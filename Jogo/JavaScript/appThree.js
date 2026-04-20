import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

// ─────────────────────────────────────────────
// Jogador
// ─────────────────────────────────────────────
class Jogador {
    constructor(cena) {
        const geometria = new THREE.BoxGeometry(1, 1, 1);
        const textura   = new THREE.TextureLoader().load('./Imagens/boxImage.jpg');
        const material  = new THREE.MeshStandardMaterial({ map: textura });

        this.mesh = new THREE.Mesh(geometria, material);
        this.mesh.position.set(38, 0.5, 50); // ← mais para trás
        this.mesh.castShadow    = true;
        this.mesh.receiveShadow = true;

        cena.add(this.mesh);
    }

    mover(cameraAngle, tecla) {
        const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
        const right   = new THREE.Vector3(-Math.cos(cameraAngle), 0,  Math.sin(cameraAngle));
        const passo   = 0.25;

        if (tecla == 87) this.mesh.position.add(forward.clone().multiplyScalar(passo));
        if (tecla == 83) this.mesh.position.add(forward.clone().multiplyScalar(-passo));
        if (tecla == 65) this.mesh.position.add(right.clone().multiplyScalar(passo));
        if (tecla == 68) this.mesh.position.add(right.clone().multiplyScalar(-passo));
    }

    orientarParaCamera(camara) {
        const alvo = new THREE.Vector3(camara.position.x, this.mesh.position.y, camara.position.z);
        this.mesh.lookAt(alvo);
    }

    get posicao() {
        return this.mesh.position;
    }
}

// ─────────────────────────────────────────────
// Câmera de 3ª pessoa
// ─────────────────────────────────────────────
class CameraTerceirasPessoa {
    constructor(renderer) {
        this.camara   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
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

// ─────────────────────────────────────────────
// Câmera Top-Down
// ─────────────────────────────────────────────
class CameraTopDown {
    constructor(renderer) {
        this.viewSize    = 25;
        this.aspectRatio = window.innerWidth / window.innerHeight;

        this.camara = new THREE.OrthographicCamera(
            -this.aspectRatio * this.viewSize / 2, this.aspectRatio * this.viewSize / 2,
             this.viewSize / 2, -this.viewSize / 2,
            -1000, 1000
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

// ─────────────────────────────────────────────
// Gerenciador de Câmeras
// ─────────────────────────────────────────────
class CameraManager {
    constructor(renderer) {
        this.cameraTerceiraPessoa = new CameraTerceirasPessoa(renderer);
        this.cameraTopDown        = new CameraTopDown(renderer);
        this.cameraAtual          = this.cameraTopDown;
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

// ─────────────────────────────────────────────
// Cenário
// ─────────────────────────────────────────────
class Cenario {
    constructor(cena) {
        this._adicionarChao(cena);
        this._adicionarParedesArea(cena);
        this._adicionarCaixas(cena);
        this._adicionarLuzes(cena);
        this._adicionarSkybox(cena);
    }

    _adicionarChao(cena) {
        const geometria = new THREE.PlaneGeometry(100, 100);
        const material  = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const mesh      = new THREE.Mesh(geometria, material);
        mesh.rotation.x    = -Math.PI / 2;
        mesh.receiveShadow = true;
        cena.add(mesh);
    }

_adicionarParedesArea(cena) {
    const material     = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const alturaParede = 3;
    const espessura    = 0.3;

    const larguraX = 24; // de x:26 a x:50
    const larguraZ = 36; // ajustado para caber no chão (de z:14 a z:50)

    // Parede de cima
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(larguraX, alturaParede, espessura), material);
    p1.position.set(38, alturaParede / 2, 14);
    p1.castShadow = true; p1.receiveShadow = true;

    // Parede de baixo
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(larguraX, alturaParede, espessura), material);
    p2.position.set(38, alturaParede / 2, 50); // ← limite do chão
    p2.castShadow = true; p2.receiveShadow = true;

    // Parede esquerda
    const p3 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, larguraZ), material);
    p3.position.set(26, alturaParede / 2, 32); // ← centro entre z:14 e z:50
    p3.castShadow = true; p3.receiveShadow = true;

    // Parede direita
    const p4 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, larguraZ), material);
    p4.position.set(50, alturaParede / 2, 32); // ← centro entre z:14 e z:50
    p4.castShadow = true; p4.receiveShadow = true;

    cena.add(p1);
    cena.add(p2);
    cena.add(p3);
    cena.add(p4);
}

    _adicionarCaixas(cena) {
        const material = new THREE.MeshStandardMaterial({ color: 0x954535 });

        const caixas = [
            // Coluna esquerda (4 caixas) — rodadas 90º (l e p trocados)
            { x: 33, z: 20, l: 4, a: 2, p: 2.5 },
            { x: 33, z: 26, l: 4, a: 2, p: 2.5 },
            { x: 33, z: 32, l: 4, a: 2, p: 2.5 },
            { x: 33, z: 38, l: 4, a: 2, p: 2.5 },

            // Coluna direita (4 caixas) — rodadas 90º (l e p trocados)
            { x: 43, z: 20, l: 4, a: 2, p: 2.5 },
            { x: 43, z: 26, l: 4, a: 2, p: 2.5 },
            { x: 43, z: 32, l: 4, a: 2, p: 2.5 },
            { x: 43, z: 38, l: 4, a: 2, p: 2.5 },
        ];

        caixas.forEach(({ x, z, l, a, p }) => {
            const geo  = new THREE.BoxGeometry(l, a, p);
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(x, a / 2, z);
            mesh.castShadow    = true;
            mesh.receiveShadow = true;
            cena.add(mesh);
        });
    }

    _adicionarLuzes(cena) {
        const luzAmbiente   = new THREE.AmbientLight(0xffffff, 0.5);
        const luzDirecional = new THREE.DirectionalLight(0xffffff, 1);
        luzDirecional.position.set(5, 10, 5);
        luzDirecional.castShadow = true;
        cena.add(luzAmbiente);
        cena.add(luzDirecional);
    }

    _adicionarSkybox(cena) {
        const loader    = new THREE.TextureLoader();
        const faces     = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];
        const materiais = faces.map(f => new THREE.MeshBasicMaterial({
            map:  loader.load(`./Skybox/${f}.jpg`),
            side: THREE.BackSide
        }));
        const skybox = new THREE.Mesh(new THREE.BoxGeometry(500, 500, 500), materiais);
        cena.add(skybox);
    }
}

// ─────────────────────────────────────────────
// Jogo (ponto de entrada)
// ─────────────────────────────────────────────
class Jogo {
    constructor() {
        this.cena      = new THREE.Scene();
        this.renderer  = this._criarRenderer();
        this.cenario   = new Cenario(this.cena);
        this.jogador   = new Jogador(this.cena);
        this.cameraManager = new CameraManager(this.renderer);

        this._registarEventos();
        this.cameraManager.atualizar(this.jogador.posicao);
        this._loop();
    }

    _criarRenderer() {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.setClearColor(0x87ceeb);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _registarEventos() {
        document.addEventListener('keydown', (event) => {
            if (event.which === 67) { // C
                this.cameraManager.alternar();
            } else {
                this.jogador.mover(this.cameraManager.angulo, event.which);
            }
        }, false);
    }

    _loop() {
        this.jogador.orientarParaCamera(this.cameraManager.camara);
        this.cameraManager.atualizar(this.jogador.posicao);
        this.renderer.render(this.cena, this.cameraManager.camara);
        requestAnimationFrame(this._loop.bind(this));
    }
}

// ─────────────────────────────────────────────
// Iniciar
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => new Jogo());