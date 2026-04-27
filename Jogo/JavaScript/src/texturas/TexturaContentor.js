import * as THREE from 'three';

export function _criarTexturaContentor(cor = '#4a7c59') {
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Base metálica com cor sólida
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, W, H);

    // Variação subtil de luminosidade vertical (painéis ondulados)
    for (let x = 0; x < W; x += 16) {
        const shade = Math.sin(x * 0.05) * 15;
        const r = parseInt(cor.slice(1,3), 16) + shade;
        const g = parseInt(cor.slice(3,5), 16) + shade;
        const b = parseInt(cor.slice(5,7), 16) + shade;
        ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
        ctx.fillRect(x, 0, 16, H);
    }

    // Nervuras verticais (corrugado metálico)
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 8; x < W; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Linhas horizontais de reforço
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3;
    [0.05, 0.5, 0.95].forEach(frac => {
        const y = frac * H;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    });

    // Riscos e desgaste
    for (let i = 0; i < 12; i++) {
        const sx = Math.random() * W;
        const sy = Math.random() * H;
        const ex = sx + (Math.random() - 0.5) * 60;
        const ey = sy + (Math.random() - 0.5) * 20;
        ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.15})`;
        ctx.lineWidth = 0.5 + Math.random();
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    }

    // Manchas de ferrugem
    for (let i = 0; i < 6; i++) {
        const cx = Math.random() * W;
        const cy = Math.random() * H;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 + Math.random() * 14);
        grad.addColorStop(0,   'rgba(120,60,10,0.45)');
        grad.addColorStop(0.5, 'rgba(100,45,5,0.2)');
        grad.addColorStop(1,   'rgba(80,35,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 18 + Math.random()*10, 10 + Math.random()*8, Math.random()*Math.PI, 0, Math.PI*2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
    }