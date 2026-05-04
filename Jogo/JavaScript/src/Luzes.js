import * as THREE from 'three';
import { PosteIluminacao } from './objetos/PosteIluminacao.js';

export class GestorLuzes {
    constructor(cena) {
        this.luzes = {};
        this.postes = [];
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
        //direcional.shadow.mapSize.set(2048, 2048);
        cena.add(direcional);

        // ── HemisphereLight (céu/chão) ──
        const hemisferica = new THREE.HemisphereLight(0x87ceeb, 0x444422, 0.6);
        cena.add(hemisferica);

        // ── SpotLight ──
       /* const spot = new THREE.SpotLight(0xffffff, 2, 50, Math.PI / 6, 0.3);
        spot.position.set(0, 15, 15);
        spot.target.position.set(0, 0, 15);
        spot.castShadow = true;
        cena.add(spot);
        cena.add(spot.target);*/

        // Regista todas com um nome e intensidade original
        this.luzes = {
            ambiente:    { luz: ambiente,    intensidade: ambiente.intensity },
            direcional:  { luz: direcional,  intensidade: direcional.intensity },
            hemisferica: { luz: hemisferica, intensidade: hemisferica.intensity },
            //spot:        { luz: spot,        intensidade: spot.intensity },
        };

        // ── Postes com PointLight ──
        this.postes = [
            new PosteIluminacao(cena, 26.7,  20, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, 26.7,  40, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, 45.5,  20, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, 45.5,  40, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, 10, 17, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, 10, 33, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, -15, 45, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, -34, 35, 0xffaa44, 20, 25),
            new PosteIluminacao(cena, -15, 20, 0xffaa44, 20, 25),
        ];
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
        const e = this.luzes[nome];
        if (!e) return;
        e.luz.intensity === 0 ? this.ligar(nome) : this.desligar(nome);
    }

    estaLigada(nome) {
        const entrada = this.luzes[nome];
        return entrada ? entrada.luz.intensity > 0 : false;
    }

    // ── Postes (liga/desliga todos de uma vez) ──
    ligarPostes()   { this.postes.forEach(p => p.ligar()); }
    desligarPostes(){ this.postes.forEach(p => p.desligar()); }
    alternarPostes(){
        const algumLigado = this.postes.some(p => p.estaLigado);
        algumLigado ? this.desligarPostes() : this.ligarPostes();
    }
    postesLigados() { return this.postes.some(p => p.estaLigado); }
}