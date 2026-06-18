/*!
 * GhostWrite Rive Integration
 * ─────────────────────────────────────────────────────────
 * Tries to load ghostwrite.riv via the Rive JS runtime.
 * Falls back to canvas-coded animation if .riv not found.
 *
 * States:
 *   idle       — ghost floats gently, pen twitches
 *   writing    — pen moves, ink particles emit
 *   loading    — ghost pulses with spinner ring
 *   success    — ghost celebrates, green burst
 *   error      — ghost shakes, red flash
 *
 * Usage:
 *   <canvas id="ghost-canvas" width="300" height="300"></canvas>
 *   <script src="ghostwrite-rive.js"></script>
 *   <script>
 *     const g = new GhostRive('ghost-canvas', {
 *       riv: 'ghostwrite.riv',       // optional — falls back to canvas
 *       logoSrc: 'ghost-logo.png',   // optional — uses programmatic ghost if absent
 *     });
 *     g.setState('writing');
 *     g.onStateChange = (from, to) => console.log(from, '->', to);
 *   </script>
 *
 * Auto-init:
 *   <canvas id="hero-ghost" data-ghostrive="heroGhost"
 *           data-riv="ghostwrite.riv" data-logo="ghost.png"
 *           width="300" height="300"></canvas>
 *   // Accessible as window.heroGhost.setState('success')
 */

class GhostRive {
  constructor(canvasId, opts = {}) {
    this.canvas   = typeof canvasId === 'string'
      ? document.getElementById(canvasId)
      : canvasId;
    this.ctx      = this.canvas.getContext('2d');
    this.opts     = Object.assign({ riv: null, logoSrc: null }, opts);
    this.state    = 'idle';
    this.frame    = 0;
    this.raf      = null;
    this.riveInst = null;
    this._inputs  = null;
    this.logoImg  = null;
    this.particles = [];

    // Animation state values
    this.ghostY   = 0;
    this.ghostR   = 0;
    this.penAngle = -0.4;
    this.penX     = 0;
    this.opacity  = 1;
    this.pulseR   = 0;
    this.shakeX   = 0;
    this.flashA   = 0;
    this.flashCol = '#10B981';
    this.celebA   = 0;
    this.errorFlash = 0;

    this.onStateChange = null;

    this._init();
  }

  async _init() {
    if (this.opts.logoSrc) await this._loadImg(this.opts.logoSrc);
    if (this.opts.riv)     await this._tryRive();
    else                   this._startCanvas();
  }

  _loadImg(src) {
    return new Promise(res => {
      const img = new Image();
      img.onload  = () => { this.logoImg = img; res(); };
      img.onerror = () => res();
      img.src = src;
    });
  }

