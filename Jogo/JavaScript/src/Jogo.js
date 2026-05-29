import * as THREE from 'three';
import { GestorColisoes } from './GestorColisoes.js';
import { Jogador }        from './Jogador.js';
import { CamaraManager }  from './Camara.js';
import { Cenario }        from './Cenario.js';
import { GestorLuzes }    from './Luzes.js';
import { UILuzes }        from './UILuzes.js';
import { GestorNPCs }     from './NPC.js';
import { GestorCutscene } from './GestorCutscene.js';  // ← NOVO

const RAIO_APANHA_CHAVE_SQ = 4.0;

export class Jogo {
    constructor() {
        this.cena      = new THREE.Scene();
        this.clock     = new THREE.Clock();
        this.renderer  = this._criarRenderer();

        this.gestorColisoes = new GestorColisoes();
        this.gestorLuzes    = new GestorLuzes(this.cena, this.gestorColisoes);
        this.cenario        = new Cenario(this.cena, this.gestorColisoes);
        this.jogador        = new Jogador(this.cena, this.gestorColisoes);
        this.cameraManager  = new CamaraManager(this.renderer, this.gestorColisoes);
        
        // Definir a câmara inicial escolhida no menu
        const camaraInicial = window.obterCamaraInicial?.() || 'terceira';
        this.cameraManager.definirCamaraInicial(camaraInicial);
        
        this.uiLuzes        = new UILuzes(this.gestorLuzes);
        this.gestorNPCs     = new GestorNPCs(this.cena, this.gestorColisoes);

        // ── Gestor de Cut-scenes ──────────────────────────────
        this.gestorCutscene     = new GestorCutscene(this.jogador, this.cameraManager, this.cena);
        this._cutsceneAtiva     = true;   // bloqueia gameplay enquanto a intro corre
        this._extraçãoDisparada = false;
        // ─────────────────────────────────────────────────────

        this.teclasPressionadas = new Set();
        this._loopId = null;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp   = this._onKeyUp.bind(this);

        this.missaoConcluida = false;
        this.missaoFalhada   = false;
        this._jogoAtivo      = true;
        this.chavesApanhadas = new Set();

        this._chavesPendentes       = null;
        this._tempVectorChaves      = new THREE.Vector3();
        this._timeoutMensagemChaves = null;
        this._ultimaMensagemPosicao = null;

        this.pontoMissao = { minX: -14, maxX: -5, minZ: 10, maxZ: 13 };

        this._criarPainelChaves();

        this.gestorColisoes.registarBox(
            new THREE.Vector3(10.5, 0, 14.2),
            new THREE.Vector3(13.5, 3.2, 17.2)
        );

        this.gestorNPCs.adicionar([
            { x: 36, z: 16 }, { x: 36, z: 40 },
            { x: 29, z: 40 }, { x: 29, z: 16 },
        ]);
        this.gestorNPCs.adicionar([
            { x: 48, z: 16 }, { x: 48, z: 41 },
            { x: 40, z: 41  }, { x: 40, z: 16 },
        ]);
        this.gestorNPCs.adicionar([{ x: 12, z: 18 }]);
        this.gestorNPCs.adicionar([
            { x: -32, z: 16 }, { x: -32, z: 48 },
            { x:   8, z: 48 }, { x:   8, z: 16 },
            { x: -10, z: 16 },
        ]);

        this._chavesPendentes = [...this.cenario.chaves];

        this._registarEventos();
        this.cameraManager.atualizar(this.jogador.posicao);

        // ── Inicia com a cut-scene de entrada ─────────────────
        this.gestorCutscene.iniciarEntrada(() => {
            // Codec fechou — gameplay começa
            this._cutsceneAtiva = false;
            this.cameraManager.cameraAtual.ativar();
        });
        // ─────────────────────────────────────────────────────

        this._loop();
    }

    // ─── Renderer ────────────────────────────────────────────────────────────

    _criarRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.setClearColor(0x87ceeb);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    // ─── UI de chaves ─────────────────────────────────────────────────────────

