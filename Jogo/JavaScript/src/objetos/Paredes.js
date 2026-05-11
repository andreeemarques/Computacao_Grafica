import * as THREE from 'three';
import { criarTexturaBetao } from '../texturas/TexturaBase.js';

export function _adicionarParedesArea(cena, gc) {
    const textura  = criarTexturaBetao();
    const alturaParede = 3;
    const espessura    = 0.3;

    const criarMaterial = (largura, altura) => {
        const tex = textura.clone();
        tex.needsUpdate = true;
        tex.repeat.set(largura / 3, altura / 3); // 1 repetição a cada 3 unidades
        return new THREE.MeshStandardMaterial({
            map:       tex,
            roughness: 0.85,
            metalness: 0.05,
        });
    };

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(60, alturaParede, espessura), criarMaterial(60, alturaParede));
    p1.position.set(20, alturaParede / 2, 14);
    p1.castShadow = true; p1.receiveShadow = true;

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(85, alturaParede, espessura), criarMaterial(85, alturaParede));
    p2.position.set(7.5, alturaParede / 2, 50);
    p2.castShadow = true; p2.receiveShadow = true;

    const p3 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 33), criarMaterial(33, alturaParede));
    p3.position.set(26, alturaParede / 2, 33.5);
    p3.castShadow = true; p3.receiveShadow = true;

    const p4 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 36), criarMaterial(36, alturaParede));
    p4.position.set(50, alturaParede / 2, 32);
    p4.castShadow = true; p4.receiveShadow = true;

    const p5 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 36), criarMaterial(36, alturaParede));
    p5.position.set(-35, alturaParede / 2, 32);
    p5.castShadow = true; p5.receiveShadow = true;

    const p6 = new THREE.Mesh(new THREE.BoxGeometry(20, alturaParede, espessura), criarMaterial(20, alturaParede));
    p6.position.set(-25, alturaParede / 2, 14);
    p6.castShadow = true; p6.receiveShadow = true;

    cena.add(p1); gc.registar(p1);
    cena.add(p2); gc.registar(p2);
    cena.add(p3); gc.registar(p3);
    cena.add(p4); gc.registar(p4);
    cena.add(p5); gc.registar(p5);
    cena.add(p6); gc.registar(p6);
}