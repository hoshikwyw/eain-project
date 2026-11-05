/* =========================================================
   Part 8 — Interactivity
   • Tap a closed bud in the garden → it blooms
   • Tap anywhere else → a little Mesua flower blooms right there,
     with hearts + sparkles, then floats up like a lantern
   • Move finger / mouse over flowers → they get nudged
   ========================================================= */

(() => {
  "use strict";

  const rand = (min, max) => Math.random() * (max - min) + min;

  const interact = {
    enabled: false,
    garden: null,       // the garden object from main.js
    state: null,
    taps: [],           // live tap flowers
    hint: null,

    init({ scene, hint, garden, state }) {
      this.garden = garden;
      this.state = state;
      this.hint = hint;

      scene.addEventListener("pointerdown", (e) => this.onTap(e));
      scene.addEventListener("pointermove", (e) => {
        if (this.enabled && window.Ambient && window.Ambient.running) {
          window.Ambient.nudge(e.clientX, e.clientY);
        }
      }, { passive: true });
      scene.addEventListener("pointerleave", () => {
        if (window.Ambient) window.Ambient.pointer = null;
      });
    },

    enable() {
      this.enabled = true;
    },

    showHint() {
      if (this.hint && !this.hint.dataset.used) this.hint.classList.add("is-visible");
    },

    hideHint() {
      if (!this.hint) return;
      this.hint.dataset.used = "1";
      this.hint.classList.remove("is-visible");
    },

    /* ---------- Taps ---------- */

    onTap(e) {
      if (!this.enabled) return;
      const x = e.clientX;
      const y = e.clientY;

      if (window.Ambient && window.Ambient.running) window.Ambient.burst(x, y);
      this.hideHint();

      // A bloomed flower is left alone, so a new one never covers it
      if (this.findFlower(x, y)) return;

      // Tapped near a closed bud? Bloom it. Otherwise bloom a new flower here.
      const bud = this.findBud(x, y);
      if (bud) this.bloomBud(bud);
      else this.spawnFlower(x, y);
    },

    // Fully bloomed garden flower under the finger (petal area)
    findFlower(x, y) {
      for (const p of this.garden.plants) {
        const f = p.flower;
        if (!f || !f.bloomed) continue;
        const r = f.petalGroup.getBoundingClientRect();
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < Math.max(r.width, r.height) * 0.42) return p;
      }
      return null;
    },

    findBud(x, y) {
      if (!this.garden.played.growth) return null;
      let best = null;
      let bestDist = 38; // generous touch radius (buds are small on phones)
      for (const p of this.garden.plants) {
        if (p.flower) continue;
        const r = p.bud.getBoundingClientRect();
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bestDist) {
          best = p;
          bestDist = d;
        }
      }
      return best;
    },

    bloomBud(plant) {
      const { createFlower } = window.MesuaFlower;
      plant.flower = createFlower(plant.headInner);
      plant.kind = "flower";
      if (!window.gsap) {
        plant.bud.setAttribute("opacity", 0);
        return;
      }
      window.Bloom.prepare(plant);
      window.Bloom.bloomFlower(plant);
    },

    // A small flower that blooms at the tap point, then drifts up and fades
    spawnFlower(x, y) {
      const svg = this.garden.svg;
      if (!svg) return;
      const { el, createFlower, createBud } = window.MesuaFlower;

      // Keep it light on phones: drop the oldest when too many
      const max = this.state.isSmall ? 6 : 10;
      while (this.taps.length >= max) this.removeTap(this.taps[0]);

      let layer = svg.querySelector(".garden__taps");
      if (!layer) layer = el("g", { class: "garden__taps" }, svg);

      const base = Math.min(1.4, Math.max(0.85, this.state.width / 375));
      const scale = rand(0.32, 0.42) * base;
      const rot = rand(-25, 25);
      const g = el("g", { class: "tap-flower" }, layer);
      const pos = { x, y, s: scale, r: rot, o: 1 };
      const apply = () => {
        g.setAttribute("transform",
          `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) rotate(${pos.r.toFixed(1)}) scale(${pos.s.toFixed(3)})`);
        g.setAttribute("opacity", pos.o.toFixed(3));
      };
      apply();

      const bud = createBud(g);
      const flower = createFlower(g, { stamens: 70 });
      const tap = { g, tl: null };
      this.taps.push(tap);

      if (!window.gsap) return;

      const plantLike = { bud, flower };
      window.Bloom.prepare(plantLike);
      const tl = gsap.timeline({ onComplete: () => this.removeTap(tap) });
      tl.add(window.Bloom.bloomFlower(plantLike), 0);

      // Float up like a little lantern, swaying, then fade
      const drift = rand(-40, 40);
      tl.to(pos, {
        y: y - rand(140, 220),
        x: x + drift,
        r: rot + drift * 0.4,
        s: scale * 0.8,
        o: 0,
        duration: rand(4.5, 6),
        ease: "sine.in",
        onUpdate: apply,
      }, 3.2);
      tap.tl = tl;
    },

    removeTap(tap) {
      if (tap.tl) tap.tl.kill();
      tap.g.remove();
      this.taps = this.taps.filter((t) => t !== tap);
    },

  };

  window.Interact = interact;
})();
