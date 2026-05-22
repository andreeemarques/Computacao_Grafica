import * as THREE from 'three';
import { Cabine } from './Cabine.js';
import { _adicionarCaixas } from './objetos/Caixas.js';
import { _adicionarContentores } from './objetos/Contentores.js';
import { adicionarEdificios } from './objetos/Edificios.js';
import { _adicionarHalfWall } from './objetos/HalfWall.js';
import { _adicionarParedesArea } from './objetos/Paredes.js';
import { criarTexturaChao } from './texturas/TexturaBase.js';
import { adicionarDecoracaoExterior } from './objetos/Decoracao.js';
import { Sirene } from './objetos/Sirene.js';
import { Chave } from './objetos/Chave.js';

export class Cenario
{
    constructor(cena, gestorColisoes) {
            this.gc = gestorColisoes;
            this._adicionarChao(cena);
            this._adicionarParedesArea(cena);
            this._adicionarCaixas(cena);
            this._adicionarEdificios(cena);
            this._adicionarContentores(cena);
            this.cabine = new Cabine(cena, 12, 15.7, 0);
            this._adicionarHalfWall(cena);
            this.skybox = this._adicionarSkybox(cena);
            this.adicionarDecoracaoExterior(cena);
            this.sirenes = [
                new Sirene(cena,  50, 3, 30, { rotacaoParede: 0,             ativo: false }),
                new Sirene(cena, -12.5, 2.5, 45, { rotacaoParede: -Math.PI / 2,  ativo: false }),
                new Sirene(cena,  12, 3, 16, { rotacaoParede:  Math.PI / 2,  ativo: false }),
            ];

            // Chaves para desbloquear a missão
            this.chaves = [
                new Chave(cena, 49, 1, 17, 0),        // Canto superior direito (spawning dos NPCs)
                new Chave(cena, 10, 1, 35, 1),       // Lado esquerdo (perto dos contentores)
                new Chave(cena, -12.5, 1, 20, 2),     // Atrás da HalfWall
            ];
        }
    
            _adicionarChao(cena) {
                const textura = criarTexturaChao();
                textura.repeat.set(25, 25); // 1 laje a cada 4 unidades no plano 100x100

                const geometria = new THREE.PlaneGeometry(200, 200);
                const material  = new THREE.MeshStandardMaterial({
                    map:       textura,
                    roughness: 0.9,
                    metalness: 0.02,
                });
                const mesh = new THREE.Mesh(geometria, material);
                mesh.rotation.x    = -Math.PI / 2;
                mesh.receiveShadow = true;
                cena.add(mesh);
            }
        
            _adicionarSkybox(cena) {
                const loader = new THREE.TextureLoader();
                const materiais = [];
                const faces = [
                    './Skybox/Face3.png', './Skybox/Face0.png', './Skybox/Face_de_cima.png',
                    './Skybox/Face_do_chao.png', './Skybox/Face2.png', './Skybox/Face1.png'
                ];

                faces.forEach(face => {
                    loader.loadAsync(face).then(texture => {
                        const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
                        const idx = faces.indexOf(face);
                        if (materiais[idx]) materiais[idx] = mat;
                        else materiais[idx] = mat;
                    });
                });

                const skybox = new THREE.Mesh(new THREE.BoxGeometry(170, 170, 170), materiais);
                cena.add(skybox);
                return skybox;
            }

            _adicionarParedesArea(cena) {
                _adicionarParedesArea(cena, this.gc);
            }

            _adicionarCaixas(cena) {
                _adicionarCaixas(cena, this.gc);
            }

            _adicionarEdificios(cena) {
                adicionarEdificios(cena, this.gc);
            }

            _adicionarContentores(cena) {
                _adicionarContentores(cena, this.gc);
            }

            _adicionarHalfWall(cena) {
                _adicionarHalfWall(cena, this.gc);
            }
            adicionarDecoracaoExterior(cena)
            {
                adicionarDecoracaoExterior(cena);
            }
}