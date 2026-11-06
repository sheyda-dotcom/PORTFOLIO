const cursorLight = document.querySelector(".cursor-light");

if (cursorLight) {
  document.addEventListener("mousemove", (event) => {
    cursorLight.style.left = event.clientX + "px";
    cursorLight.style.top = event.clientY + "px";
    cursorLight.style.opacity = "1";
  });

  document.addEventListener("mouseleave", () => {
    cursorLight.style.opacity = "0";
  });
}
document.querySelectorAll('.workspace-project').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});
(function titleCursor() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const makeCursor = () => {
    const s = document.createElement('span');
    s.className = 'type-cursor';
    s.setAttribute('aria-hidden', 'true');
    return s;
  };

  const typed = [...document.querySelectorAll('main h1, .typewriter')];

  // titles that only need a blinking cursor (no typing)
  document.querySelectorAll('.caret').forEach((el) => {
    if (!typed.includes(el)) el.appendChild(makeCursor());
  });

  typed.forEach((el) => {
    const cursor = makeCursor();
    if (reduce) { el.appendChild(cursor); return; }

    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.style.minHeight = el.offsetHeight + 'px';          // no layout jump

    // 1) collect text nodes, collapsing the HTML indentation/newlines
    const parts = [];
    let atLineStart = true;
    (function walk(node) {
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) {
          let t = c.textContent.replace(/\s+/g, ' ');
          if (atLineStart) t = t.replace(/^ /, '');
          if (!t.trim()) { c.textContent = atLineStart ? '' : t; return; }
          parts.push({ node: c, text: t });
          c.textContent = '';
          atLineStart = false;
        } else if (c.nodeName === 'BR') {
          atLineStart = true;
        } else {
          walk(c);
        }
      });
    })(el);
    if (!parts.length) { el.appendChild(cursor); return; }
    parts[parts.length - 1].text = parts[parts.length - 1].text.trimEnd();

    // 2) constant-speed typing, capped at ~1.5s total
    const total = parts.reduce((n, p) => n + p.text.length, 0);
    const perChar = Math.max(22, Math.min(60, 1500 / total));
    const delay = 300;
    const t0 = performance.now() + delay;

    cursor.classList.add('typing');
    parts[0].node.after(cursor);

    let lastShown = -1;
    (function frame(now) {
      const n = Math.min(total, Math.max(0, Math.floor((now - t0) / perChar)));

      if (n !== lastShown) {
        lastShown = n;
        let left = n, lastIdx = 0;
        parts.forEach((p, i) => {
          const k = Math.max(0, Math.min(p.text.length, left));
          p.node.textContent = p.text.slice(0, k);
          if (k > 0) lastIdx = i;
          left -= k;
        });
        parts[lastIdx].node.after(cursor);                // cursor follows the text
      }

        if (n < total) {
        requestAnimationFrame(frame);
    }
    })(performance.now());
});
})();