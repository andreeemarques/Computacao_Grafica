import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', Start);

var cena = new THREE.Scene();
var camara = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
var renderer = new THREE.WebGLRenderer();

var camaraPerspetiva = new THREE.PerspectiveCamera(45, 4/3, 0.1, 100);

renderer.setSize(window.innerWidth -15, window.innerHeight-80);
renderer.setClearColor(0xaaaaaa);

document.body.appendChild(renderer.domElement);

var geometriaCubo = new THREE.BoxGeometry(1,1,1);

var textura = new THREE.TextureLoader().load('./Images/boxImage.jpg');
var materialTextura = new THREE.MeshBasicMaterial( {map: textura} );

var meshCubo = new THREE.Mesh(geometriaCubo, materialTextura);
meshCubo.translateZ(-6.0);

function Start()
{
    cena.add( meshCubo );

    renderer.render(cena, camaraPerspetiva);

    requestAnimationFrame(loop);
}

function loop() 
{
    //mesh.rotateY(Math.PI/180 * 1);

    meshCubo.rotateY(Math.PI/180 * 1);

    renderer.render(cena, camaraPerspetiva);

    requestAnimationFrame(loop);
}