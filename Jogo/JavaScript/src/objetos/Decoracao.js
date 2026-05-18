import * as THREE from 'three';

// ─────────────────────────────────────────────
//  Utilitários
// ─────────────────────────────────────────────

function aleatorio(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Posições espalhadas na "borda" do terreno (fora da zona jogável).
 * A área jogável assume-se dentro de ~[-45, 45] em X e Z.
 * O chão tem 200x200, logo a borda vai de ~-100 a -46 e de 46 a 100.
 */
function posicoesBorda(quantidade, margemInterna = 1, margemExterna = 1) {
    const posicoes = [];
    for (let i = 0; i < quantidade; i++) {
        let x, z;
        const lado = Math.floor(Math.random() * 4);
        switch (lado) {
            case 0: // Norte
                x = aleatorio(-50, 50);
                z = aleatorio(-15, -25);
                break;
            case 1: // Sul
                x = aleatorio(-margemExterna, margemExterna);
                z = aleatorio(margemInterna, margemExterna);
                break;
            case 2: // Este
                x = aleatorio(margemInterna, margemExterna);
                z = aleatorio(-margemExterna, margemExterna);
                break;
            default: // Oeste
                x = aleatorio(-margemExterna, -margemInterna);
                z = aleatorio(-margemExterna, margemExterna);
                break;
        }
        posicoes.push({ x, z });
    }
    return posicoes;
}

// ─────────────────────────────────────────────
//  Árvore (estilo tático / low-poly)
// ─────────────────────────────────────────────

function criarArvore(escala = 1) {
    const grupo = new THREE.Group();

    // --- Tronco ---
    const geoTronco = new THREE.CylinderGeometry(0.2 * escala, 0.35 * escala, 2.5 * escala, 6);
    const matTronco = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.95, metalness: 0 });
    const tronco = new THREE.Mesh(geoTronco, matTronco);
    tronco.position.y = 1.25 * escala;
    tronco.castShadow = true;
    grupo.add(tronco);

    // --- Copa (3 camadas cónicas) ---
    const coresCopa = [0x2d5a1b, 0x3a7a24, 0x234d14];
    const alturas   = [2.2, 3.4, 4.5];
    const raios     = [2.0, 1.5, 1.0];

    for (let i = 0; i < 3; i++) {
        const geo = new THREE.ConeGeometry(raios[i] * escala, 1.8 * escala, 7);
        const mat = new THREE.MeshStandardMaterial({ color: coresCopa[i], roughness: 0.9, metalness: 0 });
        const copa = new THREE.Mesh(geo, mat);
        copa.position.y = alturas[i] * escala;
        copa.castShadow = true;
        grupo.add(copa);
    }

    return grupo;
}

// ─────────────────────────────────────────────
//  Árvore danificada / queimada
// ─────────────────────────────────────────────

function criarArvoreQueimada(escala = 1) {
    const grupo = new THREE.Group();

    const geoTronco = new THREE.CylinderGeometry(0.2 * escala, 0.4 * escala, 3.5 * escala, 5);
    const matTronco = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1.0, metalness: 0.05 });
    const tronco = new THREE.Mesh(geoTronco, matTronco);
    tronco.position.y = 1.75 * escala;
    tronco.castShadow = true;
    grupo.add(tronco);
    return grupo;
}

// ─────────────────────────────────────────────
//  Destroço: veículo militar partido
// ─────────────────────────────────────────────

function criarDestrocoVeiculo() {
    const grupo = new THREE.Group();
    const matFerrugem = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 1.0, metalness: 0.4 });
    const matMetal    = new THREE.MeshStandardMaterial({ color: 0x3a3a2e, roughness: 0.8, metalness: 0.6 });

    // Chassis inclinado
    const geoChassis = new THREE.BoxGeometry(3.5, 0.5, 1.8);
    const chassis    = new THREE.Mesh(geoChassis, matFerrugem);
    chassis.position.y   = 0.4;
    chassis.rotation.z   = aleatorio(-0.15, 0.15);
    chassis.rotation.y   = aleatorio(-0.3, 0.3);
    chassis.castShadow   = true;
    chassis.receiveShadow = true;
    grupo.add(chassis);

    // Cabine amassada
    const geoCabine = new THREE.BoxGeometry(1.6, 0.8, 1.6);
    const cabine    = new THREE.Mesh(geoCabine, matFerrugem);
    cabine.position.set(-0.2, 1.05, 0);
    cabine.rotation.x  = aleatorio(-0.1, 0.1);
    cabine.rotation.z  = aleatorio(-0.1, 0.1);
    cabine.castShadow  = true;
    grupo.add(cabine);

    // Rodas destruídas (achatadas)
    const posRodas = [
        [-1.2, 0,  0.95],
        [ 1.2, 0,  0.95],
        [-1.2, 0, -0.95],
        [ 1.2, 0, -0.95],
    ];
    posRodas.forEach(([rx, ry, rz]) => {
        const geoRoda = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 10);
        const roda    = new THREE.Mesh(geoRoda, matMetal);
        roda.rotation.z  = Math.PI / 2;
        roda.position.set(rx, 0.2 + aleatorio(-0.1, 0.1), rz);
        roda.castShadow  = true;
        grupo.add(roda);
    });

    // Peças espalhadas no chão
    for (let i = 0; i < 5; i++) {
        const geoSucata = new THREE.BoxGeometry(
            aleatorio(0.1, 0.5),
            aleatorio(0.05, 0.15),
            aleatorio(0.1, 0.4)
        );
        const sucata = new THREE.Mesh(geoSucata, matFerrugem);
        sucata.position.set(aleatorio(-2.5, 2.5), 0.05, aleatorio(-1.5, 1.5));
        sucata.rotation.y = Math.random() * Math.PI;
        sucata.receiveShadow = true;
        grupo.add(sucata);
    }

    return grupo;
}

