import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';


class GestorColisoes {
    constructor() {
        this.obstaculos = [];
    }

    registar(mesh) {
        // Guarda uma Box3 estática calculada a partir do mesh
        const box = new THREE.Box3().setFromObject(mesh);
        this.obstaculos.push(box);
    }

    registarBox(minVec, maxVec) {
        // Para obstáculos definidos manualmente (paredes finas, etc.)
        this.obstaculos.push(new THREE.Box3(minVec, maxVec));
    }

    colide(jogadorBox) {
        for (const obstaculo of this.obstaculos) {
            if (jogadorBox.intersectsBox(obstaculo)) return true;
        }
        return false;
    }
}

// ─────────────────────────────────────────────
// Jogador
// ─────────────────────────────────────────────
class Jogador {
    constructor(cena, gestorColisoes) {
        const geometria = new THREE.BoxGeometry(1, 1, 1);
        const textura   = new THREE.TextureLoader().load('./Imagens/boxImage.jpg');
        const material  = new THREE.MeshStandardMaterial({ map: textura });

        this.mesh = new THREE.Mesh(geometria, material);
        this.mesh.position.set(49, 0.5, 49);
        this.mesh.castShadow    = true;
        this.mesh.receiveShadow = true;

        this.gestorColisoes = gestorColisoes;

        cena.add(this.mesh);
    }

    _boxNaPosicao(posicao) {
        const raio = 0.45; // ligeiramente menor que 0.5 para melhor feel
        return new THREE.Box3(
            new THREE.Vector3(posicao.x - raio, posicao.y - 0.5, posicao.z - raio),
            new THREE.Vector3(posicao.x + raio, posicao.y + 0.5, posicao.z + raio)
        );
    }

    mover(cameraAngle, tecla) {
        const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
        const right   = new THREE.Vector3(-Math.cos(cameraAngle), 0,  Math.sin(cameraAngle));
        const passo   = 0.25;

        let delta = new THREE.Vector3();
        if (tecla === 87) delta.add(forward.clone().multiplyScalar( passo));
        if (tecla === 83) delta.add(forward.clone().multiplyScalar(-passo));
        if (tecla === 65) delta.add(right.clone().multiplyScalar(  passo));
        if (tecla === 68) delta.add(right.clone().multiplyScalar( -passo));

        if (delta.lengthSq() === 0) return;

        const posAtual = this.mesh.position.clone();

        // ── Tentativa 1: movimento completo (X + Z) ──
        const posTotal = posAtual.clone().add(delta);
        if (!this.gestorColisoes.colide(this._boxNaPosicao(posTotal))) {
            this.mesh.position.copy(posTotal);
            return;
        }

        // ── Tentativa 2: só X (deslizar ao longo de Z) ──
        const posSoX = posAtual.clone();
        posSoX.x += delta.x;
        if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoX))) {
            this.mesh.position.copy(posSoX);
            return;
        }

        // ── Tentativa 3: só Z (deslizar ao longo de X) ──
        const posSoZ = posAtual.clone();
        posSoZ.z += delta.z;
        if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoZ))) {
            this.mesh.position.copy(posSoZ);
        }
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

// ─────────────────────────────────────────────
// Gerenciador de Câmeras
// ─────────────────────────────────────────────
class CameraManager {
    constructor(renderer) {
        this.cameraTerceiraPessoa = new CameraTerceirasPessoa(renderer);
        this.cameraTopDown        = new CameraTopDown(renderer);
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



// ─────────────────────────────────────────────
// Cenário
// ─────────────────────────────────────────────
class Cenario {
    constructor(cena, gestorColisoes) {
        this.gc = gestorColisoes;
        this._adicionarChao(cena);
        this._adicionarParedesArea(cena);
        this._adicionarCaixas(cena);
        this._adicionarEdificios(cena);
        this._adicionarContentores(cena);
        this.cabine = new Cabine(cena, 12, 15.7, 0);
        this._adicionarHalfWall(cena);
        this._adicionarLuzes(cena);
        this.skybox = this._adicionarSkybox(cena);
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

        const larguraX = 24;
        const larguraZ = 36;

        //parede de cima z1
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(60, alturaParede, espessura), material);
        p1.position.set(20, alturaParede / 2, 14);
        p1.castShadow = true; p1.receiveShadow = true;

        //parede de baixo z1
        const p2 = new THREE.Mesh(new THREE.BoxGeometry(85, alturaParede, espessura), material);
        p2.position.set(7.5, alturaParede / 2, 50);
        p2.castShadow = true; p2.receiveShadow = true;

        //parede esquerda z1/parede direita z2
        const p3 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 33), material);
        p3.position.set(26, alturaParede / 2, 33.5);
        p3.castShadow = true; p3.receiveShadow = true;

