import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

export class CamaraTerceirasPessoas {
    constructor(renderer, gestorColisoes) {
        this.camara = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this._renderer = renderer;
        this.controls = new PointerLockControls(this.camara, renderer.domElement);
        this.gestorColisoes = gestorColisoes;
        this.distancia = 10.0;
        this.altura = 1.0;
        this.minDistance = 0.7;
        this.maxDistance = 10.0;
        this._angulo = 0;
        this.pitch = 0;
        this._posicaoAtual = new THREE.Vector3(0, this.altura + 1.2, this.distancia);
        this._velocidadeLerp = 0.8;
        this._ativa = false; // Só faz lock se esta câmara estiver ativa

        this._onMouseMoveBound = this._onMouseMove.bind(this);
        this._onClickBound     = this._onClick.bind(this);
        this._registarEventos();
    }

    ativar() {
        this._ativa = true;
    }

    desativar() {
        this._ativa = false;
        // Liberta o lock quando a câmara é desativada
        if (this.controls.isLocked) {
            this.controls.unlock();
        }
    }

    _registarEventos() {
        this.controls.addEventListener('lock', () => {
            document.addEventListener('mousemove', this._onMouseMoveBound, false);
        });

        this.controls.addEventListener('unlock', () => {
            document.removeEventListener('mousemove', this._onMouseMoveBound, false);
        });

        document.addEventListener('click', this._onClickBound, false);
    }

    _onClick() {
        // Só tenta fazer lock se:
        // 1. Esta câmara está ativa
        // 2. O canvas ainda está no DOM
        // 3. Ainda não está em lock
        if (!this._ativa) return;
        if (!document.contains(this._renderer.domElement)) return;
        if (this.controls.isLocked) return;

        this.controls.lock();
    }

    _onMouseMove(event) {
        this._angulo -= event.movementX * 0.0026;
        this.pitch    += event.movementY * 0.0024;
        this.pitch = Math.max(-Math.PI / 2 + 0.25, Math.min(Math.PI / 2 - 0.25, this.pitch));
    }

    atualizar(posicaoJogador) {
        const alvo = posicaoJogador.clone();
        alvo.y += 1.5;

        const distanciaAtual = Math.max(this.minDistance, Math.min(this.maxDistance, this.distancia));
        const offsetX = distanciaAtual * Math.sin(this._angulo) * Math.cos(this.pitch);
        const offsetZ = distanciaAtual * Math.cos(this._angulo) * Math.cos(this.pitch);
        const offsetY = distanciaAtual * Math.sin(this.pitch);

        const idealPosicao = new THREE.Vector3(
            posicaoJogador.x + offsetX,
            posicaoJogador.y + this.altura + offsetY,
            posicaoJogador.z + offsetZ
        );

        const finalPosicao = this._resolverColisao(alvo, idealPosicao);
        this._posicaoAtual.lerp(finalPosicao, this._velocidadeLerp);
        this._posicaoAtual.y = Math.max(this._posicaoAtual.y, 0.8);
        this.camara.position.copy(this._posicaoAtual);
        this.camara.lookAt(alvo);
    }

    _cameraBox(posicao) {
        const raio = 0.45;
        return new THREE.Box3(
            new THREE.Vector3(posicao.x - raio, posicao.y - raio, posicao.z - raio),
            new THREE.Vector3(posicao.x + raio, posicao.y + raio, posicao.z + raio)
        );
    }

    _resolverColisao(origem, destino) {
        if (!this.gestorColisoes) return destino;

        const minHeight = 0.8;
        const alvo = destino.clone();
        if (alvo.y < minHeight) alvo.y = minHeight;

        if (!this.gestorColisoes.colideBox(this._cameraBox(alvo))) {
            return alvo;
        }

        const direcao   = alvo.clone().sub(origem);
        const comprimento = direcao.length();
        if (comprimento < 0.001) {
            const fallback = origem.clone().add(direcao.clone().setLength(this.minDistance));
            if (fallback.y < minHeight) fallback.y = minHeight;
            return fallback;
        }

        const passo    = 0.12;
        const passos   = Math.max(8, Math.ceil(comprimento / passo));
        const incremento = direcao.clone().divideScalar(passos);
        const obstaculos = this.gestorColisoes.obterTodasBoxes();

        for (let i = passos; i >= 1; i--) {
            const posTeste = origem.clone().addScaledVector(incremento, i);
            if (posTeste.distanceTo(origem) < this.minDistance) {
                posTeste.copy(origem).add(direcao.clone().setLength(this.minDistance));
            }
            if (!this._colideComObstaculos(this._cameraBox(posTeste), obstaculos)) {
                if (posTeste.y < minHeight) posTeste.y = minHeight;
                return posTeste;
            }
        }

        const fallback = origem.clone().add(direcao.clone().setLength(this.minDistance));
        if (fallback.y < minHeight) fallback.y = minHeight;
        return fallback;
    }

    _colideComObstaculos(box, obstaculos) {
        for (const obstaculo of obstaculos) {
            if (box.intersectsBox(obstaculo)) return true;
        }
        return false;
    }

    destruir() {
        this._ativa = false;
        document.removeEventListener('click',     this._onClickBound,     false);
        document.removeEventListener('mousemove', this._onMouseMoveBound, false);
        if (this.controls.isLocked) this.controls.unlock();
        this.controls.dispose();
    }

    get angulo() {
        return this._angulo;
    }
}

export class CamaraTopDown {
    constructor() {
        this.viewSize    = 25;
        this.aspectRatio = window.innerWidth / window.innerHeight;

        this.camara = new THREE.OrthographicCamera(
            -this.aspectRatio * this.viewSize / 2,
             this.aspectRatio * this.viewSize / 2,
             this.viewSize / 2,
            -this.viewSize / 2,
            -5000, 5000
        );
        this.altura = 10;
    }

    ativar()   {}
    desativar() {}
    destruir()  {}

    atualizar(posicaoJogador) {
        this.camara.position.set(posicaoJogador.x, this.altura, posicaoJogador.z);
        this.camara.lookAt(posicaoJogador.x, 0, posicaoJogador.z);
    }

    get angulo() {
        return 0;
    }
}

export class CamaraManager {
    constructor(renderer, gestorColisoes) {
        this.cameraTerceiraPessoa = new CamaraTerceirasPessoas(renderer, gestorColisoes);
        this.cameraTopDown        = new CamaraTopDown();
        this.cameraAtual          = this.cameraTerceiraPessoa;
        this.cameraTerceiraPessoa.ativar(); // Ativa a câmara inicial
    }

    alternar() {
        this.cameraAtual.desativar();
        this.cameraAtual = (this.cameraAtual === this.cameraTopDown)
            ? this.cameraTerceiraPessoa
            : this.cameraTopDown;
        this.cameraAtual.ativar();
    }

    atualizar(posicaoJogador) {
        this.cameraAtual.atualizar(posicaoJogador);
    }

    destruir() {
        this.cameraTerceiraPessoa.destruir();
        this.cameraTopDown.destruir();
    }

    get camara() {
        return this.cameraAtual.camara;
    }

    get angulo() {
        return this.cameraAtual.angulo;
    }
}