import * as THREE from 'three';
import { _criarTexturaEdificio } from '../texturas/TexturasEdificio.js';

export function adicionarEdificios(cena, gc)
{
    const edificios = [
        // Edificio Objetivo
        { x: -13, z: 5, l: 18, a: 20, p: 14, comEntrada: true, rotacao: 0 },

        // Edifício no meio da área esquerda
        { x: -13, z: 36.8, l: 30, a: 20, p: 14, comEntrada: true, rotacao: Math.PI },
    ];

    edificios.forEach(({ x, z, l, a, p, comEntrada, rotacao }) => {
        // Face da frente com entrada, restantes sem
        const texFrenteEntrada = _criarTexturaEdificio(l, a, comEntrada);
        const texFachada       = _criarTexturaEdificio(l, a, false);

        const matFrente = new THREE.MeshStandardMaterial({
            map:       texFrenteEntrada,
            roughness: 0.8,
            metalness: 0.1,
        });
        const matFachada = new THREE.MeshStandardMaterial({
            map:       texFachada,
            roughness: 0.8,
            metalness: 0.1,
        });
        const matTopo = new THREE.MeshStandardMaterial({
            color:     0x777777,
            roughness: 0.9,
            metalness: 0.05,
        });

        // [direita, esquerda, topo, base, frente, trás]
        const materiais = [
            matFachada, // direita
            matFachada, // esquerda
            matTopo,    // topo
            matTopo,    // base
            matFrente,  // frente (com entrada)
            matFachada, // trás
        ];

        const geo  = new THREE.BoxGeometry(l, a, p);
        const mesh = new THREE.Mesh(geo, materiais);
        mesh.position.set(x, a / 2, z);
        mesh.rotation.y = rotacao;
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
        cena.add(mesh); gc.registar(mesh);

        // Cornija no topo
        const matCornija = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
        const geoCornija = new THREE.BoxGeometry(l + 0.6, 0.4, p + 0.6);
        const cornija    = new THREE.Mesh(geoCornija, matCornija);
        cornija.position.set(x, a + 0.2, z);
        cornija.rotation.y = rotacao;
        cornija.castShadow = true;
        cena.add(cornija);

        // Rodapé/base do edifício
        const geoBase = new THREE.BoxGeometry(l + 0.4, 0.5, p + 0.4);
        const base    = new THREE.Mesh(geoBase, matCornija);
        base.position.set(x, 0.25, z);
        base.rotation.y = rotacao;
        base.castShadow    = true;
        base.receiveShadow = true;
        cena.add(base);
    });
}