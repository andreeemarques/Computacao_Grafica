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
        this.mesh.position.set(49, 0.5, 49); // ← mais para trás
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

    // Parede de cima z1
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(65, alturaParede, espessura), material);
    p1.position.set(17.5, alturaParede / 2, 14);
    p1.castShadow = true; p1.receiveShadow = true;

    // Parede de baixo z1
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(65, alturaParede, espessura), material);
    p2.position.set(17.5, alturaParede / 2, 50); // ← limite do chão
    p2.castShadow = true; 
    p2.receiveShadow = true;

    // Parede esquerda z1 / Parede direita z2
    const p3 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 33), material);
    p3.position.set(26, alturaParede / 2, 33.5); // ← centro entre z:14 e z:50
    p3.castShadow = true; 
    p3.receiveShadow = true;

    // Parede direita z1
    const p4 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, larguraZ), material);
    p4.position.set(50, alturaParede / 2, 32); // ← centro entre z:14 e z:50
    p4.castShadow = true; p4.receiveShadow = true;

    cena.add(p1);
    cena.add(p2);
    cena.add(p3);
    cena.add(p4);
}

_criarTexturaMadeira(l, a, p) {
    // --- Textura difusa com tábuas ---
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Fundo base castanho
    ctx.fillStyle = '#7B4A2D';
    ctx.fillRect(0, 0, W, H);

    // Ruído de veio de madeira (linhas horizontais com variação)
    for (let y = 0; y < H; y++) {
        const t = y / H;
        const noiseAmp = 6;
        const r = Math.round(120 + 15 * Math.sin(y * 0.4 + Math.random() * 0.5));
        const g = Math.round(72  + 10 * Math.sin(y * 0.3 + 1.2));
        const b = Math.round(42  +  8 * Math.sin(y * 0.35 + 2.1));
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= W; x += 4) {
            const dy = noiseAmp * Math.sin(x * 0.05 + y * 0.1 + Math.random() * 0.3);
            ctx.lineTo(x, y + dy);
        }
        ctx.stroke();
    }

    // Divisórias entre tábuas (separadores horizontais escuros)
    const numTábuas = 4;
    const altTábua = H / numTábuas;
    ctx.strokeStyle = 'rgba(30,15,5,0.7)';
    ctx.lineWidth = 3;
    for (let i = 1; i < numTábuas; i++) {
        const yLine = i * altTábua;
        ctx.beginPath(); ctx.moveTo(0, yLine); ctx.lineTo(W, yLine); ctx.stroke();
        // Sombra subtil abaixo de cada tábua
        ctx.strokeStyle = 'rgba(255,200,140,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, yLine + 2); ctx.lineTo(W, yLine + 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(30,15,5,0.7)';
        ctx.lineWidth = 3;
    }

    // Nós de madeira aleatórios
    const rng = (n) => Math.random() * n;
    for (let i = 0; i < 5; i++) {
        const cx = rng(W), cy = rng(H);
        const rx = 8 + rng(12), ry = 5 + rng(8);
        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx);
        grad.addColorStop(0,   'rgba(50,25,10,0.8)');
        grad.addColorStop(0.5, 'rgba(80,45,20,0.4)');
        grad.addColorStop(1,   'rgba(80,45,20,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, rng(Math.PI), 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    // Escalar repetição à proporção da caixa
    tex.repeat.set(l / 2, a / 2);
    return tex;
}

