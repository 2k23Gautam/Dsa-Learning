import React, { useEffect, useRef } from 'react';

const LOGOS = [
  { name: "Google", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z", color: "#4285F4" },
  { name: "Microsoft", path: "M1 1h10v10H1V1zm12 0h10v10H13V1zM1 13h10v10H1v-10zm12 0h10v10H13v-10z", color: "#737373" },
  { name: "Amazon", path: "M15.3 15.3c-2.4 1.8-5.7 2.8-9 2.8-4.5 0-8.5-1.7-11.5-4.5-.4-.4-.1-.9.4-.7 3.5 1.5 7.5 2.4 11.7 2.4 3 0 5.8-.5 8.4-1.4.6-.2 1 .4.5.8z", color: "#FF9900" },
  { name: "Meta", path: "M16.5 6.5s-2.5-4-6.5-4c-4.5 0-8 3.5-8 8s3.5 8 8 8c4 0 6.5-4 6.5-4s2.5 4 6.5 4c4.5 0 8-3.5 8-8s-3.5-8-8-8c-4 0-6.5 4-6.5 4z", color: "#0668E1" },
  { name: "Apple", path: "M17.06 5.61c.47-.58.79-1.38.7-2.19-.7.03-1.54.46-2.03 1.03-.43.5-.81 1.28-.7 2.08.77.06 1.56-.34 2.03-.92zm-1.12 2.1c-1.15 0-2.12.71-2.68.71-.57 0-1.37-.69-2.3-.69-2.22 0-3.8 2.33-3.8 5.48 0 3.19 1.41 6.31 3.2 6.31.84 0 1.55-.54 2.6-.54 1.05 0 1.7.54 2.6.54 1.48 0 3.16-3.13 3.16-3.13-2.93-1.36-2.58-6.13.32-7.39-1-1.09-2.25-1.29-3.1-1.29z", color: "#a1a1aa" }
];

export default function ModernLogoBackground() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const particles = [];
    const particleCount = 100;
    
    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 40) + 10;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;

        let dx = mouseRef.current.x - this.x;
        let dy = mouseRef.current.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 180 && distance > 0) {
          let force = (180 - distance) / 180;
          let directionX = (dx / distance) * force * this.density;
          let directionY = (dy / distance) * force * this.density;
          this.x -= directionX;
          this.y -= directionY;
        } else {
            if (Math.abs(this.x - this.baseX) > 0.1) {
                this.x -= (this.x - this.baseX) / 40;
            }
            if (Math.abs(this.y - this.baseY) > 0.1) {
                this.y -= (this.y - this.baseY) / 40;
            }
        }

        if (this.x > canvas.width) { this.x = 0; this.baseX = 0; }
        else if (this.x < 0) { this.x = canvas.width; this.baseX = canvas.width; }
        if (this.y > canvas.height) { this.y = 0; this.baseY = 0; }
        else if (this.y < 0) { this.y = canvas.height; this.baseY = canvas.height; }
      }
      draw() {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const drawLines = () => {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    let opacity = 1 - (distance / 120);
                    ctx.strokeStyle = `rgba(100, 116, 139, ${opacity * 0.2})`;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(600px circle at ${mouseRef.current.x}px ${mouseRef.current.y}px, rgba(37, 99, 235, 0.12), transparent 85%)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', init);
    window.addEventListener('mousemove', handleMouseMove);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-transparent flex items-center justify-center">
      {/* Diagonally Scrolling Logo Wall */}
      <div className="absolute inset-0 rotate-12 scale-150 opacity-[0.03] dark:opacity-[0.05] flex flex-col gap-16 select-none">
        {Array.from({ length: 12 }).map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex gap-32 whitespace-nowrap animate-marquee"
            style={{ 
              animationDirection: rowIndex % 2 === 0 ? 'normal' : 'reverse',
              animationDuration: `${35 + rowIndex * 3}s`
            }}
          >
            {/* Double the logos for infinite marquee effect */}
            {Array.from({ length: 20 }).map((_, colIndex) => {
              const Logo = LOGOS[(rowIndex + colIndex) % LOGOS.length];
              return (
                <div key={colIndex} className="flex items-center gap-4 flex-shrink-0">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: Logo.color }}>
                    <path d={Logo.path} />
                  </svg>
                  <span className="text-xl font-bold tracking-wider" style={{ color: Logo.color }}>
                    {Logo.name}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Interactive Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Mouse Glow Spotlight */}
      <div ref={glowRef} className="absolute inset-0 pointer-events-none transition-opacity duration-300" />
    </div>
  );
}
