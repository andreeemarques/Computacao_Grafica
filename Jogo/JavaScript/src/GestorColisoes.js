import * as THREE from 'three';

export class GestorColisoes {
    constructor() {
        this.obstaculos = [];
    }

    registar(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        this.obstaculos.push(box);
    }

    registarBox(minVec, maxVec) {
        this.obstaculos.push(new THREE.Box3(minVec, maxVec));
    }

    colide(jogadorBox) {
        for (const obstaculo of this.obstaculos) {
            if (jogadorBox.intersectsBox(obstaculo)) return true;
        }
        return false;
    }
}