import * as THREE from 'three';

export function _adicionarParedesArea(cena, gc) {
            const material     = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
            const alturaParede = 3;
            const espessura    = 0.3;
    
            const larguraX = 24;
            const larguraZ = 36;
    
            //parede de cima z1
            const p1 = new THREE.Mesh(new THREE.BoxGeometry(60, alturaParede, espessura), material);
            p1.position.set(20, alturaParede / 2, 14);
            p1.castShadow = true; p1.receiveShadow = true;
    
            //parede de baixo z1
            const p2 = new THREE.Mesh(new THREE.BoxGeometry(85, alturaParede, espessura), material);
            p2.position.set(7.5, alturaParede / 2, 50);
            p2.castShadow = true; p2.receiveShadow = true;
    
            //parede esquerda z1/parede direita z2
            const p3 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 33), material);
            p3.position.set(26, alturaParede / 2, 33.5);
            p3.castShadow = true; p3.receiveShadow = true;
    
            //parede direita z1
            const p4 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, larguraZ), material);
            p4.position.set(50, alturaParede / 2, 32);
            p4.castShadow = true; p4.receiveShadow = true;
    
            //Parede esquerda exterior z2
            const p5 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 36), material);
            p5.position.set(-35, alturaParede / 2, 32);
            p5.castShadow = true; p5.receiveShadow = true;
    
            //parede de ligação - conecta parede esquerda à parede 1, no mesmo z2
            const p6 = new THREE.Mesh(new THREE.BoxGeometry(20, alturaParede, espessura), material);
            p6.position.set(-25, alturaParede / 2, 14);
            p6.castShadow = true; p6.receiveShadow = true;
    
            cena.add(p1); gc.registar(p1);
            cena.add(p2); gc.registar(p2);
            cena.add(p3); gc.registar(p3);
            cena.add(p4); gc.registar(p4);
            cena.add(p5); gc.registar(p5);
            cena.add(p6); gc.registar(p6);
        }