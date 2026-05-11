import * as THREE from 'three';

export function criarTexturaBetao() {
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Base cinzenta
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(0, 0, W, H);

    // Variação de grão
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const v = Math.floor(140 + Math.random() * 40 - 20);
        ctx.fillStyle = `rgba(${v},${v},${v},0.25)`;
        ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    // Fissuras subtis
    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(80,80,80,${0.1 + Math.random() * 0.15})`;
        ctx.lineWidth = 0.5 + Math.random();
        ctx.beginPath();
        let x = Math.random() * W;
        let y = Math.random() * H;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
            x += (Math.random() - 0.5) * 60;
            y += (Math.random() - 0.5) * 30;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }



    // Manchas de humidade/desgaste
    for (let i = 0; i < 4; i++) {
        const cx = Math.random() * W;
        const cy = Math.random() * H;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 + Math.random() * 40);
        grad.addColorStop(0,   'rgba(90,90,90,0.2)');
        grad.addColorStop(1,   'rgba(90,90,90,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

export function criarTexturaChao() {
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Base asfalto escuro
    ctx.fillStyle = '#282828';
    ctx.fillRect(0, 0, W, H);

    // Grão de asfalto
    for (let i = 0; i < 15000; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const r = Math.floor(90 + Math.random() * 50);
        ctx.fillStyle = `rgba(${r},${r},${r},0.3)`;
        ctx.fillRect(x, y, Math.random() * 2, Math.random() * 2);
    }

    // Fissuras no chão
    for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = `rgba(40,40,40,${0.2 + Math.random() * 0.2})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        let x = Math.random() * W;
        let y = Math.random() * H;
        ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) {
            x += (Math.random() - 0.5) * 40;
            y += (Math.random() - 0.5) * 40;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Manchas de óleo/desgaste
    for (let i = 0; i < 5; i++) {
        const cx = Math.random() * W;
        const cy = Math.random() * H;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 + Math.random() * 30);
        grad.addColorStop(0,   'rgba(40,40,40,0.3)');
        grad.addColorStop(1,   'rgba(40,40,40,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 20 + Math.random()*20, 10 + Math.random()*15, Math.random()*Math.PI, 0, Math.PI*2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}