# FIVE CONCEPTS FOR THE FOSTR DESCENT — SHARPENED

*Revision 2. Every critique point is folded in. One honest note first: all five share a skeleton — the panel-5 trace (touch a produced line, watch light run to its source) is the product demo in every skin, and every concept uses a falling-question variant. You are choosing the skin, not the skeleton. The skeleton is good.*

---

## COMPARISON TABLE

| # | Concept | Big idea in 6 words | Wow moment | Effort | Investor-readiness note |
|---|---------|--------------------|------------|--------|------------------------|
| 1 | TAPROOT | Ride the root tip down live | Reverse-trace up 60 feet of root | L | Highest ceiling; risks "they spent the raise on the site" |
| 2 | THE RECORD | The medium is literally the product | Same sentence retyped four times | S/M | Un-embarrassable, forwardable, ships in days |
| 3 | THE SURVEY | One line draws the whole system | Realizing the page is one stroke | M | Warmest; lives or dies on illustration talent |
| 4 | SEDIMENT | The earth is made of paperwork | 100k characters frozen mid-air | M/L | Best single photo; highest generic-AI risk |
| 5 | WORKLIGHT | You carry the light; traces persist | Panel-8 full-network switch-on | M | Most distinct spectacle per engineering hour |

## RECOMMENDATION

**Build THE RECORD.** It is the only concept where form and claim are the same object — Fostr routes text with provenance, and the site is text, routed, with provenance — so it can never be called decoration, and its panel-2 problem demo sells the business in fifteen seconds on any phone with zero WebGL. It ships inside a fundraise timeline, degrades to a beautiful server-rendered document that unfurls in an email, and every hour saved on engineering goes into the motion timing that makes it sing. **If jaz wants one notch more spectacle and can absorb a shader, WORKLIGHT is the alternate** — but RECORD is the one I'd stake the raise on.

**Critic's ranking:** 1. THE RECORD · 2. WORKLIGHT · 3. TAPROOT · 4. SEDIMENT · 5. THE SURVEY. I concur.

---

*The constants hold across all five: scroll descends into the earth; 8 verbatim panels in order; one live gold tooltip-question at a time; Plus Jakarta Sans + #5DA1A1 with the depth palette (paper #F7F5F1 / ink #1E2624 above ground, umber #8A6F55 to near-black #191412 below, gold reserved for questions and panel 7); native scroll with soft snap; the sprout as the only above-ground marker; no leaves underground; no child imagery ever; panel 7 works by subtraction. Two new constants from this revision, all concepts: (a) **the descent is budgeted — panels 1 through 4 reachable in under 25 seconds of casual scrolling**, dark stretches compressed to breaths, not passages; (b) **one truthful business line lives near panel 6** in the record-label mono tier ("SOLD TO AGENCIES · PILOTING IN MASSACHUSETTS," or whatever is true) — the verbatim panels cover problem, product, moat, founder, and never who pays; this line fixes that in every skin. And everywhere: the panel-5 trace is designed tap-and-scrub first for the dinner-table phone; hover is a desktop bonus.*

---

## CONCEPT 1 — TAPROOT (full 3D-scene-led)

**Logline:** One continuous WebGL borehole. The camera dollies down a single growing root as you scroll; you ride the growth tip from daylight to the seed.

**The big idea.** The founder's metaphor taken literally and singularly: the site is not eight sections, it is one vertical shaft, and the scroll is a camera dolly. Utsubo's rule as law: one hard idea, everything budgeted around it. The one hard idea is the root that grows tip-first exactly as fast as you read. **Revised: the root never un-grows.** Scroll back up and the camera rises past root that stays — already-traced filaments re-brighten as you pass them, like re-reading a highlighted page. A persistent record that erases itself was the metaphor contradicting the message; now scroll-back rewards the investor who goes up to re-read the solution before deciding, which is exactly what investors do.

