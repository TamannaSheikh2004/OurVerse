import React, { useEffect, useRef } from 'react';

export const BackgroundStars: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create 150 starlight particles
    const stars: Array<{ x: number; y: number; radius: number; alpha: number; speed: number }> = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.005 + 0.002,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render stars with gentle twinkling effect
      for (const star of stars) {
        star.alpha += Math.sin(Date.now() * star.speed) * 0.01;
        const normalizedAlpha = Math.max(0.1, Math.min(0.9, star.alpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 240, ${normalizedAlpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Canvas Stars */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Cosmic Nebulae Glow Orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] nebula-indigo rounded-full blur-3xl opacity-70 animate-pulse-slow pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] nebula-purple rounded-full blur-3xl opacity-60 animate-pulse-slow pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] nebula-cyan rounded-full blur-3xl opacity-40 animate-pulse-slow pointer-events-none" />

      {/* Grid Pattern overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0a_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
    </div>
  );
};
