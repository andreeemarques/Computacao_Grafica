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

        this._camaraCine   = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 5000);
        this._camAlvo      = new THREE.Vector3();
        this._camPos       = new THREE.Vector3();
        this._camPosAlvo   = new THREE.Vector3();
        this._keyframes    = [];

        this._tampa        = null;
        this._tampaCriada  = false;

        this._holofote     = null;
        this._holofoteAlvo = new THREE.Vector3();

        this.codecUI = new CodecUI();

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

    get camara() { return this._camaraCine; }

    // ── Tampa do Esgoto ─────────────────────────────────────
    _criarTampa() {
        const grupo = new THREE.Group();
        grupo.position.set(44, 0, 49);

        const geoFundo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 20);
        const matFundo = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
        const fundo = new THREE.Mesh(geoFundo, matFundo);
        fundo.position.y = -0.02;
        grupo.add(fundo);

        const geoAro = new THREE.TorusGeometry(0.72, 0.06, 8, 24);
        const matMetal = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 });
        const aro = new THREE.Mesh(geoAro, matMetal);
        aro.rotation.x = Math.PI / 2;
        aro.position.y = 0.03;
        grupo.add(aro);

        const geoCap = new THREE.CylinderGeometry(0.68, 0.68, 0.08, 20);
        const matCap = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.7 });
        const cap = new THREE.Mesh(geoCap, matCap);
        cap.position.y = 0.04;

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
        this._tampaMesh = cap;
        this._tampaGrupo = grupo;
        this._tampaAberta = false;

        this.cena.add(grupo);
    }

    _abrirTampa(duracaoMs) {
        if (this._tampaAberta) return;
        this._tampaAberta = true;
        const inicio = Date.now();
        const rodar = () => {
            const t = Math.min((Date.now() - inicio) / duracaoMs, 1);
            const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
            this._tampaMesh.rotation.z = ease * (Math.PI / 1.8);
            this._tampaMesh.position.x = ease * 0.5;
            this._tampaMesh.position.y = 0.04 + ease * 0.3;
            if (t < 1) requestAnimationFrame(rodar);
        };
        requestAnimationFrame(rodar);
    }

    // ── Holofote de Extração ────────────────────────────────
    _criarHolofote() {
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
        const N = 60;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(N * 3);

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
        this._ventoPosInicial = pos.slice();
        this._ventoFrameCount = 0; // Otimização: atualizar a cada 2 frames
        this.cena.add(this._vento);
    }

    _ativarVento() {
        this._ventoAtivo = true;
        this._vento.material.opacity = 0.7;
        this._ventoFrameCount = 0;
    }

    _atualizarVento(dt) {
        if (!this._ventoAtivo) return;
        
        // Atualizar apenas a cada 2 frames (otimização de performance)
        this._ventoFrameCount++;
        if (this._ventoFrameCount % 2 !== 0) return;

        const pos = this._vento.geometry.attributes.position.array;
        const N   = pos.length / 3;
        const centerX = -13;
        const centerZ = 2;

        for (let i = 0; i < N; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;
            
            const dx = pos[ix] - centerX;
            const dz = pos[iz] - centerZ;
            const distSq = dx * dx + dz * dz;
            
            // Atualizar posição
            pos[ix]     += (dx / (Math.sqrt(distSq) + 0.01)) * dt * 2.5 + (Math.random() - 0.5) * dt * 0.8;
            pos[iy]     -= dt * 0.4;
            pos[iz]     += (dz / (Math.sqrt(distSq) + 0.01)) * dt * 2.5 + (Math.random() - 0.5) * dt * 0.8;

            // Resetar partículas fora de alcance
            if (distSq > 49 || pos[iy] < 20.2) {
                pos[ix]     = centerX + (Math.random() - 0.5) * 2;
                pos[iy]     = 20.5 + Math.random() * 1.5;
                pos[iz]     = centerZ + (Math.random() - 0.5) * 2;
            }
        }
        this._vento.geometry.attributes.position.needsUpdate = true;
    }

    // ── Som do Helicóptero (ficheiro de áudio) ──────────────
    _criarSomHelicoptero() {
        this._heliAudio = new Audio('./Helicoptero.mp3');
        this._heliAudio.loop = true;
        this._heliAudio.volume = 0;
        this._heliAtivo = false;
        this._heliFadeAtivo = false;
    }

    _iniciarSomHelicoptero() {
        if (this._heliAtivo) return;
        this._heliAtivo = true;
        this._heliAudio.currentTime = 0;
        this._heliAudio.volume = 0;

        // Tenta reproduzir (pode ser bloqueado pelo browser sem interação prévia,
        // mas neste caso o jogador já clicou para iniciar o jogo)
        this._heliAudio.play().catch(e => {
            console.warn('Não foi possível reproduzir o som do helicóptero:', e);
        });

        // Fade in gradual — sobe o volume ao longo de 4 segundos
        this._heliFadeAlvo  = 0.8;  // volume máximo (0.0 a 1.0)
        this._heliFadeVel   = 0.8 / 4.0; // unidades por segundo
        this._heliFadeAtivo = true;
    }

    _pararSomHelicoptero() {
        if (!this._heliAtivo) return;
        // Fade out — desce o volume ao longo de 1.5 segundos
        this._heliFadeAlvo  = 0;
        this._heliFadeVel   = this._heliAudio.volume / 1.5;
        this._heliFadeAtivo = true;

        // Para mesmo o áudio quando o volume chegar a zero
        const verificar = setInterval(() => {
            if (this._heliAudio.volume <= 0.01) {
                this._heliAudio.pause();
                this._heliAudio.currentTime = 0;
                this._heliAtivo = false;
                clearInterval(verificar);
            }
        }, 100);
    }

    // ── Fade do volume — chamado no atualizar() ─────────────
    _atualizarSomHelicoptero(dt) {
        if (!this._heliFadeAtivo) return;
        const vol = this._heliAudio.volume;
        if (vol < this._heliFadeAlvo) {
            this._heliAudio.volume = Math.min(vol + this._heliFadeVel * dt, this._heliFadeAlvo);
        } else if (vol > this._heliFadeAlvo) {
            this._heliAudio.volume = Math.max(vol - this._heliFadeVel * dt, this._heliFadeAlvo);
        } else {
            this._heliFadeAtivo = false;
        }
    }

    _atualizarCamara(dt) {
        if (this._keyframes.length < 2) return;

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
        const t = raw < 0.5 ? 2*raw*raw : -1+(4-2*raw)*raw;

        this._camPos.lerpVectors(kA.pos, kB.pos, t);
        this._camAlvo.lerpVectors(kA.alvo, kB.alvo, t);

        this._camaraCine.position.copy(this._camPos);
        this._camaraCine.lookAt(this._camAlvo);
    }

    _moverJogador(destino, velocidade) {
        this._destino    = destino.clone();
        this._velocidade = velocidade;
        this._aMoverse   = true;
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

        const alvo = this.jogador.grupo.position.clone().add(dir);
        this.jogador.grupo.lookAt(alvo.x, this.jogador.grupo.position.y, alvo.z);
    }

    // ── CUT-SCENE 1 — SAÍDA DO ESGOTO ──────────────────────
    iniciarEntrada(onFim) {
        this._onFimEntrada = onFim;

        const posEsgoto    = new THREE.Vector3(44, 0, 49);
        const posAposSubir = new THREE.Vector3(44, 0, 47);

        this.jogador.grupo.position.copy(posEsgoto);
        this.jogador.grupo.position.y = -2;
        this.jogador.grupo.visible = false;

        this._keyframes = [
            { t: 0.0, pos: new THREE.Vector3(30, 10, 52), alvo: posEsgoto.clone() },
            { t: 2.0, pos: new THREE.Vector3(32,  6, 50), alvo: posEsgoto.clone() },
            { t: 3.5, pos: new THREE.Vector3(34,  3, 48), alvo: posAposSubir.clone() },
            { t: 6.0, pos: new THREE.Vector3(36,  3, 47), alvo: posAposSubir.clone() },
            { t: 9.0, pos: new THREE.Vector3(36,  3, 47), alvo: posAposSubir.clone() },
        ];

        this._passos = [
            { t: 0.0, fn: () => { this.codecUI.mostrarEcraPreto(true); }},
            { t: 0.8, fn: () => { this.codecUI.mostrarEcraPreto(false); }},
            { t: 1.2, fn: () => { this._abrirTampa(1200); }},
            { t: 1.8, fn: () => {
                this.jogador.grupo.visible = true;
                this._subirJogador(posEsgoto, 1.5);
            }},
            { t: 3.2, fn: () => { this._moverJogador(posAposSubir, 2.5); }},
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

        this._duracao    = 999;
        this._tempo      = 0;
        this._passoAtual = 0;
        this._ativa      = true;
        this._aMoverse   = false;
    }

    _subirJogador(pos, duracao) {
        const inicio  = Date.now();
        const yInicio = -2;
        const yFim    = 0;
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
        this.camaraManager.cameraAtual.ativar();
    }

    // ── CUT-SCENE 2 — EXTRAÇÃO NO TELHADO ──────────────────
    iniciarExtracao(onFim) {
        this._onFimExtracao = onFim;

        const posTelhado = new THREE.Vector3(-13, 20.5, 5);
        const posLanding = new THREE.Vector3(-13, 20.5, 2);

        this.jogador.grupo.position.copy(posTelhado);
        this.jogador.grupo.visible = true;

        const pc = this.jogador.partes.pivotCabeca;
        if (pc) pc.rotation.x = 0;

        this._inclinacaoCabeca = 0;

        this._keyframes = [
            { t: 0.0, pos: new THREE.Vector3(-5,  23,  14), alvo: posTelhado.clone() },
            { t: 2.5, pos: new THREE.Vector3(-13, 28,  18), alvo: posTelhado.clone() },
            { t: 5.0, pos: new THREE.Vector3(-20, 32,  18), alvo: posLanding.clone() },
            { t: 8.0, pos: new THREE.Vector3(-20, 35,  18), alvo: posLanding.clone() },
        ];

        this._passos = [
            { t: 0.0, fn: () => { this._moverJogador(posLanding, 3.0); }},
            { t: 1.5, fn: () => { this._iniciarSomHelicoptero(); }},
            { t: 2.8, fn: () => { this._inclinarCabeca = true; }},
            { t: 3.5, fn: () => {
                this._ativarHolofote(posLanding);
                this._ativarVento();
            }},
            { t: 4.5, fn: () => {
                this.codecUI.iniciarDialogos([
                    { falante: 'General', texto: 'Viper, o Blackhawk está em aproximação. Dez segundos.' },
                    { falante: 'Viper',   texto: '...' },
                    { falante: 'General', texto: 'Missão cumprida, Viper. Descansas quando chegares.' },
                    { falante: 'Viper',   texto: 'Só descansarei quando estiver morta.' },
                ], () => this._terminarExtracao());
            }},
        ];

        this._inclinarCabeca = false;
        this._duracao    = 999;
        this._tempo      = 0;
        this._passoAtual = 0;
        this._ativa      = true;
        this._aMoverse   = false;

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

    // ── Loop principal ──────────────────────────────────────
    atualizar(dt) {
        if (!this._ativa) return;

        this._tempo += dt;

        while (
            this._passoAtual < this._passos.length &&
            this._tempo >= this._passos[this._passoAtual].t
        ) {
            this._passos[this._passoAtual].fn();
            this._passoAtual++;
        }

        this._atualizarCamara(dt);

        // Fade do holofote
        if (this._holofote?.visible && this._holofote.intensity < this._holofoteIntensidadeAlvo) {
            this._holofote.intensity = Math.min(
                this._holofote.intensity + dt * 400,
                this._holofoteIntensidadeAlvo
            );
        }

        // Inclinação da cabeça para cima
        if (this._inclinarCabeca) {
            const pc = this.jogador.partes.pivotCabeca;
            if (pc && pc.rotation.x > -0.5) {
                pc.rotation.x -= dt * 0.8;
            }
        }

        // Fade do volume do helicóptero
        this._atualizarSomHelicoptero(dt);

        this._atualizarVento(dt);

        if (this._aMoverse) {
            this._tickMovimento(dt);
            this.jogador.atualizar(true);
        } else {
            this.jogador.atualizar(false);
        }
    }

    verificarTriggerExtracao() {
        const pos = this.jogador.posicao;
        return (
            Math.abs(pos.x - (-13)) < 5 &&
            Math.abs(pos.z - 5)     < 5 &&
            pos.y >= 19
        );
    }

    destruir() {
        this._pararSomHelicoptero();
        this.codecUI.destruir();
        if (this._holofote)   this.cena.remove(this._holofote);
        if (this._tampaGrupo) this.cena.remove(this._tampaGrupo);
        if (this._vento)      this.cena.remove(this._vento);
    }
}