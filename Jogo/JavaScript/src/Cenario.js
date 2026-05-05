import * as THREE from 'three';
import { Cabine } from './Cabine.js';
import { _adicionarCaixas } from './objetos/Caixas.js';
import { _adicionarContentores } from './objetos/Contentores.js';
import { adicionarEdificios } from './objetos/Edificios.js';
import { _adicionarHalfWall } from './objetos/HalfWall.js';
import { _adicionarParedesArea } from './objetos/Paredes.js';

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
        }
    
        _adicionarChao(cena) {
            const geometria = new THREE.PlaneGeometry(100, 100);
            const material  = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const mesh      = new THREE.Mesh(geometria, material);
            mesh.rotation.x    = -Math.PI / 2;
            mesh.receiveShadow = true;
            cena.add(mesh);
        }
    
        _adicionarSkybox(cena) {
            const loader    = new THREE.TextureLoader();
            const materiais = [
                new THREE.MeshBasicMaterial({ map: loader.load(`./Skybox/Face0.png`), side: THREE.BackSide }),
                new THREE.MeshBasicMaterial({ map: loader.load(`./Skybox/Face3.png`), side: THREE.BackSide }),
                new THREE.MeshBasicMaterial({ map: loader.load(`./Skybox/Face_de_cima.png`), side: THREE.BackSide }),
                new THREE.MeshBasicMaterial({ map: loader.load(`./Skybox/Face_do_chao.png`), side: THREE.BackSide }),
                new THREE.MeshBasicMaterial({ map: loader.load(`./Skybox/Face1.png`), side: THREE.BackSide }),
                new THREE.MeshBasicMaterial({ map: loader.load(`./Skybox/Face2.png`), side: THREE.BackSide })
            ];
            const skybox = new THREE.Mesh(new THREE.BoxGeometry(1500, 1500, 1500), materiais);
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
}