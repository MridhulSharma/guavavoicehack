# Hyperframes Composition Brief: Decibels

## Objective
Create a short launch-style brag video for **Decibels**, a hackathon-built AI phone agent that
places a real outbound call, beats the phone tree, and streams every word to the screen.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21.8s target (inside the 15-25s window)

## Source Material
- Project root: `C:\Users\sharm\workspace\guavahack`
- Primary files read:
  - `relaypro-web/app/page.tsx` — the app view: header bar, transcript column, sidebar, nudge bar, `Bubble`, `SummaryCard`, `Brand`
  - `relaypro-web/app/components/Landing.tsx` — the greeting/entry view
  - `relaypro-web/app/globals.css` — all design tokens (light + dark)
  - `relaypro-web/app/lib/types.ts` — the SSE event shapes on screen
  - `relaypro-web/app/layout.tsx` — fonts (Geist / Geist Mono) and product metadata
  - `relaypro-agent/relaypro/agent.py` — the IVR digit-picking behaviour behind Scene 4
- Product name: **Decibels**
- Tagline / strongest claim: *"Decibels places the call and shows you every word."*
  Backing claim from `layout.tsx` metadata: *"Live relay calling for people who cannot hear the phone."*
- Key UI moments to recreate (in priority order):
  1. The frosted **transcript column** with agent/human bubbles and the blinking interim caret
  2. The mono **`[pressed 3]`** DTMF chip — the phone-tree defeat
  3. The **`call live`** status pill with its green dot, in the sticky header next to the wordmark
  4. The **summary card** — `succeeded` pill plus `collected` field rows
  5. The **landing form panel** — objective textarea plus Start the call button
- Copy that must appear verbatim (from the project source):
  - "Decibels places the call and shows you every word."
  - "How can Decibels help you today?"
  - "What should the call accomplish?"
  - "Number to call"
  - "Start the call"
  - "call live" / "idle"
  - "call started"
  - "Nudge the agent"
  - "you nudged the agent"
  - "Call summary"
  - "succeeded"
  - "Decibels"

## Creative Direction
- Tone preset: `chaotic` — **for pacing and structure only**
- Creative direction: **scrappy hackathon demo, high energy** (user-provided, preserved verbatim)
- Interpretation: Use `chaotic`'s shape — 8 scenes, hard cuts, no scene over 3.4s, slam-in
  entrances, a small zoom-punch on the hero beat. Do **not** use its voice. No ALL-CAPS, no
  tilted words, no metric dumps, no mockery: the product exists so deaf and hard-of-hearing
  people can use the phone, so the writing stays mixed-case, warm and confident. Energy comes
  from cut rhythm and motion, never from shouting. Fast edit, straight face, real UI.
- Angle: Everyone has been trapped in a phone tree; almost nobody has watched a machine beat
  one. The video is the product doing the whole job in twenty seconds — you type what you want,
  it dials, it presses 3, it talks, you read every word, and it hands you the answer as
  structured data. The angle is competence at speed: a weekend build that does something
  genuinely hard, shown working rather than described.
- Hook: Dark field, type only. "Not everyone can hear the phone." then, under it,
  "So it listens for you."
- Outro / punchline: **Decibels** wordmark, "Places the call. Shows you every word.", then one
  small dry line: "built in one hackathon weekend."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign — the app's own glass-over-gradient look is the identity
  - Phone/telephone iconography, ringtone or touch-tone sounds, waveform bars
  - ALL-CAPS treatment anywhere

