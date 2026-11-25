# Eain — UX audit and test report, 19 November 2026

What was checked, what was wrong, what changed, and what is left. Measured
on the local dev server with the two scripts in `scripts/`, in headless
Chrome, at 390px (touch) and 1280px (mouse), in the light and dark themes.

## Tools

- `pnpm ux:audit [paths]` — loads pages and measures them against the
  checklist in `MASTER.md`: tap targets (44px on touch widths, 24px with a
  mouse, links inside running text at least 24px), 8px between targets,
  controls without a name, inputs without a label, images without alt,
  text contrast against the composited background (4.5:1, 3:1 for large
  text), text under 12px, horizontal overflow, focus rings by tabbing
  through the page, heading count and skipped levels, zoom lock, pointer
  cursor. Options: `--width`, `--theme`, `--cookie`, `--click`, `--json`.
  In Git Bash prefix `MSYS_NO_PATHCONV=1` so `/paths` are not rewritten.
- `pnpm ux:flows [--width 1280]` — four journeys in a real browser with a
  throwaway host and a published invitation: visitor (home, library,
  template page, guest editor), guest (RSVP on the card, come back, change
  it), keyboard (the card by Tab and arrows), host (sign in, guest list,
  download, change the account picture). 35 checks, exit 1 on any failure.

- `pnpm ux:idle [slugs]` — how busy the main thread stays once a card is
  open and nothing is happening, with the CPU throttled four times, the way
  a mid-range phone feels. It loads the template page, hides everything
  around the card, opens it, lets it settle and samples the browser's
  counters over a quiet window: task time as a share of the window, style
  recalcs, layouts, script and long tasks. `--motion off` gives the floor
  under reduced motion; `--motion both` prints the pair. `--headful` opens a
  visible window with the GPU on, the closer reading for a scene that leans
  on compositor layers; headless Chrome composites in software. `--settle`
  sets the wait after opening (6 s; the night garden needs about 60).

All three need Chrome or Edge on the machine. Chrome is preferred: headless Edge
(new mode) stops completing React's streamed sections after a few loads in
one session, which reads as empty pages. Do not run them while `pnpm test`
runs; the tests delete throwaway `@example.com` users.

## Results

| Area                                                                                           | Pages × widths × themes          | Findings before                      | Findings after |
| ---------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------ | -------------- |
| Public pages (home, library, template pages, legal, contact, sign in/up/forgot)                | 9 × 2 × 2                        | 682                                  | 0              |
| Signed-in pages (dashboard, My Gifts, gift page with replies, notifications, points, settings) | 6 × 2 × 2                        | 136                                  | 0              |
| Editor (template picker, draft editor) and guest try pages                                     | 4 × 2 × 2                        | 58                                   | 0              |
| Receiver page, closed and opened (invitation and gift)                                         | 2 × 2 × 2 × 2 states             | 15 (opened, after the earlier parts) | 0              |
| Journeys (`ux:flows`)                                                                          | 35 checks at 390px and at 1280px | 5 failed on the first run            | 0 failed       |

Full test suite after the work: 147 tests, 146 pass, 1 skipped (a cron
case that needs the production secret), 0 failures.

## What changed

