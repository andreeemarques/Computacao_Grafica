import * as THREE from 'three';

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

import { PointerLockControls } from 'PointerLockControls';

document.addEventListener('DOMContentLoaded', Start);

var objetoImportado;
var mixerAnimacao;
var relogio = new THREE.Clock();
var cena = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
var camaraPerspetiva = new THREE.PerspectiveCamera(45, 4/3, 0.1, 100);

var importer = new FBXLoader();

importer.load('./Objetos/Samba Dancing.fbx', function (object) {
    mixerAnimacao = new THREE.AnimationMixer(object);
    var action = mixerAnimacao.clipAction(object.animations[0]);
    action.play();

    object.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    cena.add(object);

    object.scale.x = 0.01;
    object.scale.z = 0.01;
    object.scale.y = 0.01;

    object.position.x = 1.5;
    object.position.y = -0.5;
    object.position.z = -6.0;

    objetoImportado = object;
});

renderer.setSize(window.innerWidth -15, window.innerHeight-80);
renderer.setClearColor(0xaaaaaa);

document.body.appendChild(renderer.domElement);

var geometriaCubo = new THREE.BoxGeometry(1,1,1);

var textura = new THREE.TextureLoader().load('./Images/boxImage.jpg');
var materialTextura = new THREE.MeshStandardMaterial( {map:textura} );

var meshCubo = new THREE.Mesh(geometriaCubo, materialTextura);
meshCubo.translateZ(-6.0);

const controls = new PointerLockControls(camaraPerspetiva, renderer.domElement)

controls.addEventListener('lock', function() {
});

controls.addEventListener('unlock', function() {
});

document.addEventListener(
    'click',
    function() {
        controls.lock()
    },
    false
);

document.addEventListener("keydown", onDocumentKeyDown, false);

function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) {
        controls.moveForward(0.25)
    }
    else if (keyCode == 83) {
        controls.moveForward(-0.25)
    }
    else if (keyCode == 65) {
        controls.moveRight(-0.25)
    }
    else if (keyCode == 68) {
        controls.moveRight(0.25)
    }
    else if (keyCode == 32) {
        if(meshCubo.parent == cena){
            cena.remove(meshCubo);
        } else {
            cena.add(meshCubo);
        }
    }
};

var texture_dir = new THREE.TextureLoader().load( './Skybox/posx.jpg');
var texture_esq = new THREE.TextureLoader().load( './Skybox/negx.jpg');
var texture_up = new THREE.TextureLoader().load( './Skybox/posy.jpg');
var texture_dn = new THREE.TextureLoader().load( './Skybox/negy.jpg');
var texture_bk = new THREE.TextureLoader().load( './Skybox/posz.jpg');
var texture_ft = new THREE.TextureLoader().load( './Skybox/negz.jpg');

var materialArray = [];

materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dir}));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_esq}));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up}));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn}));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk}));
materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft}));

for (var i =0; i < 6; i++)
    materialArray[i].side = THREE.BackSide;

var skyboxGeo = new THREE.BoxGeometry(100, 100, 100);

var skybox = new THREE.Mesh(skyboxGeo, materialArray);

cena.add(skybox);

function Start()
{
    cena.add( meshCubo );

    var luzAmbiente = new THREE.AmbientLight(0x000000);
    cena.add(luzAmbiente);

    var luzDirecional = new THREE.DirectionalLight(0xffffff, 1);
    luzDirecional.position.set(1,1,1).normalize();
    cena.add(luzDirecional);

    renderer.render(cena, camaraPerspetiva);

    requestAnimationFrame(loop);
}

function loop() 
{

    meshCubo.rotateY(Math.PI/180 * 1);

    if(mixerAnimacao) {
        mixerAnimacao.update(relogio.getDelta());
    }

    renderer.render(cena, camaraPerspetiva);

    requestAnimationFrame(loop);
}