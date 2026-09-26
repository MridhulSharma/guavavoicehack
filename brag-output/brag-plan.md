# Brag Plan: Decibels

## What is this app?
Decibels is an AI phone agent that places a real outbound call on your behalf, navigates the
phone tree, holds the conversation, streams every word to your screen as it happens, takes
your typed nudges mid-call, and hands back a structured summary of what it got — built so
people who can't use a phone still get everything a phone call gets you.

## The angle
Everyone has been trapped in a phone tree. Almost nobody has watched a machine beat one.
The video is the product doing the whole job in twenty seconds: you type what you want,
it dials, it presses 3, it talks, you read every word, and it hands you the answer as data.
The angle is **competence at speed** — a scrappy weekend build that does something genuinely
hard, shown working rather than described. The accessibility premise is the opening line and
the reason it matters; it is never the punchline.

## Hook (first 2-3 seconds)
Black-blue field. Nothing but type. **"Not everyone can hear the phone."** slams in,
holds, and a second beat lands under it: **"So it listens for you."** Five words, one
idea, and the whole product is already justified before the UI appears.

## Key moments (the middle)
- **The objective types itself.** The real Decibels greeting panel — "How can Decibels help
  you today?" — with a plain-English objective typing into the textarea, key ticks under it,
  and the cursor hitting **Start the call**.
- **The status pill flips.** `idle` to `call live` with the green dot, and the WebGL orb
  backdrop wakes up behind the glass. The `call started` marker drops into the transcript.
- **It beats the phone tree.** A recorded IVR line arrives as a transcript bubble —
  "Press 1 for hours. Press 3 for reservations." — and a mono chip slams in: **`[pressed 3]`**.
  This is the single most impressive two seconds in the product and it gets its own scene.
- **The transcript is live.** Bubbles alternate agent/human, and the last one carries the
  blinking interim caret — the actual `is_final: false` behaviour, on screen.
- **You can steer it mid-call.** The nudge bar types a follow-up and an amber
  "you nudged the agent" bubble lands in the running transcript.
- **It returns data, not vibes.** The summary card flips in with a green `succeeded` pill
  and the collected fields arriving one by one.

## Outro / punchline
Cut to black-blue. **Decibels.** Under it: *Places the call. Shows you every word.*
Then one small, dry line that earns the scrappiness: *built in one hackathon weekend.*

## User flow worth showing
Yes — this is the centerpiece. Three beats, pulled straight from `app/page.tsx`:
1. **Entry** — `Landing.tsx`: type the objective plus the number, press **Start the call**.
2. **Key action** — the call goes live: SSE transcript fills in real time, DTMF chip for the
   phone tree, nudge bar to steer the agent mid-call.
3. **Result** — `SummaryCard`: outcome pill, `collected` fields, must-ask answers.

Scenes 2 through 7 are all working-app scenes. There is exactly one non-app frame (the hook)
and one outro card. No marketing-page recreations, because there is no marketing page.

## Tone
- Preset: `chaotic` (for pacing and structure only)
- Creative direction: **scrappy hackathon demo, high energy** — user-provided, preserved
- Interpretation: Take `chaotic`'s *shape* — 8 scenes, hard cuts, nothing over 3.4s, punchy
  slam-in entrances — but not its voice. No ALL-CAPS mockery and no unhinged metric dumps:
  the product helps deaf and hard-of-hearing users, so the writing stays mixed-case, warm and
  confident, and the energy comes from cut rhythm and motion instead of from shouting. Fast
  edit, straight face, real UI.

## Format: landscape — 1920x1080
## Duration: 21.8s target

## Visual identity (from the project)
Use the app's **dark** theme — it is the more cinematic of the two and the orb reads better.
All values lifted verbatim from `app/globals.css` under `:root[data-theme="dark"]`.
- Background: `#0a0f1c` to `#0d1424` to `#131627` (three-stop gradient, low saturation)
- Panel: `rgba(17, 22, 38, 0.88)`, border `rgba(150, 175, 220, 0.18)`, radius `16px`
- Panel shadow: `0 1px 2px rgba(0,0,0,0.4), 0 16px 40px -14px rgba(0,0,0,0.65)`
- Accent: `#3567d6` (buttons), accent text `#9ebcff`, accent soft `rgba(110,152,255,0.16)`
- Text: `#eef2f8` primary, `#b3bfd4` muted, `#97a4bb` subtle
- Success: `#6ede9f` (plus soft `rgba(110,222,159,0.14)`) — the `call live` dot and `succeeded` pill
- Warn/nudge: `#fbd07f` (plus soft `rgba(251,208,127,0.14)`)
- Human bubble: `#242d45` on `#eef2f8`
- Edge glow: `rgba(94,140,255,0.40)` blue, `rgba(126,231,214,0.28)` teal
- Display font: **Geist** (bold, tight tracking — matches the `Decibels` wordmark)
- Body font: **Geist**; **Geist Mono** for the DTMF chip and field labels
- Strongest visual element: the frosted glass panel stack — sticky header bar, sunken
  transcript column, sidebar card — floating over the live orb gradient