## Visual Identity
Use the app's **dark** theme. All values verbatim from `globals.css` `:root[data-theme="dark"]`.
- Background: three-stop gradient `#0a0f1c` / `#0d1424` / `#131627`, with a `rgba(8,11,20,0.55)` scrim
- Panel: `rgba(17, 22, 38, 0.88)`; strong `rgba(20, 26, 44, 0.95)`; sunken `rgba(12, 17, 30, 0.80)`
- Panel border: `rgba(150, 175, 220, 0.18)`; radius `16px` (`10px` small)
- Panel shadow: `0 1px 2px rgba(0,0,0,0.4), 0 16px 40px -14px rgba(0,0,0,0.65)`
- Text: `#eef2f8` primary / `#b3bfd4` muted / `#97a4bb` subtle
- Accent: `#3567d6` button fill on `#ffffff`; accent text `#9ebcff`; accent soft `rgba(110,152,255,0.16)`
- Success: `#6ede9f`, soft `rgba(110,222,159,0.14)`
- Warn (nudge): `#fbd07f`, soft `rgba(251,208,127,0.14)`
- Human bubble: `#242d45` with `#eef2f8` text
- Edge glow / aura: `rgba(94,140,255,0.40)` blue and `rgba(126,231,214,0.28)` teal
- Display font: **Geist**, bold, tight tracking (Google Fonts; fall back to Inter, then system sans)
- Body font: **Geist**; **Geist Mono** for the DTMF chip and the small uppercase field labels
- Visual references from the project:
  - Frosted panel stack over a soft animated orb gradient (`Backdrop.tsx` / `OrbBackdrop.tsx`)
  - Pill + dot status chip
  - Chat-bubble transcript, agent right / human left
  - Mono marker chip for DTMF
  - Label/value definition rows in the summary card

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract. Scene summary:

1. **Hook** — 2.4s — "Not everyone can hear the phone." then "So it listens for you." Type only, orb dim.
2. **Type the objective** — 2.8s — landing panel; objective types into the textarea; cursor clicks **Start the call**. Number shows `+1 555 0134`.
3. **It's live** — 2.2s — header slides in, pill flips `idle` to `call live`, orb wakes, `call started` marker drops.
4. **It beats the phone tree** — 3.2s — IVR bubble ("Press 1 for hours. Press 3 for reservations."), then the `[pressed 3]` chip slams in, then the caption "navigates phone trees on its own."
5. **Every word, live** — 3.4s — three transcript bubbles arrive; the last keeps its blinking caret. Caption "every word, as it happens."
6. **Steer it mid-call** — 2.4s — nudge bar types a follow-up; amber "you nudged the agent" bubble lands. Caption "steer it mid-call."
7. **It returns data, not vibes** — 3.4s — summary card, green `succeeded` pill, three `collected` rows arrive one by one and hold together.
8. **Outro** — 2.0s — **Decibels**, "Places the call. Shows you every word.", "built in one hackathon weekend."

Reading floors that must be honoured (from the plan): short label about 0.8s settled; a full
sentence about 0.3s per word, minimum 1.2s. The hook line gets the most. Fast-in then hold —
never fast-in then gone.

## Audio
- Audio role: **dense rhythmic layer** — music carries the cut rhythm, SFX mark real UI motion
- Audio arc: clean bed under the hook, lifting as the call goes live, one punch on the
  `[pressed 3]` chip, ducked so the live transcript reads, building through the summary rows,
  fading out under the wordmark.
- Music: `happy-beats-business-moves-vol-9-by-ende-dot-app.mp3` (114.84 BPM), copied to
  `brag-output/composition/assets/music/`. Chosen over vol-1 (120 BPM) because its strong cues
  fall across 3.7-12.7s where this video's reveals land; vol-1's cluster after 16s.
- Music treatment: full from 0.0s; duck about 3dB across Scene 5 so the bubbles are the focus;
  0.8s fade-out across Scene 8. No hard stop, no riser.
- Music cue guidance: bundled preset at
  `<brag-skill-dir>/assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json`
  (and `.md`). Suggested strong-cue locks (use 1-3, whichever serve the edit):
  - **3.70s** — landing panel settles (Scene 2)
  - **6.34s** — status pill flips to `call live` (Scene 3)
  - **10.54s** — `[pressed 3]` chip slam (Scene 4) — this one is the priority lock
  Beat-grid windows for sequential reveals, at **every other beat** (~1.05s apart) so text
  clears its reading floor:
  - Transcript bubbles (Scene 5): 12.65 / 13.70 / 14.76
  - Summary rows (Scene 7): 18.44 / 19.48 / 20.54
  Ignore any cue that hurts readability or the product story.
