// GestorCutscene.js — Orquestra as cut-scenes de entrada e extração
import * as THREE from 'three';
import { CodecUI } from './CodecUI.js';

export class GestorCutscene {
    constructor(jogador, camaraManager, cena) {
        this.jogador       = jogador;
        this.camaraManager = camaraManager;
        this.cena          = cena;

        this._ativa        = false;
        this._tempo        = 0;
        this._duracao      = 0;
        this._passos       = [];
        this._passoAtual   = 0;

        // Câmara cinematográfica dedicada (não usa a do jogo)
        this._camaraCine   = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 5000);
        this._camAlvo      = new THREE.Vector3();
        this._camPos       = new THREE.Vector3();
        this._camPosAlvo   = new THREE.Vector3();
        this._keyframes    = [];

        // Tampa do esgoto
        this._tampa        = null;
        this._tampaCriada  = false;

        // Holofote de extração
        this._holofote     = null;
        this._holofoteAlvo = new THREE.Vector3();

        // UI
        this.codecUI = new CodecUI();

        // Callbacks externos
        this._onFimEntrada  = null;
        this._onFimExtracao = null;

        this._criarTampa();
        this._criarHolofote();
        this._criarVento();
        this._criarSomHelicoptero();

        window.addEventListener('resize', () => {
            this._camaraCine.aspect = window.innerWidth / window.innerHeight;
            this._camaraCine.updateProjectionMatrix();
        });
    }

    get ativa() { return this._ativa; }

    // Câmara a usar durante cutscene
    get camara() { return this._camaraCine; }

    // ── Tampa do Esgoto ─────────────────────────────────────
    _criarTampa() {
        const grupo = new THREE.Group();
        grupo.position.set(44, 0, 49);

        // Buraco no chão (disco escuro)
        const geoFundo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 20);
        const matFundo = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
        const fundo = new THREE.Mesh(geoFundo, matFundo);
        fundo.position.y = -0.02;
        grupo.add(fundo);

        // Aro metálico
        const geoAro = new THREE.TorusGeometry(0.72, 0.06, 8, 24);
        const matMetal = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 });
        const aro = new THREE.Mesh(geoAro, matMetal);
        aro.rotation.x = Math.PI / 2;
        aro.position.y = 0.03;
        grupo.add(aro);

        // Tampa circular
        const geoCap = new THREE.CylinderGeometry(0.68, 0.68, 0.08, 20);
        const matCap = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.7 });
        const cap = new THREE.Mesh(geoCap, matCap);
        cap.position.y = 0.04;

        // Padrão na tampa (grelha)
        const matGrelha = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.5 });
        for (let i = -2; i <= 2; i++) {
            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.03, 0.06),
                matGrelha
            );
            bar.position.set(0, 0.06, i * 0.2);
            cap.add(bar);
        }

        grupo.add(cap);
        this._tampaMesh = cap; // a parte que abre
        this._tampaGrupo = grupo;
        this._tampaAberta = false;

        this.cena.add(grupo);
    }

    // Anima a tampa a abrir (pivota para o lado)
    _abrirTampa(duracaoMs) {
        if (this._tampaAberta) return;
        this._tampaAberta = true;
        const inicio = Date.now();
        const rodar = () => {
            const t = Math.min((Date.now() - inicio) / duracaoMs, 1);
            const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // easeInOut
            this._tampaMesh.rotation.z = ease * (Math.PI / 1.8);
            this._tampaMesh.position.x = ease * 0.5;
            this._tampaMesh.position.y = 0.04 + ease * 0.3;
            if (t < 1) requestAnimationFrame(rodar);
        };
        requestAnimationFrame(rodar);
    }

    // ── Holofote de Extração ────────────────────────────────
    _criarHolofote() {
        // Ângulo muito mais fechado (PI/20) = feixe concentrado na Viper
        const spot = new THREE.SpotLight(0xddeeff, 0, 0, Math.PI / 20, 0.15);
        spot.position.set(-13, 50, 2);
        spot.castShadow = false;
        spot.visible = false;

        const alvo = new THREE.Object3D();
        alvo.position.set(-13, 20.5, 2);
        this.cena.add(alvo);
        spot.target = alvo;

        this.cena.add(spot);
        this._holofote = spot;
        this._holofoteAlvo = alvo;
    }

    _ativarHolofote(posJogador) {
        this._holofote.visible = true;
        this._holofote.intensity = 0;
        this._holofoteAlvo.position.set(posJogador.x, posJogador.y, posJogador.z);
        this._holofote.target.updateMatrixWorld();
        this._holofoteIntensidadeAlvo = 1200;
    }

    // ── Vento do Helicóptero ────────────────────────────────
    _criarVento() {
        const N = 120;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(N * 3);

        // Partículas espalhadas em torno do ponto de extração
        for (let i = 0; i < N; i++) {
            pos[i * 3]     = -13 + (Math.random() - 0.5) * 8;
            pos[i * 3 + 1] = 20.5 + Math.random() * 3;
            pos[i * 3 + 2] =  2   + (Math.random() - 0.5) * 8;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xccccaa,
            size: 0.08,
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });

        this._vento      = new THREE.Points(geo, mat);
        this._ventoAtivo = false;
        this._ventoPosInicial = pos.slice(); // cópia das posições iniciais
        this.cena.add(this._vento);
    }

    _ativarVento() {
        this._ventoAtivo = true;
        this._vento.material.opacity = 0.7;
    }

    _atualizarVento(dt) {
        if (!this._ventoAtivo) return;
        const pos = this._vento.geometry.attributes.position.array;
        const N   = pos.length / 3;

        for (let i = 0; i < N; i++) {
            // Vento radial para fora do centro + ligeiro caos
            const dx = pos[i * 3]     - (-13);
            const dz = pos[i * 3 + 2] -   2;
            const dist = Math.sqrt(dx * dx + dz * dz) + 0.01;

            pos[i * 3]     += (dx / dist) * dt * 2.5 + (Math.random() - 0.5) * dt * 0.8;
            pos[i * 3 + 1] -= dt * 0.4; // cai ligeiramente
            pos[i * 3 + 2] += (dz / dist) * dt * 2.5 + (Math.random() - 0.5) * dt * 0.8;

            // Reinicia partícula se sair muito longe ou cair abaixo do telhado
            if (dist > 7 || pos[i * 3 + 1] < 20.2) {
                const idx = i * 3;
                pos[idx]     = -13 + (Math.random() - 0.5) * 2;
                pos[idx + 1] = 20.5 + Math.random() * 1.5;
                pos[idx + 2] =   2  + (Math.random() - 0.5) * 2;
            }
        }
        this._vento.geometry.attributes.position.needsUpdate = true;
    }

    // ── Som sintético do Helicóptero (Web Audio API) ────────
    _criarSomHelicoptero() {
        this._heliAudio  = null;
        this._heliGain   = null;
        this._heliAtivo  = false;
    }

    _iniciarSomHelicoptero() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Rotor principal — onda baixa pulsante
            const osc1 = ctx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(18, ctx.currentTime); // Hz muito baixo = rotor
            osc1.frequency.linearRampToValueAtTime(22, ctx.currentTime + 6); // acelera ao aproximar

            // Modulação de amplitude — cria o efeito "thump thump"
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(6.5, ctx.currentTime);  // 6.5 pás/s
            lfo.frequency.linearRampToValueAtTime(8, ctx.currentTime + 6);

            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.5;
            lfo.connect(lfoGain);

            const gainMod = ctx.createGain();
            gainMod.gain.value = 0.5;
            lfoGain.connect(gainMod.gain);

            // Ruído de turbina por cima
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data   = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise  = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop   = true;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 180;
            noiseFilter.Q.value = 0.8;
            noise.connect(noiseFilter);

            // Gain master — começa mudo e sobe (helicóptero ao longe)
            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0, ctx.currentTime);
            masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);  // aproxima-se
            masterGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 6);  // chega

            osc1.connect(gainMod);
            gainMod.connect(masterGain);
            noiseFilter.connect(masterGain);
            masterGain.connect(ctx.destination);

            osc1.start();
            lfo.start();
            noise.start();

            this._heliCtx    = ctx;
            this._heliGain   = masterGain;
            this._heliAtivo  = true;
        } catch(e) {
            console.warn('Web Audio não disponível:', e);
        }
    }

    _pararSomHelicoptero() {
        if (!this._heliAtivo || !this._heliGain) return;
        try {
            this._heliGain.gain.linearRampToValueAtTime(0, this._heliCtx.currentTime + 1.5);
            setTimeout(() => {
                try { this._heliCtx.close(); } catch(e) {}
                this._heliAtivo = false;
            }, 1600);
        } catch(e) {}
    }
    _atualizarCamara(dt) {
        if (this._keyframes.length < 2) return;

        // Encontra os dois keyframes à volta do tempo atual
        let kA = this._keyframes[0];
        let kB = this._keyframes[1];
        for (let i = 0; i < this._keyframes.length - 1; i++) {
            if (this._tempo >= this._keyframes[i].t && this._tempo <= this._keyframes[i+1].t) {
                kA = this._keyframes[i];
                kB = this._keyframes[i+1];
                break;
            }
        }

        const span = kB.t - kA.t;
        const local = Math.max(0, this._tempo - kA.t);
        const raw = span > 0 ? Math.min(local / span, 1) : 1;
        // easeInOut suave
        const t = raw < 0.5 ? 2*raw*raw : -1+(4-2*raw)*raw;

        this._camPos.lerpVectors(kA.pos, kB.pos, t);
        this._camAlvo.lerpVectors(kA.alvo, kB.alvo, t);

        this._camaraCine.position.copy(this._camPos);
        this._camaraCine.lookAt(this._camAlvo);
    }

    // ── Mover jogador na cutscene ───────────────────────────
    _moverJogador(destino, velocidade) {
        this._destino   = destino.clone();
        this._velocidade = velocidade;
        this._aMoverse  = true;
    }

    _tickMovimento(dt) {
        if (!this._aMoverse) return;
        const dir = this._destino.clone().sub(this.jogador.posicao);
        dir.y = 0;
        const dist = dir.length();
        if (dist < 0.1) {
            this.jogador.grupo.position.copy(this._destino);
            this._aMoverse = false;
            return;
        }
        dir.normalize().multiplyScalar(this._velocidade * dt);
        this.jogador.grupo.position.add(dir);

        // Orienta o jogador para o destino
        const alvo = this.jogador.grupo.position.clone().add(dir);
        this.jogador.grupo.lookAt(alvo.x, this.jogador.grupo.position.y, alvo.z);
    }

    // ── CUT-SCENE 1 — SAÍDA DO ESGOTO ──────────────────────
    iniciarEntrada(onFim) {
        this._onFimEntrada = onFim;

        const posEsgoto = new THREE.Vector3(44, 0, 49);
        const posAposSubir = new THREE.Vector3(44, 0, 47); // ligeiramente à frente

        // Coloca o jogador na posição inicial (dentro do esgoto, invisível)
        this.jogador.grupo.position.copy(posEsgoto);
        this.jogador.grupo.position.y = -2; // começa abaixo do chão
        this.jogador.grupo.visible = false;

        // Câmara deslocada ~60° para a direita (perspetiva lateral)
        // O alvo continua na tampa — a câmara orbita pelo lado esquerdo
        this._keyframes = [
            { t: 0.0, pos: new THREE.Vector3(30, 10, 52), alvo: posEsgoto.clone() },
            { t: 2.0, pos: new THREE.Vector3(32,  6, 50), alvo: posEsgoto.clone() },
            { t: 3.5, pos: new THREE.Vector3(34,  3, 48), alvo: posAposSubir.clone() },
            { t: 6.0, pos: new THREE.Vector3(36,  3, 47), alvo: posAposSubir.clone() },
            { t: 9.0, pos: new THREE.Vector3(36,  3, 47), alvo: posAposSubir.clone() },
        ];

        this._passos = [
            // Ecrã preto inicial
            { t: 0.0, fn: () => {
                this.codecUI.mostrarEcraPreto(true);
            }},
            // Fade out do ecrã preto
            { t: 0.8, fn: () => {
                this.codecUI.mostrarEcraPreto(false);
            }},
            // Tampa começa a abrir
            { t: 1.2, fn: () => {
                this._abrirTampa(1200);
            }},
            // Jogador sobe
            { t: 1.8, fn: () => {
                this.jogador.grupo.visible = true;
                this._subirJogador(posEsgoto, 1.5);
            }},
            // Jogador avança um passo
            { t: 3.2, fn: () => {
                this._moverJogador(posAposSubir, 2.5);
            }},
            // Abre Codec
            { t: 4.2, fn: () => {
                this.codecUI.iniciarDialogos([
                    { falante: 'General',  texto: 'Viper, confirma situação. Conseguiste sair?' },
                    { falante: 'Viper',    texto: 'Afirmativo. Saí pelo sector de esgotos. Estou no exterior.' },
                    { falante: 'General',  texto: 'E o disco com os dados de IRON CURTAIN?' },
                    { falante: 'Viper',    texto: 'Comigo. Intacto.' },
                    { falante: 'General',  texto: 'Bom trabalho, Viper. O teu ponto de extração é o telhado do edifício a Norte. Não te demores — as patrulhas vão estar em alerta máximo.' },
                    { falante: 'Viper',    texto: 'Entendido. Viper, out.' },
                ], () => this._terminarEntrada());
            }},
        ];

        this._duracao = 999; // termina via callback do codec
        this._tempo = 0;
        this._passoAtual = 0;
        this._ativa = true;
        this._aMoverse = false;
    }

    _subirJogador(pos, duracao) {
        const inicio = Date.now();
        const yInicio = -2;
        const yFim = 0;
        const subir = () => {
            const t = Math.min((Date.now() - inicio) / (duracao * 1000), 1);
            const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
            this.jogador.grupo.position.y = yInicio + (yFim - yInicio) * ease;
            if (t < 1) requestAnimationFrame(subir);
            else this.jogador.grupo.position.y = yFim;
        };
        requestAnimationFrame(subir);
    }

    _terminarEntrada() {
        this._ativa = false;
        if (this._onFimEntrada) this._onFimEntrada();
        // Reativa a câmara do jogo
        this.camaraManager.cameraAtual.ativar();
    }

    // ── CUT-SCENE 2 — EXTRAÇÃO NO TELHADO ──────────────────
    iniciarExtracao(onFim) {
        this._onFimExtracao = onFim;

        // y:20.5 garante que a Viper está em cima do telhado e não dentro
        const posTelhado = new THREE.Vector3(-13, 20.5, 5);
        const posLanding = new THREE.Vector3(-13, 20.5, 2);

        // ── Teleporta a Viper para o telhado imediatamente ──
        this.jogador.grupo.position.copy(posTelhado);
        this.jogador.grupo.visible = true;

        // Reset da cabeça (pode estar inclinada de animações anteriores)
        const pc = this.jogador.partes.pivotCabeca;
        if (pc) pc.rotation.x = 0;

        this._inclinacaoCabeca = 0; // controlada no atualizar(), sem rAF extra

        this._keyframes = [
            { t: 0.0, pos: new THREE.Vector3(-5,  23,  14), alvo: posTelhado.clone() },
            { t: 2.5, pos: new THREE.Vector3(-13, 28,  18), alvo: posTelhado.clone() },
            { t: 5.0, pos: new THREE.Vector3(-20, 32,  18), alvo: posLanding.clone() },
            { t: 8.0, pos: new THREE.Vector3(-20, 35,  18), alvo: posLanding.clone() },
        ];

        this._passos = [
            // Jogador caminha para o centro do telhado
            { t: 0.0, fn: () => {
                this._moverJogador(posLanding, 3.0);
            }},
            // Som do helicóptero começa ao longe
            { t: 1.5, fn: () => {
                this._iniciarSomHelicoptero();
            }},
            // Começa a inclinar a cabeça para cima (flag — tratada no atualizar)
            { t: 2.8, fn: () => {
                this._inclinarCabeca = true;
            }},
            // Holofote aparece sobre a Viper
            { t: 3.5, fn: () => {
                this._ativarHolofote(posLanding);
                this._ativarVento();
            }},
            // Codec — general confirma extração
            { t: 4.5, fn: () => {
                this.codecUI.iniciarDialogos([
                    { falante: 'General', texto: 'Viper, o Blackhawk está em aproximação. Trinta segundos.' },
                    { falante: 'Viper',   texto: '...' },
                    { falante: 'General', texto: 'Missão cumprida, Viper. Descansas quando chegares.' },
                    { falante: 'Viper',   texto: 'Só descansarei quando estiver morta.' },
                ], () => this._terminarExtracao());
            }},
        ];

        this._inclinarCabeca = false;
        this._duracao  = 999;
        this._tempo    = 0;
        this._passoAtual = 0;
        this._ativa    = true;
        this._aMoverse = false;

        // Desativa câmara do jogo
        this.camaraManager.cameraAtual.desativar();
    }

    _terminarExtracao() {
        this.codecUI.mostrarEcraPreto(true);
        this._holofoteIntensidadeAlvo = 0;
        this._ventoAtivo = false;
        this._vento.material.opacity = 0;
        this._pararSomHelicoptero();

        setTimeout(() => {
            this._ativa = false;
            this._holofote.visible = false;
            this.codecUI.mostrarEcraPreto(false);
            if (this._onFimExtracao) this._onFimExtracao();
        }, 1800);
    }

    // ── Loop principal — chamar no render loop ──────────────
    atualizar(dt) {
        if (!this._ativa) return;

        this._tempo += dt;

        // Executa passos agendados
        while (
            this._passoAtual < this._passos.length &&
            this._tempo >= this._passos[this._passoAtual].t
        ) {
            this._passos[this._passoAtual].fn();
            this._passoAtual++;
        }

        // Anima câmara cinematográfica
        this._atualizarCamara(dt);

        // Fade in do holofote (sem rAF separado)
        if (this._holofote?.visible && this._holofote.intensity < this._holofoteIntensidadeAlvo) {
            this._holofote.intensity = Math.min(
                this._holofote.intensity + dt * 400,
                this._holofoteIntensidadeAlvo
            );
        }

        // Inclinação da cabeça para cima (sem rAF separado)
        if (this._inclinarCabeca) {
            const pc = this.jogador.partes.pivotCabeca;
            if (pc && pc.rotation.x > -0.5) {
                pc.rotation.x -= dt * 0.8;
            }
        }

        // Vento do helicóptero
        this._atualizarVento(dt);
        if (this._aMoverse) {
            this._tickMovimento(dt);
            this.jogador.atualizar(true);
        } else {
            this.jogador.atualizar(false);
        }
    }

    // ── Trigger de extração — colocar no teu loop ──────────
    // Retorna true se o jogador chegou ao telhado
    verificarTriggerExtracao() {
        const pos = this.jogador.posicao;
        // Zona no telhado do edifício: x:-13 ±5, z:5 ±5, y≥19
        return (
            Math.abs(pos.x - (-13)) < 5 &&
            Math.abs(pos.z - 5)     < 5 &&
            pos.y >= 19
        );
    }

    destruir() {
        this.codecUI.destruir();
        if (this._holofote)   this.cena.remove(this._holofote);
        if (this._tampaGrupo) this.cena.remove(this._tampaGrupo);
        if (this._vento)      this.cena.remove(this._vento);
    }
}