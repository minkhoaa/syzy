// Lightweight vanilla confetti — no external dependency needed.
// Fires a burst of particles from a given DOM origin.

const COLORS = ["#3B82F6", "#10B981", "#06B6D4", "#8B5CF6"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export function fireConfettiBurst(originEl: HTMLElement): void {
  if (typeof window === "undefined") return;

  const rect = originEl.getBoundingClientRect();

  const canvas = document.createElement("canvas");
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100vw; height: 100vh;
    pointer-events: none; z-index: 9999;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particleCount = 12;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const speed = 2.5 + Math.random() * 2.5;
    particles.push({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 5 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#3B82F6",
      alpha: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    });
  }

  const gravity = 0.12;
  const friction = 0.98;

  function animate() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = false;

    for (const p of particles) {
      p.vy += gravity;
      p.vx *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      p.rotation += p.rotationSpeed;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }

    if (alive) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  }

  animate();
}
