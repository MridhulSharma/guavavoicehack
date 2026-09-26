"use client";

import { useEffect, useRef } from "react";

import { useTheme } from "@/app/components/ThemeProvider";
import { useReducedMotion } from "@/app/lib/ui/useReducedMotion";

/** Renderer pixel ratio ceiling. Keeps a 4K panel from costing 4x the fill. */
const MAX_DPR = 1.5;
/** Theme cross-fade, matched to the 600ms CSS transitions on the UI. */
const PALETTE_MS = 600;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * A slow fluid orb: two octaves of 3D simplex noise domain-warp a radial
 * field, and the field drives both hue and a soft bloom-like falloff. Four
 * noise calls per pixel total, which is what keeps this cheap enough to run
 * full-viewport at 60fps.
 *
 * uMix cross-fades the whole palette between day (0) and night (1); uLive
 * lifts brightness and flow slightly while a call is up.
 */
const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2  uRes;
  uniform float uTime;
  uniform float uMix;   // 0 = day, 1 = night
  uniform float uLive;  // 0 = idle, 1 = call live

  // Day palette: warm, soft, low saturation.
  uniform vec3 uDayCore;
  uniform vec3 uDayMid;
  uniform vec3 uDayEdge;

  // Night palette: deep and cool, but luminous in the core.
  uniform vec3 uNightCore;
  uniform vec3 uNightMid;
  uniform vec3 uNightEdge;

  // Ashima simplex noise (webgl-noise, MIT).
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    // Aspect-corrected coords centred on the orb.
    vec2 p = (vUv * uRes - 0.5 * uRes) / min(uRes.x, uRes.y);

    float t = uTime * (0.055 + 0.03 * uLive);

    // Domain warp: two cheap noise lookups bend the field into a slow curl.
    vec2 warp = vec2(
      snoise(vec3(p * 1.05, t)),
      snoise(vec3(p * 1.05 + 4.7, t))
    );
    vec2 q = p + warp * (0.36 + 0.05 * uLive);

    // The orb body, plus a second smaller lobe so the shape never reads as a
    // plain circle.
    float r = length(q * vec2(0.92, 1.12));
    float body = exp(-r * r * 1.45);
    float lobe = exp(-pow(length(q - vec2(0.42, -0.3)) * 1.6, 2.0));

    // Fine detail, scaled down so it modulates rather than dominates.
    float detail = snoise(vec3(q * 2.1, t * 1.3)) * 0.5 + 0.5;

    float field = clamp(body * 0.86 + lobe * 0.3 + detail * 0.16, 0.0, 1.0);
    // Bloom-like falloff: bright, soft core dropping off smoothly.
    float glow = pow(field, 1.55);
    float core = smoothstep(0.52, 0.98, field);

    vec3 dayCol = mix(uDayEdge, uDayMid, smoothstep(0.0, 0.62, glow));
    dayCol = mix(dayCol, uDayCore, core);

    vec3 nightCol = mix(uNightEdge, uNightMid, smoothstep(0.0, 0.62, glow));
    nightCol = mix(nightCol, uNightCore, core);

    vec3 col = mix(dayCol, nightCol, uMix);
    col += core * (0.05 + 0.06 * uLive);

    // Vignette, so the orb settles into the page instead of ending abruptly.
    col *= 1.0 - 0.16 * smoothstep(0.55, 1.5, length(p));

    gl_FragColor = vec4(col, 1.0);
  }
