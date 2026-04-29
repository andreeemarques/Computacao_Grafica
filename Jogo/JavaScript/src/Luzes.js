import * as THREE from 'three';

export class GestorLuzes {
    constructor(cena) {
        this.luzes = {};
        this._construir(cena);
    }

    _construir(cena) {
        // ── Luz Ambiente ──
        const ambiente = new THREE.AmbientLight(0xffffff, 0.4);
        cena.add(ambiente);

        // ── Luz Direcional (sol) ──
        const direcional = new THREE.DirectionalLight(0xffffff, 1.0);
        direcional.position.set(10, 20, 10);
        direcional.castShadow = true;
        direcional.shadow.mapSize.set(2048, 2048);
        cena.add(direcional);

        // ── PointLight (ex: candeeiro de rua) ──
        const ponto1 = new THREE.PointLight(0xffaa44, 2, 30);
        ponto1.position.set(20, 8, 30);
        ponto1.castShadow = true;
        cena.add(ponto1);

        // ── Segunda PointLight ──
        const ponto2 = new THREE.PointLight(0x4488ff, 2, 25);
        ponto2.position.set(-10, 6, 20);
        ponto2.castShadow = true;
        cena.add(ponto2);

        // ── HemisphereLight (céu/chão) ──
        const hemisferica = new THREE.HemisphereLight(0x87ceeb, 0x444422, 0.6);
        cena.add(hemisferica);

        // ── SpotLight ──
        const spot = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.3);
        spot.position.set(0, 15, 15);
        spot.target.position.set(0, 0, 15);
        spot.castShadow = true;
        cena.add(spot);
        cena.add(spot.target);

        // Regista todas com um nome e intensidade original
        this.luzes = {
            ambiente:    { luz: ambiente,    intensidade: ambiente.intensity },
            direcional:  { luz: direcional,  intensidade: direcional.intensity },
            ponto1:      { luz: ponto1,      intensidade: ponto1.intensity },
            ponto2:      { luz: ponto2,      intensidade: ponto2.intensity },
            hemisferica: { luz: hemisferica, intensidade: hemisferica.intensity },
            spot:        { luz: spot,        intensidade: spot.intensity },
        };
    }

    ligar(nome) {
        const entrada = this.luzes[nome];
        if (entrada) entrada.luz.intensity = entrada.intensidade;
    }

    desligar(nome) {
        const entrada = this.luzes[nome];
        if (entrada) entrada.luz.intensity = 0;
    }

    alternar(nome) {
        const entrada = this.luzes[nome];
        if (!entrada) return;
        if (entrada.luz.intensity === 0) {
            this.ligar(nome);
        } else {
            this.desligar(nome);
        }
    }

    estaLigada(nome) {
        const entrada = this.luzes[nome];
        return entrada ? entrada.luz.intensity > 0 : false;
    }
}