_criarNormalMap(l, a) {
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Base neutra (normal apontada para cima: R=128 G=128 B=255)
    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(0, 0, W, H);

    // Bordas de tábua em relevo
    const numTábuas = 4;
    const altTábua = H / numTábuas;
    for (let i = 0; i < numTábuas; i++) {
        const y0 = i * altTábua;
        // Borda superior da tábua (inclinada para cima → verde alto)
        ctx.fillStyle = 'rgb(128,200,255)';
        ctx.fillRect(0, y0, W, 4);
        // Borda inferior (inclinada para baixo → verde baixo)
        ctx.fillStyle = 'rgb(128,50,255)';
        ctx.fillRect(0, y0 + altTábua - 4, W, 4);
    }

    // Veio em normal leve (perturbação subtil em X)
    for (let y = 0; y < H; y += 2) {
        const shift = Math.sin(y * 0.3) * 8;
        const r = Math.round(128 + shift);
        ctx.fillStyle = `rgb(${r},128,255)`;
        ctx.fillRect(0, y, W, 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(l / 2, a / 2);
    return tex;
}

_adicionarCantoneiras(cena, x, z, l, a, p) {
    const matMetal = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.9,
        roughness: 0.3,
    });

    const esp = 0.12; // espessura da cantoneira
    const tamanho = 0.5;

    // Posições dos 8 cantos: [dx, dy, dz]
    const cantos = [
        [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
        [-1, -1,  1], [1, -1,  1], [-1, 1,  1], [1, 1,  1],
    ];

    cantos.forEach(([dx, dy, dz]) => {
        const cx = x + dx * (l / 2 - esp / 2);
        const cy =     dy * (a / 2 - esp / 2) + a / 2;
        const cz = z + dz * (p / 2 - esp / 2);

        // Placa horizontal da cantoneira (em L — duas tiras)
        const geoH = new THREE.BoxGeometry(tamanho, esp, esp);
        const meshH = new THREE.Mesh(geoH, matMetal);
        meshH.position.set(cx, cy, z + dz * p / 2);
        meshH.castShadow = true;
        cena.add(meshH);

        const geoV = new THREE.BoxGeometry(esp, esp, tamanho);
        const meshV = new THREE.Mesh(geoV, matMetal);
        meshV.position.set(x + dx * l / 2, cy, cz);
        meshV.castShadow = true;
        cena.add(meshV);

        // Pilar vertical do canto
        const geoP = new THREE.BoxGeometry(esp, tamanho, esp);
        const meshP = new THREE.Mesh(geoP, matMetal);
        meshP.position.set(x + dx * l / 2, cy, z + dz * p / 2);
        meshP.castShadow = true;
        cena.add(meshP);
    });
}

_adicionarCintas(cena, x, z, l, a, p) {
    const matCinta = new THREE.MeshStandardMaterial({
        color: 0x777777,
        metalness: 0.85,
        roughness: 0.25,
    });

    // Duas cintas horizontais a 1/3 e 2/3 da altura
    [1/3, 2/3].forEach(frac => {
        const y = frac * a;

        // Face frontal e traseira
        [-1, 1].forEach(dz => {
            const geo = new THREE.BoxGeometry(l + 0.02, 0.12, 0.06);
            const mesh = new THREE.Mesh(geo, matCinta);
            mesh.position.set(x, y, z + dz * (p / 2 + 0.03));
            mesh.castShadow = true;
            cena.add(mesh);
        });

        // Lados esquerdo e direito
        [-1, 1].forEach(dx => {
            const geo = new THREE.BoxGeometry(0.06, 0.12, p + 0.02);
            const mesh = new THREE.Mesh(geo, matCinta);
            mesh.position.set(x + dx * (l / 2 + 0.03), y, z);
            mesh.castShadow = true;
            cena.add(mesh);
        });
    });
}

_adicionarCaixas(cena) {
    const caixas = [
        { x: 33, z: 20, l: 4, a: 2, p: 2.5 },
        { x: 33, z: 26, l: 4, a: 2, p: 2.5 },
        { x: 33, z: 32, l: 4, a: 2, p: 2.5 },
        { x: 33, z: 38, l: 4, a: 2, p: 2.5 },
        { x: 43, z: 20, l: 4, a: 2, p: 2.5 },
        { x: 43, z: 26, l: 4, a: 2, p: 2.5 },
        { x: 43, z: 32, l: 4, a: 2, p: 2.5 },
        { x: 43, z: 38, l: 4, a: 2, p: 2.5 },
    ];

    caixas.forEach(({ x, z, l, a, p }) => {
        const texDif = this._criarTexturaMadeira(l, a, p);
        const texNrm = this._criarNormalMap(l, a);

        const material = new THREE.MeshStandardMaterial({
            map:         texDif,
            normalMap:   texNrm,
            normalScale: new THREE.Vector2(1.2, 1.2),
            roughness:   0.75,
            metalness:   0.05,
            color:       0xffffff, // deixar a textura ditar a cor
        });

        const geo  = new THREE.BoxGeometry(l, a, p);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, a / 2, z);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        cena.add(mesh);

        // Detalhes metálicos
        this._adicionarCantoneiras(cena, x, z, l, a, p);
        this._adicionarCintas(cena, x, z, l, a, p);
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