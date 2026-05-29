import * as THREE from 'three';

// ─────────────────────────────────────────────
// NPC — Guarda com patrulha e campo de visão
// ─────────────────────────────────────────────
export class NPC {
    constructor(cena, pontos, gestorColisoes) {
        this.grupo = new THREE.Group();
        this.partes = {};
        this._tempoAndar = 0;

        // Rota de patrulha
        this.pontos          = pontos.map(p => new THREE.Vector3(p.x, 0, p.z));
        this.indicePonto     = 0;
        this.velocidade      = 0.04;

        // Campo de visão
        this.anguloVisao     = Math.PI / 3;   // 60° de cada lado (120° total)
        this.distanciaVisao  = 13;
        this.jogadorDetectado = false;

        // Gestor de colisões
        this.gestorColisoes = gestorColisoes;

        // Estado
        this.estado = 'patrulha'; // 'patrulha' | 'alerta' | 'investigar' | 'estacionario'
        this._tempoAlerta    = 0;
        this._posUltimaVista = null;

        this.estacionario = this.pontos.length === 1;
        if (this.estacionario) {
            this.estado = 'estacionario';
            this._tempoOlhar = 0;
            this._direcaoOlhar = true;
        }

        this.boxColisao = new THREE.Box3();
        this._atualizarBoxColisao();

        this._somTocando = false;

        this._construir();
        cena.add(this.grupo);

        // Posiciona no primeiro ponto
        this.grupo.position.copy(this.pontos[0]);
            if (this.pontos.length > 1) {
                this.indicePonto = 1; // ← começa já a ir para o ponto 1
                this.grupo.lookAt(this.pontos[1]);
            }

        // Cone de visão (visual debug — pode remover se não quiseres ver)
        this._criarConeVisao(cena);
        this._criarSinalAlerta();

        // Som de alerta
        this.audioListener = new THREE.AudioListener();
        this.grupo.add(this.audioListener);
        this.somAlerta = new THREE.Audio(this.audioListener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('VideoAlerta.mp4', (buffer) => {
            this.somAlerta.setBuffer(buffer);
            this.somAlerta.setVolume(0.5);
        });
    }

    // ══════════════════════════════════════════
    // Materiais (igual ao Snake mas cor diferente
    // para distinguir — fato cinzento militar)
    // ══════════════════════════════════════════
    _matPele()    { return new THREE.MeshStandardMaterial({ color: 0xdca880, roughness: 0.8 }); }
    _matFato()    { return new THREE.MeshStandardMaterial({ color: 0x3a3f3a, roughness: 0.75, metalness: 0.05 }); }
    _matEquip()   { return new THREE.MeshStandardMaterial({ color: 0x2a2f2a, roughness: 0.6,  metalness: 0.3  }); }
    _matMetal()   { return new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2,  metalness: 0.9  }); }
    _matOlho()    { return new THREE.MeshStandardMaterial({ color: 0x3a5c5c, roughness: 0.3 }); }
    _matCabelo()  { return new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.9 }); }
    _matSola()    { return new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.95 }); }
    _matCapacete(){ return new THREE.MeshStandardMaterial({ color: 0x2a2f28, roughness: 0.6,  metalness: 0.2  }); }

    _criarTexturaCamuflagem() {
        if (!NPC._texturaCamuflagem) {
            const W = 256, H = 256;
            const canvas = document.createElement('canvas');
            canvas.width = W; canvas.height = H;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#3a3f3a';
            ctx.fillRect(0, 0, W, H);
            const cores = ['rgba(30,38,28,0.9)', 'rgba(50,58,44,0.85)', 'rgba(42,50,38,0.75)'];
            for (let i = 0; i < 90; i++) {
                ctx.save();
                ctx.translate(Math.random() * W, Math.random() * H);
                ctx.rotate(Math.random() * Math.PI);
                ctx.beginPath();
                ctx.ellipse(0, 0, 10 + Math.random() * 38, 6 + Math.random() * 22, 0, 0, Math.PI * 2);
                ctx.fillStyle = cores[Math.floor(Math.random() * cores.length)];
                ctx.fill();
                ctx.restore();
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(2, 3);
            NPC._texturaCamuflagem = tex;
        }
        return NPC._texturaCamuflagem;
    }

    // ══════════════════════════════════════════
    // Construção do modelo
    // ══════════════════════════════════════════
    _construir() {
        this._construirBotas();
        this._construirPernas();
        this._construirTorso();
        this._construirBracos();
        this._construirPescoco();
        this._construirCabeca();
        this._construirCapacete();
        this._construirEquipamento();
    }

    _construirBotas() {
        const matB = this._matFato();
        const matS = this._matSola();
        [['Esq', -0.12], ['Dir', 0.12]].forEach(([lado, dx]) => {
            this[`_botaData${lado}`] = { dx, matB, matS };
        });
    }

    _construirPernas() {
        const matC = new THREE.MeshStandardMaterial({
            map: this._criarTexturaCamuflagem(), roughness: 0.8
        });
        [['Esq', -0.12], ['Dir', 0.12]].forEach(([lado, dx]) => {
            const pivotCoxa = new THREE.Group();
            pivotCoxa.position.set(dx, 0.91, 0);
            this.grupo.add(pivotCoxa);
            this.partes[`pivotCoxa${lado}`] = pivotCoxa;

            const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.085, 0.42, 10), matC);
            coxa.position.set(0, -0.21, 0);
            pivotCoxa.add(coxa);

            const pivotJoelho = new THREE.Group();
            pivotJoelho.position.set(0, -0.42, 0);
            pivotCoxa.add(pivotJoelho);
            this.partes[`pivotJoelho${lado}`] = pivotJoelho;

            const canela = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.32, 10), matC);
            canela.position.set(0, -0.16, 0);
            pivotJoelho.add(canela);

            const { matB, matS } = this[`_botaData${lado}`];
            const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.22, 10), matB);
            cano.position.set(0, -0.36, 0);
            pivotJoelho.add(cano);

            const biq = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.22), matB);
            biq.position.set(0, -0.50, 0.04);
            pivotJoelho.add(biq);

            const sola = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.24), matS);
            sola.position.set(0, -0.545, 0.04);
            pivotJoelho.add(sola);
        });
    }

    _construirTorso() {
        const matC = new THREE.MeshStandardMaterial({
            map: this._criarTexturaCamuflagem(), roughness: 0.8
        });
        const matEq = this._matEquip();

        const pivotTorso = new THREE.Group();
        pivotTorso.position.set(0, 0.91, 0);
        this.grupo.add(pivotTorso);
        this.partes.pivotTorso = pivotTorso;

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.52, 0.26), matC);
        torso.position.set(0, 0.26, 0);
        pivotTorso.add(torso);

        const cintura = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.18, 12), matC);
        cintura.position.set(0, -0.03, 0);
        pivotTorso.add(cintura);

        const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.06, 14), matEq);
        cinto.position.set(0, -0.04, 0);
        pivotTorso.add(cinto);

        // Mochila
        const mochila = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.10), matEq);
        mochila.position.set(0, 0.28, -0.18);
        pivotTorso.add(mochila);

        // Placa táctica
        const placa = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.30, 0.04), matEq);
        placa.position.set(0, 0.28, 0.15);
        pivotTorso.add(placa);
    }

    _construirBracos() {
        const matC = new THREE.MeshStandardMaterial({
            map: this._criarTexturaCamuflagem(), roughness: 0.8
        });
        const matP  = this._matPele();
        const matEq = this._matEquip();

        [['Esq', -0.28], ['Dir', 0.28]].forEach(([lado, dx]) => {
            const pivotOmbro = new THREE.Group();
            pivotOmbro.position.set(dx, 0.47, 0);
            this.partes.pivotTorso.add(pivotOmbro);
            this.partes[`pivotOmbro${lado}`] = pivotOmbro;

            const om = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), matC);
            pivotOmbro.add(om);

            const bSup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.34, 10), matC);
            bSup.position.set(0, -0.17, 0);
            pivotOmbro.add(bSup);

            const pivotCotovelo = new THREE.Group();
            pivotCotovelo.position.set(0, -0.34, 0);
            pivotOmbro.add(pivotCotovelo);
            this.partes[`pivotCotovelo${lado}`] = pivotCotovelo;

            const aB = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.30, 10), matC);
            aB.position.set(0, -0.15, 0);
            pivotCotovelo.add(aB);

            const mao = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.05), matP);
            mao.position.set(0, -0.32, 0.01);
            pivotCotovelo.add(mao);

            // Arma no braço direito (rifle)
            if (lado === 'Dir') {
                const rifle = new THREE.Group();
                rifle.position.set(0, -0.30, 0.06);

                const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.35), matEq);
                corpo.position.set(0, 0, 0);
                rifle.add(corpo);

                const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), this._matMetal());
                cano.rotation.x = Math.PI / 2;
                cano.position.set(0, 0.015, 0.26);
                rifle.add(cano);

                const coronha = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.12), matEq);
                coronha.position.set(0, -0.02, -0.22);
                rifle.add(coronha);

                pivotCotovelo.add(rifle);
                this.partes.rifle = rifle;
            }
        });
    }

    _construirPescoco() {
        const mat = this._matPele();
        const pes = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), mat);
        pes.position.set(0, 0.62, 0);
        this.partes.pivotTorso.add(pes);
    }

    _construirCabeca() {
        const matP = this._matPele();

        const pivotCabeca = new THREE.Group();
        pivotCabeca.position.set(0, 0.68, 0);
        this.partes.pivotTorso.add(pivotCabeca);
        this.partes.pivotCabeca = pivotCabeca;

        const cab = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), matP);
        cab.scale.set(1.0, 1.15, 0.95);
        cab.position.set(0, 0.18, 0);
        pivotCabeca.add(cab);

        const queixo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matP);
        queixo.scale.set(1.1, 0.6, 0.8);
        queixo.position.set(0, 0.08, 0.06);
        pivotCabeca.add(queixo);

        const matOlho = this._matOlho();
        [[-0.07], [0.07]].forEach(([dx]) => {
            const olho = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 8), matOlho);
            olho.position.set(dx, 0.20, 0.15);
            pivotCabeca.add(olho);
        });
    }

    _construirCapacete() {
        const mat = this._matCapacete();
        const pc  = this.partes.pivotCabeca;

        // Corpo do capacete
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.205, 14, 10), mat);
        cap.scale.set(1.05, 0.85, 1.05);
        cap.position.set(0, 0.25, 0);
        pc.add(cap);

        // Aba frontal
        const aba = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.12), mat);
        aba.position.set(0, 0.175, 0.155);
        pc.add(aba);

        // Banda lateral (goggle mount)
        const matGoggle = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.5 });
        const goggle = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.04), matGoggle);
        goggle.position.set(0, 0.22, 0.16);
        pc.add(goggle);

        // Viseira (lente verde escura)
        const matViseira = new THREE.MeshStandardMaterial({
            color: 0x1a3320, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.3
        });
        const viseira = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.03), matViseira);
        viseira.position.set(0, 0.215, 0.175);
        pc.add(viseira);
    }

    _construirEquipamento() {
        const matEq = this._matEquip();
        [['Esq', -0.12], ['Dir', 0.12]].forEach(([lado]) => {
            const joe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matEq);
            joe.scale.set(1, 1.2, 0.6);
            joe.position.set(0, -0.04, 0.06);
            this.partes[`pivotJoelho${lado}`].add(joe);
        });
    }

    // ══════════════════════════════════════════
    // Cone de visão (helper visual)
    // ══════════════════════════════════════════
    _criarConeVisao(cena) {
        const geo = new THREE.ConeGeometry(
            Math.tan(this.anguloVisao) * this.distanciaVisao, // raio da base
            this.distanciaVisao,
            16,
            1,
            true  // aberto (wireframe só das faces)
        );

        // Cone aponta para +Z por defeito — vamos rodá-lo para a frente (+Z do NPC)
        const mat = new THREE.MeshBasicMaterial({
            color:       0xffff00,
            transparent: true,
            opacity:     0.08,
            side:        THREE.DoubleSide,
            depthWrite:  false,
        });

        this.coneVisao = new THREE.Mesh(geo, mat);
        // Roda 90° para que o cone aponte para a frente (+Z)
        this.coneVisao.rotation.x = -Math.PI / 2;
        // Desloca para que o vértice fique na cabeça do NPC
        this.coneVisao.position.set(0, 1.8, this.distanciaVisao / 2);
        this.coneVisao.visible = false;
        this.grupo.add(this.coneVisao);

        // Linha de contorno (wireframe) para ser mais visível
        const geoWire = new THREE.EdgesGeometry(geo);
        const matWire = new THREE.LineBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.25 });
        const wire = new THREE.LineSegments(geoWire, matWire);
        wire.rotation.x = -Math.PI / 2;
        wire.position.set(0, 1.8, this.distanciaVisao / 2);
        wire.visible = false;
        this.grupo.add(wire);

        // Guarda referências para mudar cor no alerta
        this._coneMatFill = mat;
        this._coneMatWire = matWire;
    }

    // ══════════════════════════════════════════
    // Animação de andar (igual ao Jogador)
    // ══════════════════════════════════════════
    _animar(emMovimento) {
        const vel = 7.0;
        const dt  = 0.016;

        if (emMovimento) {
            this._tempoAndar += dt * vel;
        } else {
            this._tempoAndar *= 0.55;
            if (Math.abs(this._tempoAndar) < 0.05) this._tempoAndar = 0;
        }

        const t = this._tempoAndar;
        const s = Math.sin(t);
        const c = Math.cos(t);

        const pCoxaEsq   = this.partes.pivotCoxaEsq;
        const pCoxaDir   = this.partes.pivotCoxaDir;
        const pJoelhoEsq = this.partes.pivotJoelhoEsq;
        const pJoelhoDir = this.partes.pivotJoelhoDir;

        if (pCoxaEsq && pCoxaDir) {
            pCoxaEsq.rotation.x =  s * 0.50;
            pCoxaDir.rotation.x = -s * 0.50;
        }
        if (pJoelhoEsq && pJoelhoDir) {
            pJoelhoEsq.rotation.x = Math.max(0, -c * 0.36) + (emMovimento ? 0.08 : 0);
            pJoelhoDir.rotation.x = Math.max(0,  c * 0.36) + (emMovimento ? 0.08 : 0);
        }

        const pOmbroEsq = this.partes.pivotOmbroEsq;
        const pOmbroDir = this.partes.pivotOmbroDir;
        const pCotEsq   = this.partes.pivotCotoveloEsq;
        const pCotDir   = this.partes.pivotCotoveloDir;

        if (pOmbroEsq && pOmbroDir) {
            pOmbroEsq.rotation.x = -s * 0.35;
            pOmbroDir.rotation.x =  s * 0.35;
        }
        if (pCotEsq && pCotDir) {
            pCotEsq.rotation.x = Math.max(0, Math.sin(t + 0.5) * 0.20);
            pCotDir.rotation.x = Math.max(0, Math.sin(t - 0.5) * 0.20);
        }

        const pTorso = this.partes.pivotTorso;
        if (pTorso) {
            pTorso.rotation.y = s * 0.07;
            pTorso.position.y = 0.91 + Math.abs(s) * 0.016;
        }
    }

    // ══════════════════════════════════════════
    // Deteção do jogador
    // ══════════════════════════════════════════
   _detectarJogador(posJogador, alturaCabecaJogador = 1.59) {
        const posNPC = this.grupo.position.clone();
        posNPC.y += 1.7;

        const posAlvo = posJogador.clone();
        posAlvo.y += alturaCabecaJogador;

        // ── 1. Distância ──
        const paraJogador = new THREE.Vector3().subVectors(posAlvo, posNPC);
        const distancia   = paraJogador.length();
        if (distancia > this.distanciaVisao) return false;

        // ── 2. Ângulo (campo de visão) ──
        const frente      = new THREE.Vector3(0, 0, 1).applyQuaternion(this.grupo.quaternion);
        const dirPlana    = new THREE.Vector3(paraJogador.x, 0, paraJogador.z).normalize();
        const frentePlana = new THREE.Vector3(frente.x, 0, frente.z).normalize();
        if (frentePlana.angleTo(dirPlana) > this.anguloVisao) return false;

        // ── 3. Linha de visão contra as Box3 diretamente ──
        // Faz amostragem ao longo do raio e verifica se algum ponto está dentro de um obstáculo
        const direcao = paraJogador.clone().normalize();
        const ray      = new THREE.Ray(posNPC, direcao);
        const hitPoint = new THREE.Vector3();

        for (const obstaculo of this.gestorColisoes.obstaculos) {
            if (ray.intersectBox(obstaculo, hitPoint)) {
                // Só bloqueia se o obstáculo estiver entre o NPC e o jogador
                if (posNPC.distanceTo(hitPoint) < distancia) return false;
            }
        }

        return true;
    }

    _criarSinalAlerta() {
    // Sprite "!" em canvas
    const canvas = document.createElement('canvas');
    canvas.width  = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Fundo amarelo arredondado
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.roundRect(4, 4, 56, 56, 10);
    ctx.fill();

    // Borda escura
    ctx.strokeStyle = '#222200';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, 56, 56, 10);
    ctx.stroke();

    // "!"
    ctx.fillStyle = '#111100';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 32, 30, 60);

    // Ponto do "!"
    /*ctx.beginPath();
    ctx.arc(32, 52, 4, 0, Math.PI * 2);
    ctx.fill();*/

    const textura = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map:         textura,
        transparent: true,
        depthTest:   false, // aparece sempre por cima
    });

    this.sinalAlerta = new THREE.Sprite(material);
    this.sinalAlerta.scale.set(1.0, 1.0, 1.0);
    this.sinalAlerta.position.set(0, 2.8, 0); // acima da cabeça
    this.sinalAlerta.visible = false;
    this.grupo.add(this.sinalAlerta);

    // Para a animação de escala
    this._tempoSinal = 0;
}

    // ══════════════════════════════════════════
    // Atualizar cor do cone consoante o estado
    // ══════════════════════════════════════════
