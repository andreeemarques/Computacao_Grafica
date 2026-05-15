import * as THREE from 'three';

export class GestorColisoes {
    constructor() {
        this.obstaculos = [];
        this.obstaculosDinamicos = [];
    }

    registar(mesh) {
        const box = new THREE.Box3().setFromObject(mesh);
        this.obstaculos.push(box);
    }

    registarBox(minVec, maxVec) {
        this.obstaculos.push(new THREE.Box3(minVec, maxVec));
    }

    registarDinamico(mesh) {
        this.obstaculosDinamicos.push({
            mesh,
            box: new THREE.Box3().setFromObject(mesh),
        });
    }

    removerDinamico(mesh) {
        this.obstaculosDinamicos = this.obstaculosDinamicos.filter(entry => entry.mesh !== mesh);
    }

    atualizar() {
        for (const entry of this.obstaculosDinamicos) {
            entry.box.setFromObject(entry.mesh);
        }
    }

    obterTodasBoxes() {
        return this.obstaculos.concat(this.obstaculosDinamicos.map(entry => entry.box));
    }

    colide(jogadorBox) {
        return this.colideBox(jogadorBox);
    }

    colideBox(box) {
        for (const obstaculo of this.obstaculos) {
            if (box.intersectsBox(obstaculo)) return true;
        }
        for (const entry of this.obstaculosDinamicos) {
            if (box.intersectsBox(entry.box)) return true;
        }
        return false;
    }
}