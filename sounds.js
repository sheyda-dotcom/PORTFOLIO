/* ==========================================================
   Soft UI sounds for the whole portfolio.
   - No audio files: the sounds are generated in the browser.
   - Quiet and very short, to match the dark red / code theme.
   - Only starts after the visitor's first click or key press
     (browsers do not allow sound before that).
   - A small speaker button (top right) turns the sounds on/off
     and remembers the choice.
   ========================================================== */
(function () {
  'use strict';

  var VOLUME = 0.6;          // master volume, 0 to 1. Lower = quieter.
  var KEY = 'portfolio-sound';

  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  var ctx = null, master = null, lastAt = 0;
  var enabled = true;
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) {}

  /* ---------- audio engine ---------- */
  function start() {
    if (!ctx) {
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
      master = ctx.createGain();
      master.gain.value = VOLUME;
      var soft = ctx.createBiquadFilter();       // takes the sharpness off the top
      soft.type = 'lowpass';
      soft.frequency.value = 3600;
      master.connect(soft);
      soft.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function ready() { return enabled && ctx && ctx.state === 'running'; }

  // inside a click / key press: the browser allows sound, so wake the audio and play at once
  function gesture(fn) {
    if (!enabled) return;
    start();
    if (ctx.state === 'running') fn();
    else ctx.resume().then(fn).catch(function () {});
  }
  // on hover: play right away whenever the browser already allows sound
  // (if it does not yet, nothing is queued, so sounds never pile up)
  function tryPlay(fn) {
    if (!enabled) return;
    if (!ctx) { try { start(); } catch (e) { return; } }
    if (ctx.state !== 'running') { ctx.resume().catch(function () {}); return; }
    fn();
  }

  // one very short, soft tone: starts instantly and fades fast (no echo, no tail)
  function note(freq, dur, peak, delaySec) {
    if (!ready()) return;
    var t = ctx.currentTime + (delaySec || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);   // near-instant, still click-free
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  var lastClick = 0, lastHover = 0, lastPic = 0;
  function gap(prev, ms) { return performance.now() - prev < ms; }

  /* ---------- the sounds (all well under a quarter of a second) ---------- */
  function click() {                    // press: a short, soft pop
    if (gap(lastClick, 60)) return;
    lastClick = performance.now();
    note(784, 0.09, 0.06);
    note(1175, 0.06, 0.02, 0.005);
  }
  function hover() {                    // pointer lands on something clickable: a tiny, quiet tick
    if (gap(lastHover, 70)) return;
    lastHover = performance.now();
    note(1320, 0.05, 0.02);
  }
  function grow() {                     // picture enlarges: quick soft rise
    if (gap(lastPic, 100)) return;
    lastPic = performance.now();
    note(523, 0.1, 0.045);
    note(784, 0.13, 0.04, 0.045);
  }
  function shrink() {                   // picture returns: one short, softer note
    if (gap(lastPic, 100)) return;
    lastPic = performance.now();
    note(587, 0.08, 0.03);
  }

  /* ---------- unlock on the first interaction ---------- */
  ['pointerdown', 'mousedown', 'pointerup', 'click', 'keydown', 'touchstart', 'touchend'].forEach(function (ev) {
    window.addEventListener(ev, start, { passive: true });
  });

  /* ---------- clicks and hovers on anything clickable ---------- */
  var CLICKABLE = 'a, button, [role="button"], .g-slide, .project-card, .workspace-project, .run-project, .play-button';
  var PIC = '.ac-fig:not(.photo) img';

  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    if (e.target.closest && e.target.closest('#snd-toggle')) return;
    if (e.target.closest && e.target.closest(CLICKABLE)) { gesture(click); }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = document.activeElement;
    if (t && t.closest && t.closest(CLICKABLE)) { gesture(click); }
  }, true);

  var current = null, hovered = null;
  document.addEventListener('mouseover', function (e) {
    if (!e.target.closest) return;

    // achievements pictures: enlarge sound
    var img = e.target.closest(PIC);
    if (img && img !== current) { current = img; tryPlay(grow); return; }

    // everything else that can be clicked: hover tick
    var el = e.target.closest(CLICKABLE);
    if (el && el !== hovered && !el.closest('#snd-toggle')) { hovered = el; tryPlay(hover); }
  });
  document.addEventListener('mouseout', function (e) {
    if (!e.target.closest) return;
    var img = e.target.closest(PIC);
    if (img && img === current && !(e.relatedTarget && img.contains(e.relatedTarget))) {
      current = null; tryPlay(shrink);
    }
    var el = e.target.closest(CLICKABLE);
    if (el && el === hovered && !(e.relatedTarget && el.contains(e.relatedTarget))) hovered = null;
  });

  /* ---------- on / off button ---------- */
  var ON  = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var OFF = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';

  var css = document.createElement('style');
  css.textContent =
    '#snd-toggle{position:fixed;top:5rem;right:1rem;z-index:90;width:2rem;height:2rem;' +
    'display:grid;place-items:center;padding:0;cursor:pointer;color:#ffd3d7;' +
    'background:rgba(38,4,11,.75);border:1px solid rgba(255,255,255,.17);border-radius:50%;' +
    'opacity:.7;transition:opacity .2s,background .2s,box-shadow .2s;}' +
    '#snd-toggle:hover{opacity:1;background:#8c1125;box-shadow:0 0 16px rgba(241,76,98,.45);}';
  document.head.appendChild(css);

  function mountToggle() {
    var b = document.createElement('button');
    b.id = 'snd-toggle';
    b.type = 'button';
    function paint() {
      b.innerHTML = enabled ? ON : OFF;
      b.title = enabled ? 'Sound on (click to mute)' : 'Sound off (click to turn on)';
      b.setAttribute('aria-label', b.title);
    }
    paint();
    b.addEventListener('click', function () {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) {}
      paint();
      if (enabled) { gesture(click); }
    });
    document.body.appendChild(b);
  }
  if (document.body) mountToggle();
  else document.addEventListener('DOMContentLoaded', mountToggle);
})();