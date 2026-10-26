import { useEffect, useRef } from 'react';

type Ripple = { x: number; y: number; age: number };

export default function RippleCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!canvas || !context || !finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let running = false;
    let previous = { x: 0, y: 0, time: 0 };
    let lastFrame = performance.now();
    let ripples: Ripple[] = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (now: number) => {
      const dt = Math.min(now - lastFrame, 34);
      lastFrame = now;
      context.clearRect(0, 0, width, height);
      ripples = ripples.filter((ripple) => ripple.age < 760);
      for (const ripple of ripples) {
        ripple.age += dt;
        const progress = ripple.age / 760;
        const radius = 3 + progress * 34;
        const opacity = Math.pow(1 - progress, 1.7) * 0.3;
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(173, 129, 5, ${opacity})`;
        context.lineWidth = 1;
        context.stroke();
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius * 0.56, 0, Math.PI * 2);
        context.strokeStyle = `rgba(173, 129, 5, ${opacity * 0.62})`;
        context.lineWidth = 0.7;
        context.stroke();
      }
      if (ripples.length) frame = window.requestAnimationFrame(draw);
      else running = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      const time = performance.now();
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      if (time - previous.time > 95 && dx * dx + dy * dy > 30 * 30) {
        ripples.push({ x: event.clientX, y: event.clientY, age: 0 });
        previous = { x: event.clientX, y: event.clientY, time };
        if (!running) {
          running = true;
          lastFrame = time;
          frame = window.requestAnimationFrame(draw);
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="ripple-cursor" aria-hidden="true" />;
}