## Share copy (draft)
Built Decibels this weekend: you type what you want, it calls, presses 3 to get past the
phone tree, and you read every word as it happens. Phone calls, for people who can't use the phone.

## Audio direction
- Role: dense rhythmic layer — the music carries the cut rhythm, SFX mark real UI motion
- Music: `happy-beats-business-moves-vol-9-by-ende-dot-app.mp3` (114.84 BPM). Chosen over
  vol-1 (120 BPM) because its strong cues are distributed across 3.7-12.7s where this video's
  reveals actually land; vol-1's cluster after 16s.
- Music treatment: in from 0.0s at full bed, duck about 3dB under the transcript scene so the
  bubbles feel like the focus, 0.8s fade-out over the outro card. No hard stop.
- Music cue guidance: preset read from `assets/music/cues/...vol-9....music-cues.md`.
  Target strong cues — **3.70s** (landing panel settles), **6.34s** (status pill flips to
  `call live`), **10.54s** (`[pressed 3]` chip slam). Sequential reveals use the beat grid at
  **every other beat** (about 1.05s apart, not 0.53s) so text clears its reading floor:
  transcript bubbles 12.65 / 13.70 / 14.76; summary field rows 18.44 / 19.48 / 20.54.
- Audio-reactive treatment: subtle. Music RMS/bass may breathe the orb glow and the panel
  edge aura only. No waveform bars, no bouncing UI — the app has a real shader look already.
- SFX posture: moderate, motion-matched. Every sound must correspond to something that
  actually moves on screen.
- Audio-coupled moments: objective text typing (key ticks), the Start-the-call click, the
  DTMF chip (one dry interface blip — a real touch-tone would be on the nose), each transcript
  bubble arrival (soft UI tick), the nudge send, each summary row (light card/interface tick),
  one restrained impact on the wordmark.
- Restraint rule: no stock whooshes on every cut, no riser into the outro, no telephone
  ringtone or DTMF tone samples, and nothing loud enough to compete with reading the
  transcript. The video is about words on a screen — the audio stays under them.

## Storyboard

### Scene 1 — Hook — 2.4s
Full-bleed dark gradient, orb dormant and dim. Two lines of Geist Bold, centered, large.
Line 1 "Not everyone can hear the phone." slams in at 0.25s and holds about 1.5s settled.
Line 2 "So it listens for you." arrives under it at about 1.4s, smaller, in `#9ebcff`.
No UI yet — the idea has to land before the product does.
Sequential/interaction: yes — two lines, second offset about 1.15s behind the first, both held to the cut.
Audio intent: music enters clean and confident; room to breathe before the edit accelerates.
Audio-coupled idea: beat-aligned entrance on each line; no SFX.
Music: upbeat bed, full.
Transition mood: hard cut to Scene 2

### Scene 2 — Type the objective — 2.8s
Recreate the real `Landing.tsx` panel on the orb background: the sub-line "Decibels places the
call and shows you every word.", the greeting headline "How can Decibels help you today?",
then the frosted form panel. The objective textarea types out, character by character:
"Book a table for four at 7pm Friday." Below it the number field shows **+1 555 0134**
(fictional stand-in — see Safety). Cursor slides to the blue **Start the call** button and clicks;
button shows its pressed state.
Sequential/interaction: yes — simulated typing in the textarea, then a simulated cursor click on Start the call.
Audio intent: the viewer should feel a human doing something, not a slide advancing.
Audio-coupled idea: soft key ticks under the typing (sparse, not one per character), one clean UI click on the button.
Music: steady bed.
Transition mood: hard cut to Scene 3

### Scene 3 — It's live — 2.2s
Snap to the app view. The sticky header bar slides down; the `Decibels` wordmark sits left and
the status pill flips `idle` to **`call live`** with the `#6ede9f` dot pulsing. Behind the glass
the orb wakes — glow lifts, motion picks up. A `call started` marker drops into the empty
transcript column. Small caption, low-right, `#97a4bb`: "a real outbound call".
Sequential/interaction: yes — header slide, then pill flip about 0.4s later, then the marker.
Audio intent: the moment the machine takes over; a small lift, not a whoosh.
Audio-coupled idea: beat-aligned pill flip on the 6.34s strong cue; one soft interface tick on the marker.
Music: bed lifts.
Transition mood: hard cut to Scene 4

