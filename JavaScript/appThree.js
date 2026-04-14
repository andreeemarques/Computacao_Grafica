import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', Start);

var textura = new THREE.TextureLoader().load('./Images/boxImage.jpg');
var materialTextura = new THREE.MeshBasicMaterial( {map: textura} );

var cena = new THREE.Scene();
var camara = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
var renderer = new THREE.WebGLRenderer();

var camaraPerspetiva = new THREE.PerspectiveCamera(45, 4/3, 0.1, 100);

renderer.setSize(window.innerWidth -15, window.innerHeight-80);

renderer.setClearColor(0xaaaaaa);

document.body.appendChild(renderer.domElement);

var geometria = new THREE.BufferGeometry();
var vertices = new Float32Array( [
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
    0.0, 0.5, 0.0
]);

const cores = new Float32Array( [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
]);

geometria.setAttribute('position', new THREE.BufferAttribute(vertices,3));
geometria.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cores),3));

var material = new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.DoubleSide});

var mesh = new THREE.Mesh(geometria, material);

//mesh.translateX(0.5);
//mesh.translateY(0.5);



mesh.translateZ(-6.0);

var anguloDeRotacao = 0;

function loop() 
{
    //mesh.rotateY(Math.PI/180 * 1);

    meshCubo.rotateY(Math.PI/180 * 1);

    renderer.render(cena, camaraPerspetiva);

    requestAnimationFrame(loop);
}

var geometriaCubo = new THREE.BoxGeometry(1,1,1);

var uvAttribute = geometriaCubo.getAttribute('uv');

uvAttribute.setXY(0,1,1);
uvAttribute.setXY(1,0,1);
uvAttribute.setXY(2,1,0);
uvAttribute.setXY(3,0,0);

uvAttribute.setXY(4,1,1);
uvAttribute.setXY(5,0,1);
uvAttribute.setXY(6,1,0);
uvAttribute.setXY(7,0,0);

uvAttribute.setXY(8,1,1);
uvAttribute.setXY(9,0,1);
uvAttribute.setXY(10,1,0);
uvAttribute.setXY(11,0,0);

uvAttribute.setXY(12,1,1);
uvAttribute.setXY(13,0,1);
uvAttribute.setXY(14,1,0);
uvAttribute.setXY(15,1,0);

uvAttribute.setXY(16,1,1);
uvAttribute.setXY(17,0,1);
uvAttribute.setXY(18,1,0);
uvAttribute.setXY(19,0,0);

uvAttribute.setXY(20,1,1);
uvAttribute.setXY(21,0,1);
uvAttribute.setXY(22,1,0);
uvAttribute.setXY(23,0,0);

var materialCubo = new THREE.MeshBasicMaterial( { vertexColors: true});

const vertexColorsCubo = new Float32Array ( [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 0.0,

    1.0, 0.0, 0.0,
    0.0, 0.0, 0.0,
    0.0, 0.0, 1.0,
    0.0, 1.0, 0.0,

    0.0, 0.0, 1.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,

    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
    1.0, 0.0, 0.0,
    0.0, 0.0, 0.0,

    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,

    0.0, 1.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 0.0,
]);

geometriaCubo.setAttribute( 'color', new THREE.Float32BufferAttribute(vertexColorsCubo, 3));

var meshCubo = new THREE.Mesh(geometriaCubo, materialTextura);

meshCubo.translateZ(-6.0);

function Start()
{
    //cena.add(mesh);
    cena.add( meshCubo );

    renderer.render(cena, camaraPerspetiva);

    requestAnimationFrame(loop);
}