**Art direction.** Depth-graded palette as vertical fog: paper sky, umber, loam, near-black bedrock, strata boundaries as faint sediment bands doubling as panel markers. The root is schematic, not botanical — clean tube geometry, 1.5 to 2 units thick, asymmetric branching, small node spheres, half root and half data-lineage diagram. Teal changes function, never hue: fill above ground, light source below; underground the root is the only saturated, emissive thing. **Hard architectural decision, made now: all text and all documents are DOM, always.** The canvas renders root, soil, and light only; filaments terminate at screen-space anchor points projected each frame to DOM document containers. This sync layer (resize, dpr, iOS URL-bar collapse) is the hardest engineering on the page — it gets the first sprint, not the root shader. Type: ExtraBold 56–72px panel lines, wide-tracked Medium "record label" tier for depth markers ("−6 M · CASE NOTES"). The masthead sprout's stem aligns with the taproot at the fold: one continuous plant.

**The scroll journey.**
1. **HERO, above ground.** Flat daylight, paper field, early-access badge, headline as instant DOM text. At the viewport's bottom edge, a thin dark horizon line. The sprout is the only green.
2. **Crossing.** The horizon rises through the viewport — the emotional hinge. Light drops, the shaft closes around the camera, the taproot appears already descending. Sheets of forms sit embedded in the soil wall like fossils, the same fields legible on each: Name. DOB. Placement. Panel 2's line sits over them. *Tight: this whole stratum is one comfortable scroll-length, not a journey.*
3. Everything stops. The root pauses mid-growth, the fossils stop accumulating. "Not the worker's." Stillness is the empathy note.
4. **The branch.** The taproot splits into four bright filaments that dive to four DOM documents (Intake / Case notes / Court prep / State system), which fill themselves in as the filaments arrive. Solution imagery equals brand imagery. Reached in under 25 seconds from the top.
5. **The demo — the interaction we protect above every visual.** On phones: an authored auto-scrub — as you scroll the panel, the page itself selects a line of the court filing and runs light back up the shaft to the source node, which re-renders the original visit note, quoted and timestamped; scrub speed is yours. On desktop, hover any line to drive it manually. "No guessing" is something the investor performs either way.
6. Lateral roots spread into dimmed side-galleries labeled group homes, elder care. Present, not yet lit. The business line sits here in mono, seated in the soil like a survey stake.
7. **The seed.** The shaft narrows, branches fall away, motion nearly stops. The camera arrives at the origin point — **revised: the seed is the least rendered thing on the page.** No glow, no jewel; a small matte node, barely warmer than the dark around it, and Jaden's words beside it in Regular weight, smaller than anything above, ragged right. The system goes quiet around the fact and adds nothing.
8. **Germination.** From the seed a new shoot draws upward, resolves into the two-leaf sprout glyph, CTA beneath it in daylight-adjacent warmth. Book 20 minutes with Jaden / Email Jaden.

**Tooltip chain.** The gold question pill tethers to the growth tip, appears in the last 20% of each panel, rides the tip down through a short dark breath, dissolves into the next headline. Tap to descend.

**Wow moment.** The panel-5 trace: an investor touches one line of a court filing and watches light run back up sixty feet of root to its source. The pitch and the shader are the same object — and now it works with a thumb, not a cursor.

**Tech plan.** R3F canvas fixed at −z, Lenis as single scroll source, one MotionValue bridged into uniforms via useFrame (no React state on scroll). Root = one merged instanced geometry, no shadows, no post; strata fog and grain in the background shader. frameloop="demand", dpr [1, 1.75] with PerformanceMonitor decline. Canvas lazy-loads after first paint; hero is pure HTML. **Sprint 1 is the DOM-anchor sync layer, validated across resize/dpr/URL-bar before any art pass.** Mobile: same scene at dpr 1, shorter pins. Reduced motion: static SVG strata with the root fully grown per panel, questions as captions.