// ─────────────────────────────────────────────
//  Destroço: parede em ruína
// ─────────────────────────────────────────────

function criarParedeRuina() {
    const grupo = new THREE.Group();
    const matBetao = new THREE.MeshStandardMaterial({ color: 0x7a7a6a, roughness: 1.0, metalness: 0.0 });

    // Secções de parede partidas
    const secoes = [
        { w: 2.5, h: 2.2, d: 0.4, x: 0,    y: 1.1,  rz: 0 },
        { w: 1.8, h: 1.4, d: 0.4, x: 2.0,  y: 0.7,  rz:  0.12 },
        { w: 1.2, h: 0.9, d: 0.4, x: -2.2, y: 0.45, rz: -0.08 },
    ];

    secoes.forEach(s => {
        const geo  = new THREE.BoxGeometry(s.w, s.h, s.d);
        const mesh = new THREE.Mesh(geo, matBetao);
        mesh.position.set(s.x, s.y, 0);
        mesh.rotation.z   = s.rz;
        mesh.castShadow   = true;
        mesh.receiveShadow = true;
        grupo.add(mesh);
    });

    // Escombros no chão
    for (let i = 0; i < 8; i++) {
        const geo  = new THREE.BoxGeometry(aleatorio(0.2, 0.6), aleatorio(0.1, 0.25), aleatorio(0.2, 0.5));
        const mesh = new THREE.Mesh(geo, matBetao);
        mesh.position.set(aleatorio(-2.5, 2.5), 0.05, aleatorio(-0.8, 0.8));
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.x = aleatorio(-0.2, 0.2);
        mesh.receiveShadow = true;
        grupo.add(mesh);
    }

    return grupo;
}

// ─────────────────────────────────────────────
//  Destroço: barril enferrujado
// ─────────────────────────────────────────────

function criarBarril(tombado = false) {
    const grupo = new THREE.Group();
    const matBarril = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9, metalness: 0.5 });

    const geo  = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12);
    const mesh = new THREE.Mesh(geo, matBarril);
    mesh.castShadow = true;

    if (tombado) {
        mesh.rotation.z = Math.PI / 2;
        mesh.position.y = 0.35;
    } else {
        mesh.position.y = 0.45;
    }

    grupo.add(mesh);
    return grupo;
}

// ─────────────────────────────────────────────
//  Função principal de exportação
// ─────────────────────────────────────────────

export function adicionarDecoracaoExterior(cena) {
    // ── Árvores normais ──────────────────────────────
    posicoesBorda(30, 52, 88).forEach(({ x, z }) => {
        const escala = aleatorio(0.7, 1.4);
        const arvore = criarArvore(escala);
        arvore.position.set(x, 0, z);
        arvore.rotation.y = Math.random() * Math.PI * 2;
        cena.add(arvore);
    });

    // ── Árvores queimadas ────────────────────────────
    posicoesBorda(10, 52, 85).forEach(({ x, z }) => {
        const escala  = aleatorio(0.6, 1.2);
        const arvore  = criarArvoreQueimada(escala);
        arvore.position.set(x, 0, z);
        arvore.rotation.y = Math.random() * Math.PI * 2;
        cena.add(arvore);
    });

    // ── Veículos destruídos ──────────────────────────
    posicoesBorda(5, 54, 82).forEach(({ x, z }) => {
        const veiculo = criarDestrocoVeiculo();
        veiculo.position.set(x, 0, z);
        veiculo.rotation.y = Math.random() * Math.PI * 2;
        cena.add(veiculo);
    });

    // ── Paredes em ruína ─────────────────────────────
    posicoesBorda(6, 54, 84).forEach(({ x, z }) => {
        const ruina = criarParedeRuina();
        ruina.position.set(x, 0, z);
        ruina.rotation.y = Math.random() * Math.PI * 2;
        cena.add(ruina);
    });

    // ── Barris enferrujados ──────────────────────────
    posicoesBorda(12, 52, 80).forEach(({ x, z }) => {
        const tombado = Math.random() > 0.5;
        const barril  = criarBarril(tombado);
        barril.position.set(x, 0, z);
        barril.rotation.y = Math.random() * Math.PI * 2;
        cena.add(barril);
    });
}