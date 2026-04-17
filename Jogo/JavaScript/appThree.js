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
        this.mesh.position.set(0, 0.5, 0);
        this.mesh.castShadow    = true;
        this.mesh.receiveShadow = true;

        cena.add(this.mesh);
    }

    mover(cameraAngle, tecla) {
        const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
        const right   = new THREE.Vector3(-Math.cos(cameraAngle), 0,  Math.sin(cameraAngle));
        const passo   = 0.25;
 
        if (tecla == 87) this.mesh.position.add(forward.clone().multiplyScalar(passo));   // W
        if (tecla == 83) this.mesh.position.add(forward.clone().multiplyScalar(-passo));  // S
        if (tecla == 65) this.mesh.position.add(right.clone().multiplyScalar(passo));     // A
        if (tecla == 68) this.mesh.position.add(right.clone().multiplyScalar(-passo));    // D
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
        this.altura    = 1;   // nível do ombro
        this._angulo    = 0;   // horizontal (radianos)
        this.pitch     = 0;   // vertical   (radianos)

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
        this.pitch  -= event.movementY * 0.002;
        this.pitch   = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
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
        this.viewSize = 25;
        this.aspectRatio = window.innerWidth / window.innerHeight;

        this.camara = new THREE.OrthographicCamera(
            -this.aspectRatio * this.viewSize / 2, this.aspectRatio * this.viewSize / 2,
            this.viewSize / 2, -this.viewSize / 2,
            -1000, 1000
        );
        this.altura = 10; // Altura da câmera acima do jogador
    }

    atualizar(posicaoJogador) {
        this.camara.position.set(posicaoJogador.x, this.altura, posicaoJogador.z);
        this.camara.lookAt(posicaoJogador.x, 0, posicaoJogador.z);
    }

    get angulo() {
        return 0; // Não usado em top-down
    }
}

// ─────────────────────────────────────────────
// Gerenciador de Câmeras
// ─────────────────────────────────────────────
class CameraManager {
    constructor(renderer) {
        this.cameraTerceiraPessoa = new CameraTerceirasPessoa(renderer);
        this.cameraTopDown = new CameraTopDown(renderer);
        this.cameraAtual = this.cameraTopDown; // Começar com top-down
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
// Cenário (chão + paredes + luzes)
// ─────────────────────────────────────────────
class Cenario {
    constructor(cena) {
        this._adicionarChao(cena);
        this._adicionarParedes(cena);
        this._adicionarLuzes(cena);
        this._adicionarSkybox(cena);
        this._adicionarCaixa(cena);
    }

    _adicionarChao(cena) {
        const geometria = new THREE.PlaneGeometry(20, 20);
        const material  = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const mesh      = new THREE.Mesh(geometria, material);

        mesh.rotation.x    = -Math.PI / 2;
        mesh.receiveShadow = true;
        cena.add(mesh);
    }

    _adicionarParedes(cena) {
        const geometria = new THREE.BoxGeometry(20, 4, 0.3);
        const material  = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

        const parede1 = new THREE.Mesh(geometria, material);
        parede1.position.set(0, 2, -10);
        parede1.castShadow    = true;
        parede1.receiveShadow = true;

        const parede2 = new THREE.Mesh(geometria, material);
        parede2.rotation.y = Math.PI / 2;
        parede2.position.set(-10, 2, 0);
        parede2.castShadow    = true;
        parede2.receiveShadow = true;

        cena.add(parede1);
        cena.add(parede2);
    }

    _adicionarLuzes(cena) {
        const luzAmbiente   = new THREE.AmbientLight(0xffffff, 0.5);
        const luzDirecional = new THREE.DirectionalLight(0xffffff, 1);
        luzDirecional.position.set(5, 10, 5);

        cena.add(luzAmbiente);
        cena.add(luzDirecional);
    }
    _adicionarSkybox(cena)
    {
        var texture_dir = new THREE.TextureLoader().load( './Skybox/posx.jpg');
        var texture_esq = new THREE.TextureLoader().load( './Skybox/negx.jpg');
        var texture_up = new THREE.TextureLoader().load( './Skybox/posy.jpg');
        var texture_dn = new THREE.TextureLoader().load( './Skybox/negy.jpg');
        var texture_bk = new THREE.TextureLoader().load( './Skybox/posz.jpg');
        var texture_ft = new THREE.TextureLoader().load( './Skybox/negz.jpg');

        var materialArray = [];
        
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dir}));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_esq}));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up}));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn}));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk}));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft}));
        
        for (var i =0; i < 6; i++)
            materialArray[i].side = THREE.BackSide;
        
        var skyboxGeo = new THREE.BoxGeometry(100, 100, 100);
        
        var skybox = new THREE.Mesh(skyboxGeo, materialArray);

        cena.add(skybox);
    }
    _adicionarCaixa(cena)
    {
        const geometria = new THREE.BoxGeometry(1.5,1.5,1);
        const material = new THREE.MeshStandardMaterial({color: 0x954535 });

        const Caixa1 = new THREE.Mesh(geometria, material);
        Caixa1.position.set(0, 0.5, -5);
        Caixa1.castShadow    = true;
        Caixa1.receiveShadow = true;

        cena.add(Caixa1);
    }
}


// ─────────────────────────────────────────────
// Jogo (ponto de entrada)
// ─────────────────────────────────────────────
class Jogo {
    constructor() {
        this.cena     = new THREE.Scene();
        this.renderer = this._criarRenderer();

        this.cenario  = new Cenario(this.cena);
        this.jogador  = new Jogador(this.cena);
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