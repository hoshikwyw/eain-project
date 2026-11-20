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

Both need Chrome or Edge on the machine. Chrome is preferred: headless Edge
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