_atualizarCone() {
    if (this.estado === 'alerta') {
        this._coneMatFill.color.set(0xff2200);
        this._coneMatFill.opacity = 0.18;
        this._coneMatWire.color.set(0xff4400);

        // Mostra e anima o sinal
        this.sinalAlerta.visible = true;
        this._tempoSinal += 0.016;

        // Animação: aparece com "pop" e depois pulsa subtilmente
        const escala = this._tempoSinal < 0.15
            ? (this._tempoSinal / 0.15) * 1.3  // cresce rápido
            : 1.0 + Math.sin(this._tempoSinal * 8) * 0.06; // pulsa

        this.sinalAlerta.scale.set(escala * 1.0, escala * 1.0, escala * 1.0);

            // Toca som de alerta se não estiver tocando
            if (!this._somTocando && this.somAlerta.buffer) {
                this.somAlerta.play();
                this._somTocando = true;
            }

        } else if (this.estado === 'investigar') {
            this._coneMatFill.color.set(0xff8800);
            this._coneMatFill.opacity = 0.13;
            this._coneMatWire.color.set(0xffaa00);

            // Esconde gradualmente ao sair do alerta
            this.sinalAlerta.visible = false;
            this._tempoSinal = 0;

            // Para o som
            if (this._somTocando) {
                this.somAlerta.stop();
                this._somTocando = false;
            }

        } else {
            this._coneMatFill.color.set(0xffff00);
            this._coneMatFill.opacity = 0.08;
            this._coneMatWire.color.set(0xffdd00);

            this.sinalAlerta.visible = false;
            this._tempoSinal = 0;

            // Para o som
            if (this._somTocando) {
                this.somAlerta.stop();
                this._somTocando = false;
            }
        }
    }

    _atualizarBoxColisao() {
        const p = this.grupo.position;
        const r = 0.35;
        this.boxColisao.set(
            new THREE.Vector3(p.x - r, p.y,       p.z - r),
            new THREE.Vector3(p.x + r, p.y + 1.9, p.z + r)
        );
    }

    _colideComJogador(posJogador) {
        const raio = 0.8;
        const boxJogador = new THREE.Box3(
            new THREE.Vector3(posJogador.x - raio, posJogador.y - 0.5, posJogador.z - raio),
            new THREE.Vector3(posJogador.x + raio, posJogador.y + 0.5, posJogador.z + raio)
        );
        return this.boxColisao.intersectsBox(boxJogador);
    }

    // ══════════════════════════════════════════
    // Mover para um ponto destino
    // ══════════════════════════════════════════
    _moverPara(destino, velocidade = this.velocidade) {
        const dir = new THREE.Vector3(
            destino.x - this.grupo.position.x,
            0,
            destino.z - this.grupo.position.z
        );
        const dist = dir.length();
        if (dist < 0.15) return true;

        dir.normalize();
        const posAtual = this.grupo.position.clone();
        const raio     = 0.30;

        const testar = (pos) => {
            const box = new THREE.Box3(
                new THREE.Vector3(pos.x - raio, pos.y + 0.05, pos.z - raio),
                new THREE.Vector3(pos.x + raio, pos.y + 1.90, pos.z + raio)
            );
            return !this.gestorColisoes.colideExcluindo(box, this);
        };

        const aplicar = (pos) => {
            this.grupo.position.copy(pos);
            this.grupo.lookAt(pos.clone().add(dir));
        };

        const posTotal = posAtual.clone().addScaledVector(dir, velocidade);
        if (testar(posTotal)) { aplicar(posTotal); return false; }

        const posSoX = posAtual.clone();
        posSoX.x += dir.x * velocidade;
        if (testar(posSoX)) { aplicar(posSoX); return false; }

        const posSoZ = posAtual.clone();
        posSoZ.z += dir.z * velocidade;
        if (testar(posSoZ)) { aplicar(posSoZ); return false; }

        // Bloqueado — passa ao próximo ponto
        return true;
    }

    // ══════════════════════════════════════════
    // Loop principal do NPC
    // ══════════════════════════════════════════
    atualizar(posJogador, alturaCabecaJogador = 1.59) {
        const detectado = this._detectarJogador(posJogador, alturaCabecaJogador) || this._colideComJogador(posJogador);

        // ── Máquina de estados ─────────────────
        switch (this.estado) {

            case 'patrulha': {
                if (detectado) {
                    this.estado = 'alerta';
                    this._tempoAlerta = 3.0; // segundos de alerta
                    this._posUltimaVista = posJogador.clone();
                    break;
                }
                const destino  = this.pontos[this.indicePonto];
                const chegou   = this._moverPara(destino);
                if (chegou) {
                    this.indicePonto = (this.indicePonto + 1) % this.pontos.length;
                }
                this._animar(true);
                break;
            }

            case 'alerta': {
                // Olha para a última posição conhecida do jogador
                if (detectado) {
                    this._posUltimaVista = posJogador.clone();
                    this._tempoAlerta    = 3.0;
                }

                // Vira-se para o jogador
                const alvoAlerta = new THREE.Vector3(
                    posJogador.x, this.grupo.position.y, posJogador.z
                );
                this.grupo.lookAt(alvoAlerta);
                this._animar(false);

                this._tempoAlerta -= 0.016;
                if (this._tempoAlerta <= 0) {
                    // Perdeu o jogador — vai investigar o último sítio visto
                    this.estado = detectado ? 'alerta' : (this.estacionario ? 'estacionario' : 'investigar');
                }
                break;
            }

            case 'investigar': {
                if (detectado) {
                    this.estado = 'alerta';
                    this._tempoAlerta = 3.0;
                    this._posUltimaVista = posJogador.clone();
                    break;
                }
                if (this._posUltimaVista) {
                    const chegou = this._moverPara(this._posUltimaVista, this.velocidade * 0.7);
                    this._animar(true);
                    if (chegou) {
                        // Chegou ao sítio — volta à patrulha
                        this._posUltimaVista = null;
                        this.estado = this.estacionario ? 'estacionario' : 'patrulha';
                    }
                } else {
                    this.estado = this.estacionario ? 'estacionario' : 'patrulha';
                }
                break;
            }

            case 'estacionario': {
                if (detectado) {
                    this.estado = 'alerta';
                    this._tempoAlerta = 3.0;
                    this._posUltimaVista = posJogador.clone();
                    break;
                }
                this._tempoOlhar += 0.016;
                if (this._tempoOlhar >= 3) {
                    this._direcaoOlhar = !this._direcaoOlhar;
                    this._tempoOlhar = 0;
                }
                const angulo = this._direcaoOlhar ? Math.PI / 6 : -Math.PI / 6;
                this.grupo.rotation.y = angulo;
                this._animar(false);
                break;
            }
        }

        this._atualizarCone();
        this._atualizarBoxColisao();
        return this.estado === 'alerta'; // retorna true se o jogador foi detetado
    }

    get posicao() {
        return this.grupo.position;
    }

    get foiDetectado() {
        return this.estado === 'alerta';
    }
}

// ─────────────────────────────────────────────
// Gestor de NPCs
// ─────────────────────────────────────────────
export class GestorNPCs {
    constructor(cena, gestorColisoes) {
        this.npcs = [];
        this.cena = cena;
        this.gestorColisoes = gestorColisoes;
    }

    // Adiciona um NPC com uma rota de pontos
    // Exemplo: gestorNPCs.adicionar([{x:30,z:20},{x:30,z:40}])
    adicionar(pontos) {
        const npc = new NPC(this.cena, pontos, this.gestorColisoes);
        this.npcs.push(npc);
        this.gestorColisoes.registarNPC(npc);
        return npc;
    }

    atualizar(posJogador, alturaCabecaJogador = 1.59) {
        let alertaGlobal = false;
        this.npcs.forEach(npc => {
            const emAlerta = npc.atualizar(posJogador, alturaCabecaJogador);
            if (emAlerta) alertaGlobal = true;
        });
        return alertaGlobal;
    }
}