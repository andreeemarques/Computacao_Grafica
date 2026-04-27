import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

export class CamaraTerceirasPessoas
{
    constructor(renderer) {
            this.camara   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
            this.controls = new PointerLockControls(this.camara, renderer.domElement);
    
            this.distancia = 10;
            this.altura    = 1;
            this._angulo   = 0;
            this.pitch     = 0;
    
            this._onMouseMoveBound = this._onMouseMove.bind(this);
            this._registarEventos(renderer);
        }
    
        _registarEventos(renderer) {
            this.controls.addEventListener('lock', () => {
                document.addEventListener('mousemove', this._onMouseMoveBound, false);
            });
    
            this.controls.addEventListener('unlock', () => {
                document.removeEventListener('mousemove', this._onMouseMoveBound, false);
            });
    
            document.addEventListener('click', () => this.controls.lock(), false);
        }
    
        _onMouseMove(event) {
            this._angulo -= event.movementX * 0.002;
            this.pitch   += event.movementY * 0.002;
            this.pitch    = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        }
    
        atualizar(posicaoJogador) {
            const offsetX = this.distancia * Math.sin(this._angulo) * Math.cos(this.pitch);
            const offsetZ = this.distancia * Math.cos(this._angulo) * Math.cos(this.pitch);
            const offsetY = this.distancia * Math.sin(this.pitch);
    
            this.camara.position.set(
                posicaoJogador.x + offsetX,
                posicaoJogador.y + this.altura + offsetY,
                posicaoJogador.z + offsetZ
            );
            this.camara.lookAt(posicaoJogador);
        }
    
        get angulo() {
            return this._angulo;
        }
}

export class CamaraTopDown
{
    constructor(renderer) {
            this.viewSize    = 25;
            this.aspectRatio = window.innerWidth / window.innerHeight;
    
            this.camara = new THREE.OrthographicCamera(
                -this.aspectRatio * this.viewSize / 2, this.aspectRatio * this.viewSize / 2,
                 this.viewSize / 2, -this.viewSize / 2,
                -5000, 5000
            );
            this.altura = 10;
        }
    
        atualizar(posicaoJogador) {
            this.camara.position.set(posicaoJogador.x, this.altura, posicaoJogador.z);
            this.camara.lookAt(posicaoJogador.x, 0, posicaoJogador.z);
        }
    
        get angulo() {
            return 0;
        }
}

export class CamaraManager {
    constructor(renderer) {
        this.cameraTerceiraPessoa = new CamaraTerceirasPessoas(renderer); // ← nome correto
        this.cameraTopDown        = new CamaraTopDown(renderer);          // ← nome correto
        this.cameraAtual          = this.cameraTerceiraPessoa;
    }

    alternar() {
        if (this.cameraAtual === this.cameraTopDown) {
            this.cameraAtual = this.cameraTerceiraPessoa;
        } else {
            this.cameraAtual = this.cameraTopDown;
        }
    }

    atualizar(posicaoJogador) {
        this.cameraAtual.atualizar(posicaoJogador);
    }

    get camara() {
        return this.cameraAtual.camara;
    }

    get angulo() {
        return this.cameraAtual.angulo;
    }
}