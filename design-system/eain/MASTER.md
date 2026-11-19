# Eain — Design System Master

Source of truth for UI polish work. Derived from the UI/UX Pro Max skill's
database (`.claude/skills/ui-ux-pro-max/data`) read by hand on 2026-11-19,
because the machine that set this up had no Python for the skill's search
script. Re-generate with the script once Python is installed:

```
python .claude/skills/ui-ux-pro-max/scripts/search.py "digital gift cards invitations rsvp celebration" --design-system -p "Eain" --persist --output-dir .
```

Rules here describe the existing Eain brand. They do not re-theme it: the
pink brand, the dark "glass" theme and the gift designs stay as they are.

## Product

- **Type**: gifting and invitations for friends and family (skill rows: Gift &
  Wishlist 139, Wedding/Event Planning 39). Audience in Myanmar, two languages
  (English, Burmese), mostly on phones over slow connections.
- **Pattern** (from the skill): minimal and direct for gifts, storytelling and
  social proof for invitations; large section gaps (48px+); celebration colours,
  never muted or low-energy.
- **Styles the skill pairs with this product**: Soft UI Evolution (soft depth,
  better contrast) and Glassmorphism (what the signed-in app already uses).
  Anti-patterns to avoid: generic templates, emoji as icons, gray on gray.

## Tokens in use (app/globals.css)

| Token                      | Light             | Dark              |
| -------------------------- | ----------------- | ----------------- |
| background                 | #fff8f4           | #170d1b           |
| foreground                 | #2b1f21           | #fcf2f6           |
| card                       | #ffffff           | #251630           |
| primary                    | #db3358           | #db3358           |
| primary-ink                | #c62a4f           | #ff7a9c           |
| brand                      | #f4506e           | #ff7396           |
| accent / accent-foreground | #ffe4e8 / #b32747 | #40203a / #ffd5df |
| muted / muted-foreground   | #fbeeeb / #6e595c | #29182f / #bba6ba |
| border                     | #f8ddd9           | #3a2543           |
| success                    | #1f7a51           | #3ddc97           |
| destructive                | #c62828           | #ff7b7b           |
| ring                       | #f4506e           | #ff7c9c           |
| radius                     | 0.875rem          |                   |

Fonts: Plus Jakarta Sans (interface), Fraunces (display and gift headings),
Noto Sans Myanmar / Padauk for Burmese; handwriting and poster faces only
inside gift designs. Base size 16px, line height 1.5.

## Checks every part of the polish applies (skill priorities 1–9)

1. **Accessibility (critical)**: text contrast 4.5:1 (3:1 for large text and
   UI parts), every icon-only control has an accessible name, visible focus
   rings never removed, images carry alt text or are hidden on purpose.
2. **Touch and interaction (critical)**: interactive targets 44×44 CSS px with
   8px between them; loading state on anything that takes longer than 100ms;
   nothing relies on hover alone; no 0ms state changes.
3. **Performance (high)**: WebP images, lazy loading below the fold, space
   reserved for anything that loads later (no layout shift).
4. **Style (high)**: SVG icons only (no emoji as icons), one visual language
   per surface, the gift designs keep their own palettes.
5. **Layout (high)**: mobile first, no horizontal scroll at 360px, no fixed
   pixel container widths, zoom never disabled.
6. **Typography and colour (medium)**: body never under 12px (14px minimum
   for anything to read), semantic tokens rather than raw hex in components.
7. **Animation (medium)**: durations fit the size of the change (150ms hover,
   200–300ms panels, 400–700ms page reveals), exits faster than entrances,
   `prefers-reduced-motion` honoured.
8. **Forms and feedback (medium)**: visible labels (placeholders are not
   labels), errors next to the field, helper text where a value has rules.
9. **Navigation (high)**: back always works, bottom navigation at most five
   items, every state has a link.

## Page overrides

None yet. Add `pages/<name>.md` when a page needs to depart from this file.