`;

// sRGB 0-1. Chosen to stay low-saturation: the scrim and frosted panels sit on
// top, and the orb is never what text has to contrast against.
const DAY = {
  core: [0.99, 0.97, 0.93],
  mid: [0.87, 0.9, 0.97],
  edge: [0.95, 0.96, 0.99],
};
const NIGHT = {
  core: [0.42, 0.56, 0.95],
  mid: [0.1, 0.16, 0.34],
  edge: [0.04, 0.06, 0.13],
};

export function OrbBackdrop({ live }: { live: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { theme, ready } = useTheme();
  const reduced = useReducedMotion();

  // Read inside the animation loop so theme/live changes never remount WebGL.
  const targetMix = useRef(0);
  const liveRef = useRef(live);
  const reducedRef = useRef(reduced);

  useEffect(() => {
    targetMix.current = ready && theme === "dark" ? 1 : 0;
  }, [theme, ready]);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === "undefined") return;

    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | undefined;

    // Imported here rather than at module scope so three never ships in the
    // server bundle and never runs during SSR.
    void import("three")
      .then((THREE) => {
        if (disposed) return;

        let renderer: import("three").WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            powerPreference: "default",
          });
        } catch {
          // No WebGL: leave the host empty and the body gradient shows through.
          return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
        renderer.setSize(window.innerWidth, window.innerHeight, false);

        const canvas = renderer.domElement;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        host.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const geometry = new THREE.PlaneGeometry(2, 2);

        const uniforms = {
          uRes: {
            value: new THREE.Vector2(window.innerWidth, window.innerHeight),
          },
          uTime: { value: 0 },
          uMix: { value: targetMix.current },
          uLive: { value: liveRef.current ? 1 : 0 },
          uDayCore: { value: new THREE.Vector3(...DAY.core) },
          uDayMid: { value: new THREE.Vector3(...DAY.mid) },
          uDayEdge: { value: new THREE.Vector3(...DAY.edge) },
          uNightCore: { value: new THREE.Vector3(...NIGHT.core) },
          uNightMid: { value: new THREE.Vector3(...NIGHT.mid) },
          uNightEdge: { value: new THREE.Vector3(...NIGHT.edge) },
        };

        const material = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          uniforms,
          depthTest: false,
          depthWrite: false,
        });

        scene.add(new THREE.Mesh(geometry, material));

        const onResize = () => {
          renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, MAX_DPR),
          );
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
          if (reducedRef.current) renderer.render(scene, camera);
        };
        window.addEventListener("resize", onResize);

        let last = performance.now();
        // Motion is integrated rather than read off the clock, so pausing for a
        // hidden tab does not make the orb jump when it comes back.
        let clock = 0;

        const tick = (now: number) => {
          frame = requestAnimationFrame(tick);

          const dt = Math.min((now - last) / 1000, 1 / 20);
          last = now;

          // Reduced motion: hold one still frame of the orb.
          if (!reducedRef.current) clock += dt;

          uniforms.uTime.value = clock;

          // Ease both the palette and the live lift so a toggle reads as a
          // fade, not a cut.
          const mixStep = (dt * 1000) / PALETTE_MS;
          uniforms.uMix.value +=
            (targetMix.current - uniforms.uMix.value) * Math.min(mixStep, 1);

          const liveTarget = liveRef.current ? 1 : 0;
          uniforms.uLive.value +=
            (liveTarget - uniforms.uLive.value) * Math.min(dt * 2.2, 1);

          renderer.render(scene, camera);
        };

        // Rendering while the tab is hidden burns battery for nothing.
        const onVisibility = () => {
          if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
          } else if (!frame) {
            last = performance.now();
            frame = requestAnimationFrame(tick);
          }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // A context loss would otherwise leave a frozen or black canvas.
        const onContextLost = (event: Event) => {
          event.preventDefault();
          cancelAnimationFrame(frame);
          frame = 0;
          canvas.style.display = "none";
        };
        canvas.addEventListener("webglcontextlost", onContextLost);

        frame = requestAnimationFrame(tick);

        cleanup = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener("resize", onResize);
          document.removeEventListener("visibilitychange", onVisibility);
          canvas.removeEventListener("webglcontextlost", onContextLost);
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          if (canvas.parentNode === host) host.removeChild(canvas);
        };
      })
      .catch(() => {
        // three failed to load: the CSS gradient is the whole backdrop.
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="backdrop-canvas" aria-hidden="true" />;
}
