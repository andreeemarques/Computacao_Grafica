import * as THREE from 'three';
import { PointerLockControls } from 'PointerLockControls';

document.addEventListener('DOMContentLoaded', iniciar);

var cena     = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
var camara   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
var controls = new PointerLockControls(camara, renderer.domElement);

controls.addEventListener('lock', function() {
    document.addEventListener('mousemove', onMouseMove, false);
});

controls.addEventListener('unlock', function() {
    document.removeEventListener('mousemove', onMouseMove, false);
});

function onMouseMove(event) {
    cameraAngle -= event.movementX * 0.002; // inverter horizontal
    cameraPitch -= event.movementY * 0.002; // adicionar vertical
    cameraPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraPitch)); // limitar pitch
}

document.addEventListener('click', function() {
    controls.lock();
}, false);

// Variáveis para câmera de 3ª pessoa
var cameraDistance = 10;
var cameraHeight = 1; // nível do ombro do jogador
var cameraAngle = 0; // em radianos
var cameraPitch = 0; // em radianos

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x87ceeb); // cor de fundo (azul céu)
document.body.appendChild(renderer.domElement);

var geometriaChao = new THREE.PlaneGeometry(20, 20);
var materialChao  = new THREE.MeshStandardMaterial({ color: 0x888888 });
var meshChao      = new THREE.Mesh(geometriaChao, materialChao);

meshChao.rotation.x = -Math.PI / 2; // deitamos o plano na horizontal
meshChao.receiveShadow = true;

var luzAmbiente   = new THREE.AmbientLight(0xffffff, 0.5);
var luzDirecional = new THREE.DirectionalLight(0xffffff, 1);
luzDirecional.position.set(5, 10, 5);

var geometriaParede = new THREE.BoxGeometry(20, 4, 0.3);
var materialParede  = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

var meshParede1 = new THREE.Mesh(geometriaParede, materialParede);
meshParede1.position.set(0, 2, -10); // fundo da cena
meshParede1.castShadow    = true;
meshParede1.receiveShadow = true;

var meshParede2 = new THREE.Mesh(geometriaParede, materialParede);
meshParede2.rotation.y = Math.PI / 2;  // rodamos 90° para ficar lateral
meshParede2.position.set(-10, 2, 0);   // lado esquerdo
meshParede2.castShadow    = true;
meshParede2.receiveShadow = true;

var geometriaJogador = new THREE.BoxGeometry(1, 1, 1);
var textura          = new THREE.TextureLoader().load('./Imagens/boxImage.jpg');
var materialJogador  = new THREE.MeshStandardMaterial({ map: textura });
var meshJogador      = new THREE.Mesh(geometriaJogador, materialJogador);

meshJogador.position.set(0, 0.5, 0); // 0.5 para assentar no chão (o cubo tem altura 1, logo o centro fica a metade)
meshJogador.castShadow    = true;
meshJogador.receiveShadow = true;

//const controlos = new PointerLockControls(camara, renderer.domElement);

/*document.addEventListener('click', function () {
    controlos.lock();
}, false);*/

document.addEventListener('keydown', function (event) {
    var forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
    var right = new THREE.Vector3(-Math.cos(cameraAngle), 0, Math.sin(cameraAngle));
    
    if (event.which == 87) meshJogador.position.add(forward.clone().multiplyScalar(0.25));  // W
    if (event.which == 83) meshJogador.position.add(forward.clone().multiplyScalar(-0.25)); // S
    if (event.which == 65) meshJogador.position.add(right.clone().multiplyScalar(0.25));   // A
    if (event.which == 68) meshJogador.position.add(right.clone().multiplyScalar(-0.25));    // D
    
    // Orientar o jogador para a direção forward
    meshJogador.lookAt(meshJogador.position.clone().add(forward));
}, false);

function updateCamera() {
    var offsetX = cameraDistance * Math.sin(cameraAngle) * Math.cos(cameraPitch);
    var offsetZ = cameraDistance * Math.cos(cameraAngle) * Math.cos(cameraPitch);
    var offsetY = cameraDistance * Math.sin(cameraPitch);
    
    camara.position.x = meshJogador.position.x + offsetX;
    camara.position.y = meshJogador.position.y + cameraHeight + offsetY;
    camara.position.z = meshJogador.position.z + offsetZ;
    camara.lookAt(meshJogador.position);
}

function iniciar() {
    cena.add(meshChao);
    cena.add(luzAmbiente);
    cena.add(luzDirecional);
    cena.add(meshParede1);
    cena.add(meshParede2);
    cena.add(meshJogador);

    // Configurar câmera inicial
    updateCamera();

    renderer.render(cena, camara);
    requestAnimationFrame(loop);
}

function loop() {

    // Orientar o jogador para a câmera (apenas horizontal)
    var target = new THREE.Vector3(camara.position.x, meshJogador.position.y, camara.position.z);
    meshJogador.lookAt(target);
    // Atualizar câmera
    updateCamera();
    
    renderer.render(cena, camara);
    requestAnimationFrame(loop);
}