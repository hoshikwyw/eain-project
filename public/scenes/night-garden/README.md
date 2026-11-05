# Night Garden scene

The animation behind the "Night Garden" gift template: a twilight sky, a garden
that grows and blooms, fireflies and falling petals, then a name and a message
typed a line at a time. Tapping blooms more flowers.

It is a plain static page with no build step. Eain shows it inside a frame on
the gift page and in the editor (`components/scene/scene-frame.tsx`), and sends
it what to show. Opened on its own (`/scenes/night-garden/index.html`) it plays
with sample text.

## What it is told

`js/config.js` asks the page that frames it for its content and gets back:

| Field | Meaning |
|---|---|
| `name` | Shown in script at the top, with a heart after it. |
| `pages` | The message. Each page is a few short lines; the last page stays. |
| `tapHint` | The small line shown after the message, until the first tap. |
| `flower` | One of `white`, `pink`, `yellow`, `lavender`, `red`, `blue`. |
| `fonts` | The app's own fonts, so nothing is fetched from another site. |

The flower keys are stored on gifts and must match `features/gifts/scene.ts`.
Only a page on the same site that frames this one may configure it.

## Files

```
index.html          the layers: sky, garden, particles, message
css/style.css       colours, layout, animations
js/config.js        content and flower colours
js/flower.js        SVG builder for the plant
js/growth.js        stem, leaf and bud growth (GSAP)
js/bloom.js         bud to flower (GSAP)
js/ambient.js       wind, fireflies, pollen, petals, tap bursts
js/message.js       the name and the typed message
js/interact.js      taps: bloom a bud, or a new flower where tapped
js/main.js          sky, garden layout, and the order things play in
js/vendor/          GSAP 3.15.1, free for commercial use (gsap.com/standard-license)
```

Adapted from the "Flowers for Jie Jie" project by the same author, keeping the
flower field and the text.
