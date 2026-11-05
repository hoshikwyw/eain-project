/* =========================================================
   The message: a name in script, then pages of text typed out
   a line at a time. The last page stays on screen.
   The name and pages come from js/config.js.
   ========================================================= */

(() => {
  "use strict";

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Typewriter "letters" ----------
     Keeps emoji (❤️ = ❤ + U+FE0F) and combining marks (Myanmar vowels
     ေ ြ ် and the like) together with the character before them, so
     nothing renders broken while it is typed. */
  const isMyanmarMark = (c) =>
    (c >= 0x102b && c <= 0x103e) || (c >= 0x1056 && c <= 0x1059) ||
    (c >= 0x105e && c <= 0x1060) || (c >= 0x1062 && c <= 0x1064) ||
    (c >= 0x1067 && c <= 0x106d) || (c >= 0x1071 && c <= 0x1074) ||
    (c >= 0x1082 && c <= 0x108d) || c === 0x108f || (c >= 0x109a && c <= 0x109d);

  function clusters(text) {
    const out = [];
    let joinNext = false;
    for (const ch of text) {
      const code = ch.codePointAt(0);
      const attach = out.length && (joinNext || isMyanmarMark(code) || code === 0xfe0f || code === 0x200d);
      if (attach) out[out.length - 1] += ch;
      else out.push(ch);
      joinNext = code === 0x1039 || code === 0x200d; // virama / zero-width joiner
    }
    return out;
  }

  const message = {
    root: null,
    reduced: false,

    build(root, reduced) {
      this.root = root;
      this.reduced = reduced;
      root.innerHTML = "";

      // Name in script, one letter at a time, with a heart after it
      const text = window.Scene.config.name.trim();
      const name = document.createElement("h1");
      name.className = "message__name";
      if (text) name.setAttribute("aria-label", text);
      const parts = text ? [...clusters(text), " ", "♡"] : ["♡"];
      parts.forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = ch === "♡" ? "message__char message__heart" : "message__char";
        s.textContent = ch === " " ? " " : ch;
        s.style.transitionDelay = `${i * 0.12}s`;
        s.setAttribute("aria-hidden", "true");
        name.appendChild(s);
      });

      const page = document.createElement("div");
      page.className = "message__page";

      root.append(name, page);
      this.nameEl = name;
      this.pageEl = page;
    },

    // Builds one line: visible typed part + caret + invisible rest (keeps layout steady)
    makeLine(text) {
      const p = document.createElement("p");
      p.className = "message__line";
      const sr = document.createElement("span");
      sr.className = "visually-hidden";
      sr.textContent = text;
      const shown = document.createElement("span");
      shown.className = "message__shown";
      shown.setAttribute("aria-hidden", "true");
      const caret = document.createElement("span");
      caret.className = "message__caret";
      caret.setAttribute("aria-hidden", "true");
      const rest = document.createElement("span");
      rest.className = "message__rest";
      rest.setAttribute("aria-hidden", "true");
      rest.textContent = text;
      p.append(sr, shown, caret, rest);
      return { p, shown, caret, rest, parts: clusters(text) };
    },

    async typeLine(line, speed) {
      line.p.classList.add("is-typing");
      if (this.reduced) {
        line.shown.textContent = line.parts.join("");
        line.rest.textContent = "";
      } else {
        for (let i = 1; i <= line.parts.length; i++) {
          line.shown.textContent = line.parts.slice(0, i).join("");
          line.rest.textContent = line.parts.slice(i).join("");
          // Linger a little on spaces so phrases breathe
          await wait(line.parts[i - 1] === " " ? speed * 2.5 : speed);
        }
      }
      line.p.classList.remove("is-typing");
    },

    async showPage(lines, isLast) {
      const page = this.pageEl;
      page.classList.remove("is-leaving");
      page.innerHTML = "";
      const built = lines.map((t) => this.makeLine(t));
      built.forEach((l) => page.appendChild(l.p));
      page.classList.add("is-visible");

      // A long page types faster, so nobody waits a minute for one message
      const letters = built.reduce((n, l) => n + l.parts.length, 0);
      const speed = letters > 90 ? 40 : letters > 50 ? 55 : 75;
      for (const line of built) {
        await this.typeLine(line, speed);
        await wait(350);
      }

      if (isLast) {
        page.classList.add("is-final");
        return;
      }
      await wait(this.reduced ? 3500 : 2400);
      page.classList.add("is-leaving");
      await wait(700);
      page.classList.remove("is-visible");
    },

    async play() {
      const pages = window.Scene.config.pages;
      // Make sure the script and Myanmar fonts are ready (max 2s wait on slow networks)
      if (document.fonts && document.fonts.ready) {
        await Promise.race([document.fonts.ready, wait(2000)]);
      }
      this.root.classList.add("is-active");
      await wait(100);
      this.nameEl.classList.add("is-visible");
      await wait(1400);
      for (let i = 0; i < pages.length; i++) {
        await this.showPage(pages[i], i === pages.length - 1);
      }
    },
  };

  window.Message = message;
})();
