import * as THREE from 'three';
import { _criarTexturaContentor } from '../texturas/TexturaContentor.js';

export function _adicionarContentores(cena, gc) {
        const contentores = [
            { x: 20, z: 28, l: 6, a: 2.6, p: 3, cor: '#4a7c59' }, // verde militar
            { x: 20, z: 38, l: 6, a: 2.6, p: 3, cor: '#7a6a52' }, // bege/cáqui
        ];
    
        contentores.forEach(({ x, z, l, a, p, cor }) => {
            const texMetal = _criarTexturaContentor(cor);
    
            const matLateral = new THREE.MeshStandardMaterial({
                map:       texMetal,
                roughness: 0.55,
                metalness: 0.6,
            });
            const matTopo = new THREE.MeshStandardMaterial({
                color:     0x333333,
                roughness: 0.6,
                metalness: 0.7,
            });
    
            // [direita, esquerda, topo, base, frente, trás]
            const materiais = [
                matLateral, matLateral,
                matTopo,    matTopo,
                matLateral, matLateral,
            ];
    
            const geo  = new THREE.BoxGeometry(l, a, p);
            const mesh = new THREE.Mesh(geo, materiais);
            mesh.position.set(x, a / 2, z);
            mesh.castShadow    = true;
            mesh.receiveShadow = true;
            cena.add(mesh); gc.registar(mesh);
    
            // Reforços metálicos nas arestas (cantoneiras)
            const matAco = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });
            const cantos = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
            cantos.forEach(([dx, dy, dz]) => {
                const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), matAco);
                c.position.set(x + dx * l/2, dy * a/2 + a/2, z + dz * p/2);
                c.castShadow = true;
                cena.add(c);
            });
    
            // Faixas de reforço horizontais
            const matFaixa = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.85, roughness: 0.25 });
            [-1, 1].forEach(dz => {
                const faixa = new THREE.Mesh(new THREE.BoxGeometry(l + 0.02, 0.1, 0.06), matFaixa);
                faixa.position.set(x, a * 0.5 + a/2 * 0 , z + dz * (p/2 + 0.03));
                // topo e base
                [0.08, 0.92].forEach(frac => {
                    const f = new THREE.Mesh(new THREE.BoxGeometry(l + 0.02, 0.1, 0.06), matFaixa);
                    f.position.set(x, frac * a, z + dz * (p / 2 + 0.03));
                    f.castShadow = true;
                    cena.add(f);
                });
            });
        });
    }