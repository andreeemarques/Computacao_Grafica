import * as THREE from 'three';

export function _criarTexturaEdificio(l, a, comEntrada = false)
{
    const W = 512, H = 512;
                const canvas = document.createElement('canvas');
                canvas.width = W; canvas.height = H;
                const ctx = canvas.getContext('2d');
        
                // Base cinzento betão com variação subtil
                ctx.fillStyle = '#8a8a8a';
                ctx.fillRect(0, 0, W, H);
                for (let y = 0; y < H; y += 2) {
                    const v = Math.round(138 + Math.sin(y * 0.07) * 6 + (Math.random() * 4 - 2));
                    ctx.fillStyle = `rgb(${v},${v},${v})`;
                    ctx.fillRect(0, y, W, 2);
                }
        
                // Linhas de separação entre pisos
                const numPisos = 5;
                const altPiso  = H / numPisos;
                ctx.strokeStyle = 'rgba(50,50,50,0.5)';
                ctx.lineWidth   = 2;
                for (let i = 1; i < numPisos; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, i * altPiso);
                    ctx.lineTo(W, i * altPiso);
                    ctx.stroke();
                }
        
                // Janelas — apenas 2 por andar, nos pisos superiores (não no rés-do-chão)
                const numCols  = 2;
                const janLarg  = W / numCols * 0.35;
                const janAlt   = altPiso * 0.4;
                const janOffX  = (W / numCols - janLarg) / 2;
                const janOffY  = (altPiso - janAlt) / 2;
        
                // Começa no piso 0
                for (let row = 0; row < numPisos; row++) {
                    for (let col = 0; col < numCols; col++) {
                        const jx = col * (W / numCols) + janOffX;
                        const jy = row * altPiso + janOffY;
        
                        // Vidro azulado
                        const grad = ctx.createLinearGradient(jx, jy, jx + janLarg, jy + janAlt);
                        grad.addColorStop(0,   'rgba(140,185,215,0.85)');
                        grad.addColorStop(0.5, 'rgba(170,210,235,0.9)');
                        grad.addColorStop(1,   'rgba(110,165,205,0.8)');
                        ctx.fillStyle = grad;
                        ctx.fillRect(jx, jy, janLarg, janAlt);
        
                        // Moldura
                        ctx.strokeStyle = 'rgba(50,50,50,0.9)';
                        ctx.lineWidth   = 2;
                        ctx.strokeRect(jx, jy, janLarg, janAlt);
        
                        // Cruz da janela
                        ctx.beginPath();
                        ctx.moveTo(jx + janLarg / 2, jy);
                        ctx.lineTo(jx + janLarg / 2, jy + janAlt);
                        ctx.moveTo(jx, jy + janAlt / 2);
                        ctx.lineTo(jx + janLarg, jy + janAlt / 2);
                        ctx.stroke();
                    }
                }
        
                // Entrada no rés-do-chão (piso 0), deslocada para a esquerda e mais abaixo
                if (comEntrada) {
                    const entLarg = W * 0.22;
                    const entAlt  = altPiso * 0.75;
                    const entX    = W * 0.4;               // ← mais à direita
                    const entY    = H - entAlt - 10;       // ← perto do chão (fundo do canvas)
        
                    // Porta — madeira escura
                    ctx.fillStyle = '#3B1F0A';
                    ctx.fillRect(entX, entY, entLarg, entAlt);
        
                    // Painel central da porta
                    ctx.fillStyle = '#4E2A0E';
                    ctx.fillRect(entX + entLarg * 0.1, entY + entAlt * 0.05, entLarg * 0.8, entAlt * 0.42);
                    ctx.fillRect(entX + entLarg * 0.1, entY + entAlt * 0.53, entLarg * 0.8, entAlt * 0.42);
        
                    // Moldura da porta
                    ctx.strokeStyle = '#1a0d00';
                    ctx.lineWidth   = 3;
                    ctx.strokeRect(entX, entY, entLarg, entAlt);
        
                    // Arco por cima da porta
                    ctx.beginPath();
                    ctx.arc(entX + entLarg / 2, entY, entLarg / 2, Math.PI, 0);
                    ctx.fillStyle = '#3B1F0A';
                    ctx.fill();
                    ctx.strokeStyle = '#1a0d00';
                    ctx.lineWidth   = 2;
                    ctx.stroke();
        
                    // Puxador
                    ctx.beginPath();
                    ctx.arc(entX + entLarg * 0.65, entY + entAlt * 0.55, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#c8a800';
                    ctx.fill();
                }
        
                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
                return tex;
}