- Audio-reactive treatment: **subtle**. Drive only the orb glow intensity and the panel edge
  aura from music RMS/low-band energy. No waveform bars, no equalizer, no particles, no
  strobing, no pulsing UI chrome. The backdrop already has a shader look — this should read as
  the room breathing, not as a music visualiser.
- Audio-coupled moments:
  - Scene 2, objective textarea — simulated typing with sparse key ticks (not one per character)
  - Scene 2, Start the call — one clean UI click on the press
  - Scene 3, status pill — beat-locked flip, one soft interface tick on the `call started` marker
  - Scene 4, `[pressed 3]` chip — the one real impact of the video, dry and mechanical
  - Scene 5, each bubble — one soft UI tick per arrival, quieter than the DTMF hit
  - Scene 6, nudge — brief key ticks plus one send tick
  - Scene 7, each summary row — light card/interface tick, brightening slightly across the three
  - Scene 8, wordmark — one restrained impact, then fade
- SFX selection guidance: choose after the animation exists, and match sound to motion. UI and
  interface families for clicks, ticks and the chip; keyboard family for typing; card family is
  appropriate for the summary rows. Nothing should fire that does not correspond to something
  moving on screen.
- SFX analysis guidance: use
  `<brag-skill-dir>/assets/sfx/sfx-analysis.md` (and `.json`). Prefer low high-frequency-risk
  files for the repeated ticks in Scenes 5 and 7 — those fire three times each and will get
  fatiguing if bright.
- Exact SFX choice: Hyperframes chooses filenames, timestamps, density and volume based on the
  implemented animation.
- Audio files: copy the chosen music and every selected SFX into
  `brag-output/composition/assets/`.

`<brag-skill-dir>` resolves to
`C:\Users\sharm\.claude\plugins\cache\brag\brag\0.4.0\skills\brag`.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition
contract plus `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design
spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and
`hyperframes-cli` (lint/check/render). This is the `/brag` workflow: do not enter the
`hyperframes` entry-point intent interview and do not route into its generic promo /
launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show real UI, copy and visual elements from the source project — Scenes 2 through 7 are all
  working-app recreations, not marketing frames.
- Keep all text readable in the final render; honour the reading floors above.
- Keep the video within 15-25 seconds.
- Include the planned music and SFX layer.
- Treat the `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual
  animation exists.
- Treat music cue metadata as optional timing hints. Lock 1-3 strong cues (the `[pressed 3]`
  slam at 10.54s is the one that matters most), within about 0.15s; snap smaller sequential
  entrances within about 0.10s of a beat.
- Honour the ducking across Scene 5 and the 0.8s fade-out in Scene 8.
- Wire at least one visual element to extracted audio data (orb glow / edge aura), following the
  `hyperframes-creative` audio-reactive workflow. FFmpeg 9.0.2 and FFprobe are on PATH, so
  extraction is available. If it fails anyway, document it and continue — do not block the render.
- Use local assets for audio and any runtime dependencies.
- Run `hyperframes check` before render — it is `/brag`'s single gate.

## Safety constraints (hard)
Nothing secret may reach the screen:
- `.env`, `relaypro-agent/.env`, `relaypro-web/.env` were not read and must not be referenced.
- `relaypro-agent/guava.toml` contains a real provisioned phone number, `project_id` and
  `org_id`. **None may appear.** The on-screen number is the fictional **+1 555 0134**.
- The called business is the invented **"Koto Bistro"**.
- Every transcript line, nudge and summary value in the storyboard is written for this video;
  none is a real call.
- The author's first name (present in the real landing greeting) must not appear on screen.