  async _tryRive() {
    const loadRuntime = () => new Promise((res, rej) => {
      if (typeof Rive !== 'undefined') { res(); return; }
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@rive-app/canvas@2.21.7/rive.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });

    try {
      await loadRuntime();
      const r = new Rive({
        src: this.opts.riv,
        canvas: this.canvas,
        autoplay: true,
        stateMachines: 'GhostStateMachine',
        onLoad: () => {
          this.riveInst = r;
          this._inputs  = r.stateMachineInputs('GhostStateMachine');
          console.log('[GhostRive] Rive loaded. Inputs:', this._inputs?.map(i=>i.name));
          this.setState('idle');
        },
        onLoadError: () => {
          console.log('[GhostRive] .riv not found — canvas fallback');
          r.reset();
          this._startCanvas();
        },
      });
    } catch(e) {
      console.log('[GhostRive] Runtime error — canvas fallback:', e.message);
      this._startCanvas();
    }
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────

  setState(newState) {
    if (newState === this.state) return;
    const prev = this.state;
    this.state  = newState;

    // Drive real Rive state machine
    if (this.riveInst && this._inputs) {
      const map = { idle:0, writing:1, loading:2, success:3, error:4 };
      // Try number input
      const numInput = this._inputs.find(i => i.name === 'state' || i.name === 'State');
      if (numInput) numInput.value = map[newState] ?? 0;
      // Try trigger input
      const trigger  = this._inputs.find(i => i.name === newState);
      if (trigger?.fire) trigger.fire();
      // Try boolean inputs
      Object.keys(map).forEach(s => {
        const boolInp = this._inputs.find(i => i.name === `is_${s}` || i.name === `Is${s[0].toUpperCase()+s.slice(1)}`);
        if (boolInp !== undefined) boolInp.value = s === newState;
      });
    }

    // Canvas fallback state entry
    if (newState === 'success') {
      this.flashCol = '#10B981';
      this.flashA   = 1.0;
      this.celebA   = 1.0;
      this._burst('#10B981', 28);
      this._burst('#9B7EFD', 10);
    }
    if (newState === 'error') {
      this.flashCol  = '#EF4444';
      this.flashA    = 0.9;
      this.errorFlash = 1.0;
      this._burst('#EF4444', 8);
      this._shake();
    }
    if (newState === 'loading') {
      this.pulseR = 0;
    }
    if (newState === 'idle') {
      this.flashA = 0; this.celebA = 0; this.errorFlash = 0;
    }

    if (this.onStateChange) this.onStateChange(prev, newState);
  }

  getState() { return this.state; }

  stop() {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    if (this.riveInst) { try { this.riveInst.cleanup(); } catch(e) {} }
  }

  // ── PARTICLE BURST ────────────────────────────────────────────────────────

  _burst(color, count) {
    const cx = this.canvas.width  / 2;
    const cy = this.canvas.height / 2;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.4;
      const speed = 2.5 + Math.random() * 4;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1.0,
        decay: 0.020 + Math.random() * 0.018,
        r: 2.5 + Math.random() * 4,
        color,
        spin: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  _shake() {
    let count = 0;
    const run = () => {
      this.shakeX = (count % 2 === 0 ? 1 : -1) * Math.max(0, 9 - count * 1.4);
      count++;
      if (count <= 7) setTimeout(run, 52);
      else this.shakeX = 0;
    };
    run();
  }

  // ── CANVAS RENDERER ───────────────────────────────────────────────────────

  _startCanvas() {
    const tick = () => {
      this.frame++;
      this._update();
      this._draw();
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  _update() {
    const f  = this.frame;
    const st = this.state;

    // Float
    const amp = st === 'loading' ? 5 : st === 'error' ? 3 : 11;
    const spd = st === 'loading' ? 0.045 : 0.022;
    this.ghostY = Math.sin(f * spd) * amp;
    this.ghostR = Math.sin(f * 0.017) * (st === 'error' ? 0.03 : 0.04);

    // Writing pen movement
    if (st === 'writing') {
      this.penAngle = -0.4 + Math.sin(f * 0.09) * 0.20;
      this.penX     = Math.sin(f * 0.13) * 7;
      if (f % 5 === 0) {
        const W = this.canvas.width, H = this.canvas.height;
        this.particles.push({
          x:  W/2 + this.penX + 22,
          y:  H/2 + this.ghostY + 22,
          vx: (Math.random() - 0.5) * 1.6,
          vy: 0.9 + Math.random() * 0.9,
          life: 1.0, decay: 0.048,
          r: 1.5 + Math.random() * 2.5,
          color: f % 15 < 8 ? '#7C5CFC' : '#9B7EFD',
          spin: 0,
        });
      }
    } else {
      this.penAngle += (-0.4 - this.penAngle) * 0.07;
      this.penX     += (0   - this.penX)      * 0.09;
    }

    // Loading ring
    if (st === 'loading') {
      this.pulseR = (this.pulseR + 1.4) % 360;
      this.opacity = 0.72 + Math.sin(f * 0.09) * 0.28;
    } else {
      this.opacity += (1 - this.opacity) * 0.07;
    }

    // Decay
    if (this.flashA  > 0) this.flashA  = Math.max(0, this.flashA  - 0.025);
    if (this.celebA  > 0) this.celebA  = Math.max(0, this.celebA  - 0.010);
    if (this.errorFlash > 0) this.errorFlash = Math.max(0, this.errorFlash - 0.030);

    // Particles
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.05;
      p.vx *= 0.98;
      p.life -= p.decay;
    });
  }

  _draw() {
    const c  = this.ctx;
    const W  = this.canvas.width;
    const H  = this.canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const st = this.state;

    c.clearRect(0, 0, W, H);

    // ── PARTICLES (behind ghost) ──
    this.particles.forEach(p => {
      c.save();
      c.globalAlpha = Math.max(0, p.life * 0.88);
      c.fillStyle   = p.color;
      c.shadowBlur  = 8;
      c.shadowColor = p.color;
      c.beginPath();
      c.arc(p.x, p.y, Math.max(0.1, p.r * p.life), 0, Math.PI * 2);
      c.fill();
      c.restore();
    });

    c.save();
    c.translate(cx + this.shakeX, cy);

    // ── SUCCESS GLOW ──
    if (this.celebA > 0) {
      c.save();
      c.globalAlpha = this.celebA * 0.45;
      const gr = c.createRadialGradient(0, this.ghostY, 20, 0, this.ghostY, 95);
      gr.addColorStop(0, 'rgba(16,185,129,0.35)');
      gr.addColorStop(1, 'rgba(16,185,129,0)');
      c.fillStyle = gr;
      c.beginPath();
      c.arc(0, this.ghostY, 95, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // ── ERROR GLOW ──
    if (this.errorFlash > 0) {
      c.save();
      c.globalAlpha = this.errorFlash * 0.35;
      const gr2 = c.createRadialGradient(0, this.ghostY, 15, 0, this.ghostY, 80);
      gr2.addColorStop(0, 'rgba(239,68,68,0.40)');
      gr2.addColorStop(1, 'rgba(239,68,68,0)');
      c.fillStyle = gr2;
      c.beginPath();
      c.arc(0, this.ghostY, 80, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // ── LOADING RINGS ──
    if (st === 'loading') {
      c.save();
      const arc = this.pulseR * Math.PI / 180;
      // Outer ring
      c.strokeStyle = '#7C5CFC';
      c.lineWidth   = 3;
      c.lineCap     = 'round';
      c.globalAlpha = 0.80;
      c.beginPath();
      c.arc(0, this.ghostY, 72, arc, arc + Math.PI * 1.4);
      c.stroke();
      // Inner ring (opposite direction)
      c.strokeStyle = '#9B7EFD';
      c.lineWidth   = 1.5;
      c.globalAlpha = 0.30;
      c.beginPath();
      c.arc(0, this.ghostY, 60, -arc * 1.3, -arc * 1.3 + Math.PI * 1.8);
      c.stroke();
      // Dots at ring ends
      c.globalAlpha = 0.90;
      c.fillStyle   = '#7C5CFC';
      c.shadowBlur  = 10;
      c.shadowColor = '#7C5CFC';
      c.beginPath();
      c.arc(
        72 * Math.cos(arc + Math.PI * 1.4),
        this.ghostY + 72 * Math.sin(arc + Math.PI * 1.4),
        4, 0, Math.PI * 2
      );
      c.fill();
      c.restore();
    }

    // ── GHOST BODY ──
    c.save();
    c.translate(0, this.ghostY);
    c.rotate(this.ghostR);
    c.globalAlpha = this.opacity;

    if (this.logoImg) {
      // Draw provided logo image
      const s = Math.min(W, H) * 0.55;
      c.drawImage(this.logoImg, -s/2, -s/2 - 8, s, s);
    } else {
      // Programmatic ghost
      const bodyGrad = c.createRadialGradient(-10, -22, 4, 2, -10, 54);
      bodyGrad.addColorStop(0, 'rgba(255,255,255,0.96)');
      bodyGrad.addColorStop(0.55, 'rgba(225,218,248,0.88)');
      bodyGrad.addColorStop(1,   'rgba(180,168,230,0.72)');
      c.fillStyle = bodyGrad;
      c.shadowBlur  = 18;
      c.shadowColor = 'rgba(124,92,252,0.22)';
      c.beginPath();
      c.arc(0, -14, 40, Math.PI, 0);
      c.lineTo(40, 30);
      c.quadraticCurveTo(30, 44, 20, 30);
      c.quadraticCurveTo(10, 18, 0, 30);
      c.quadraticCurveTo(-10, 44, -20, 30);
      c.quadraticCurveTo(-30, 18, -40, 30);
      c.lineTo(-40, -14);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
      // Eyes
      c.fillStyle = '#111118';
      c.beginPath(); c.ellipse(-14, -17, 7, 9, 0, 0, Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(14,  -17, 7, 9, 0, 0, Math.PI*2); c.fill();
      // Eye shine
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.beginPath(); c.arc(-11, -21, 2.5, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(17,  -21, 2.5, 0, Math.PI*2); c.fill();
      // Smile
      c.strokeStyle = '#111118';
      c.lineWidth   = 2.5;
      c.lineCap     = 'round';
      c.beginPath();
      c.arc(0, -4, 12, 0.15, Math.PI - 0.15);
      c.stroke();
    }

    // ── PEN ──
    c.save();
    c.translate(this.logoImg ? 18 : 18, this.logoImg ? 12 : 14);
    c.rotate(this.penAngle);

    // Pen body gradient
    const penGr = c.createLinearGradient(0, -34, 0, 14);
    penGr.addColorStop(0,   '#2A2A3A');
    penGr.addColorStop(0.45,'#3C3C50');
    penGr.addColorStop(1,   '#1A1A28');
    c.fillStyle = penGr;
    c.beginPath();
    c.moveTo(-4.5, -34);
    c.lineTo(4.5,  -34);
    c.lineTo(5.5,  -4);
    c.lineTo(0,    14);
    c.lineTo(-5.5, -4);
    c.closePath();
    c.fill();

    // Nib
    c.fillStyle = '#C8C8DA';
    c.beginPath();
    c.moveTo(-3.5, -4);
    c.lineTo(3.5,  -4);
    c.lineTo(0,    14);
    c.closePath();
    c.fill();

    // Pen band
    c.fillStyle = '#7C5CFC';
    c.fillRect(-5.5, -12, 11, 5);

    // Clip
    c.fillStyle = '#9B7EFD';
    c.beginPath();
    c.roundRect(2.5, -30, 3, 20, 1.5);
    c.fill();

    // Writing glow on nib
    if (st === 'writing') {
      const glow = 0.55 + Math.sin(this.frame * 0.15) * 0.45;
      c.save();
      c.globalAlpha = glow;
      c.shadowBlur  = 14;
      c.shadowColor = '#7C5CFC';
      c.fillStyle   = '#9B7EFD';
      c.beginPath();
      c.arc(0, 14, 3.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    c.restore(); // pen
    c.restore(); // ghost body

    // ── IDLE AMBIENT DOTS ──
    if (st === 'idle') {
      const dotA = 0.12 + Math.sin(this.frame * 0.04) * 0.08;
      c.save();
      c.globalAlpha = dotA;
      c.fillStyle   = '#7C5CFC';
      [[50, 20],[55, -15],[-52, -10],[-48, 25]].forEach(([x,y], i) => {
        const r = 2.5 + Math.sin(this.frame * 0.05 + i) * 1.2;
        c.beginPath();
        c.arc(x, y + this.ghostY, r, 0, Math.PI * 2);
        c.fill();
      });
      c.restore();
    }

    c.restore(); // main
  }
}

// ── AUTO-INIT via data attributes ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('canvas[data-ghostrive]').forEach(canvas => {
    if (!canvas.id) canvas.id = 'gw-rive-' + Math.random().toString(36).slice(2,7);
    const g = new GhostRive(canvas, {
      riv:     canvas.dataset.riv     || null,
      logoSrc: canvas.dataset.logo    || null,
    });
    canvas._ghostRive = g;
    const name = canvas.dataset.ghostrive;
    if (name) window[name] = g;
  });
});

// ── EXPORT ────────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined') module.exports = GhostRive;
