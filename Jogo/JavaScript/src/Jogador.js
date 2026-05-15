import * as THREE from 'three';

export class Jogador {
    constructor(cena, gestorColisoes) {
        this.grupo = new THREE.Group();
        this.grupo.position.set(49, 0, 49);

        // Partes animáveis
        this.partes = {};
        this._tempoAndar = 0;
        this._emMovimento = false;

        this._construir();
        cena.add(this.grupo);

        this.ultimaDirecao = new THREE.Vector3(0, 0, 1);
        this.gestorColisoes = gestorColisoes;
        this.mesh = this.grupo;
    }

    // ── Materiais ──────────────────────────────────────────
    _matPele()    { return new THREE.MeshStandardMaterial({ color: 0xdca880, roughness: 0.8 }); }
    _matFato()    { return new THREE.MeshStandardMaterial({ color: 0x1a1f1a, roughness: 0.75, metalness: 0.05 }); }
    _matBandana() { return new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.9 }); }
    _matEquip()   { return new THREE.MeshStandardMaterial({ color: 0x2a2f2a, roughness: 0.6, metalness: 0.3 }); }
    _matMetal()   { return new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2, metalness: 0.9 }); }
    _matOlho()    { return new THREE.MeshStandardMaterial({ color: 0x3a5c5c, roughness: 0.3 }); }
    _matCabelo()  { return new THREE.MeshStandardMaterial({ color: 0x4a321f, roughness: 0.8 }); }
    _matSola()    { return new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.95 }); }

    _criarTexturaCamuflagem() {
        const W = 256, H = 256;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1f1a';
        ctx.fillRect(0, 0, W, H);
        const cores = ['rgba(12,16,12,0.9)', 'rgba(28,36,24,0.85)', 'rgba(35,42,30,0.75)'];
        for (let i = 0; i < 90; i++) {
            const cx = Math.random() * W;
            const cy = Math.random() * H;
            const rx = 10 + Math.random() * 38;
            const ry = 6  + Math.random() * 22;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.random() * Math.PI);
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = cores[Math.floor(Math.random() * cores.length)];
            ctx.fill();
            ctx.restore();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 3);
        return tex;
    }

    _criarCapsule(radius, length, radialSegments = 8) {
        const points = [];
        for (let i = 0; i <= 8; i++) {
            const angle = (i / 8) * Math.PI / 2;
            points.push(new THREE.Vector2(Math.sin(angle) * radius, length / 2 + Math.cos(angle) * radius));
        }
        for (let i = 0; i <= 4; i++) {
            points.push(new THREE.Vector2(radius, length / 2 - (i / 4) * length));
        }
        for (let i = 8; i >= 0; i--) {
            const angle = (i / 8) * Math.PI / 2;
            points.push(new THREE.Vector2(Math.sin(angle) * radius, -length / 2 - Math.cos(angle) * radius));
        }
        return new THREE.LatheGeometry(points, radialSegments);
    }

    // ── Construção ─────────────────────────────────────────
    _construir() {
        this._construirBotas();
        this._construirPernas();
        this._construirTorso();
        this._construirBracos();
        this._construirPescoco();
        this._construirCabeca();
        this._construirCabelo();
        this._construirBandana();
        this._construirEquipamento();
    }

    // Cria um Group pivot centrado numa posição world,
    // com a origem no TOPO do segmento (para rotação natural da articulação)
    _criarPivot(x, y, z) {
        const pivot = new THREE.Group();
        pivot.position.set(x, y, z);
        this.grupo.add(pivot);
        return pivot;
    }

    _construirBotas() {
        const matB = this._matFato();
        const matS = this._matSola();

        [['Esq', -0.12], ['Dir', 0.12]].forEach(([lado, dx]) => {
            // As botas são filhas dos pivots das pernas (construídos depois)
            // guardamos posição para as adicionar ao pivot correto depois
            this[`_botaData${lado}`] = { dx, matB, matS };
        });
    }

    _construirPernas() {
        const matC = new THREE.MeshStandardMaterial({
            map: this._criarTexturaCamuflagem(), roughness: 0.8
        });

        [['Esq', -0.12], ['Dir', 0.12]].forEach(([lado, dx]) => {
            // ── Pivot da coxa (articulação da anca) ──
            // Fica no topo da coxa (y = 0.91 = base do torso)
            const pivotCoxa = new THREE.Group();
            pivotCoxa.position.set(dx, 0.91, 0);
            this.grupo.add(pivotCoxa);
            this.partes[`pivotCoxa${lado}`] = pivotCoxa;

            // Coxa — pende para baixo a partir do pivot
            const coxa = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.085, 0.42, 10), matC
            );
            coxa.position.set(0, -0.21, 0); // centro a -0.21 do pivot
            pivotCoxa.add(coxa);

            // ── Pivot do joelho (articulação do joelho) ──
            // Fica no fundo da coxa, em coordenadas locais do pivotCoxa
            const pivotJoelho = new THREE.Group();
            pivotJoelho.position.set(0, -0.42, 0); // fundo da coxa
            pivotCoxa.add(pivotJoelho);
            this.partes[`pivotJoelho${lado}`] = pivotJoelho;

            // Canela
            const canela = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.075, 0.32, 10), matC
            );
            canela.position.set(0, -0.16, 0);
            pivotJoelho.add(canela);

            // ── Bota (filha do pivot do joelho) ──
            const { matB, matS } = this[`_botaData${lado}`];

            const cano = new THREE.Mesh(
                new THREE.CylinderGeometry(0.075, 0.065, 0.22, 10), matB
            );
            cano.position.set(0, -0.36, 0);
            pivotJoelho.add(cano);

            const biq = new THREE.Mesh(
                new THREE.BoxGeometry(0.13, 0.09, 0.22), matB
            );
            biq.position.set(0, -0.50, 0.04);
            pivotJoelho.add(biq);

            const sola = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.03, 0.24), matS
            );
            sola.position.set(0, -0.545, 0.04);
            pivotJoelho.add(sola);
        });
    }

    _construirTorso() {
        const matC = new THREE.MeshStandardMaterial({
            map: this._criarTexturaCamuflagem(), roughness: 0.8
        });
        const matEq = this._matEquip();

        // Pivot do torso (para balanço leve ao andar)
        const pivotTorso = new THREE.Group();
        pivotTorso.position.set(0, 0.91, 0);
        this.grupo.add(pivotTorso);
        this.partes.pivotTorso = pivotTorso;

        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.50, 0.52, 0.26), matC
        );
        torso.position.set(0, 0.26, 0);
        pivotTorso.add(torso);

        const peito = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 0.22, 8), matC
        );
        peito.rotation.z = Math.PI / 2;
        peito.position.set(0, 0.35, 0.14);
        pivotTorso.add(peito);

        const cintura = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.24, 0.18, 12), matC
        );
        cintura.position.set(0, -0.03, 0);
        pivotTorso.add(cintura);

        const cinto = new THREE.Mesh(
            new THREE.CylinderGeometry(0.20, 0.20, 0.06, 14), matEq
        );
        cinto.position.set(0, -0.04, 0);
        pivotTorso.add(cinto);

        // Mochila (filha do torso)
        const mochila = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.35, 0.10), matEq
        );
        mochila.position.set(0, 0.28, -0.18);
        pivotTorso.add(mochila);
    }

    _construirBracos() {
        const matC = new THREE.MeshStandardMaterial({
            map: this._criarTexturaCamuflagem(), roughness: 0.8
        });
        const matP = this._matPele();
        const matEq = this._matEquip();

        [['Esq', -0.28], ['Dir', 0.28]].forEach(([lado, dx]) => {
            // O pivot do ombro é filho do pivotTorso
            const pivotOmbro = new THREE.Group();
            pivotOmbro.position.set(dx, 0.47, 0); // relativo ao pivotTorso
            this.partes.pivotTorso.add(pivotOmbro);
            this.partes[`pivotOmbro${lado}`] = pivotOmbro;

            // Ombro (esfera)
            const om = new THREE.Mesh(
                new THREE.SphereGeometry(0.09, 10, 8), matC
            );
            om.position.set(0, 0, 0);
            pivotOmbro.add(om);

            // Braço superior
            const bSup = new THREE.Mesh(
                new THREE.CylinderGeometry(0.07, 0.06, 0.34, 10), matC
            );
            bSup.position.set(0, -0.17, 0);
            pivotOmbro.add(bSup);

            // ── Pivot do cotovelo ──
            const pivotCotovelo = new THREE.Group();
            pivotCotovelo.position.set(0, -0.34, 0);
            pivotOmbro.add(pivotCotovelo);
            this.partes[`pivotCotovelo${lado}`] = pivotCotovelo;

            // Antebraço
            const aB = new THREE.Mesh(
                new THREE.CylinderGeometry(0.055, 0.05, 0.30, 10), matC
            );
            aB.position.set(0, -0.15, 0);
            pivotCotovelo.add(aB);

            // Mão
            const mao = new THREE.Mesh(
                new THREE.BoxGeometry(0.07, 0.10, 0.05), matP
            );
            mao.position.set(0, -0.32, 0.01);
            pivotCotovelo.add(mao);

            // Braçadeira táctica
            const brac = new THREE.Mesh(
                new THREE.CylinderGeometry(0.058, 0.058, 0.08, 10), matEq
            );
            brac.position.set(0, -0.18, 0);
            pivotCotovelo.add(brac);
        });
    }

    _construirPescoco() {
        const mat = this._matPele();
        const pes = new THREE.Mesh(
            new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), mat
        );
        // Filho do pivotTorso
        pes.position.set(0, 0.62, 0);
        this.partes.pivotTorso.add(pes);
    }

    _construirCabeca() {
        const matP = this._matPele();

        // Pivot da cabeça (filho do pivotTorso, para balanço sutil)
        const pivotCabeca = new THREE.Group();
        pivotCabeca.position.set(0, 0.68, 0);
        this.partes.pivotTorso.add(pivotCabeca);
        this.partes.pivotCabeca = pivotCabeca;

        const cab = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 16, 14), matP
        );
        cab.scale.set(1.0, 1.15, 0.95);
        cab.position.set(0, 0.18, 0);
        pivotCabeca.add(cab);

        const queixo = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8), matP
        );
        queixo.scale.set(1.1, 0.6, 0.8);
        queixo.position.set(0, 0.08, 0.06);
        pivotCabeca.add(queixo);

        const matOlho = this._matOlho();
        [[-0.07, 0], [0.07, 0]].forEach(([dx]) => {
            const olho = new THREE.Mesh(
                new THREE.SphereGeometry(0.035, 8, 8), matOlho
            );
            olho.position.set(dx, 0.20, 0.15);
            pivotCabeca.add(olho);

            const pestanas = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.01, 0.03), this._matCabelo()
            );
            pestanas.position.set(dx, 0.23, 0.16);
            pivotCabeca.add(pestanas);
        });
    }

    _construirCabelo() {
        const mat = this._matCabelo();
        const pc  = this.partes.pivotCabeca;

        const base = new THREE.Mesh(
            new THREE.SphereGeometry(0.195, 12, 12), mat
        );
        base.scale.set(1.05, 1.0, 1.1);
        base.position.set(0, 0.21, -0.02);
        pc.add(base);

        const rabo = new THREE.Mesh(this._criarCapsule(0.05, 0.4, 6), mat);
        rabo.position.set(0, 0.10, -0.22);
        rabo.rotation.x = -0.4;
        pc.add(rabo);

        [[-0.18, 0], [0.18, 0]].forEach(([dx]) => {
            const m = new THREE.Mesh(this._criarCapsule(0.04, 0.15, 6), mat);
            m.position.set(dx, 0.11, 0.08);
            pc.add(m);
        });
    }

    _construirBandana() {
        const mat = this._matBandana();
        const faixa = new THREE.Mesh(
            new THREE.CylinderGeometry(0.19, 0.19, 0.05, 16, 1, true), mat
        );
        faixa.position.set(0, 0.25, 0);
        this.partes.pivotCabeca.add(faixa);
    }

    _construirEquipamento() {
        const matEq = this._matEquip();

        [['Esq', -0.12], ['Dir', 0.12]].forEach(([lado, dx]) => {
            // Joelheiras — filhas dos pivots do joelho
            const joe = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8), matEq
            );
            joe.scale.set(1, 1.2, 0.6);
            joe.position.set(0, -0.04, 0.06);
            this.partes[`pivotJoelho${lado}`].add(joe);
        });
    }

    // ── Animação ───────────────────────────────────────────
    // Chamado a cada frame pelo loop principal
    atualizar(emMovimento) {
        this._emMovimento = emMovimento;
        const vel   = 8.0;   // velocidade do ciclo
        const dt    = 0.016; // ~60fps

        if (emMovimento) {
            this._tempoAndar += dt * vel;
        } else {
            // Retorno suave à pose de repouso
            this._tempoAndar *= 0.85;
            if (Math.abs(this._tempoAndar) < 0.001) this._tempoAndar = 0;
        }

        const t = this._tempoAndar;
        const s = Math.sin(t);
        const c = Math.cos(t);

        // ── Pernas ────────────────────────────────────────
        // Amplitude da coxa
        const ampCoxa   = 0.52;
        // Amplitude do joelho (sempre dobra para a frente, nunca para trás)
        const ampJoelho = 0.38;

        const pCoxaEsq = this.partes.pivotCoxaEsq;
        const pCoxaDir = this.partes.pivotCoxaDir;
        const pJoelhoEsq = this.partes.pivotJoelhoEsq;
        const pJoelhoDir = this.partes.pivotJoelhoDir;

        if (pCoxaEsq && pCoxaDir) {
            pCoxaEsq.rotation.x = emMovimento ? s * ampCoxa : 0;
            pCoxaDir.rotation.x = emMovimento ? -s * ampCoxa : 0;
        }

        if (pJoelhoEsq && pJoelhoDir) {
            // O joelho dobra sempre para a frente (valor sempre >= 0)
            // Usa (1 - cos) para obter impulso na fase de elevação
            pJoelhoEsq.rotation.x = emMovimento ? Math.max(0, -c * ampJoelho) + 0.08 : 0;
            pJoelhoDir.rotation.x = emMovimento ? Math.max(0,  c * ampJoelho) + 0.08 : 0;
        }

        // ── Braços ────────────────────────────────────────
        // Braços balançam em oposição às pernas (natural)
        const ampOmbro    = 0.38;
        const ampCotovelo = 0.22;

        const pOmbroEsq = this.partes.pivotOmbroEsq;
        const pOmbroDir = this.partes.pivotOmbroDir;
        const pCotEsq   = this.partes.pivotCotoveloEsq;
        const pCotDir   = this.partes.pivotCotoveloDir;

        if (pOmbroEsq && pOmbroDir) {
            // Oposição às pernas
            pOmbroEsq.rotation.x = emMovimento ? -s * ampOmbro : 0;
            pOmbroDir.rotation.x = emMovimento ? s * ampOmbro : 0;
            // Leve balanço lateral
            pOmbroEsq.rotation.z = emMovimento ? Math.abs(c) * 0.06 : 0;
            pOmbroDir.rotation.z = emMovimento ? -Math.abs(c) * 0.06 : 0;
        }

        if (pCotEsq && pCotDir) {
            // Cotovelo dobra ligeiramente durante o balanço
            pCotEsq.rotation.x = emMovimento ? Math.max(0, Math.sin(t + 0.5) * ampCotovelo) : 0;
            pCotDir.rotation.x = emMovimento ? Math.max(0, Math.sin(t - 0.5) * ampCotovelo) : 0;
        }

        // ── Torso ─────────────────────────────────────────
        // Rotação leve do torso em oposição às ancas
        const pTorso = this.partes.pivotTorso;
        if (pTorso) {
            pTorso.rotation.y = emMovimento ? s * 0.08 : 0;
            // Leve balanço vertical (bounce)
            pTorso.position.y = emMovimento ? 0.91 + Math.abs(s) * 0.018 : 0.91;
        }

        // ── Cabeça ────────────────────────────────────────
        // Cabeça compensa a rotação do torso (mantém-se estável)
        const pCabeca = this.partes.pivotCabeca;
        if (pCabeca) {
            pCabeca.rotation.y = emMovimento ? -s * 0.04 : 0;
            // Leve bob vertical
            pCabeca.position.y = emMovimento ? 0.68 + Math.abs(s) * 0.012 : 0.68;
        }
    }

    // ── Colisões ───────────────────────────────────────────
    _boxNaPosicao(posicao) {
        const raio = 0.45;
        return new THREE.Box3(
            new THREE.Vector3(posicao.x - raio, posicao.y - 0.5, posicao.z - raio),
            new THREE.Vector3(posicao.x + raio, posicao.y + 0.5, posicao.z + raio)
        );
    }

    mover(cameraAngle, teclas) {
        const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
        const right   = new THREE.Vector3(-Math.cos(cameraAngle), 0,  Math.sin(cameraAngle));
        const velocidade = 0.15;

        let delta = new THREE.Vector3();
        teclas.forEach(tecla => {
            if (tecla === 87) delta.add(forward);
            if (tecla === 83) delta.sub(forward);
            if (tecla === 65) delta.add(right);
            if (tecla === 68) delta.sub(right);
        });

        if (delta.lengthSq() === 0) return;

        delta.normalize().multiplyScalar(velocidade);
        this.ultimaDirecao.copy(delta).normalize();

        const posAtual = this.grupo.position.clone();
        const posTotal = posAtual.clone().add(delta);
        if (!this.gestorColisoes.colide(this._boxNaPosicao(posTotal))) {
            this.grupo.position.copy(posTotal);
            return;
        }

        const posSoX = posAtual.clone().add(new THREE.Vector3(delta.x, 0, 0));
        if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoX))) {
            this.grupo.position.copy(posSoX);
            return;
        }

        const posSoZ = posAtual.clone().add(new THREE.Vector3(0, 0, delta.z));
        if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoZ))) {
            this.grupo.position.copy(posSoZ);
            return;
        }

        const posParcial = posAtual.clone().add(delta.clone().multiplyScalar(0.5));
        if (!this.gestorColisoes.colide(this._boxNaPosicao(posParcial))) {
            this.grupo.position.copy(posParcial);
        }
    }

    orientarParaCamera(camara) {
        const alvo = this.grupo.position.clone().add(this.ultimaDirecao);
        this.grupo.lookAt(alvo);
    }

    get posicao() {
        return this.grupo.position;
    }
}