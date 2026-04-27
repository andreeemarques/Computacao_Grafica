import * as THREE from 'three';

export class Cabine
{
    constructor(cena, x, z, rotacao = 0) {
            this.x = x;
            this.z = z;
            this.rotacao = rotacao;
            this.grupo = new THREE.Group();
    
            this._construir();
    
            this.grupo.position.set(x, 0, z);
            this.grupo.rotation.y = rotacao;
            cena.add(this.grupo);
        }
    
        _matBranco() {
            return new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6, metalness: 0.05 });
        }
        _matEscuro() {
            return new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.3 });
        }
        _matVidro() {
            return new THREE.MeshStandardMaterial({
                color: 0x334455, transparent: true, opacity: 0.55,
                roughness: 0.05, metalness: 0.1
            });
        }
    
        _construir() {
            const L = 3.0, A = 3.2, P = 3.0; // ← altura aumentada para 3.2
            const esp = 0.12;
    
            // ── Chão interno ──
            const chao = new THREE.Mesh(
                new THREE.BoxGeometry(L, 0.08, P),
                new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 })
            );
            chao.position.set(0, 0.04, 0);
            chao.receiveShadow = true;
            this.grupo.add(chao);
    
            // ── Parede traseira (sólida, branca) ──
            const pTras = new THREE.Mesh(
                new THREE.BoxGeometry(L, A, esp),
                this._matBranco()
            );
            pTras.position.set(0, A / 2, -P / 2 + esp / 2);
            pTras.castShadow = true;
            this.grupo.add(pTras);
    
            // ── Parede lateral esquerda (sólida, branca) ──
            const pEsq = new THREE.Mesh(
                new THREE.BoxGeometry(esp, A, P),
                this._matBranco()
            );
            pEsq.position.set(-L / 2 + esp / 2, A / 2, 0);
            pEsq.castShadow = true;
            this.grupo.add(pEsq);
    
            // ── Parede lateral direita — painel branco inferior + vidro superior ──
            // Painel branco no terço inferior
            const painelBrancoDir = new THREE.Mesh(
                new THREE.BoxGeometry(esp, A * 0.45, P),
                this._matBranco()
            );
            painelBrancoDir.position.set(L / 2 - esp / 2, A * 0.45 / 2, 0);
            this.grupo.add(painelBrancoDir);
    
            // Montante escuro no topo
            const mTopoDir = new THREE.Mesh(
                new THREE.BoxGeometry(esp, 0.2, P),
                this._matEscuro()
            );
            mTopoDir.position.set(L / 2 - esp / 2, A - 0.1, 0);
            this.grupo.add(mTopoDir);
    
            // Vidro lateral direita (parte superior)
            const vidDta = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, A * 0.55 - 0.2, P - 0.1),
                this._matVidro()
            );
            vidDta.position.set(L / 2 - esp / 2, A * 0.45 + (A * 0.55 - 0.2) / 2, 0);
            this.grupo.add(vidDta);
    
            // ── Parede frontal — aberta no centro (vão da porta), branco nos lados ──
    
            // Montante escuro superior (cobre toda a largura)
            const mSupFrente = new THREE.Mesh(
                new THREE.BoxGeometry(L, 0.2, esp),
                this._matEscuro()
            );
            mSupFrente.position.set(0, A - 0.1, P / 2 - esp / 2);
            this.grupo.add(mSupFrente);
    
            // Painel branco inferior esquerdo (junto ao canto)
            const painelFEsqInf = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, A * 0.45, esp),
                this._matBranco()
            );
            painelFEsqInf.position.set(-L / 2 + 0.25, A * 0.45 / 2, P / 2 - esp / 2);
            this.grupo.add(painelFEsqInf);
    
            // Painel branco inferior direito (junto ao canto)
            const painelFDtaInf = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, A * 0.45, esp),
                this._matBranco()
            );
            painelFDtaInf.position.set(L / 2 - 0.25, A * 0.45 / 2, P / 2 - esp / 2);
            this.grupo.add(painelFDtaInf);
    
            // Montante vertical esquerdo (escuro, fino)
            const mVEsq = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, A - 0.2, esp),
                this._matEscuro()
            );
            mVEsq.position.set(-L / 2 + 0.5 + 0.04, A / 2 - 0.1, P / 2 - esp / 2);
            this.grupo.add(mVEsq);
    
            // Montante vertical direito (escuro, fino)
            const mVDta = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, A - 0.2, esp),
                this._matEscuro()
            );
            mVDta.position.set(L / 2 - 0.5 - 0.04, A / 2 - 0.1, P / 2 - esp / 2);
            this.grupo.add(mVDta);
    
            // ── Teto principal ──
            const teto = new THREE.Mesh(
                new THREE.BoxGeometry(L, 0.12, P),
                this._matBranco()
            );
            teto.position.set(0, A, 0);
            teto.castShadow = true;
            this.grupo.add(teto);
    
            // ── Beirado saliente (escuro) ──
            const beirado = new THREE.Mesh(
                new THREE.BoxGeometry(L + 0.5, 0.1, P + 0.5),
                this._matEscuro()
            );
            beirado.position.set(0, A + 0.07, 0);
            beirado.castShadow = true;
            this.grupo.add(beirado);
    
            // ── Colunas de canto (perfis escuros) ──
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dz]) => {
                const col = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, A, 0.1),
                    this._matEscuro()
                );
                col.position.set(dx * (L / 2 - 0.05), A / 2, dz * (P / 2 - 0.05));
                col.castShadow = true;
                this.grupo.add(col);
            });
    
            // ── Ponto de referência para o NPC ──
            //this.posicaoNPC = new THREE.Vector3(x, 0.5, z + P / 2 + 0.6);
            //this.direcaoNPC = new THREE.Vector3(0, 0, 1);
        }
}