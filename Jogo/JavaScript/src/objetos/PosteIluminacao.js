import * as THREE from 'three';

export class PosteIluminacao {
    constructor(cena, x, z, cor = 0xffaa44, intensidade = 2, alcance = 25) {
        this.grupo = new THREE.Group();
        this._construir(cor);
        this.grupo.position.set(x, 0, z);
        cena.add(this.grupo);

        // ── PointLight no topo do poste ──
        this.luz = new THREE.PointLight(cor, intensidade, alcance);
        this.luz.position.set(x, 7.4, z);
        this.luz.castShadow = true;
        this.luz.shadow.mapSize.set(512, 512);
        cena.add(this.luz);

        // Guarda intensidade original para ligar/desligar
        this._intensidade = intensidade;
    }

    _construir(cor) {
        const matPoste = new THREE.MeshStandardMaterial({
            color:     0x555555,
            metalness: 0.8,
            roughness: 0.3,
        });
        const matLampada = new THREE.MeshStandardMaterial({
            color:     cor,
            emissive:  cor,
            emissiveIntensity: 1.2,
            roughness: 0.2,
            metalness: 0.1,
        });
        const matCarcaca = new THREE.MeshStandardMaterial({
            color:     0x333333,
            metalness: 0.9,
            roughness: 0.2,
        });

        // ── Base ──
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8),
            matPoste
        );
        base.position.y = 0.15;
        base.castShadow = true;
        this.grupo.add(base);

        // ── Fuste (poste vertical) ──
        const fuste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.09, 7, 8),
            matPoste
        );
        fuste.position.y = 3.8;
        fuste.castShadow = true;
        this.grupo.add(fuste);

        // ── Braço curvo (feito de 2 peças) ──
        const bracoPrincipal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6),
            matPoste
        );
        bracoPrincipal.rotation.z = -Math.PI/2;
        bracoPrincipal.position.set(0.55, 7.4, 0);
        bracoPrincipal.castShadow = true;
        this.grupo.add(bracoPrincipal);

        const bracoHorizontal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.8, 6),
            matPoste
        );
        bracoHorizontal.rotation.z = -Math.PI / 2;
        bracoHorizontal.position.set(1.25, 7.4, 0);
        bracoHorizontal.castShadow = true;
        this.grupo.add(bracoHorizontal);

        // ── Carcaça da luminária ──
        const carcaca = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.15, 0.25),
            matCarcaca
        );
        carcaca.position.set(1.4, 7.45, 0);
        carcaca.castShadow = true;
        this.grupo.add(carcaca);

        // ── Difusor (vidro da lâmpada) ──
        const difusor = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.08, 0.18),
            matLampada
        );
        difusor.position.set(1.4, 7.35, 0);
        this.grupo.add(difusor);

        // ── Anel de reforço no fuste ──
        [2.5, 5.0].forEach(y => {
            const anel = new THREE.Mesh(
                new THREE.TorusGeometry(0.1, 0.025, 6, 12),
                matPoste
            );
            anel.rotation.x = Math.PI / 2;
            anel.position.y = y;
            this.grupo.add(anel);
        });
    }

    ligar() {
        this.luz.intensity = this._intensidade;
        // Reativa emissive da lâmpada
        this.grupo.traverse(obj => {
            if (obj.isMesh && obj.material.emissiveIntensity !== undefined) {
                obj.material.emissiveIntensity = 1.2;
            }
        });
    }

    desligar() {
        this.luz.intensity = 0;
        this.grupo.traverse(obj => {
            if (obj.isMesh && obj.material.emissiveIntensity !== undefined) {
                obj.material.emissiveIntensity = 0;
            }
        });
    }

    get estaLigado() {
        return this.luz.intensity > 0;
    }
}