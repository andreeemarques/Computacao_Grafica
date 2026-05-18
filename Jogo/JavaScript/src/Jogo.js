import * as THREE from 'three';
import { GestorColisoes } from './GestorColisoes.js';
import { Jogador }        from './Jogador.js';
import { CamaraManager }  from './Camara.js';
import { Cenario }        from './Cenario.js';
import { GestorLuzes }    from './Luzes.js';
import { UILuzes }        from './UILuzes.js';
import { GestorNPCs } from './NPC.js';

export class Jogo
{
    constructor() {
        this.cena      = new THREE.Scene();
        this.clock    = new THREE.Clock(); // aqui adicionei o clock para o delta
        this.renderer  = this._criarRenderer();
        this.gestorColisoes   = new GestorColisoes();
        this.gestorLuzes     = new GestorLuzes(this.cena, this.gestorColisoes);
        this.cenario          = new Cenario(this.cena, this.gestorColisoes); // ← passar
        this.jogador          = new Jogador(this.cena, this.gestorColisoes); // ← passar
        this.cameraManager = new CamaraManager(this.renderer, this.gestorColisoes);
        this.uiLuzes         = new UILuzes(this.gestorLuzes);
        this.teclasPressionadas = new Set();
        this._loopId = null;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this.gestorNPCs = new GestorNPCs(this.cena, this.gestorColisoes);
        this.missaoConcluida = false;
        this.missaoFalhada   = false;
        this.chavesApanhadas = new Set(); // Rastrear as chaves que o jogador tem
        this._tempoMensagemChaves = 0;
        this._timeoutMensagemChaves = null; // Timeout para esconder a mensagem
        this._ultimaMensagemPosicao = null; // Rastrear a última vez que mostrou a mensagem
        this.pontoMissao = {
            minX: -14, maxX: -5,
            minZ: 10,  maxZ: 13
        };

        // Criar painel de mensagem de chaves
        this._criarPainelChaves();

        // Colisão manual para a cabine
        this.gestorColisoes.registarBox(
            new THREE.Vector3(10.5, 0, 14.2),
            new THREE.Vector3(13.5, 3.2, 17.2)
        );

          this.gestorNPCs.adicionar([
            { x: 36, z: 16 },
            { x: 36, z: 40 },
            { x: 29, z: 40 },
            { x: 29, z: 16 },
        ]);
        this.gestorNPCs.adicionar([
            { x: 48, z: 16 },
            { x: 48, z: 41 },
            { x: 40, z: 41},
            { x: 40, z: 16},
        ]);
        this.gestorNPCs.adicionar([
            {x:12, z:18},
        ]);
        this.gestorNPCs.adicionar([
            {x:-32, z:16},
            {x:-32, z:48},
            {x:8, z:48},
            {x:8, z:16},
            {x:-10, z:16},
        ]);

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

    _criarPainelChaves() {
        const painel = document.createElement('div');
        painel.id = 'painel-chaves';
        painel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
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
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            transition: opacity 0.3s ease-out;
            opacity: 0;
        `;
        document.body.appendChild(painel);
        this._painelChaves = painel;
    }

    _mostrarMensagemChaves(mensagem) {
        if (!this._painelChaves) return;
        
        // Limpar timeout anterior se existir
        if (this._timeoutMensagemChaves) {
            clearTimeout(this._timeoutMensagemChaves);
        }
        
        // Mostrar o painel
        this._painelChaves.textContent = mensagem;
        this._painelChaves.style.display = 'block';
        this._painelChaves.style.opacity = '1';
        
        // Esconder automaticamente após 4 segundos
        this._timeoutMensagemChaves = setTimeout(() => {
            this._painelChaves.style.opacity = '0';
            setTimeout(() => {
                this._painelChaves.style.display = 'none';
            }, 300); // Esperar pela animação de fade out
        }, 4000);
    }

    _ocultarMensagemChaves() {
        if (!this._painelChaves) return;
        if (this._timeoutMensagemChaves) {
            clearTimeout(this._timeoutMensagemChaves);
        }
        this._painelChaves.style.opacity = '0';
        setTimeout(() => {
            this._painelChaves.style.display = 'none';
        }, 300);
    }

    _registarEventos() {
        document.addEventListener('keydown', this._onKeyDown, false);
        document.addEventListener('keyup', this._onKeyUp, false);
    }

    _onKeyDown(event) {
        if (event.which === 67) { // C
            this.cameraManager.alternar();
        }
        else if (event.key === 'l' || event.key === 'L') {
            const p = document.getElementById('painel-luzes');
            if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
        } else if ([87, 83, 65, 68].includes(event.which)) {
            this.teclasPressionadas.add(event.which);
        }
    }

    _onKeyUp(event) {
        if ([87, 83, 65, 68].includes(event.which)) {
            this.teclasPressionadas.delete(event.which);
        }
    }

    _verificarMissao() {
        if (this.missaoConcluida) return;

        const { x, z } = this.jogador.posicao;
        const { minX, maxX, minZ, maxZ } = this.pontoMissao;
        if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
            // Verificar se o jogador tem as 3 chaves
            if (this.chavesApanhadas.size < 3) {
                // Mostrar mensagem apenas se não foi mostrada recentemente
                const agora = Date.now();
                if (!this._ultimaMensagemPosicao || agora - this._ultimaMensagemPosicao > 5000) {
                    this._mostrarMensagemChaves(`⚠ Precisas de apanhar as 3 chaves!\nTens ${this.chavesApanhadas.size}/3`);
                    this._ultimaMensagemPosicao = agora;
                }
                return;
            } else {
                this._ocultarMensagemChaves();
            }
            
            this.missaoConcluida = true;
            const painel = document.getElementById('panel-missao-concluida');
            if (painel) painel.classList.add('active');
        }
    }

    _verificarDetecao(emAlerta) {
        if (this.missaoFalhada || this.missaoConcluida) return;
        if (!emAlerta) return;

        this.missaoFalhada = true;

        this.cenario.sirenes.forEach(s => s.ligar());

        setTimeout(() => {
            const painel = document.getElementById('panel-missao-falhada');
            if (painel) painel.classList.add('active');
        }, 2500);
    }

    destruir() {
        if (this._loopId !== null) {
            cancelAnimationFrame(this._loopId);
            this._loopId = null;
        }
        if (this._timeoutMensagemChaves) {
            clearTimeout(this._timeoutMensagemChaves);
        }
        document.removeEventListener('keydown', this._onKeyDown, false);
        document.removeEventListener('keyup', this._onKeyUp, false);
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.remove();
        }
        const painelLuzes = document.getElementById('painel-luzes');
        if (painelLuzes) {
            painelLuzes.remove();
        }
        const painelChaves = document.getElementById('painel-chaves');
        if (painelChaves) {
            painelChaves.remove();
        }
    }

    _loop() {
        const delta = this.clock.getDelta();

        this.gestorColisoes.atualizar();
        this.jogador.mover(this.cameraManager.angulo, Array.from(this.teclasPressionadas));
        this.jogador.atualizar(this.teclasPressionadas.size > 0);
        this.jogador.orientarParaCamera(this.cameraManager.camara);
        this.cameraManager.atualizar(this.jogador.posicao);
        this._verificarMissao();
        
        // Atualizar chaves apenas se ainda não foram todas apanhadas
        if (this.chavesApanhadas.size < 3) {
            for (const chave of this.cenario.chaves) {
                chave.update(delta);
                if (!chave.apanhada && this.jogador.boxColisao && chave.boxColisao) {
                    if (this.jogador.boxColisao.intersectsBox(chave.boxColisao)) {
                        this.chavesApanhadas.add(chave.id);
                        chave.apanhar();
                        console.log(`✓ Chave ${chave.id + 1} apanhada! (${this.chavesApanhadas.size}/3)`);
                    }
                }
            }
        }
        
        this.cenario.sirenes.forEach(s => s.update(delta));

        this.cenario.skybox.position.copy(this.cameraManager.camara.position);
        this.renderer.render(this.cena, this.cameraManager.camara);
        this._loopId = requestAnimationFrame(this._loop.bind(this));
        const emAlerta = this.gestorNPCs.atualizar(this.jogador.posicao);
        this._verificarDetecao(emAlerta);
    }
}