**Touch sizes.** Small and icon buttons are 44px tall below the `sm`
breakpoint everywhere (`components/ui/button.tsx`); the compact desktop
sizes return from 640px. Header, nav, footer, legal, library, auth,
dashboard and editor links and chips are 44px tall on phones with 8px
between neighbours. Inside the gift card, which is laid out at 400px and
scaled to the screen, controls use `touch-min` and `touch-gap` (divided by
the stage's scale) so they still measure 44px and 8px on the screen.

**Headings.** Every page has exactly one h1. Gift thumbnails used to leak
their sample title as an h1 (ten h1s on the home page); headings in the
card now carry a class for their look and render as plain text in
thumbnails, as h2 under a page title.

**Hydration.** Thumbnails sat inside links while carrying links of their
own (the event's map link), so the home page and the galleries threw their
server HTML away and re-rendered on the client. Thumbnails are inert now.

**Contrast.** The champagne look's muted and accent text (4.1:1, 4.25:1)
and the celebrate look's accent button (3.64:1) read at 4.5:1 or better.

**Readability.** 11px labels (home eyebrows, bottom nav, editor tabs) and
the 10px question note are 12px.

**Keyboard.** Buttons show a pointer cursor. Gift tiles, canvas sections and
the editor's section list show focus rings. The card's options behave like
radio buttons: one tab stop per group, arrow keys move and choose.

**Layout.** The fixed-width card no longer widens grid cells on phones
(`contain: inline-size` on the stage); the phone header shows the logo
mark alone so nothing overlaps.

**Flows.** "Change my RSVP" kept clearing the guest's name, so a changed
answer could not be sent on an invitation; the earlier answers now stay
filled in. The library's chip filter, the returning-guest restore and the
sign-in form all pass the journey checks.

## Landing page against the skill's patterns

The database pairs this product with the "Minimal & Direct" landing pattern
(hero headline, short description, at most three benefit bullets, one CTA,
large type, whitespace) and, for invitations, storytelling with proof.
Measured on 19 November 2026:

- The primary button sits above the fold at 1280×800 and at 390×844
  (bottom edge at 463px in both), and the hero leaves the top of the next
  section visible as a cue.
- Running text measures at most 56 characters per line on desktop and 50
  on a phone, inside the ranges the guidelines ask for.
- Motion: one floating illustration in the hero; every animation and
  transition collapses under `prefers-reduced-motion`.
- Fixed in this review: both hero buttons led to the template library. The
  secondary one now goes to "How it works", so the hero offers one primary
  action and one different path, as the pattern asks.
- Not done on purpose: social proof. Eain has no testimonials or usage
  numbers worth showing yet, and none will be invented.

## Account pictures (20 November 2026)

Every account now shows a drawn avatar (Boring Avatars) or its provider
photo, and Settings has a picker: six styles, five palettes, shuffle, the
Google photo when there is one. The settings page with the picker measures
0 findings at 390px and 1280px in both themes; the tiles are 72×86px and the
palette swatches 44×44px with 8px between them. The host journey picks a
style, sees the confirmation and the bar redraw (35 of 35 checks at both
widths). Two things the browser run caught: the toast library ignores a
toast whose fixed id was already dismissed, so the picker dismisses the last
confirmation by its own id instead; and a provider photo that fails before
hydration never fires its error event, so the component also checks the
image after mount and falls back to the drawing.

## Premium polish of the templates (20 November 2026)

Five commits gave every card a finish without touching the audit results.
Shared: paper grain, a sheen and an inner edge on every card, the card's
shadow cast from the stage, photos as prints with matte, hairline and
layered shadow. Postcards: a perforated SVG stamp, the postcard back with
frame and address lines, letterpress headings. Premium cards: gold foil
from the look's own gold with a drift that reduced motion stops, a ticket
with stub and perforation, the memory album with linen and stitching,
fireflies that breathe. Invitations: hairline RSVP fields, display-face
numerals, an outlined send in spaced capitals, double hairlines and corner
ornaments, crests pressed in. Openings: a grained envelope with liner and a
domed wax seal, satin ribbon, velvet curtain under a braided valance; a
gold crown badge marks premium templates in the library.

After the work: home, library and template pages 0 findings at 390px light
and dark and 1280px light; the receiver page closed and opened 0 findings
in the same three; journeys 35 of 35 at both widths; 152 tests, 151 pass,
1 skipped. Before and after screenshots of all 20 opened cards were taken
at the receiver's view for the comparison.

The polish was then checked where it had not been looked at: in the editor
and in a production build. In the editor, the resize handle sits on the
corner of a photo print and dragging it resizes the print; the stationery
RSVP preview dresses as it does on the card. One regression found and
fixed: the print container had started centring itself, so a photo narrower
than the card no longer stretched to its width as before. The production
build (`next build`, served by `next start`) draws the foil, the ticket's
notches, the stamp's perforations and the domed seal the same as the dev
server; home, library, template and receiver pages 0 findings, journeys 35
of 35 at both widths.

A Burmese pass over the polished cards followed. Foil, letterpress, the
stamp, the prints and the stationery frames all hold at Burmese sizes.
Two things did not: the ticket's stub wrote the guest's name sideways,
which stacks Burmese marks badly, so Burmese now stays upright on the stub;
and the invitation's time and place lines wore spaced small capitals, a
Latin device that pulls Burmese clusters apart, so Burmese event lines keep
their letters together a size up, and the send line does the same on a
Burmese page.

## What an open card costs at idle (20 November 2026)

The polish added a grain overlay, a drop-shadow filter on the stage, a foil
drift, breathing fireflies and the earlier floating illustration, so the
idle cost of every opened card was measured with `pnpm ux:idle` at 390px
and the CPU throttled four times. Nineteen of the twenty cards keep the
main thread between 2% and 16% busy; the foil drift on the anniversary card
is within noise of the card without it. The first measurement after a dev
server starts reads high (compilation), so a busy first row is re-run.

The night garden is the exception at 99%, with about 46 long tasks in five
seconds, and it was so before this work: its scene is a canvas and GSAP
piece adapted from another project, with a frame loop, per-frame layout
reads on each plant, additive canvas blending and a dozen CSS animations.
Reduced motion stops all of it.

The scene was then taken apart with switches inside its frame. The frame
loop and the CSS animations each saturated the main thread on their own, so
only stopping both freed it. Inside the loop, the plants' SVG transform
writes cost the most (a layout and a repaint of the whole garden per write),
then the canvas, then the particle maths. Among the CSS animations, the
grass sway (CSS transforms on SVG groups in the same garden, repainting it
sixty times a second), the blinking eyes and cheeks (SVG again), the clouds
(a drop-shadow filter on the parent of a bobbing picture, re-drawn every
frame) and the twinkling stars (one compositor layer each) cost the most.

Changes in `public/scenes/night-garden`: the grass sways from the same
15 Hz tick as the plants instead of its own animation; plants are written
15 times a second; the loop draws 30 frames a second on small screens; the
canvas draws at 1.5x at most on small screens; blink and cheek glow use
stepped timing, so they change a few times a second; the cloud's shadow sits
on the element that bobs; the final line breathes by opacity instead of an
animated text-shadow; every other star holds still on small screens.

Measured in the same headless setting, old scene against new, over 5 s 40 s
in: paints 198 to 108, layouts 66 to 53; with CSS animations off, the loop
alone left a probe at 14 frames a second before and 27 after. Headless
Chrome composites in software, so the star, cloud and halo layers still
saturate it there and `ux:idle` keeps reading 99% for this card; on a phone
those layers run on the GPU and the main-thread savings above are what
remains. The scene still looks and moves the same: grass angles change from
tick to tick, half the stars twinkle, clouds keep their glow, the final line
keeps its halo.

### Measured with the GPU on

`pnpm ux:idle --headful` opens a visible Chrome window with the GPU on and
brings it to the front (a window spawned from a script starts hidden, and a
hidden page gets no frames). Two things came out of the first such run.

The tool's own hide rule had never hidden the template page's "more
templates" strip: the page wraps everything in one element, so the rule
matched nothing, and the strip's thumbnails, with their floating balloons
and foil, were counted in every row. The rule now follows the page's
structure and the tool refuses a row when anything but the demo section is
left. The `--settle` option had also lost its default, so cards were
sampled during their opening. The table below replaces the earlier one.

The second finding is how Chrome prices animations, proven on small pages
built for the purpose, each over three seconds of style recalcs:

- An animation on the compositor costs the main thread nothing, until any
  requestAnimationFrame loop runs. Then every main frame recalculates style
  for every running animation (40 twinkles: 0 recalcs alone, 150 with an
  empty frame loop, 51 with the loop paced to 30 frames a second).
- A transform animation on an `<svg>` element runs on the main thread (180
  recalcs); the same animation on a div around it runs on the compositor (2).
- Keyframes that read a custom property (`opacity: var(--min-o)`) are
  recomputed for every element in every style pass.
- An animation that starts while a transition or another animation holds
  the same property on the same element starts on the main thread and stays
  there for good, and alone drives sixty main frames a second for the whole
  page. The tap hint's pulse against the pill's fade-in, and the name's
  heartbeat against the heart's reveal, were both stuck that way.

Changes in `public/scenes/night-garden`: blinks and the moon's cheeks are
written from the plants' 15 Hz tick (two writes per blink, two a second for
the cheeks) instead of CSS animations; the cloud bob sits on a div inside
the cloud; the cloud drift, the twinkle and the shooting star are Web
Animations with plain pixel and number keyframes; the heartbeat starts once
the heart's reveal has finished (`is-beating`); the hint's pulse is on its
text, and the pill lost its backdrop blur; the gusts are plain maths from a
timestamp, so GSAP's ticker sleeps after the intro; the loop paces itself
with a timeout on small screens, since a frame callback that returns early
still costs a main frame. The scene looks the same: five faces blink, the
cheeks glow, clouds drift and bob, stars twinkle, shooting stars fly, the
heart beats, the hint pulses; reduced motion holds the clouds still and
runs no loop; console clean.

Standalone scene, GPU on, CPU throttled four times, no frame loop of our
own, 45 s in, before and after this part:

| | before | after |
| --- | --- | --- |
| busy, scene running | 96% to 100% | 81% to 85% |
| busy, ambient loop stopped | 95% | 5% |
| main frames in 5 s, loop stopped | 140 to 184 | 6 |
| long tasks in 5 s, scene running | 41 to 48 | 32 to 38 |

With the loop stopped nothing in the scene touches the main thread any
more. What remains while it runs is the plants' sway: each 15 Hz tick
writes SVG transforms, and that costs a style pass, a layout, a repaint and
a re-layerisation of the garden, about 55 ms per tick on the throttled core.
The structural fix, one `<svg>` per plant so the sway can be a compositor
transform, is open. Through the tool, the embedded card reads 89% headless
and 77% with the GPU on.


## Known limits

- Text over gradients or images is reported as unmeasured, not passed; the
  audit prints how many such elements each page has.
- Google's own sign-in button is 40px tall at its largest size and is
  excluded from the audit (`data-audit-ignore`).
- On the template pages in development, React's dev build logs a timing
  exception ("negative time stamp"); it is absent from production builds.
- The same audit and journeys were then run against a local production
  build (`next build` served by `next start`): 92 page rows, 0 findings, no
  stalled loads; 31 of 31 journey checks at 390px and at 1280px; the dev-only
  timing exception is absent; the home page answers in about 0.9s to first
  byte on this machine.
