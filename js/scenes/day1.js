/* couchlet day 1 */

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer;

var points;

function loaderGuts( geometry ){
    geometry.computeVertexNormals();

    g = geometry.attributes.position.array;

    var particles = g.length / 3;

    var geometry = new THREE.BufferGeometry();

    var positions = new Float32Array( particles * 3 );
    var colors = new Float32Array( particles * 3 );

    var color = new THREE.Color();

    var scale = 300;
    for ( var i = 0; i < positions.length; i += 3 ) {

        for (var j = 0; j < 3; j++){
            var x = g[i + j];
            positions[i + j] = x * scale;
            colors[i + j] = 1;
        }
    }

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

    geometry.computeBoundingSphere();

    var material = new THREE.PointsMaterial( { size: 15, vertexColors: THREE.VertexColors } );

    points = new THREE.Points( geometry, material );

    scene.add( points );

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener('resize', onWindowResize, false );
}

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 5, 3500 );
    camera.position.z = 2750;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );

    var loader = new THREE.PLYLoader();
    loader.load( '../assets/models/kinectCloud.ply', loaderGuts);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    requestAnimationFrame( animate );

    if (!!points) {
        render();
        stats.update();
    }
}

function render() {

    if (!!points) {
        var time = Date.now() * 0.001;

        points.rotation.x = time * 0.25;
        points.rotation.y = time * 0.5;
        renderer.render( scene, camera );
    }
}

init();
animate();
