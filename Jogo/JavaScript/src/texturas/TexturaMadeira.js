import * as THREE from 'three';

export function _criarTexturaMadeira(l, a, p)
{
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
        
    ctx.fillStyle = '#7B4A2D';
    ctx.fillRect(0, 0, W, H);
        
    for (let y = 0; y < H; y++) {
        const noiseAmp = 6;
        const r = Math.round(120 + 15 * Math.sin(y * 0.4 + Math.random() * 0.5));
        const g = Math.round(72  + 10 * Math.sin(y * 0.3 + 1.2));
        const b = Math.round(42  +  8 * Math.sin(y * 0.35 + 2.1));
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= W; x += 4) {
            const dy = noiseAmp * Math.sin(x * 0.05 + y * 0.1 + Math.random() * 0.3);
            ctx.lineTo(x, y + dy);
        }
        ctx.stroke();
    }

    const numTábuas = 4;
    const altTábua  = H / numTábuas;
    ctx.strokeStyle = 'rgba(30,15,5,0.7)';
    ctx.lineWidth   = 3;
    for (let i = 1; i < numTábuas; i++) {
        const yLine = i * altTábua;
        ctx.beginPath(); ctx.moveTo(0, yLine); ctx.lineTo(W, yLine); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,140,0.15)';
        ctx.lineWidth   = 2;
        ctx.beginPath(); ctx.moveTo(0, yLine + 2); ctx.lineTo(W, yLine + 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(30,15,5,0.7)';
        ctx.lineWidth   = 3;
    }

    const rng = (n) => Math.random() * n;
    for (let i = 0; i < 5; i++) {
        const cx = rng(W), cy = rng(H);
        const rx = 8 + rng(12), ry = 5 + rng(8);
        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx);
        grad.addColorStop(0,   'rgba(50,25,10,0.8)');
        grad.addColorStop(0.5, 'rgba(80,45,20,0.4)');
        grad.addColorStop(1,   'rgba(80,45,20,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, rng(Math.PI), 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(l / 2, a / 2);
    return tex;
}