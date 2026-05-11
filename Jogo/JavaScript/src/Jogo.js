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
        this.renderer  = this._criarRenderer();
        this.gestorColisoes   = new GestorColisoes();
        this.gestorLuzes     = new GestorLuzes(this.cena, this.gestorColisoes);
        this.cenario          = new Cenario(this.cena, this.gestorColisoes); // ← passar
        this.jogador          = new Jogador(this.cena, this.gestorColisoes); // ← passar
        this.cameraManager = new CamaraManager(this.renderer);
        this.uiLuzes         = new UILuzes(this.gestorLuzes);
        this.teclasPressionadas = new Set();
        this.gestorNPCs = new GestorNPCs(this.cena, this.gestorColisoes);

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

    _registarEventos() {
        document.addEventListener('keydown', (event) => {
            if (event.which === 67) { // C
                this.cameraManager.alternar();
            }
            else if (event.key === 'l' || event.key === 'L')
            {
                const p = document.getElementById('painel-luzes');
                p.style.display = p.style.display === 'none' ? 'block' : 'none';
            } else if ([87, 83, 65, 68].includes(event.which)) {
                this.teclasPressionadas.add(event.which);
            }
        }, false);
        document.addEventListener('keyup', (event) => {
            if ([87, 83, 65, 68].includes(event.which)) {
                this.teclasPressionadas.delete(event.which);
            }
        }, false);
    }

    

    _loop() {
        this.jogador.mover(this.cameraManager.angulo, Array.from(this.teclasPressionadas));
        this.jogador.atualizar(this.teclasPressionadas.size > 0);
        this.jogador.orientarParaCamera(this.cameraManager.camara);
        this.cameraManager.atualizar(this.jogador.posicao);
        // Fazer a skybox seguir a câmara
        this.cenario.skybox.position.copy(this.cameraManager.camara.position);
        this.renderer.render(this.cena, this.cameraManager.camara);
        requestAnimationFrame(this._loop.bind(this));
        this.gestorNPCs.atualizar(this.jogador.posicao);
    }
}