    _criarPainelChaves() {
        const painel = document.createElement('div');
        painel.id = 'painel-chaves';
        painel.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #ffd700;
            padding: 30px 40px;
            border: 3px solid #ffd700;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            font-size: 20px;
            font-weight: bold;
            z-index: 1000;
            display: none;
            pointer-events: none;
            text-align: center;
            box-shadow: 0 0 20px rgba(255,215,0,0.5);
            transition: opacity 0.3s ease-out;
            opacity: 0;
        `;
        document.body.appendChild(painel);
        this._painelChaves = painel;
    }

    _mostrarMensagemChaves(mensagem) {
        if (!this._painelChaves) return;
        if (this._timeoutMensagemChaves) clearTimeout(this._timeoutMensagemChaves);
        this._painelChaves.textContent   = mensagem;
        this._painelChaves.style.display = 'block';
        this._painelChaves.style.opacity = '1';
        this._timeoutMensagemChaves = setTimeout(() => {
            this._painelChaves.style.opacity = '0';
            setTimeout(() => { this._painelChaves.style.display = 'none'; }, 300);
        }, 4000);
    }

    _ocultarMensagemChaves() {
        if (!this._painelChaves) return;
        if (this._timeoutMensagemChaves) clearTimeout(this._timeoutMensagemChaves);
        this._painelChaves.style.opacity = '0';
        setTimeout(() => { this._painelChaves.style.display = 'none'; }, 300);
    }

    // ─── Eventos ──────────────────────────────────────────────────────────────

    _registarEventos() {
        document.addEventListener('keydown', this._onKeyDown, false);
        document.addEventListener('keyup',   this._onKeyUp,   false);
    }

    _onKeyDown(event) {
        // Bloqueia input durante cutscenes
        if (this._cutsceneAtiva) return;
        if (!this._jogoAtivo) return;

        if (event.which === 86) {  // V - Alternar câmara
            this.cameraManager.alternar();
        } else if (event.key === 'l' || event.key === 'L') {
            const p = document.getElementById('painel-luzes');
            if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
        } else if (event.key === 'c' || event.key === 'C') {  // C - Agachar
            this.jogador.alternarAgacho();
        } else if ([87, 83, 65, 68].includes(event.which)) {
            this.teclasPressionadas.add(event.which);
        }
    }

    _onKeyUp(event) {
        if ([87, 83, 65, 68].includes(event.which)) {
            this.teclasPressionadas.delete(event.which);
        }
    }

    // ─── Lógica de missão ─────────────────────────────────────────────────────

    _verificarMissao() {
        if (this.missaoConcluida) return;

        const { x, z } = this.jogador.posicao;
        const { minX, maxX, minZ, maxZ } = this.pontoMissao;

        if (x < minX || x > maxX || z < minZ || z > maxZ) return;

        if (this.chavesApanhadas.size < 3) {
            const agora = Date.now();
            if (!this._ultimaMensagemPosicao || agora - this._ultimaMensagemPosicao > 5000) {
                this._mostrarMensagemChaves(
                    `⚠ Precisas de apanhar as 3 chaves!\nTens ${this.chavesApanhadas.size}/3`
                );
                this._ultimaMensagemPosicao = agora;
            }
            return;
        }

        this._ocultarMensagemChaves();
        this.missaoConcluida = true;
        this._cutsceneAtiva  = true;
        this.teclasPressionadas.clear();
        this.cameraManager.cameraAtual.desativar();

        // Dispara a cut-scene de extração — o painel aparece só no fim dela
        this.gestorCutscene.iniciarExtracao(() => {
            this._cutsceneAtiva = false;
            this._jogoAtivo     = false;
            const painel = document.getElementById('panel-missao-concluida');
            if (painel) painel.classList.add('active');
        });
    }

    _verificarDetecao(emAlerta) {
        if (this.missaoFalhada || this.missaoConcluida) return;
        if (!emAlerta) return;

        this.missaoFalhada = true;
        this._terminarJogo();
        this.cenario.sirenes.forEach(s => s.ligar());

        setTimeout(() => {
            const painel = document.getElementById('panel-missao-falhada');
            if (painel) painel.classList.add('active');
        }, 2500);
    }

    // ─── Apanhar chaves ───────────────────────────────────────────────────────

    _atualizarChaves(delta) {
        if (this._chavesPendentes.length === 0) return;

        const jogadorPos = this.jogador.posicao;
        const jogadorBox = this.jogador.boxColisao;

        for (let i = this._chavesPendentes.length - 1; i >= 0; i--) {
            const chave = this._chavesPendentes[i];
            chave.update(delta);

            // Remove chaves que já completaram o desaparecimento
            if (chave.apanhada) {
                this._chavesPendentes.splice(i, 1);
                continue;
            }

            if (!chave.boxColisao || !jogadorBox) continue;

            // Otimização: calcular distância direta em vez de usar getCenter()
            const chaveBox = chave.boxColisao;
            const chaveCenterX = (chaveBox.min.x + chaveBox.max.x) * 0.5;
            const chaveCenterZ = (chaveBox.min.z + chaveBox.max.z) * 0.5;
            
            const dx = jogadorPos.x - chaveCenterX;
            const dz = jogadorPos.z - chaveCenterZ;
            const distSq = dx * dx + dz * dz;
            const dist = Math.sqrt(distSq);
            
            // Atualizar proximidade (desativa luz quando perto para evitar lag)
            chave.atualizarProximidadeJogador(dist);
            
            // Se está muito longe, skip
            if (distSq > RAIO_APANHA_CHAVE_SQ) continue;
            
            // Apenas fazer collision check se passou no raio
            if (!jogadorBox.intersectsBox(chaveBox)) continue;

            this.chavesApanhadas.add(chave.id);
            chave.iniciarDesaparecimento();
        }
    }

    // ─── Terminar jogo ────────────────────────────────────────────────────────

    _terminarJogo() {
        this._jogoAtivo = false;
        this.teclasPressionadas.clear();
        this.cameraManager.cameraTerceiraPessoa.desativar();
    }

    // ─── Destruição ───────────────────────────────────────────────────────────

    destruir() {
        if (this._loopId !== null) {
            cancelAnimationFrame(this._loopId);
            this._loopId = null;
        }
        if (this._timeoutMensagemChaves) clearTimeout(this._timeoutMensagemChaves);

        document.removeEventListener('keydown', this._onKeyDown, false);
        document.removeEventListener('keyup',   this._onKeyUp,   false);

        this.cameraManager.destruir();
        this.gestorCutscene.destruir();  // ← NOVO

        if (this.renderer?.domElement) this.renderer.domElement.remove();

        document.getElementById('painel-luzes')?.remove();
        document.getElementById('painel-chaves')?.remove();
    }

    // ─── Loop principal ───────────────────────────────────────────────────────

    _loop() {
        this._loopId = requestAnimationFrame(this._loop.bind(this));

        const delta = this.clock.getDelta();

        // ── Cut-scene ativa — bloqueia tudo o resto ───────────
        if (this._cutsceneAtiva) {
            this.gestorCutscene.atualizar(delta);
            this.cenario.skybox.position.copy(this.gestorCutscene.camara.position);
            this.renderer.render(this.cena, this.gestorCutscene.camara);
            return;
        }

        // ── Missão já terminou — só renderiza ─────────────────
        if (!this._jogoAtivo) {
            this.cenario.sirenes.forEach(s => s.update(delta));
            this.gestorNPCs.npcs.forEach(npc => npc._atualizarCone());
            this.cenario.skybox.position.copy(this.cameraManager.camara.position);
            this.renderer.render(this.cena, this.cameraManager.camara);
            return;
        }

        // ── Gameplay normal ───────────────────────────────────
        this.gestorColisoes.atualizar();
        this.jogador.mover(this.cameraManager.angulo, Array.from(this.teclasPressionadas));
        this.jogador.atualizar(this.teclasPressionadas.size > 0);
        this.jogador.orientarParaCamera(this.cameraManager.camara);
        this.cameraManager.atualizar(this.jogador.posicao);

        this._verificarMissao();
        this._atualizarChaves(delta);

        this.cenario.sirenes.forEach(s => s.update(delta));
        this.cenario.skybox.position.copy(this.cameraManager.camara.position);

        const emAlerta = this.gestorNPCs.atualizar(this.jogador.posicao, this.jogador.alturaCabeca);
        this._verificarDetecao(emAlerta);

        this.renderer.render(this.cena, this.cameraManager.camara);
    }
}