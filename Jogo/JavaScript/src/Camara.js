import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

export class CamaraTerceirasPessoas
{
    constructor(renderer, gestorColisoes) {
            this.camara   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
            this.controls = new PointerLockControls(this.camara, renderer.domElement);
            this.gestorColisoes = gestorColisoes;
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
    
            const idealPosicao = new THREE.Vector3(
                posicaoJogador.x + offsetX,
                posicaoJogador.y + this.altura + offsetY,
                posicaoJogador.z + offsetZ
            );

            const finalPosicao = this._resolverColisao(posicaoJogador, idealPosicao);
            this.camara.position.copy(finalPosicao);
            this.camara.lookAt(posicaoJogador);
        }

        _cameraBox(posicao) {
            const raio = 0.25;
            return new THREE.Box3(
                new THREE.Vector3(posicao.x - raio, posicao.y - raio, posicao.z - raio),
                new THREE.Vector3(posicao.x + raio, posicao.y + raio, posicao.z + raio)
            );
        }

        _resolverColisao(origem, destino) {
            if (!this.gestorColisoes) return destino;

            const minHeight = 0.45;
            const alvo = destino.clone();
            if (alvo.y < minHeight) alvo.y = minHeight;

            if (!this.gestorColisoes.colideBox(this._cameraBox(alvo))) {
                return alvo;
            }

            const direcao = alvo.clone().sub(origem);
            const comprimento = direcao.length();
            if (comprimento === 0) return alvo;

            const raioSeguranca = 0.35;
            const direcaoNormalizada = direcao.clone().normalize();
            const raio = new THREE.Ray(origem.clone(), direcaoNormalizada);
            const tempPonto = new THREE.Vector3();
            let distanciaMaisPerto = Infinity;

            for (const obstaculo of this.gestorColisoes.obstaculos) {
                const ponto = raio.intersectBox(obstaculo, tempPonto);
                if (ponto) {
                    const distancia = ponto.distanceTo(origem);
                    if (distancia >= 0 && distancia < distanciaMaisPerto && distancia <= comprimento) {
                        distanciaMaisPerto = distancia;
                    }
                }
            }

            if (distanciaMaisPerto === Infinity) {
                return alvo;
            }

            const distanciaSegura = Math.max(0.8, distanciaMaisPerto - raioSeguranca);
            const posicaoSegura = origem.clone().add(direcaoNormalizada.multiplyScalar(distanciaSegura));
            if (posicaoSegura.y < minHeight) posicaoSegura.y = minHeight;
            return posicaoSegura;
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
    constructor(renderer, gestorColisoes) {
        this.cameraTerceiraPessoa = new CamaraTerceirasPessoas(renderer, gestorColisoes); // ← nome correto
        this.cameraTopDown        = new CamaraTopDown(renderer);                           // ← nome correto
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