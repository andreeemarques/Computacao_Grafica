import * as THREE from 'three';

export function _adicionarHalfWall(cena, gc) {
    const alturaHW  = 1.5;   // meia parede ~1m de altura
    const espessura = 0.15;
    const comprimento = 9;

    const matHW = new THREE.MeshStandardMaterial({
        color:     0xd0ccc8,
        roughness: 0.85,
        metalness: 0.05,
    });

    // Corpo principal da half wall
    const geo  = new THREE.BoxGeometry(comprimento, alturaHW, espessura);
    const mesh = new THREE.Mesh(geo, matHW);

    // Lado esquerdo da cabine: x=12, L=3 → borda esquerda em x=10.5
    // A wall estende-se mais para a esquerda, centrada em x = 10.5 - comprimento/2
    mesh.position.set(
        -8 - comprimento / 2,   // x: centrado na extensão à esquerda
        alturaHW / 2,              // y: assente no chão
        18                       // z: alinhado com o centro da cabine
    );
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    cena.add(mesh); gc.registar(mesh);
}