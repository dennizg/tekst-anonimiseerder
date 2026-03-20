import { useEffect, useRef } from 'react';

export default function BackgroundParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    const particleCount = 75; // Precies genoeg voor een rijk netwerk, zonder lagg
    const connectionDistance = 180;
    
    // Subtiele purper/blauwe AntiGravity tinten (matcht de `--color-accent` glow)
    const particleColor = 'rgba(99, 102, 241, 0.4)';
    const lineColorBase = '99, 102, 241'; 
    // We voegen ook wat accentkleur toe aan de zwevende bubbels
    const secondaryColorBase = '168, 85, 247'; 

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        // Trage, zachte flow (Net als AntiGravity)
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 1.5 + 0.5;
        this.isSecondary = Math.random() > 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Vloeiend rondlopen over de randen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isSecondary ? `rgba(${secondaryColorBase}, 0.5)` : particleColor;
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      // Gebruik clearRect voor een strak spoorloos canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update en teken eerst alle bolletjes
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Teken de netwerklijnen tússen de deeltjes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            // Hoe dichterbij, hoe helderder de lijn
            const opacity = 1 - (distance / connectionDistance);
            
            ctx.beginPath();
            // Gebruik het hoofdkleur thema, met een lagere max-opaciteit voor subtiliteit
            ctx.strokeStyle = `rgba(${lineColorBase}, ${opacity * 0.20})`; 
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,            // Helemaal onderop, samen met de blobs
        pointerEvents: 'none',// Zorgt ervoor dat je gewoon tekst kan selecteren er doorheen
        opacity: 0.6          // Algemene subtiliteits factor
      }}
    />
  );
}
