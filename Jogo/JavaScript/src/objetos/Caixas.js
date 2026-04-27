import * as THREE from 'three';
import { _criarTexturaMadeira } from '../texturas/TexturaMadeira.js';

function _criarNormalMap(l, a) {
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(0, 0, W, H);

    const numTábuas = 4;
    const altTábua  = H / numTábuas;
    for (let i = 0; i < numTábuas; i++) {
        const y0 = i * altTábua;
        ctx.fillStyle = 'rgb(128,200,255)';
        ctx.fillRect(0, y0, W, 4);
        ctx.fillStyle = 'rgb(128,50,255)';
        ctx.fillRect(0, y0 + altTábua - 4, W, 4);
    }

    for (let y = 0; y < H; y += 2) {
        const shift = Math.sin(y * 0.3) * 8;
        const r = Math.round(128 + shift);
        ctx.fillStyle = `rgb(${r},128,255)`;
        ctx.fillRect(0, y, W, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(l / 2, a / 2);
    return tex;
}

function _adicionarCantoneiras(cena, x, z, l, a, p) {
            const matMetal = new THREE.MeshStandardMaterial({
                color:     0x888888,
                metalness: 0.9,
                roughness: 0.3,
            });
    
            const esp     = 0.12;
            const tamanho = 0.5;
    
            const cantos = [
                [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
                [-1, -1,  1], [1, -1,  1], [-1, 1,  1], [1, 1,  1],
            ];
    
            cantos.forEach(([dx, dy, dz]) => {
                const cx = x + dx * (l / 2 - esp / 2);
                const cy =     dy * (a / 2 - esp / 2) + a / 2;
                const cz = z + dz * (p / 2 - esp / 2);
    
                const geoH  = new THREE.BoxGeometry(tamanho, esp, esp);
                const meshH = new THREE.Mesh(geoH, matMetal);
                meshH.position.set(cx, cy, z + dz * p / 2);
                meshH.castShadow = true;
                cena.add(meshH);
    
                const geoV  = new THREE.BoxGeometry(esp, esp, tamanho);
                const meshV = new THREE.Mesh(geoV, matMetal);
                meshV.position.set(x + dx * l / 2, cy, cz);
                meshV.castShadow = true;
                cena.add(meshV);
    
                const geoP  = new THREE.BoxGeometry(esp, tamanho, esp);
                const meshP = new THREE.Mesh(geoP, matMetal);
                meshP.position.set(x + dx * l / 2, cy, z + dz * p / 2);
                meshP.castShadow = true;
                cena.add(meshP);
            });
        }
    
function _adicionarCintas(cena, x, z, l, a, p) {
    const matCinta = new THREE.MeshStandardMaterial({
        color:     0x777777,
        metalness: 0.85,
        roughness: 0.25,
    });

    [1/3, 2/3].forEach(frac => {
        const y = frac * a;

        [-1, 1].forEach(dz => {
            const geo  = new THREE.BoxGeometry(l + 0.02, 0.12, 0.06);
            const mesh = new THREE.Mesh(geo, matCinta);
            mesh.position.set(x, y, z + dz * (p / 2 + 0.03));
            mesh.castShadow = true;
            cena.add(mesh);
        });

        [-1, 1].forEach(dx => {
            const geo  = new THREE.BoxGeometry(0.06, 0.12, p + 0.02);
            const mesh = new THREE.Mesh(geo, matCinta);
            mesh.position.set(x + dx * (l / 2 + 0.03), y, z);
            mesh.castShadow = true;
            cena.add(mesh);
        });
    });
}
    
export function _adicionarCaixas(cena, gc) {
    const caixas = [
        //Caixas da zona 1
        { x: 33, z: 20,     l: 4, a: 2, p: 2.5 },
        { x: 33, z: 26,     l: 4, a: 2, p: 2.5 },
        { x: 33, z: 32,     l: 4, a: 2, p: 2.5 },
        { x: 33, z: 38,     l: 4, a: 2, p: 2.5 },
        { x: 43, z: 20,     l: 4, a: 2, p: 2.5 },
        { x: 43, z: 26,     l: 4, a: 2, p: 2.5 },
        { x: 43, z: 32,     l: 4, a: 2, p: 2.5 },
        { x: 43, z: 38,     l: 4, a: 2, p: 2.5 },
        //Caixas da zona 2
        { x: 3.2, z: 37,     l: 2, a: 3, p: 2 },//caixa do lado direito do prédio da zona 2
        { x: -13, z: 45,     l: 2, a: 3, p: 2 },//caixa do lado a trás do prédio da zona 2
        { x: -29.2, z: 37,     l: 2, a: 3, p: 2 },//caixa do lado esquerdo do prédio da zona 2
    ];

    caixas.forEach(({ x, z, l, a, p }) => {
        const texDif = _criarTexturaMadeira(l, a, p);
        const texNrm = _criarNormalMap(l, a);

        const material = new THREE.MeshStandardMaterial({
            map:         texDif,
            normalMap:   texNrm,
            normalScale: new THREE.Vector2(1.2, 1.2),
            roughness:   0.75,
            metalness:   0.05,
            color:       0xffffff,
        });

        const geo  = new THREE.BoxGeometry(l, a, p);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, a / 2, z);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        cena.add(mesh); gc.registar(mesh);

        _adicionarCantoneiras(cena, x, z, l, a, p);
        _adicionarCintas(cena, x, z, l, a, p);
    });
}