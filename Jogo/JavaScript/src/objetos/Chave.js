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

        this._meshes = []; // Cache dos meshes para otimização
        this._construir();
        cena.add(this.grupo);

        this.boxColisao = new THREE.Box3();
        this.boxColisao.setFromObject(this.grupo);
        this._aFadeOut = false;
        this._tempoFade = 0;
    }

    _construir() {
        // Material dourado para a chave (criado POR CHAVE para evitar recompilação de shaders)
        const matOuro = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            transparent: true,  // ← Já definido aqui para evitar recompilação depois
            opacity: 1.0,
        });

        // Corpo da chave (cilindro)
        const geoCorpo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
        const corpo = new THREE.Mesh(geoCorpo, matOuro);
        corpo.rotation.z = Math.PI / 2;
        corpo.position.set(-0.1, 0, 0);
        this.grupo.add(corpo);
        this._meshes.push(corpo);

        // Cabeça redonda da chave
        const geoCabeca = new THREE.SphereGeometry(0.15, 8, 8);
        const cabeca = new THREE.Mesh(geoCabeca, matOuro);
        cabeca.position.set(-0.25, 0, 0);
        this.grupo.add(cabeca);
        this._meshes.push(cabeca);

        // Dentes da chave (pequenos cubos)
        for (let i = 0; i < 3; i++) {
            const geoDente = new THREE.BoxGeometry(0.08, 0.06, 0.15);
            const dente = new THREE.Mesh(geoDente, matOuro);
            dente.position.set(0.15 + i * 0.1, -0.08, 0);
            this.grupo.add(dente);
            this._meshes.push(dente);
        }

        // Ponto de luz para destaque (será desativada no fade-out)
        const luz = new THREE.PointLight(0xffd700, 0.15, 8);  // ← Intensidade ao mínimo (0.15)
        luz.position.set(0, 0.3, 0);
        this.grupo.add(luz);
        this._luz = luz;
    }

    update(delta) {
        if (this.apanhada) return;

        if (this._aFadeOut) {
            this._tempoFade += delta;
            const duracao = 0.4;
            const progress = Math.min(this._tempoFade / duracao, 1);
            const opacity = 1 - progress;

            // Atualizar só os meshes em cache (muito mais rápido)
            for (let i = 0; i < this._meshes.length; i++) {
                this._meshes[i].material.opacity = opacity;
            }

            if (progress >= 1) {
                this.apanhar();
            }
            return;
        }

        this.grupo.rotation.y += Math.PI * delta;

        const tempoSegundos = Date.now() * 0.001;
        const posicaoY = (this.grupo.userData.posicaoOriginalY ?? this.grupo.position.y);
        if (!this.grupo.userData.posicaoOriginalY) {
            this.grupo.userData.posicaoOriginalY = posicaoY;
        }
        this.grupo.position.y = posicaoY + Math.sin(tempoSegundos) * 0.3;

        const r = 0.2;
        this.boxColisao.min.set(this.grupo.position.x - r, this.grupo.position.y - r, this.grupo.position.z - r);
        this.boxColisao.max.set(this.grupo.position.x + r, this.grupo.position.y + r, this.grupo.position.z + r);
    }

    /**
     * Atualiza proximidade do jogador (chamado externamente)
     * A luz já está ao mínimo por defeito, este método pode ser used para lógica futura se necessário
     */
    atualizarProximidadeJogador(distanciaAoJogador) {
        // Luz já está ao mínimo (0.15) no construtor
        // Este espaço fica reservado para lógica futura se precisares
    }

    /**
     * Inicia fade-out e remove após animação
     */
    iniciarDesaparecimento() {
        if (this._aFadeOut || this.apanhada) return;
        
        // Desativar luz para não atualizar iluminação da cena
        if (this._luz) {
            this._luz.visible = false;
        }
        
        this._aFadeOut = true;
        this._tempoFade = 0;
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
