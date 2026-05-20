import * as THREE from 'three';
import { GestorColisoes } from './GestorColisoes.js';
import { Jogador }        from './Jogador.js';
import { CamaraManager }  from './Camara.js';
import { Cenario }        from './Cenario.js';
import { GestorLuzes }    from './Luzes.js';
import { UILuzes }        from './UILuzes.js';
import { GestorNPCs }     from './NPC.js';

// Raio máximo (em unidades do mundo) para sequer testar colisão com uma chave.
// Deve ser >= metade da diagonal da boxColisao da chave.
const RAIO_APANHA_CHAVE_SQ = 4.0; // 2 unidades de raio → ao quadrado evita sqrt

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
        this.uiLuzes        = new UILuzes(this.gestorLuzes);
        this.gestorNPCs     = new GestorNPCs(this.cena, this.gestorColisoes);

        this.teclasPressionadas = new Set();
        this._loopId = null;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp   = this._onKeyUp.bind(this);

        this.missaoConcluida = false;
        this.missaoFalhada   = false;
        this._jogoAtivo      = true;  // false quando a missão termina (concluída ou falhada)
        this.chavesApanhadas = new Set();

        // Cache da lista de chaves ainda por apanhar — evita iterar as já apanhadas
        this._chavesPendentes = null; // inicializado após this.cenario estar pronto

        this._timeoutMensagemChaves  = null;
        this._ultimaMensagemPosicao  = null;

        this.pontoMissao = { minX: -14, maxX: -5, minZ: 10, maxZ: 13 };

        this._criarPainelChaves();

        // Colisão manual para a cabine
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

        // Guardar referência às chaves pendentes (as que ainda não foram apanhadas)
        this._chavesPendentes = [...this.cenario.chaves];

        this._registarEventos();
        this.cameraManager.atualizar(this.jogador.posicao);
        this._loop();
    }

    // ─── Renderer ────────────────────────────────────────────────────────────

    _criarRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: false }); // antialias off = +perf
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

        this._painelChaves.textContent  = mensagem;
        this._painelChaves.style.display  = 'block';
        this._painelChaves.style.opacity  = '1';

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
    if (!this._jogoAtivo) return;
    if (event.which === 67) {
        this.cameraManager.alternar();
    } else if (event.key === 'l' || event.key === 'L') {
        const p = document.getElementById('painel-luzes');
        if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
    } else if (event.key === 'z' || event.key === 'Z') {   // ← linha nova
        this.jogador.alternarAgacho();                      // ← linha nova
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
        this._terminarJogo();
        const painel = document.getElementById('panel-missao-concluida');
        if (painel) painel.classList.add('active');
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

    // ─── Apanhar chaves (otimizado) ───────────────────────────────────────────

    _atualizarChaves(delta) {
        if (this._chavesPendentes.length === 0) return;

        const jogadorPos = this.jogador.posicao;
        const jogadorBox = this.jogador.boxColisao;

        // Iteramos para trás para poder fazer splice sem saltarmos índices
        for (let i = this._chavesPendentes.length - 1; i >= 0; i--) {
            const chave = this._chavesPendentes[i];

            chave.update(delta);

            if (!chave.boxColisao || !jogadorBox) continue;

            // 1.ª guarda: distância ao quadrado (muito mais barato que intersectsBox)
            const dx = jogadorPos.x - chave.boxColisao.getCenter(new THREE.Vector3()).x;
            const dz = jogadorPos.z - chave.boxColisao.getCenter(new THREE.Vector3()).z;
            if (dx * dx + dz * dz > RAIO_APANHA_CHAVE_SQ) continue;

            // 2.ª guarda: colisão real apenas quando perto
            if (!jogadorBox.intersectsBox(chave.boxColisao)) continue;

            // Apanhou a chave!
            this.chavesApanhadas.add(chave.id);

            // Remove da lista de pendentes → nunca mais é testada no loop
            this._chavesPendentes.splice(i, 1);

            if (chave.grupo)  chave.grupo.visible  = false;
            if (chave.mesh)   chave.mesh.visible   = false;

            // Difere o trabalho pesado (dispose, removeFromParent, etc.)
            // para fora do frame atual — evita freeze visível
            setTimeout(() => chave.apanhar(), 200);

            console.log(`✓ Chave ${chave.id + 1} apanhada! (${this.chavesApanhadas.size}/3)`);
        }
    }

    // ─── Terminar jogo (bloqueia input, liberta rato) ─────────────────────────

    _terminarJogo() {
        this._jogoAtivo = false;
        this.teclasPressionadas.clear(); // limpa teclas que possam estar pressionadas
        // Liberta o pointer lock para o cursor ficar visível nos painéis
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

        // Destruir câmaras (remove os seus próprios event listeners)
        this.cameraManager.destruir();

        if (this.renderer?.domElement) this.renderer.domElement.remove();

        document.getElementById('painel-luzes')?.remove();
        document.getElementById('painel-chaves')?.remove();
    }

    // ─── Loop principal ───────────────────────────────────────────────────────

    _loop() {
        this._loopId = requestAnimationFrame(this._loop.bind(this));

        const delta = this.clock.getDelta();

        // Quando a missão terminou: só renderiza, não atualiza gameplay
        if (!this._jogoAtivo) {
            this.cenario.sirenes.forEach(s => s.update(delta));
            this.gestorNPCs.npcs.forEach(npc => npc._atualizarCone());
            this.cenario.skybox.position.copy(this.cameraManager.camara.position);
            this.renderer.render(this.cena, this.cameraManager.camara);
            return;
        }

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