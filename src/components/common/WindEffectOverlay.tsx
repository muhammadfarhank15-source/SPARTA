import React, { useEffect, useRef, useState } from 'react';
import { Wind, Play, Pause } from 'lucide-react';

interface WindEffectOverlayProps {
  showControl?: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  type: 'leaf' | 'mote' | 'petal' | 'dust';
  angle: number;
  spin: number;
  swaySpeed: number;
  swayAmp: number;
  color: string;
}

interface WindStreamer {
  x: number;
  y: number;
  length: number;
  speed: number;
  width: number;
  alpha: number;
  curve: number;
  freq: number;
}

export const WindEffectOverlay: React.FC<WindEffectOverlayProps> = ({
  showControl = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [windLevel, setWindLevel] = useState<'gentle' | 'breeze' | 'gust'>('breeze');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const gustMultiplierRef = useRef<number>(1);
  const gustTimeRef = useRef<number>(0);

  // Speed multiplier based on windLevel
  const speedFactor = windLevel === 'gentle' ? 0.6 : windLevel === 'breeze' ? 1.0 : 1.6;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle Palette inspired by Rutan Jeneponto sunset & grass field
    const leafColors = [
      'rgba(245, 158, 11, ', // golden amber
      'rgba(251, 191, 36, ', // warm yellow
      'rgba(16, 185, 129, ', // emerald grass leaf
      'rgba(52, 211, 153, ', // light green leaf
      'rgba(217, 119, 6, ',  // autumn amber
      'rgba(255, 255, 255, ',// pure breeze mote
    ];

    const PARTICLE_COUNT = Math.min(65, Math.floor((width * height) / 18000));
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const typeRand = Math.random();
      const type = typeRand < 0.35 ? 'leaf' : typeRand < 0.65 ? 'petal' : typeRand < 0.85 ? 'mote' : 'dust';
      const colorPrefix = leafColors[Math.floor(Math.random() * leafColors.length)];

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 1.2 + Math.random() * 2.2,
        vy: -0.3 + Math.random() * 0.8,
        size: type === 'leaf' ? 3 + Math.random() * 3.5 : type === 'petal' ? 2.5 + Math.random() * 2.5 : 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.6,
        baseAlpha: 0.2 + Math.random() * 0.6,
        type,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
        swaySpeed: 0.02 + Math.random() * 0.04,
        swayAmp: 0.8 + Math.random() * 1.5,
        color: colorPrefix,
      });
    }

    // Wind Streamers (curved breeze streaks)
    const STREAMER_COUNT = 7;
    const streamers: WindStreamer[] = [];
    for (let i = 0; i < STREAMER_COUNT; i++) {
      streamers.push({
        x: -200 - Math.random() * 400,
        y: Math.random() * height,
        length: 80 + Math.random() * 160,
        speed: 3 + Math.random() * 3.5,
        width: 1 + Math.random() * 2,
        alpha: 0.12 + Math.random() * 0.25,
        curve: (Math.random() - 0.5) * 20,
        freq: 0.005 + Math.random() * 0.01,
      });
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        time += 0.03 * speedFactor;
        gustTimeRef.current += 0.015 * speedFactor;

        // Periodic natural wind gusts
        const gustCycle = Math.sin(gustTimeRef.current);
        const gustBoost = gustCycle > 0.6 ? 1 + (gustCycle - 0.6) * 1.5 : 1;
        gustMultiplierRef.current = gustBoost;
      }

      const currentGust = gustMultiplierRef.current * speedFactor;

      // 1. Render and update Wind Streamers
      ctx.save();
      for (let i = 0; i < streamers.length; i++) {
        const s = streamers[i];

        if (isPlaying) {
          s.x += s.speed * currentGust;
          if (s.x > width + 100) {
            s.x = -s.length - Math.random() * 300;
            s.y = Math.random() * height;
            s.speed = 3 + Math.random() * 3.5;
            s.alpha = 0.1 + Math.random() * 0.25;
            s.length = 80 + Math.random() * 180;
          }
        }

        // Draw curved streamline
        const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.length, s.y);
        grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        grad.addColorStop(0.3, `rgba(251, 191, 36, ${s.alpha * 0.8})`);
        grad.addColorStop(0.7, `rgba(255, 255, 255, ${s.alpha})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.beginPath();
        const startX = s.x;
        const startY = s.y;
        const midX = s.x + s.length * 0.5;
        const midY = s.y + Math.sin(time + s.x * s.freq) * s.curve;
        const endX = s.x + s.length;
        const endY = s.y + Math.cos(time + s.x * s.freq) * (s.curve * 0.5);

        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Render and update Organic Wind Particles (Leaves, Petals, Dust)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isPlaying) {
          const sway = Math.sin(time * 2 + i) * p.swayAmp;
          p.x += (p.vx * currentGust) + sway * 0.4;
          p.y += (p.vy * currentGust) + Math.cos(time * p.swaySpeed * 20 + i) * 0.5;
          p.angle += p.spin * currentGust;

          // Wrap around edges seamlessly
          if (p.x > width + 20) {
            p.x = -20;
            p.y = Math.random() * height;
          }
          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          } else if (p.y < -20) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.type === 'leaf' || p.type === 'petal') {
          // Draw organic leaf/petal with flutter
          ctx.beginPath();
          ctx.fillStyle = `${p.color}${p.alpha})`;
          ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Delicate vein down the center
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.4})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(-p.size * 1.2, 0);
          ctx.lineTo(p.size * 1.2, 0);
          ctx.stroke();
        } else if (p.type === 'mote') {
          // Glowing solar spore
          const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
          rad.addColorStop(0, `rgba(251, 191, 36, ${p.alpha})`);
          rad.addColorStop(0.5, `rgba(255, 255, 255, ${p.alpha * 0.5})`);
          rad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Subtle breeze dust
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, speedFactor]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}>
      {/* 1. Rutan Jeneponto Background Image with Cinematic Ken Burns Breeze Sway Animation */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform will-change-transform animate-wind-breeze"
        style={{
          backgroundImage: `url('/assets/aistudio/GAMBAR_RUTAN_JENEPONTOOOOO_b20dbdbd.png')`,
          transformOrigin: 'center center',
          filter: 'brightness(0.92) contrast(1.05)',
        }}
      />

      {/* 2. Soft Wind Drift Mist & Cloud Layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-blue-500/10 mix-blend-screen opacity-50 animate-cloud-drift-1 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-l from-teal-500/5 via-transparent to-amber-400/10 mix-blend-screen opacity-40 animate-cloud-drift-2 pointer-events-none" />

      {/* 3. Contrast Overlays for Ultimate Text Readability & Golden Hour Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/70 to-slate-950/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/40 to-slate-950/85 pointer-events-none" />

      {/* 4. Canvas for Dynamic Wind Gust Currents, Leaves & Breeze Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* 5. Subtle Interactive Wind Controller for User (bottom-right or top corner) */}
      {showControl && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg text-[11px] text-slate-300 transition-all">
          <Wind className={`w-3.5 h-3.5 text-amber-400 ${isPlaying ? 'animate-pulse' : ''}`} />
          <span className="font-semibold text-slate-200">Angin Rutan:</span>
          <button
            onClick={() => setWindLevel('gentle')}
            className={`px-2 py-0.5 rounded-full font-medium transition-all ${
              windLevel === 'gentle' ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white'
            }`}
            title="Angin Sepoi-sepoi Lembut"
          >
            Sejuk
          </button>
          <button
            onClick={() => setWindLevel('breeze')}
            className={`px-2 py-0.5 rounded-full font-medium transition-all ${
              windLevel === 'breeze' ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white'
            }`}
            title="Angin Sedang Standar"
          >
            Alami
          </button>
          <button
            onClick={() => setWindLevel('gust')}
            className={`px-2 py-0.5 rounded-full font-medium transition-all ${
              windLevel === 'gust' ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white'
            }`}
            title="Angin Berhembus Kencang"
          >
            Kencang
          </button>
          <div className="w-px h-3 bg-slate-700 mx-0.5" />
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isPlaying ? 'Jeda Animasi Angin' : 'Mulai Animasi Angin'}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
          </button>
        </div>
      )}
    </div>
  );
};