### Scene 4 — It beats the phone tree — 3.2s
The hero technical beat. One human bubble arrives in the transcript column:
"Thanks for calling Koto Bistro. Press 1 for hours. Press 3 for reservations."
Beat. Then the mono `[pressed 3]` chip **slams** in centered under it, oversized relative to
the bubble, in Geist Mono with the `#9ebcff` accent. Caption fades in beneath: "navigates
phone trees on its own."
Sequential/interaction: yes — IVR bubble first (held about 1.2s to read), then the DTMF chip slam, then the caption.
Audio intent: the punch of the whole video. Dry and mechanical, deliberately not a touch-tone.
Audio-coupled idea: chip slam lands on the 10.54s strong cue with one short dry interface impact.
Music: bed at full.
Transition mood: hard cut with a small zoom-punch to Scene 5

### Scene 5 — Every word, live — 3.4s
The transcript column fills. Bubbles arrive one by one, right-aligned agent in accent-soft,
left-aligned human in `#242d45`:
1. agent — "Table for four, Friday at seven?"
2. human — "That works. See you then."
3. agent — a partial line with the blinking `caret` still running (the real interim state).
Caption low: "every word, as it happens."
Sequential/interaction: yes — three bubbles on **every other beat** (12.65 / 13.70 / 14.76), each held past its reading floor; the third keeps its caret blinking to the cut.
Audio intent: music ducks about 3dB so the reading is the focus; the rhythm keeps the pace without shouting.
Audio-coupled idea: one soft UI tick per bubble arrival, quieter than the DTMF hit.
Music: ducked bed.
Transition mood: hard cut to Scene 6

### Scene 6 — Steer it mid-call — 2.4s
Pull to the bottom nudge bar. The textarea types "Ask if they have a gluten-free menu" and the
**Nudge** button lights. An amber bubble lands in the transcript above: "**you nudged the
agent**  Ask if they have a gluten-free menu." Caption: "steer it mid-call."
Sequential/interaction: yes — simulated typing, button activate, then the amber bubble arrival.
Audio intent: quick, light, human — the user is back in the loop for one second.
Audio-coupled idea: brief key ticks, one send tick on the nudge bubble.
Music: bed returns to full.
Transition mood: hard cut to Scene 7

### Scene 7 — It returns data, not vibes — 3.4s
The sidebar swaps to the summary card. Header "Call summary" with the green **`succeeded`**
pill. One line of summary text. Then three `collected` rows arrive one by one, label in
`#b3bfd4`, value in medium weight:
`party_size — 4` · `time — Fri 7:00 PM` · `gluten_free — yes`
All three stay on screen together for the last 0.9s.
Sequential/interaction: yes — rows on every other beat (18.44 / 19.48 / 20.54), then held as a set.
Audio intent: the payoff — small, satisfying, additive arrivals.
Audio-coupled idea: one light card/interface tick per row, rising slightly in brightness.
Music: full, building to the outro.
Transition mood: clean cut to Scene 8

### Scene 8 — Outro — 2.0s
Back to the dark field, orb glowing low and slow. **Decibels** in Geist Bold at scale, centered.
Under it, `#b3bfd4`: "Places the call. Shows you every word." A beat later, small and dry in
`#97a4bb`: "built in one hackathon weekend."
Sequential/interaction: yes — wordmark, then tagline about 0.5s later, then the small line.
Audio intent: land it and get out. No riser, no swell.
Audio-coupled idea: one restrained impact on the wordmark only.
Music: 0.8s fade-out across the card.
Transition mood: end

**Music mood for this video:** upbeat
**Audio summary:** A 115 BPM bed runs the whole cut — clean under the hook, lifting as the call
goes live, punching once on the `[pressed 3]` chip, ducking so the live transcript can be read,
then building through the summary rows and fading out under the wordmark.

## Duration check
2.4 + 2.8 + 2.2 + 3.2 + 3.4 + 2.4 + 3.4 + 2.0 = **21.8s** — inside the 15-25s window, 8 scenes for `chaotic`.

## Safety — nothing secret leaves this plan
The repo contains real credentials and identifiers that must never appear on screen:
- `.env`, `relaypro-agent/.env`, `relaypro-web/.env` — **not read, not used.**
- `relaypro-agent/guava.toml` holds a real provisioned phone number, `project_id` and
  `org_id`. **None of these appear in the video.** The number on screen is the fictional
  **+1 555 0134**; the app's own placeholder is `+15551234567`, so this is consistent with the UI.
- The called business is the invented **"Koto Bistro"**. No real venue, no real transcript.
- All transcript lines, nudge text and summary values are written for this video.
- One real detail is kept deliberately out: the landing greeting in `Landing.tsx` says
  "Hello Mridhul!". Scene 2 uses the generic half — "How can Decibels help you today?" — so
  the author's name does **not** appear on screen. Say the word if you'd rather it did.
