import * as THREE from 'three';

export class Jogador 
{
    constructor(cena, gestorColisoes) {
            const geometria = new THREE.BoxGeometry(1, 1, 1);
            const textura   = new THREE.TextureLoader().load('./Imagens/boxImage.jpg');
            const material  = new THREE.MeshStandardMaterial({ map: textura });
    
            this.mesh = new THREE.Mesh(geometria, material);
            this.mesh.position.set(49, 0.5, 49);
            this.mesh.castShadow    = true;
            this.mesh.receiveShadow = true;
    
            this.gestorColisoes = gestorColisoes;
    
            cena.add(this.mesh);
        }
    
        _boxNaPosicao(posicao) {
            const raio = 0.45; // ligeiramente menor que 0.5 para melhor feel
            return new THREE.Box3(
                new THREE.Vector3(posicao.x - raio, posicao.y - 0.5, posicao.z - raio),
                new THREE.Vector3(posicao.x + raio, posicao.y + 0.5, posicao.z + raio)
            );
        }
    
        mover(cameraAngle, tecla) {
            const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
            const right   = new THREE.Vector3(-Math.cos(cameraAngle), 0,  Math.sin(cameraAngle));
            const passo   = 0.25;
    
            let delta = new THREE.Vector3();
            if (tecla === 87) delta.add(forward.clone().multiplyScalar( passo));
            if (tecla === 83) delta.add(forward.clone().multiplyScalar(-passo));
            if (tecla === 65) delta.add(right.clone().multiplyScalar(  passo));
            if (tecla === 68) delta.add(right.clone().multiplyScalar( -passo));
    
            if (delta.lengthSq() === 0) return;
    
            const posAtual = this.mesh.position.clone();
    
            // ── Tentativa 1: movimento completo (X + Z) ──
            const posTotal = posAtual.clone().add(delta);
            if (!this.gestorColisoes.colide(this._boxNaPosicao(posTotal))) {
                this.mesh.position.copy(posTotal);
                return;
            }
    
            // ── Tentativa 2: só X (deslizar ao longo de Z) ──
            const posSoX = posAtual.clone();
            posSoX.x += delta.x;
            if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoX))) {
                this.mesh.position.copy(posSoX);
                return;
            }
    
            // ── Tentativa 3: só Z (deslizar ao longo de X) ──
            const posSoZ = posAtual.clone();
            posSoZ.z += delta.z;
            if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoZ))) {
                this.mesh.position.copy(posSoZ);
            }
        }
    
        orientarParaCamera(camara) {
            const alvo = new THREE.Vector3(camara.position.x, this.mesh.position.y, camara.position.z);
            this.mesh.lookAt(alvo);
        }
    
        get posicao() {
            return this.mesh.position;
        }
}