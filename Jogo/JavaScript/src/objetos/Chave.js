import * as THREE from 'three';

/**
 * Chave colecionável para desbloquear áreas.
 * 
 * Uso:
 *   const chave = new Chave(cena, x, y, z, id);
 *   chave.update(delta); // chamar no loop de animação
 */
export class Chave {
    constructor(cena, x, y, z, id = 0) {
        this.cena = cena;
        this.id = id;
        this.apanhada = false;

        this.grupo = new THREE.Group();
        this.grupo.position.set(x, y, z);

        this._construir();
        cena.add(this.grupo);

        // Box de colisão - será inicializada após construir
        this.boxColisao = new THREE.Box3();
        this.boxColisao.setFromObject(this.grupo);
    }

    _construir() {
        // Material dourado para a chave
        const matOuro = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
        });

        // Corpo da chave (cilindro)
        const geoCorpo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
        const corpo = new THREE.Mesh(geoCorpo, matOuro);
        corpo.rotation.z = Math.PI / 2;
        corpo.position.set(-0.1, 0, 0);
        corpo.castShadow = true;
        this.grupo.add(corpo);

        // Cabeça redonda da chave
        const geoCabeca = new THREE.SphereGeometry(0.15, 8, 8);
        const cabeca = new THREE.Mesh(geoCabeca, matOuro);
        cabeca.position.set(-0.25, 0, 0);
        cabeca.castShadow = true;
        this.grupo.add(cabeca);

        // Dentes da chave (pequenos cubos)
        for (let i = 0; i < 3; i++) {
            const geoDente = new THREE.BoxGeometry(0.08, 0.06, 0.15);
            const dente = new THREE.Mesh(geoDente, matOuro);
            dente.position.set(0.15 + i * 0.1, -0.08, 0);
            dente.castShadow = true;
            this.grupo.add(dente);
        }

        // Ponto de luz para destaque
        const luz = new THREE.PointLight(0xffd700, 1, 8);
        luz.position.set(0, 0.3, 0);
        this.grupo.add(luz);
    }

    /**
     * Atualiza a chave (rotação)
     * @param {number} delta - segundos desde o último frame
     */
    update(delta) {
        if (this.apanhada) return;
        
        // Rotação contínua
        this.grupo.rotation.y += Math.PI * delta;
        
        // Movimento up-down suave
        const tempoSegundos = Date.now() * 0.001;
        const posicaoY = (this.grupo.userData.posicaoOriginalY ?? this.grupo.position.y);
        if (!this.grupo.userData.posicaoOriginalY) {
            this.grupo.userData.posicaoOriginalY = posicaoY;
        }
        this.grupo.position.y = posicaoY + Math.sin(tempoSegundos) * 0.3;

        // Atualizar box de colisão apenas (reutilizar a mesma instância)
        this.boxColisao.setFromObject(this.grupo);
        this.boxColisao.expandByScalar(0.3);
    }

    /**
     * Apanha a chave (remove da cena)
     */
    apanhar() {
        this.apanhada = true;
        this.cena.remove(this.grupo);
    }

    /**
     * Remove a chave da cena e liberta memória
     */
    destruir() {
        if (this.grupo.parent) {
            this.grupo.parent.remove(this.grupo);
        }
    }
}
