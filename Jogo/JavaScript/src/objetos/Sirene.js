import * as THREE from 'three';

/**
 * Sirene rotativa estilo militar/industrial para montar em paredes.
 *
 * Uso:
 *   const sirene = new Sirene(cena, x, y, z, { ativo: true, velocidade: 2 });
 *   sirene.update(delta); // chamar no loop de animação
 *   sirene.ligar();
 *   sirene.desligar();
 */
export class Sirene {
    /**
     * @param {THREE.Scene}  cena
     * @param {number}       x
     * @param {number}       y
     * @param {number}       z
     * @param {object}       opcoes
     * @param {boolean}      [opcoes.ativo=false]       - começa a girar?
     * @param {number}       [opcoes.velocidade=2]      - rotações por segundo
     * @param {number}       [opcoes.rotacaoParede=0]   - rotação Y para alinhar com a parede (radianos)
     * @param {number}       [opcoes.escala=1]          - escala global
     * @param {number}       [opcoes.corLuz=0xff2200]   - cor da luz de alerta
     */
    constructor(cena, x, y, z, opcoes = {}) {
        this.cena        = cena;
        this.ativo       = opcoes.ativo       ?? false;
        this.velocidade  = opcoes.velocidade  ?? 2;          // rad/s × 2π
        this.escala      = opcoes.escala      ?? 1;
        this.corLuz      = opcoes.corLuz      ?? 0xff2200;

        this._tempoBlink = 0;
        this._luzLigada  = false;

        this.grupo = new THREE.Group();
        this.grupo.position.set(x, y, z);
        this.grupo.rotation.y = opcoes.rotacaoParede ?? 0;
        this.grupo.scale.setScalar(this.escala);

        this._construir();
        cena.add(this.grupo);
    }

    // ─────────────────────────────────────────
    //  Construção do modelo
    // ─────────────────────────────────────────

    _construir() {
        const matMetal = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a, roughness: 0.6, metalness: 0.8,
        });
        const matAmarelo = new THREE.MeshStandardMaterial({
            color: 0xccaa00, roughness: 0.5, metalness: 0.7,
        });
        const matVermelho = new THREE.MeshStandardMaterial({
            color: 0xcc1100, roughness: 0.4, metalness: 0.3,
        });

        // ── Suporte de parede (bracket em L) ─────────────────
        const geoBracketH = new THREE.BoxGeometry(0.3, 0.12, 0.5);
        const bracketH    = new THREE.Mesh(geoBracketH, matMetal);
        bracketH.position.set(0, 0, 0.25);
        bracketH.castShadow = true;
        this.grupo.add(bracketH);

        const geoBracketV = new THREE.BoxGeometry(0.12, 0.5, 0.12);
        const bracketV    = new THREE.Mesh(geoBracketV, matMetal);
        bracketV.position.set(0, 0.25, 0);
        bracketV.castShadow = true;
        this.grupo.add(bracketV);

        // Parafusos decorativos no suporte
        [-0.08, 0.08].forEach(ox => {
            const geoP = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 6);
            const p    = new THREE.Mesh(geoP, matMetal);
            p.rotation.x = Math.PI / 2;
            p.position.set(ox, 0, 0.02);
            this.grupo.add(p);
        });

        // ── Base da sirene ────────────────────────────────────
        const geoBase = new THREE.CylinderGeometry(0.22, 0.25, 0.18, 12);
        const base    = new THREE.Mesh(geoBase, matMetal);
        base.position.set(0, 0.5, 0.3);
        base.castShadow = true;
        this.grupo.add(base);

        // ── Corpo central (cápsula) ───────────────────────────
        const geoCorpo = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12);
        const corpo    = new THREE.Mesh(geoCorpo, matAmarelo);
        corpo.position.set(0, 0.75, 0.3);
        corpo.castShadow = true;
        this.grupo.add(corpo);

        // ── Grupo rotativo (farol + reflector) ───────────────
        this._grupoRotativo = new THREE.Group();
        this._grupoRotativo.position.set(0, 0.92, 0.3);
        this.grupo.add(this._grupoRotativo);

        // Cúpula de vidro (hemisfera)
        const geoCupula = new THREE.SphereGeometry(0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        this._matCupula = new THREE.MeshStandardMaterial({
            color:       this.corLuz,
            emissive:    this.corLuz,
            emissiveIntensity: 0,
            transparent: true,
            opacity:     0.55,
            roughness:   0.05,
            metalness:   0.1,
        });
        const cupula = new THREE.Mesh(geoCupula, this._matCupula);
        cupula.castShadow = false;
        this._grupoRotativo.add(cupula);

        // Reflector interno (disco brilhante)
        const geoReflector = new THREE.CylinderGeometry(0.16, 0.18, 0.06, 12);
        const matReflector = new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.1, metalness: 0.9,
        });
        const reflector = new THREE.Mesh(geoReflector, matReflector);
        reflector.position.y = 0.02;
        this._grupoRotativo.add(reflector);

        // Lente central (ponto de luz)
        const geoLente = new THREE.SphereGeometry(0.08, 10, 8);
        this._matLente = new THREE.MeshStandardMaterial({
            color:             0xffffff,
            emissive:          this.corLuz,
            emissiveIntensity: 0,
            roughness:         0.0,
            metalness:         0.0,
        });
        const lente = new THREE.Mesh(geoLente, this._matLente);
        lente.position.y = 0.08;
        this._grupoRotativo.add(lente);

        // Aba de protecção superior
        const geoAba = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 12);
        const aba    = new THREE.Mesh(geoAba, matMetal);
        aba.position.y = 0.22;
        this._grupoRotativo.add(aba);

        // ── Luz pontual (PointLight) ──────────────────────────
        this._luz = new THREE.PointLight(this.corLuz, 0, 12, 1.5);
        this._luz.position.set(0, 0.92, 0.3);
        this.grupo.add(this._luz);

        // ── Fios decorativos descendo pelo suporte ────────────
        const matFio = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
        const geoFio = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4);
        const fio    = new THREE.Mesh(geoFio, matFio);
        fio.position.set(0.06, 0.25, 0.05);
        this.grupo.add(fio);
    }

    // ─────────────────────────────────────────
    //  API pública
    // ─────────────────────────────────────────

    ligar()    { this.ativo = true;  }
    desligar() { this.ativo = false; this._apagar(); }

    /**
     * Chamar no loop de animação principal.
     * @param {number} delta - segundos desde o último frame (clock.getDelta())
     */
    update(delta) {
        if (!this.ativo) return;

        // Rotação contínua do farol
        this._grupoRotativo.rotation.y += this.velocidade * Math.PI * 2 * delta;

        // Blink da luz (liga/desliga ~2× por rotação completa)
        this._tempoBlink += delta;
        const periodo = 1 / (this.velocidade * 2);
        if (this._tempoBlink >= periodo) {
            this._tempoBlink -= periodo;
            this._luzLigada = !this._luzLigada;
            this._luzLigada ? this._acender() : this._apagar();
        }
    }

    // ─────────────────────────────────────────
    //  Internos
    // ─────────────────────────────────────────

    _acender() {
        this._matCupula.emissiveIntensity = 1.5;
        this._matLente.emissiveIntensity  = 3.0;
        this._luz.intensity               = 3.5;
    }

    _apagar() {
        this._matCupula.emissiveIntensity = 0;
        this._matLente.emissiveIntensity  = 0;
        this._luz.intensity               = 0;
    }

    /** Remove a sirene da cena e liberta memória. */
    destruir() {
        this.cena.remove(this.grupo);
        this.grupo.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
}