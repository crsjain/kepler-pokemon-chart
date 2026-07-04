(function() {
  let canvas, ctx;
  let particles = [];
  let animationId = null;
  let lastTime = 0;

  // Daily Celebration Colors (Planetary themes)
  const DAY_COLORS = [
    ['#ffcb05', '#ff9f05', '#ffe57f'], // Sun (Gold)
    ['#e0e0e0', '#f5f5f5', '#b0bec5'], // Moon (Silver)
    ['#ff3c3c', '#ff5722', '#ff9800'], // Fire (Red)
    ['#00bcd4', '#0097a7', '#80deea'], // Water (Teal)
    ['#4caf50', '#2e7d32', '#a5d6a7'], // Wood (Green)
    ['#ff80ab', '#ff4081', '#f50057'], // Venus (Pink/Rose)
    ['#9c27b0', '#6a1b9a', '#e1bee7']  // Saturn (Purple)
  ];

  function init() {
    canvas = document.getElementById('celebration-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
  }

  function triggerDailyCelebration(dayIndex, startX, startY) {
    const colors = DAY_COLORS[dayIndex] || ['#ffcb05', '#ffffff'];
    const count = 30;
    
    for (let i = 0; i < count; i++) {
      particles.push(createDailyParticle(startX, startY, colors));
    }
    
    if (!animationId) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(animate);
    }
  }

  function createDailyParticle(startX, startY, colors) {
    const size = Math.random() * 6 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = (Math.random() * 60 + 60) * Math.PI / 180;
    const speed = Math.random() * 4 + 4; // Reduced from 10+10
    
    return {
      x: startX,
      y: startY,
      size,
      color,
      shape: 'star',
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.sin(angle) * speed,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8, // Reduced from 15
      opacity: 1,
      gravity: 0.22, // Reduced from 0.6
      decay: 0.035  // Reduced from 0.05 (lasts slightly longer)
    };
  }

  function triggerCelebration(isMega) {
    if (animationId) {
      cancelAnimationFrame(animationId);
      particles = [];
    }
    
    const count = isMega ? 300 : 120;
    const colors = isMega 
      ? ['#7c3aed', '#ff3c3c', '#ffcb05', '#2a71d0', '#4caf50', '#ffffff'] 
      : ['#ffcb05', '#fde68a', '#fbbf24', '#ffffff', '#cbd5e0'];
      
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(isMega, colors));
    }
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(animate);
  }

  function createParticle(isMega, colors) {
    const x = Math.random() * canvas.width;
    const y = isMega ? Math.random() * canvas.height - canvas.height : -20;
    const size = Math.random() * (isMega ? 15 : 10) + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      x,
      y,
      size,
      color,
      shape: Math.random() > 0.4 ? 'star' : 'circle',
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 5 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    };
  }

  function drawRotatedStar(x, y, r, p, m, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0 - r);
    for (let i = 0; i < p; i++) {
      ctx.rotate(Math.PI / p);
      ctx.lineTo(0, 0 - (r * m));
      ctx.rotate(Math.PI / p);
      ctx.lineTo(0, 0 - r);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function animate(timestamp) {
    if (!timestamp) timestamp = performance.now();
    if (!lastTime) lastTime = timestamp;
    const elapsed = Math.min(100, timestamp - lastTime);
    lastTime = timestamp;

    const dt = elapsed / 16.67;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      if (p.opacity > 0) {
        active = true;
        
        if (p.gravity) {
          p.vy += p.gravity * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        
        ctx.globalAlpha = p.opacity;

        if (p.shape === 'star') {
          drawRotatedStar(p.x, p.y, p.size, 5, 0.5, p.color, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, 2 * Math.PI);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        
        if (p.decay) {
          p.opacity -= p.decay * dt;
        } else if (p.y > canvas.height - 50) {
          p.opacity -= 0.02 * dt;
        }
      }
    });

    if (active) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
      animationId = null;
      lastTime = 0;
    }
  }

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);

  // Expose to global scope
  window.CelebrationEngine = {
    triggerCelebration,
    triggerDailyCelebration
  };
})();
