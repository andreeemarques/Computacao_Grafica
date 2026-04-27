import * as THREE from 'three';

export class Jogador 
{
    constructor(cena, gestorColisoes) {
        this.grupo = new THREE.Group();
        this.grupo.position.set(49, 0, 49);
        this._construir();
        cena.add(this.grupo);
        
        this.gestorColisoes = gestorColisoes;
        this.mesh = this.grupo; // Compatibilidade com código existente
    }
    
    // ── Métodos de Materiais ──────────────────────────────
    _matPele()    { return new THREE.MeshStandardMaterial({ color: 0xdca880, roughness: 0.8 }); }
    _matFato()    { return new THREE.MeshStandardMaterial({ color: 0x1a1f1a, roughness: 0.75, metalness: 0.05 }); }
    _matBandana() { return new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.9 }); }
    _matEquip()   { return new THREE.MeshStandardMaterial({ color: 0x2a2f2a, roughness: 0.6, metalness: 0.3 }); }
    _matMetal()   { return new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.2, metalness: 0.9 }); }
    _matOlho()    { return new THREE.MeshStandardMaterial({ color: 0x3a5c5c, roughness: 0.3 }); }
    _matCabelo()  { return new THREE.MeshStandardMaterial({ color: 0x4a321f, roughness: 0.8 }); }
    _matSola()    { return new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.95 }); }

    _criarTexturaCamuflagem() {
        const W = 256, H = 256;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1f1a';
        ctx.fillRect(0, 0, W, H);
        const cores = ['rgba(12,16,12,0.9)', 'rgba(28,36,24,0.85)', 'rgba(35,42,30,0.75)'];
        for (let i = 0; i < 90; i++) {
            const cx = Math.random() * W;
            const cy = Math.random() * H;
            const rx = 10 + Math.random() * 38;
            const ry = 6 + Math.random() * 22;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.random() * Math.PI);
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = cores[Math.floor(Math.random() * cores.length)];
            ctx.fill();
            ctx.restore();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 3);
        return tex;
    }

    _criarCapsule(radius, length, radialSegments = 8, lengthSegments = 1) {
        // Criador alternativo de Capsule usando LatheGeometry
        const points = [];
        const segLen = length / (lengthSegments || 1);
        
        // Meia-esfera superior
        for (let i = 0; i <= 8; i++) {
            const angle = (i / 8) * Math.PI / 2;
            points.push(new THREE.Vector2(Math.sin(angle) * radius, segLen / 2 + Math.cos(angle) * radius));
        }
        // Cilindro
        for (let i = 0; i <= 4; i++) {
            points.push(new THREE.Vector2(radius, segLen / 2 - (i / 4) * segLen));
        }
        // Meia-esfera inferior
        for (let i = 8; i >= 0; i--) {
            const angle = (i / 8) * Math.PI / 2;
            points.push(new THREE.Vector2(Math.sin(angle) * radius, -segLen / 2 - Math.cos(angle) * radius));
        }
        
        return new THREE.LatheGeometry(points, radialSegments);
    }

    _construir() {
        this._construirBotas();
        this._construirPernas();
        this._construirTorso();
        this._construirBracos();
        this._construirPescoco();
        this._construirCabeca();
        this._construirCabelo();
        this._construirBandana();
        this._construirEquipamento();
    }

    _construirBotas() {
        const matB = this._matFato();
        const matS = this._matSola();
        [[-0.12, 1], [0.12, -1]].forEach(([dx]) => {
            const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.32, 10), matB);
            cano.position.set(dx, 0.22, 0);
            this.grupo.add(cano);
            const biq = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.22), matB);
            biq.position.set(dx, 0.06, 0.04);
            this.grupo.add(biq);
            const sola = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.24), matS);
            sola.position.set(dx, 0.015, 0.04);
            this.grupo.add(sola);
        });
    }

    _construirPernas() {
        const matC = new THREE.MeshStandardMaterial({ map: this._criarTexturaCamuflagem(), roughness: 0.8 });
        [[-0.12, 1], [0.12, -1]].forEach(([dx]) => {
            const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.085, 0.42, 10), matC);
            coxa.position.set(dx, 0.70, 0);
            this.grupo.add(coxa);
            const canela = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.32, 10), matC);
            canela.position.set(dx, 0.35, 0);
            this.grupo.add(canela);
        });
    }

    _construirTorso() {
        const matC = new THREE.MeshStandardMaterial({ map: this._criarTexturaCamuflagem(), roughness: 0.8 });
        const matEq = this._matEquip();

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.52, 0.26), matC);
        torso.position.set(0, 1.16, 0);
        this.grupo.add(torso);

        const peito = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 8), matC);
        peito.rotation.z = Math.PI / 2;
        peito.position.set(0, 1.25, 0.14);
        this.grupo.add(peito);

        const cintura = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.18, 12), matC);
        cintura.position.set(0, 0.88, 0);
        this.grupo.add(cintura);

        const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.06, 14), matEq);
        cinto.position.set(0, 0.87, 0);
        this.grupo.add(cinto);
    }

    _construirBracos() {
        const matC = new THREE.MeshStandardMaterial({ map: this._criarTexturaCamuflagem(), roughness: 0.8 });
        const matP = this._matPele();
        [[-0.28, 1], [0.28, -1]].forEach(([dx]) => {
            const om = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), matC);
            om.position.set(dx, 1.38, 0);
            this.grupo.add(om);
            const bSup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.34, 10), matC);
            bSup.position.set(dx, 1.18, 0);
            this.grupo.add(bSup);
            const aB = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.30, 10), matC);
            aB.position.set(dx, 0.84, 0);
            this.grupo.add(aB);
            const mao = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.05), matP);
            mao.position.set(dx, 0.67, 0.01);
            this.grupo.add(mao);
        });
    }

    _construirPescoco() {
        const mat = this._matPele();
        const pes = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), mat);
        pes.position.set(0, 1.50, 0);
        this.grupo.add(pes);
    }

    _construirCabeca() {
        const matP = this._matPele();
        const cab = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), matP);
        cab.scale.set(1.0, 1.15, 0.95);
        cab.position.set(0, 1.72, 0);
        this.grupo.add(cab);

        const queixo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matP);
        queixo.scale.set(1.1, 0.6, 0.8);
        queixo.position.set(0, 1.62, 0.06);
        this.grupo.add(queixo);

        const matOlho = this._matOlho();
        [[-0.07, 0], [0.07, 0]].forEach(([dx]) => {
            const olho = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), matOlho);
            olho.position.set(dx, 1.74, 0.15);
            this.grupo.add(olho);
            
            const pestanas = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.03), this._matCabelo());
            pestanas.position.set(dx, 1.77, 0.16);
            this.grupo.add(pestanas);
        });
    }

    _construirCabelo() {
        const mat = this._matCabelo();
        const base = new THREE.Mesh(new THREE.SphereGeometry(0.195, 12, 12), mat);
        base.scale.set(1.05, 1.0, 1.1);
        base.position.set(0, 1.75, -0.02);
        this.grupo.add(base);

        const rabo = new THREE.Mesh(this._criarCapsule(0.05, 0.4, 6), mat);
        rabo.position.set(0, 1.6, -0.22);
        rabo.rotation.x = -0.4;
        this.grupo.add(rabo);

        [[-0.18, 1], [0.18, -1]].forEach(([dx]) => {
            const m = new THREE.Mesh(this._criarCapsule(0.04, 0.15, 6), mat);
            m.position.set(dx, 1.65, 0.08);
            this.grupo.add(m);
        });
    }

    _construirBandana() {
        const mat = this._matBandana();
        const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 16, 1, true), mat);
        faixa.position.set(0, 1.79, 0);
        this.grupo.add(faixa);
    }

    _construirEquipamento() {
        const matEq = this._matEquip();
        [[-0.12, 0], [0.12, 0]].forEach(([dx]) => {
            const joe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matEq);
            joe.scale.set(1, 1.2, 0.6);
            joe.position.set(dx, 0.50, 0.06);
            this.grupo.add(joe);
        });
        const mochila = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.10), matEq);
        mochila.position.set(0, 1.18, -0.18);
        this.grupo.add(mochila);
    }

    _boxNaPosicao(posicao) {
        const raio = 0.45;
        return new THREE.Box3(
            new THREE.Vector3(posicao.x - raio, posicao.y - 0.5, posicao.z - raio),
            new THREE.Vector3(posicao.x + raio, posicao.y + 0.5, posicao.z + raio)
        );
    }
    
        mover(cameraAngle, teclas) {
            const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
            const right   = new THREE.Vector3(-Math.cos(cameraAngle), 0,  Math.sin(cameraAngle));
            const passo   = 0.10;
    
            let delta = new THREE.Vector3();
            teclas.forEach(tecla => {
                if (tecla === 87) delta.add(forward.clone().multiplyScalar( passo));
                if (tecla === 83) delta.add(forward.clone().multiplyScalar(-passo));
                if (tecla === 65) delta.add(right.clone().multiplyScalar(  passo));
                if (tecla === 68) delta.add(right.clone().multiplyScalar( -passo));
            });
    
            if (delta.lengthSq() === 0) return;
    
            const posAtual = this.grupo.position.clone();
    
            // ── Tentativa 1: movimento completo (X + Z) ──
            const posTotal = posAtual.clone().add(delta);
            if (!this.gestorColisoes.colide(this._boxNaPosicao(posTotal))) {
                this.grupo.position.copy(posTotal);
                return;
            }
    
            // ── Tentativa 2: só X (deslizar ao longo de Z) ──
            const posSoX = posAtual.clone();
            posSoX.x += delta.x;
            if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoX))) {
                this.grupo.position.copy(posSoX);
                return;
            }
    
            // ── Tentativa 3: só Z (deslizar ao longo de X) ──
            const posSoZ = posAtual.clone();
            posSoZ.z += delta.z;
            if (!this.gestorColisoes.colide(this._boxNaPosicao(posSoZ))) {
                this.grupo.position.copy(posSoZ);
            }
        }
    
        orientarParaCamera(camara) {
            const alvo = new THREE.Vector3(camara.position.x, this.grupo.position.y, camara.position.z);
            this.grupo.lookAt(alvo);
        }
    
        get posicao() {
            return this.grupo.position;
        }
}