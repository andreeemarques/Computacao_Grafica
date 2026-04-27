import * as THREE from 'three';
import { GestorColisoes } from './GestorColisoes.js';
import { Jogador }        from './Jogador.js';
import { CamaraManager }  from './Camara.js';
import { Cenario }        from './Cenario.js';

export class Jogo
{
    constructor() {
            this.cena      = new THREE.Scene();
            this.renderer  = this._criarRenderer();
           this.gestorColisoes   = new GestorColisoes();               // ← criar primeiro
            this.cenario          = new Cenario(this.cena, this.gestorColisoes); // ← passar
            this.jogador          = new Jogador(this.cena, this.gestorColisoes); // ← passar
            this.cameraManager = new CamaraManager(this.renderer);
    
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