        //parede direita z1
        const p4 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, larguraZ), material);
        p4.position.set(50, alturaParede / 2, 32);
        p4.castShadow = true; p4.receiveShadow = true;

        //Parede esquerda exterior z2
        const p5 = new THREE.Mesh(new THREE.BoxGeometry(espessura, alturaParede, 36), material);
        p5.position.set(-35, alturaParede / 2, 32);
        p5.castShadow = true; p5.receiveShadow = true;

        //parede de ligação - conecta parede esquerda à parede 1, no mesmo z2
        const p6 = new THREE.Mesh(new THREE.BoxGeometry(20, alturaParede, espessura), material);
        p6.position.set(-25, alturaParede / 2, 14);
        p6.castShadow = true; p6.receiveShadow = true;

        cena.add(p1); this.gc.registar(p1);
        cena.add(p2); this.gc.registar(p2);
        cena.add(p3); this.gc.registar(p3);
        cena.add(p4); this.gc.registar(p4);
        cena.add(p5); this.gc.registar(p5);
        cena.add(p6); this.gc.registar(p6);
    }

    // ─────────────────────────────────────────
    // Textura de betão para os edifícios
    // Menos janelas, agrupadas por andar, com entrada no rés-do-chão
    // ─────────────────────────────────────────
    _criarTexturaEdificio(l, a, comEntrada = false) {
        const W = 512, H = 512;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Base cinzento betão com variação subtil
        ctx.fillStyle = '#8a8a8a';
        ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 2) {
            const v = Math.round(138 + Math.sin(y * 0.07) * 6 + (Math.random() * 4 - 2));
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(0, y, W, 2);
        }

        // Linhas de separação entre pisos
        const numPisos = 5;
        const altPiso  = H / numPisos;
        ctx.strokeStyle = 'rgba(50,50,50,0.5)';
        ctx.lineWidth   = 2;
        for (let i = 1; i < numPisos; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * altPiso);
            ctx.lineTo(W, i * altPiso);
            ctx.stroke();
        }

        // Janelas — apenas 2 por andar, nos pisos superiores (não no rés-do-chão)
        const numCols  = 2;
        const janLarg  = W / numCols * 0.35;
        const janAlt   = altPiso * 0.4;
        const janOffX  = (W / numCols - janLarg) / 2;
        const janOffY  = (altPiso - janAlt) / 2;

        // Começa no piso 0
        for (let row = 0; row < numPisos; row++) {
            for (let col = 0; col < numCols; col++) {
                const jx = col * (W / numCols) + janOffX;
                const jy = row * altPiso + janOffY;

                // Vidro azulado
                const grad = ctx.createLinearGradient(jx, jy, jx + janLarg, jy + janAlt);
                grad.addColorStop(0,   'rgba(140,185,215,0.85)');
                grad.addColorStop(0.5, 'rgba(170,210,235,0.9)');
                grad.addColorStop(1,   'rgba(110,165,205,0.8)');
                ctx.fillStyle = grad;
                ctx.fillRect(jx, jy, janLarg, janAlt);

                // Moldura
                ctx.strokeStyle = 'rgba(50,50,50,0.9)';
                ctx.lineWidth   = 2;
                ctx.strokeRect(jx, jy, janLarg, janAlt);

                // Cruz da janela
                ctx.beginPath();
                ctx.moveTo(jx + janLarg / 2, jy);
                ctx.lineTo(jx + janLarg / 2, jy + janAlt);
                ctx.moveTo(jx, jy + janAlt / 2);
                ctx.lineTo(jx + janLarg, jy + janAlt / 2);
                ctx.stroke();
            }
        }

        // Entrada no rés-do-chão (piso 0), deslocada para a esquerda e mais abaixo
        if (comEntrada) {
            const entLarg = W * 0.22;
            const entAlt  = altPiso * 0.75;
            const entX    = W * 0.4;               // ← mais à direita
            const entY    = H - entAlt - 10;       // ← perto do chão (fundo do canvas)

            // Porta — madeira escura
            ctx.fillStyle = '#3B1F0A';
            ctx.fillRect(entX, entY, entLarg, entAlt);

            // Painel central da porta
            ctx.fillStyle = '#4E2A0E';
            ctx.fillRect(entX + entLarg * 0.1, entY + entAlt * 0.05, entLarg * 0.8, entAlt * 0.42);
            ctx.fillRect(entX + entLarg * 0.1, entY + entAlt * 0.53, entLarg * 0.8, entAlt * 0.42);

            // Moldura da porta
            ctx.strokeStyle = '#1a0d00';
            ctx.lineWidth   = 3;
            ctx.strokeRect(entX, entY, entLarg, entAlt);

            // Arco por cima da porta
            ctx.beginPath();
            ctx.arc(entX + entLarg / 2, entY, entLarg / 2, Math.PI, 0);
            ctx.fillStyle = '#3B1F0A';
            ctx.fill();
            ctx.strokeStyle = '#1a0d00';
            ctx.lineWidth   = 2;
            ctx.stroke();

            // Puxador
            ctx.beginPath();
            ctx.arc(entX + entLarg * 0.65, entY + entAlt * 0.55, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#c8a800';
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    _adicionarEdificios(cena) {
        const edificios = [
            // Edificio Objetivo
            { x: -13, z: 5, l: 18, a: 20, p: 14, comEntrada: true, rotacao: 0 },

            // Edifício no meio da área esquerda
            { x: -13, z: 36.8, l: 30, a: 20, p: 14, comEntrada: true, rotacao: Math.PI },
        ];

        edificios.forEach(({ x, z, l, a, p, comEntrada, rotacao }) => {
            // Face da frente com entrada, restantes sem
            const texFrenteEntrada = this._criarTexturaEdificio(l, a, comEntrada);
            const texFachada       = this._criarTexturaEdificio(l, a, false);

            const matFrente = new THREE.MeshStandardMaterial({
                map:       texFrenteEntrada,
                roughness: 0.8,
                metalness: 0.1,
            });
            const matFachada = new THREE.MeshStandardMaterial({
                map:       texFachada,
                roughness: 0.8,
                metalness: 0.1,
            });
            const matTopo = new THREE.MeshStandardMaterial({
                color:     0x777777,
                roughness: 0.9,
                metalness: 0.05,
            });

            // [direita, esquerda, topo, base, frente, trás]
            const materiais = [
                matFachada, // direita
                matFachada, // esquerda
                matTopo,    // topo
                matTopo,    // base
                matFrente,  // frente (com entrada)
                matFachada, // trás
            ];

            const geo  = new THREE.BoxGeometry(l, a, p);
            const mesh = new THREE.Mesh(geo, materiais);
            mesh.position.set(x, a / 2, z);
            mesh.rotation.y = rotacao;
            mesh.castShadow    = true;
            mesh.receiveShadow = true;
            cena.add(mesh); this.gc.registar(mesh);

            // Cornija no topo
            const matCornija = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
            const geoCornija = new THREE.BoxGeometry(l + 0.6, 0.4, p + 0.6);
            const cornija    = new THREE.Mesh(geoCornija, matCornija);
            cornija.position.set(x, a + 0.2, z);
            cornija.rotation.y = rotacao;
            cornija.castShadow = true;
            cena.add(cornija);

            // Rodapé/base do edifício
            const geoBase = new THREE.BoxGeometry(l + 0.4, 0.5, p + 0.4);
            const base    = new THREE.Mesh(geoBase, matCornija);
            base.position.set(x, 0.25, z);
            base.rotation.y = rotacao;
            base.castShadow    = true;
            base.receiveShadow = true;
            cena.add(base);
        });
    }

    _criarTexturaMadeira(l, a, p) {
        const W = 512, H = 512;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#7B4A2D';
        ctx.fillRect(0, 0, W, H);

        for (let y = 0; y < H; y++) {
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

        const numTábuas = 4;
        const altTábua  = H / numTábuas;
        ctx.strokeStyle = 'rgba(30,15,5,0.7)';
        ctx.lineWidth   = 3;
        for (let i = 1; i < numTábuas; i++) {
            const yLine = i * altTábua;
            ctx.beginPath(); ctx.moveTo(0, yLine); ctx.lineTo(W, yLine); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,200,140,0.15)';
            ctx.lineWidth   = 2;
            ctx.beginPath(); ctx.moveTo(0, yLine + 2); ctx.lineTo(W, yLine + 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(30,15,5,0.7)';
            ctx.lineWidth   = 3;
        }

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
        tex.repeat.set(l / 2, a / 2);
        return tex;
    }

    _criarNormalMap(l, a) {
        const W = 512, H = 512;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgb(128,128,255)';
        ctx.fillRect(0, 0, W, H);

        const numTábuas = 4;
        const altTábua  = H / numTábuas;
        for (let i = 0; i < numTábuas; i++) {
            const y0 = i * altTábua;
            ctx.fillStyle = 'rgb(128,200,255)';
            ctx.fillRect(0, y0, W, 4);
            ctx.fillStyle = 'rgb(128,50,255)';
            ctx.fillRect(0, y0 + altTábua - 4, W, 4);
        }

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
            color:     0x888888,
            metalness: 0.9,
            roughness: 0.3,
        });

        const esp     = 0.12;
        const tamanho = 0.5;

        const cantos = [
            [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
            [-1, -1,  1], [1, -1,  1], [-1, 1,  1], [1, 1,  1],
        ];

        cantos.forEach(([dx, dy, dz]) => {
            const cx = x + dx * (l / 2 - esp / 2);
            const cy =     dy * (a / 2 - esp / 2) + a / 2;
            const cz = z + dz * (p / 2 - esp / 2);

            const geoH  = new THREE.BoxGeometry(tamanho, esp, esp);
            const meshH = new THREE.Mesh(geoH, matMetal);
            meshH.position.set(cx, cy, z + dz * p / 2);
            meshH.castShadow = true;
            cena.add(meshH);

            const geoV  = new THREE.BoxGeometry(esp, esp, tamanho);
            const meshV = new THREE.Mesh(geoV, matMetal);
            meshV.position.set(x + dx * l / 2, cy, cz);
            meshV.castShadow = true;
            cena.add(meshV);

            const geoP  = new THREE.BoxGeometry(esp, tamanho, esp);
            const meshP = new THREE.Mesh(geoP, matMetal);
            meshP.position.set(x + dx * l / 2, cy, z + dz * p / 2);
            meshP.castShadow = true;
            cena.add(meshP);
        });
    }

    _adicionarCintas(cena, x, z, l, a, p) {
        const matCinta = new THREE.MeshStandardMaterial({
            color:     0x777777,
            metalness: 0.85,
            roughness: 0.25,
        });

        [1/3, 2/3].forEach(frac => {
            const y = frac * a;

            [-1, 1].forEach(dz => {
                const geo  = new THREE.BoxGeometry(l + 0.02, 0.12, 0.06);
                const mesh = new THREE.Mesh(geo, matCinta);
                mesh.position.set(x, y, z + dz * (p / 2 + 0.03));
                mesh.castShadow = true;
                cena.add(mesh);
            });

            [-1, 1].forEach(dx => {
                const geo  = new THREE.BoxGeometry(0.06, 0.12, p + 0.02);
                const mesh = new THREE.Mesh(geo, matCinta);
                mesh.position.set(x + dx * (l / 2 + 0.03), y, z);
                mesh.castShadow = true;
                cena.add(mesh);
            });
        });
    }

    _adicionarCaixas(cena) {
        const caixas = [
            //Caixas da zona 1
            { x: 33, z: 20,     l: 4, a: 2, p: 2.5 },
            { x: 33, z: 26,     l: 4, a: 2, p: 2.5 },
            { x: 33, z: 32,     l: 4, a: 2, p: 2.5 },
            { x: 33, z: 38,     l: 4, a: 2, p: 2.5 },
            { x: 43, z: 20,     l: 4, a: 2, p: 2.5 },
            { x: 43, z: 26,     l: 4, a: 2, p: 2.5 },
            { x: 43, z: 32,     l: 4, a: 2, p: 2.5 },
            { x: 43, z: 38,     l: 4, a: 2, p: 2.5 },
            //Caixas da zona 2
            { x: 3.2, z: 37,     l: 2, a: 3, p: 2 },//caixa do lado direito do prédio da zona 2
            { x: -13, z: 45,     l: 2, a: 3, p: 2 },//caixa do lado a trás do prédio da zona 2
            { x: -29.2, z: 37,     l: 2, a: 3, p: 2 },//caixa do lado esquerdo do prédio da zona 2
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
                color:       0xffffff,
            });

            const geo  = new THREE.BoxGeometry(l, a, p);
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(x, a / 2, z);
            mesh.castShadow    = true;
            mesh.receiveShadow = true;
            cena.add(mesh); this.gc.registar(mesh);

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
        const skybox = new THREE.Mesh(new THREE.BoxGeometry(1000, 1000, 1000), materiais);
        cena.add(skybox);
        return skybox;
    }

    _adicionarHalfWall(cena) {
    const alturaHW  = 2.0;   // meia parede ~1m de altura
    const espessura = 0.15;
    const comprimento = 9;

    const matHW = new THREE.MeshStandardMaterial({
        color:     0xd0ccc8,
        roughness: 0.85,
        metalness: 0.05,
    });

    // Corpo principal da half wall
    const geo  = new THREE.BoxGeometry(comprimento, alturaHW, espessura);
    const mesh = new THREE.Mesh(geo, matHW);

    // Lado esquerdo da cabine: x=12, L=3 → borda esquerda em x=10.5
    // A wall estende-se mais para a esquerda, centrada em x = 10.5 - comprimento/2
    mesh.position.set(
        -8 - comprimento / 2,   // x: centrado na extensão à esquerda
        alturaHW / 2,              // y: assente no chão
        18                       // z: alinhado com o centro da cabine
    );
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    cena.add(mesh); this.gc.registar(mesh);

    // Tampa no topo (acabamento)
    const matTampa = new THREE.MeshStandardMaterial({
        color:     0xb8b4b0,
        roughness: 0.6,
        metalness: 0.1,
    });
    const geoTampa  = new THREE.BoxGeometry(comprimento + 0.1, 0.08, espessura + 0.1);
    const tampa     = new THREE.Mesh(geoTampa, matTampa);
    tampa.position.set(
        10.5 - comprimento / 2,
        alturaHW + 0.04,
        15.7
    );
    tampa.castShadow = true;
    cena.add(tampa);
    }

    _criarTexturaContentor(cor = '#4a7c59') {
    const W = 512, H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Base metálica com cor sólida
    ctx.fillStyle = cor;
    ctx.fillRect(0, 0, W, H);

    // Variação subtil de luminosidade vertical (painéis ondulados)
    for (let x = 0; x < W; x += 16) {
        const shade = Math.sin(x * 0.05) * 15;
        const r = parseInt(cor.slice(1,3), 16) + shade;
        const g = parseInt(cor.slice(3,5), 16) + shade;
        const b = parseInt(cor.slice(5,7), 16) + shade;
        ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
        ctx.fillRect(x, 0, 16, H);
    }

    // Nervuras verticais (corrugado metálico)
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 8; x < W; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Linhas horizontais de reforço
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3;
    [0.05, 0.5, 0.95].forEach(frac => {
        const y = frac * H;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    });

    // Riscos e desgaste
    for (let i = 0; i < 12; i++) {
        const sx = Math.random() * W;
        const sy = Math.random() * H;
        const ex = sx + (Math.random() - 0.5) * 60;
        const ey = sy + (Math.random() - 0.5) * 20;
        ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.15})`;
        ctx.lineWidth = 0.5 + Math.random();
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    }

    // Manchas de ferrugem
    for (let i = 0; i < 6; i++) {
        const cx = Math.random() * W;
        const cy = Math.random() * H;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 + Math.random() * 14);
        grad.addColorStop(0,   'rgba(120,60,10,0.45)');
        grad.addColorStop(0.5, 'rgba(100,45,5,0.2)');
        grad.addColorStop(1,   'rgba(80,35,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 18 + Math.random()*10, 10 + Math.random()*8, Math.random()*Math.PI, 0, Math.PI*2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
    }
    _adicionarContentores(cena) {
    const contentores = [
        { x: 20, z: 28, l: 6, a: 2.6, p: 3, cor: '#4a7c59' }, // verde militar
        { x: 20, z: 38, l: 6, a: 2.6, p: 3, cor: '#7a6a52' }, // bege/cáqui
    ];

    contentores.forEach(({ x, z, l, a, p, cor }) => {
        const texMetal = this._criarTexturaContentor(cor);

        const matLateral = new THREE.MeshStandardMaterial({
            map:       texMetal,
            roughness: 0.55,
            metalness: 0.6,
        });
        const matTopo = new THREE.MeshStandardMaterial({
            color:     0x333333,
            roughness: 0.6,
            metalness: 0.7,
        });

        // [direita, esquerda, topo, base, frente, trás]
        const materiais = [
            matLateral, matLateral,
            matTopo,    matTopo,
            matLateral, matLateral,
        ];

        const geo  = new THREE.BoxGeometry(l, a, p);
        const mesh = new THREE.Mesh(geo, materiais);
        mesh.position.set(x, a / 2, z);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        cena.add(mesh); this.gc.registar(mesh);

        // Reforços metálicos nas arestas (cantoneiras)
        const matAco = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });
        const cantos = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
        cantos.forEach(([dx, dy, dz]) => {
            const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), matAco);
            c.position.set(x + dx * l/2, dy * a/2 + a/2, z + dz * p/2);
            c.castShadow = true;
            cena.add(c);
        });

        // Faixas de reforço horizontais
        const matFaixa = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.85, roughness: 0.25 });
        [-1, 1].forEach(dz => {
            const faixa = new THREE.Mesh(new THREE.BoxGeometry(l + 0.02, 0.1, 0.06), matFaixa);
            faixa.position.set(x, a * 0.5 + a/2 * 0 , z + dz * (p/2 + 0.03));
            // topo e base
            [0.08, 0.92].forEach(frac => {
                const f = new THREE.Mesh(new THREE.BoxGeometry(l + 0.02, 0.1, 0.06), matFaixa);
                f.position.set(x, frac * a, z + dz * (p / 2 + 0.03));
                f.castShadow = true;
                cena.add(f);
            });
        });
    });
    }
}

class Cabine {
    constructor(cena, x, z, rotacao = 0) {
        this.x = x;
        this.z = z;
        this.rotacao = rotacao;
        this.grupo = new THREE.Group();

        this._construir();

        this.grupo.position.set(x, 0, z);
        this.grupo.rotation.y = rotacao;
        cena.add(this.grupo);
    }

    _matBranco() {
        return new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6, metalness: 0.05 });
    }
    _matEscuro() {
        return new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.3 });
    }
    _matVidro() {
        return new THREE.MeshStandardMaterial({
            color: 0x334455, transparent: true, opacity: 0.55,
            roughness: 0.05, metalness: 0.1
        });
    }

    _construir() {
        const L = 3.0, A = 3.2, P = 3.0; // ← altura aumentada para 3.2
        const esp = 0.12;

        // ── Chão interno ──
        const chao = new THREE.Mesh(
            new THREE.BoxGeometry(L, 0.08, P),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 })
        );
        chao.position.set(0, 0.04, 0);
        chao.receiveShadow = true;
        this.grupo.add(chao);

        // ── Parede traseira (sólida, branca) ──
        const pTras = new THREE.Mesh(
            new THREE.BoxGeometry(L, A, esp),
            this._matBranco()
        );
        pTras.position.set(0, A / 2, -P / 2 + esp / 2);
        pTras.castShadow = true;
        this.grupo.add(pTras);

        // ── Parede lateral esquerda (sólida, branca) ──
        const pEsq = new THREE.Mesh(
            new THREE.BoxGeometry(esp, A, P),
            this._matBranco()
        );
        pEsq.position.set(-L / 2 + esp / 2, A / 2, 0);
        pEsq.castShadow = true;
        this.grupo.add(pEsq);

        // ── Parede lateral direita — painel branco inferior + vidro superior ──
        // Painel branco no terço inferior
        const painelBrancoDir = new THREE.Mesh(
            new THREE.BoxGeometry(esp, A * 0.45, P),
            this._matBranco()
        );
        painelBrancoDir.position.set(L / 2 - esp / 2, A * 0.45 / 2, 0);
        this.grupo.add(painelBrancoDir);

        // Montante escuro no topo
        const mTopoDir = new THREE.Mesh(
            new THREE.BoxGeometry(esp, 0.2, P),
            this._matEscuro()
        );
        mTopoDir.position.set(L / 2 - esp / 2, A - 0.1, 0);
        this.grupo.add(mTopoDir);

        // Vidro lateral direita (parte superior)
        const vidDta = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, A * 0.55 - 0.2, P - 0.1),
            this._matVidro()
        );
        vidDta.position.set(L / 2 - esp / 2, A * 0.45 + (A * 0.55 - 0.2) / 2, 0);
        this.grupo.add(vidDta);

        // ── Parede frontal — aberta no centro (vão da porta), branco nos lados ──

        // Montante escuro superior (cobre toda a largura)
        const mSupFrente = new THREE.Mesh(
            new THREE.BoxGeometry(L, 0.2, esp),
            this._matEscuro()
        );
        mSupFrente.position.set(0, A - 0.1, P / 2 - esp / 2);
        this.grupo.add(mSupFrente);

        // Painel branco inferior esquerdo (junto ao canto)
        const painelFEsqInf = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, A * 0.45, esp),
            this._matBranco()
        );
        painelFEsqInf.position.set(-L / 2 + 0.25, A * 0.45 / 2, P / 2 - esp / 2);
        this.grupo.add(painelFEsqInf);

        // Painel branco inferior direito (junto ao canto)
        const painelFDtaInf = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, A * 0.45, esp),
            this._matBranco()
        );
        painelFDtaInf.position.set(L / 2 - 0.25, A * 0.45 / 2, P / 2 - esp / 2);
        this.grupo.add(painelFDtaInf);

        // Montante vertical esquerdo (escuro, fino)
        const mVEsq = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, A - 0.2, esp),
            this._matEscuro()
        );
        mVEsq.position.set(-L / 2 + 0.5 + 0.04, A / 2 - 0.1, P / 2 - esp / 2);
        this.grupo.add(mVEsq);

        // Montante vertical direito (escuro, fino)
        const mVDta = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, A - 0.2, esp),
            this._matEscuro()
        );
        mVDta.position.set(L / 2 - 0.5 - 0.04, A / 2 - 0.1, P / 2 - esp / 2);
        this.grupo.add(mVDta);

        // ── Teto principal ──
        const teto = new THREE.Mesh(
            new THREE.BoxGeometry(L, 0.12, P),
            this._matBranco()
        );
        teto.position.set(0, A, 0);
        teto.castShadow = true;
        this.grupo.add(teto);

        // ── Beirado saliente (escuro) ──
        const beirado = new THREE.Mesh(
            new THREE.BoxGeometry(L + 0.5, 0.1, P + 0.5),
            this._matEscuro()
        );
        beirado.position.set(0, A + 0.07, 0);
        beirado.castShadow = true;
        this.grupo.add(beirado);

        // ── Colunas de canto (perfis escuros) ──
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dz]) => {
            const col = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, A, 0.1),
                this._matEscuro()
            );
            col.position.set(dx * (L / 2 - 0.05), A / 2, dz * (P / 2 - 0.05));
            col.castShadow = true;
            this.grupo.add(col);
        });

        // ── Ponto de referência para o NPC ──
        //this.posicaoNPC = new THREE.Vector3(x, 0.5, z + P / 2 + 0.6);
        //this.direcaoNPC = new THREE.Vector3(0, 0, 1);
    }
}


// ─────────────────────────────────────────────
// Jogo (ponto de entrada)
// ─────────────────────────────────────────────
class Jogo {
    constructor() {
        this.cena      = new THREE.Scene();
        this.renderer  = this._criarRenderer();
       this.gestorColisoes   = new GestorColisoes();               // ← criar primeiro
        this.cenario          = new Cenario(this.cena, this.gestorColisoes); // ← passar
        this.jogador          = new Jogador(this.cena, this.gestorColisoes); // ← passar
        this.cameraManager = new CameraManager(this.renderer);

        // Colisão manual para a cabine
        this.gestorColisoes.registarBox(
            new THREE.Vector3(10.5, 0, 14.2),
            new THREE.Vector3(13.5, 3.2, 17.2)
        );

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
        // Fazer a skybox seguir a câmara
        this.cenario.skybox.position.copy(this.cameraManager.camara.position);
        this.renderer.render(this.cena, this.cameraManager.camara);
        requestAnimationFrame(this._loop.bind(this));
    }
}

// ─────────────────────────────────────────────
// Iniciar
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => new Jogo());