**Risk + effort: L.** The hardest build and the one most likely to impress a designer while making an investor wonder where the money went — its defense is that panel 5 is a real product demo, so guard that interaction with the whole budget if necessary. Cheap failure mode remains gray-spaghetti roots or a shaft that reads as a game level. If it lands, it is the Awwwards-tier version.

---

## CONCEPT 2 — THE RECORD (typography-led)

**Logline:** The page is one continuous typeset document descending into ink; type is the terrain, and roots are the rules and underline-threads that carry facts downward.

**The big idea.** Fostr's product is text that goes where it's owed, so the site is built from nothing but text. The By-Kin / Daylight / Abridge register: restraint as confidence, exaggerated hierarchy mapping exactly onto the panel-line + tooltip structure. It clears the Binti bar by conviction, and it is the one concept an investor can never call a gimmick — the medium literally is the product.

**Art direction.** A slow paper-to-ink inversion (#F7F5F1 → #3E322A → #191412) with text inverting to paper. **Revised: the descent is now physical, not just tonal.** Each stratum boundary is a full-width ruled sediment line with a mono depth label, and the text column visibly *crosses* it — headlines seat their baselines on these rules like foundations on bedrock, and a hairline of soil texture thickens at each boundary. The fixed left-rail depth ruler reads as a core sample; answered questions turn teal in it, quietly diagramming the argument and doubling as skip-nav. The founder's descent is non-negotiable, and now you feel the floor of each stratum. Monospace (IBM Plex Mono) only inside record artifacts. Roots are typographic matter: 2px teal rules descending from underlined phrases, carrying a fact from one panel to its reappearance in the next. Gold twice: questions, panel 7. Sprout in the masthead; recurs at reading scale at the end.

**The scroll journey.**
1. The headline alone, enormous, black on paper, badge above. The teal underline beneath "never reaches a kid" grows a descender off the baseline as you scroll — the first root is an underline escaping the sentence, and it dives through the first ruled stratum line.
2. **The Same Sentence Four Times — capped hard at ~8 seconds of pinned scroll.** Retype 1 plays in full, cursor blinking through every keystroke. Retypes 2, 3, 4 land at accelerating compression — each faster, more mechanical, until the fourth stamps in almost instantly. You feel the tedium without serving it. Devastating and DOM-only.
3. The typing stops mid-word. Background warms one step. "Not the worker's." alone in acres of space, seated on a stratum rule. First stillness.
4. **The Split.** The panel-2 sentence appears once, center, ExtraBold. On scrub, four teal rules branch from beneath it and carry live copies down into four columns that typeset themselves simultaneously. One keystroke, four documents, drawn as typography.
5. A finished court-filing paragraph. On phones, scrubbing walks the trace phrase by phrase automatically: each phrase highlights, a teal thread draws upward to a floating source snippet with a mono provenance tag — "TRACED TO VISIT 03/14." Hover drives it manually on desktop.
6. The column widens; adjacent markets set in dimmed ink down the margins like unindexed entries. **The business line lives here as a mono footnote in the margin apparatus** — the one concept honest enough to carry it without a register break.
7. Near-black field. Everything gone except Jaden's words, Regular weight, smaller than the hero, ragged — gold's only appearance in body text. Attribution in the record-label tier: "JADEN · FOUNDER · MASSACHUSETTS." **Decision made: no photo.** Text and silence carry it; a photograph is a variable this panel doesn't need.
8. The background lifts two steps toward warmth. The sprout glyph appears above the CTA line, finally pointing up. Two generous buttons. Done.

**Tooltip chain.** The Falling Question, purest form: the gold pill detaches from panel N's baseline and falls with your scroll, lands, and morphs into the first word of panel N+1's answer. **Engineering rule: the pill moves on a scroll-linked transform only — never a re-layout** — and every thread endpoint recomputes on ResizeObserver + document.fonts.ready, so font-load reflow, rotation, and iOS URL-bar collapse can't snap a thread.

**Wow moment.** Panel 2. The same sentence retyped four times puts the problem in every investor's hands within fifteen seconds, no WebGL required — and now it ends before it wears out its welcome.

**Tech plan.** No Three.js (at most a grain shader on the background). CSS scroll-driven animations for the color ramp, ruler, strata rules, and parallax; Motion for pins, typing, morphs, and the SVG thread (path between measured rects, dashoffset scrub, endpoints re-measured as above). Fastest possible load; the entire pitch is server-rendered, forwardable, unfurlable text. Reduced motion collapses to a beautifully typeset long-form page with printed questions — 95% as persuasive.

**Risk + effort: S/M.** Cheapest and most resilient. Failure mode: without razor-sharp motion timing it reads as "a nice article" — the strata rules, seated baselines, and depth ruler now carry the earth together, but the timing pass is where the remaining budget goes.

---

## CONCEPT 3 — THE SURVEY (illustration / line-art-led)

**Logline:** A single continuous schematic line drawing — half botanical plate, half data-lineage diagram — draws itself tip-first down the page as you scroll.

**The big idea.** The Tux Creative House model: one authored illustration built to be broken apart and re-animated along the scroll. Everything on the page is one drawn system in one line language, because in Fostr everything traces back to one record. **Revised: the drawing is permanent ink.** Scroll draws it; scroll back and the line does not erase — it *re-inks*, passing strokes brightening slightly as you rise, like a surveyor confirming the measurement. Un-drawing the record contradicted "every line traces back"; re-tracing performs it.

**Art direction.** Warm paper the entire descent — the only concept that keeps light all the way down. Depth rendered by line, not darkness: soil as fine ink hatching that densifies per stratum, sediment boundaries as ruled survey lines with mono depth labels, a geologist's field sheet. Two stroke voices only: ink #1E2624 for the world, teal #5DA1A1 for the living root and every provenance trace. 1.5–2px strokes, asymmetric branching, node circles at terminations, zero leaves below ground. Type sits inside the drawing as plate annotations. The masthead sprout is drawn in the same stroke weight — the logo demonstrably from the same hand. **The register guardrail: this must read as a survey document, not an explainer video** — ruled precision, annotation discipline, no rounded-friendly curves. If a sample stroke reads cute, it gets redrawn or the concept dies (see tech plan).

**The scroll journey.**
1. Above ground: nearly empty paper, headline, one horizontal ruled ground line, the sprout's two strokes just above it. A teal line breaks the ground and begins drawing downward.
2. **Revised for speed:** the line passes the first form sheet, which draws itself stroke by stroke — then the remaining sheets *stamp* into the hatched soil in quick succession, the same three fields inked on each. You feel the repetition through accumulation, not through waiting.
3. The pen lifts. Half-finished hatching just stops. "Not the worker's." sits in the white space where the drawing refused to continue. Stillness as a drawing decision.
4. The taproot line reaches a node and branches into four clean teal paths that each draw a destination document frame and fill it, line by line, simultaneously. One stroke becomes four documents — reached inside the 25-second budget.
5. A drawn court filing. Tap any line (auto-scrub walks it on mobile) and the connecting path re-draws backward up the page to the source note, sketched in beside it with a timestamp annotation. The trace is literally the same stroke seen in reverse.
6. Lateral roots draw outward in lighter ink into labeled margins: group homes, elder care, annotated "NEXT," not colored in. The business line sits here as a survey annotation in mono.
7. **Revised.** The hatching clears. On bare paper: the small drawn stack of forms, alone, and Jaden's words set beside it. The height-tick is gone — a survey rule measuring a child's body was child imagery by proxy, exactly the aestheticization the brief forbids. The forms and the words state it; the drawing stops.
8. The taproot's final stroke curls into a seed node, and from it the sprout glyph is drawn upward, stroke by stroke, completing the logo at full size above the CTA. The last thing drawn on the page is the brand.

**Tooltip chain.** The Root Thread, native here: the gold question label rides the pen tip of the master path. The question travels because the line travels; crossing into the next panel, it blooms into the headline.

**Wow moment.** The realization, around panel 4, that the entire page is one line — and that scrolling up re-inks it. Investors scroll back to watch the line confirm itself, which means they re-read the pitch.

**Tech plan.** No WebGL. One SVG megapath (plus per-panel sub-paths) with precomputed lengths, stroke-dashoffset scrubbed via a single useTransform; GSAP DrawSVG if easing across many segments gets fiddly. **Hatching pre-rasterized per stratum** (baked PNG/AVIF layers revealed by clip on CSS scroll timelines) — only the teal path stays live vector, so old Android never chokes on full-viewport pattern paint. Featherweight on phones. Reduced motion: fully drawn per panel, static. **Gate zero, before any code: commission three sample plates (panel 2 forms, the panel-4 branch, the sprout). If they read as whiteboard-explainer rather than field document, kill the concept that week.** The illustration is not polish; it is the concept.

**Risk + effort: M — but the effort is authorship, not engineering.** The critical path runs through illustration talent, which is not on the team's tech palette. Budget the drawing pass first, in hours or dollars, and hold the kill-gate honestly.

---

## CONCEPT 4 — SEDIMENT (particle / data-material-led)

**Logline:** The earth is made of retyped words. A hundred thousand fallen characters of duplicated paperwork settle into strata, and Fostr routes them through one living channel.

**The big idea.** Soil is accumulated deposition; so is casework backlog. The ground the page descends through is composed, visibly, of the same fields typed over and over: the material of the earth IS the problem statement. Shopify Editions' particle-type language pointed at a serious subject, with Igloo Inc's asset discipline. **The concept now carries a gate: it exists only if the conceit is visible.** Before any build, a one-day prototype renders glyphs at target grain size; if a stranger cannot say "those are letters" within 5 seconds, the concept collapses to generic particles and we walk away. The resolution: glyphs render at two tiers — near-field particles (the closest 10%) large enough to read as characters, far-field as grain — so legibility lives in a legible minority and the DOM copy never fights a wall of readable type.

**Art direction.** Particles are glyph sprites in Plus Jakarta Sans (N, a, m, e, D, O, B...), ink-colored, gravity-bound — never fairy dust, never glowing swirls. **This is now a written law in the repo, comment-block at the top of the particle shader: "Particles are grains of type obeying gravity. No curl swirls, no glow, no orbiting. Delete any commit that adds them."** Iteration pressure erodes taste rules unless they're in the codebase. Strata form where particles settle: warm dark fields with stippled texture. Teal is reserved exclusively for particles moving through the root channel — saturation equals the product working. DOM type floats above the canvas untouched. Gold for questions and panel 7. The sprout stays in the masthead; particles never form leaves.

**The scroll journey.**
1. Clean paper hero. As the headline lands, a few characters shake loose from the sentence and fall past the baseline. By the time you scroll: a steady, quiet snowfall of type, downward, past you.
2. Below ground, the falling characters land and sort into four labeled drifts: Intake, Case notes, Court prep, State system. The same glyphs, four piles. Scrolling back lifts them off the piles and returns them to the sky — which people will do twice. (The sorting is authored per-particle target data, not noise — a scheduled choreography task, not an afterthought.)
3. **The stillness.** Every particle halts mid-air on the panel boundary. A full viewport of suspended type, frozen, around "Not the worker's." — **which sits in a cleared pocket computed in the shader**: a particle-exclusion zone guaranteeing AAA contrast, not hoped for. The most striking image on the page, and it is an absence of motion.
4. One sentence, written once, center, in DOM. It dissolves into a single bright teal stream that dives and splits into four channels, each landing in a destination document and re-forming as legible text. Write once; flow everywhere, literally.
5. Touch a produced line (auto-scrub on mobile) and a thin teal countercurrent of particles flows backward up its channel to the source note. Provenance as visible current.
6. The strata widen; faint dimmed seams run off both edges of the viewport, labeled for adjacent markets. Sediment deposited, not yet mined. Business line here, mono, seated in a seam.
7. **Revised: zero motion.** The particles have already settled — a still, fully deposited floor, one small warm point of light in the dark, and Jaden's words beside it. No drifting matter around trauma text; falling particles near this panel read as snow-globe decoration, so nothing falls here. Everything the page had, subtracted and at rest.
8. **Revised.** From that point, particles rise for the only time on the site — and as they rise they *shed their glyph identity*, resolving into plain teal points before assembling the sprout above the CTA. The brand is not built from the problem's debris; the material is transformed before it becomes growth.

**Tooltip chain.** The Falling Question, with a wake: the gold pill falls with you between panels and the glyph-fall bends slightly around it — the question as an object in the weather. One alive at a time; tap to descend.

**Wow moment.** Panel 3. A hundred thousand characters stopping dead in mid-air is the frame the investor photographs. (Runner-up: your own upward scroll un-settling the piles.)

**Tech plan.** One instanced sprite system + one fullscreen background shader; positions computed in the vertex shader from uScrollProgress + per-particle seed — scrubbing free and reversible, zero physics state. Panel-2 drift targets and the panel-3 exclusion pocket are authored uniforms/attributes, scheduled as design tasks. Two-tier glyph sizing per the legibility gate. dpr [1, 1.5]; particle count tiered by deviceMemory/hardwareConcurrency; mobile ~20% count. Ambient drift throttled; full rate only while scrolling. Reduced motion: static stippled strata renders (each panel's final frame), questions as captions.

**Risk + effort: M/L.** Still the highest gimmick risk of the five — but the risk is now front-loaded into a one-day gate instead of discovered at launch, and the law in the shader header keeps it from drifting swirly under iteration.

---

## CONCEPT 5 — WORKLIGHT (hybrid wildcard: light-led)

**Logline:** The underground is genuinely dark. A cone of work-light descends with you, and the root system exists only where your light has passed.

**The big idea.** The founder's own words: roots are "invisible when they're doing their job." Make invisibility literal and make the investor carry the light: scroll lowers an inspection lamp into a borehole, and everything Fostr does is revealed — then keeps faintly glowing after the beam passes, because a trace, once made, persists. The interaction model IS the traceability claim. The metaphor's hairline crack — the site makes you hunt with a lamp while the product's pitch is removing work — is answered by panel 8: the system was working the whole time, you just couldn't see it. That makes the finale load-bearing, and it is engineered accordingly (below). The moodiest concept, and the one no competitor could ship.

**Art direction.** Panels 2–7 in near-black warm soil (#2A211C → #191412) with heavy grain — **dithered in the shader**, because dark gradients band and smear on OLED. The beam is warm paper-white, generous, soft-edged. **The cardinal rule, promoted to law: every panel's headline is fully inside the beam at AAA contrast the moment the panel enters the viewport.** The beam reveals texture and roots — never the copy. A skimming investor reads the entire pitch without ever slowing down; the darkness is atmosphere around the words, not a gate in front of them. Roots are teal SDF lines that render only under the beam, then persist at 20% afterglow. Gold for questions glinting below the beam edge and for panel 7. The lamp is implied, never drawn — except its cable, a thin vertical line from the top of the viewport, and above ground at the top of that line: the sprout. The plant is what holds the light.

**The scroll journey.**
1. Full daylight, paper, badge, headline. No beam needed above ground. The thin cable hangs from the masthead sprout to the bottom edge, hinting.
2. Crossing the ground line, the viewport drops to dark and the beam kicks on with a soft bloom, sweeping across forms embedded in the soil wall — the same fields on each — panel 2's line printed in the light from the first frame.
3. The beam goes still and slightly warm. Nothing to inspect. Just the sentence, held in light: "Not the worker's." Exoneration staged as literally holding someone in the light.
4. The beam finds the taproot and, as you scrub, follows it through the branch into four destinations; each filament it touches stays lit. By panel's end the first permanent structure glows behind you. Under 25 seconds from the top.
5. Touch any produced line (auto-scrub on mobile) and the beam snaps a thread of light back up the shaft to the source note; the afterglow now runs the full height of everything you've read. The page is accumulating proof.
6. The beam widens to a floodlight for one beat, revealing how far the laterals run off-screen into elder care and group homes, then narrows. A glimpse of scale, not a tour. The business line sits in the floodlit beat, mono.
7. **Revised: the candle is dead.** No flame connotation, no vigil semantics near a foster-care story. The beam becomes a work-lamp dimmed to its lowest steady setting — small, warm, utterly unflickering — a pool of shop light around Jaden's words and nothing else. The darkest, quietest moment on the site, and the only place the light changes color.
8. **The switch-on — engineered as load-bearing, not a flourish.** One slow pulse runs from the seed upward and the entire root network — every filament, trace, and lateral you passed — lights at once, floor to surface, behind the CTA. It triggers on panel entry via IntersectionObserver, never on a scroll-velocity condition; it fires identically on a lazy half-scroll, a scrollbar drag, or a skip-nav jump. You finally see the whole system you descended through. Book 20 minutes with Jaden.

**Tooltip chain.** The question glints in gold just below the beam's lower edge — half-lit, legible but in shadow — pulling you to scroll it into the light, where it resolves into the next headline. Curiosity staged as literal darkness ahead.

**Wow moment.** The panel-8 switch-on. After three minutes of seeing only what your lamp touched, the full network reveal is the frame an investor describes to their partners the next morning.

**Tech plan.** Cheapest WebGL of the visual concepts, priced honestly: one fullscreen fragment-shader quad computing strata gradient + grain + SDF root lines + beam falloff — **plus a small ping-pong render target for afterglow accumulation** (the "one draw call" claim was undersold; it's one quad, two passes, still trivial). Dither baked into the gradient. Lenis + Motion for DOM; text is always HTML inside the beam region. **Phone-first: the beam follows scroll only — that is the design; cursor-steering is desktop garnish added last.** dpr 1 on mobile. Acceptance test written into the plan: the page is read on a real phone at a dinner table under restaurant lighting before the concept is signed off. Reduced motion / no-WebGL: each panel as a static lit-vignette with fully-grown roots, ending on the full-network still — the entire story preserved.

**Risk + effort: M.** Failure modes contained by law rather than hope: headline-always-lit kills the skim risk, the dead candle kills the grief register, dither and the dinner-table test kill the OLED and glare problems. Keep the beam big, the copy light-handed, and panel 8 bright, and this is the highest wow-per-engineering-hour on the list.

---

## HOW TO CHOOSE (one paragraph, not a sixth concept)

By spectacle: TAPROOT > SEDIMENT > WORKLIGHT > SURVEY > THE RECORD; inversely by resilience and speed to ship. The critic and I converge: **THE RECORD** is the pick — the medium is the product, it ships in days, and it is un-embarrassable in a partner meeting or a forwarded link. **WORKLIGHT** is the alternate if the fundraise can afford one shader and jaz wants the finale investors retell. TAPROOT is the flagship only with a real art budget and a timeline that won't make the site look like where the money went. SEDIMENT lives or dies on a one-day legibility gate — run it before falling in love with the freeze-frame. SURVEY now needs an illustration kill-gate before a line of code. All five keep the copy as real HTML, say who pays at panel 6, treat scroll-back as re-reading rather than erasure, design panel 5 for a thumb first, keep panel 7 as subtraction, and end with the sprout finally pointing up.