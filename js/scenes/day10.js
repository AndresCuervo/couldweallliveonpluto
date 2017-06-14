if ( !Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer;

var controls;
var material;

var tree_trunk, lights;

var mesh;

var group;

var gyroPresent;

var bloomPass, renderScene;
var composer;

var params = {
    projection: 'normal',
    background: false,
    exposure: 1.0,
    bloomStrength: 1.1,
    bloomThreshold: 0.692,
    bloomRadius: 1.0,

    'printVars' : function() {
        console.log("gyroPresent: ");
        console.log(gyroPresent);
    },
};

var mouse = {x: 0, y: 0};

var debug = false;

function frond_maker() {
    var num_boops = 10;

    group = new THREE.Object3D();

    for (var i = 0; i < num_boops; i++) {
        var mesh = booper_maker();
        mesh.rotation.x = (i / num_boops) * Math.PI * 2;
        group.add( mesh );
    }


    for (var i = 0; i < num_boops; i++) {
        var mesh = booper_maker();
        mesh.rotation.z = (i / num_boops) * Math.PI * 2;
        group.add( mesh );
    }

    group.rotation.z = Math.PI * .251;


    scene.add( group );
}

function booper_maker(INSTANCE_COUNT = 5,
                     HEIGHT = 10,
                     PER_HEIGHT = 1.0,
                     NOISE_SCALE = .3,
                     NOISE_DISPLACEMENT = .5){
    var START_RAD = .5;
    var END_RAD = 0.0;

    noise.seed(Math.random());

    var trunk = new THREE.Geometry();

    var TOTAL_INSTANCES = INSTANCE_COUNT * HEIGHT;

    for ( var i = 0; i < TOTAL_INSTANCES; i ++ ) {

        var position = new THREE.Vector3();

        var cur_radius = (1.0 - i/TOTAL_INSTANCES)*START_RAD + (i/TOTAL_INSTANCES)*END_RAD;

        var radians = Math.PI * 2.0 * (i % INSTANCE_COUNT) / INSTANCE_COUNT;
        position.set( Math.cos(radians)*cur_radius, PER_HEIGHT*i / INSTANCE_COUNT, Math.sin(radians)*cur_radius);
        var nx = noise.simplex3(position.x*NOISE_SCALE, position.y*NOISE_SCALE, position.z*NOISE_SCALE);
        var ny = noise.simplex3(
            (position.x+1000.0)*NOISE_SCALE,
            (position.y+1000.0)*NOISE_SCALE,
            (position.z+1000.0)*NOISE_SCALE);
        var nz = noise.simplex3(
            (position.x+2000.0)*NOISE_SCALE,
            (position.y+2000.0)*NOISE_SCALE,
            (position.z+2000.0)*NOISE_SCALE);

        position.x += nx*NOISE_DISPLACEMENT + Math.random()*.05;
        position.y += ny*NOISE_DISPLACEMENT + Math.random()*.05;
        position.z += nz*NOISE_DISPLACEMENT + Math.random()*.05;

        trunk.vertices.push(position);

        if (i > INSTANCE_COUNT){
            trunk.faces.push(new THREE.Face3(i, i-INSTANCE_COUNT+1, i-INSTANCE_COUNT));
            trunk.faces.push(new THREE.Face3(i, i-INSTANCE_COUNT, i-1));
        }
    }

    var material = new THREE.MeshPhongMaterial( {
        color: 0xFFF,
        emissive: new THREE.Color(1,1,1)}
    );

    tree_trunk = new THREE.Mesh(trunk, material);

    return tree_trunk;
}

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 100000 );
    camera.position.z = 20;


    scene = new THREE.Scene();

    // starMaker();

    renderer = new THREE.WebGLRenderer();

    if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
        document.getElementById( "notSupported" ).style.display = "";
        return;
    }

    renderer.setClearColor( 0x090909 );
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    renderScene = new THREE.RenderPass(scene, camera);

    effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
    var copyShader = new THREE.ShaderPass(THREE.CopyShader);
    copyShader.renderToScreen = true;
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), params.bloomStrength,params.bloomRadius, params.bloomThreshold);//1.0, 9, 0.5, 512);
    composer = new THREE.EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(renderScene);
    composer.addPass(effectFXAA);
    composer.addPass(bloomPass);
    composer.addPass(copyShader);
    //renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;


    var tree_count = 0;
    var POP = 10;

    var colors = [	new THREE.Color( 0x7ec8c8 ),
        new THREE.Color( 0xcc86d7 ),
        new THREE.Color( 0xd9cde4 ),
        new THREE.Color( 0xadc7c7 )]

    for (var i=0; i < POP; i++){
        // for (var i=-10; i<11; i += 20){
        // 	for (var j=-15; j<16; j+= 30){
        //tree_maker(new THREE.Vector3(j, i, 0), colors[tree_count % colors.length]);
        // tree_maker(new THREE.Vector3((Math.random()-.5)*40,-15, (Math.random()-.5)*40),
        //     colors[tree_count % colors.length]);
        // tree_count++;
        // 	}
        // }
    }

    if (debug){
        stats = new Stats();
        container.appendChild( stats.dom );
        var gui = new dat.GUI();
        gui.add( params, 'exposure', 0.1, 2 );
        gui.add( params, 'bloomThreshold', 0.0, 1.0 ).onChange( function(value) {
            bloomPass.threshold = Number(value);
        });
        gui.add( params, 'bloomStrength', 0.0, 3.0 ).onChange( function(value) {
            bloomPass.strength = Number(value);
        });
        gui.add( params, 'bloomRadius', 0.0, 3 ).onChange( function(value) {
            bloomPass.radius = Number(value);
        });
        gui.open();
    }

    // Controls
    controls = new THREE.DeviceOrientationControls( camera );
    // controls.target.set( 0, 0, 0 );
    // controls.update();

    // controls.enabled = gyroPresent;
    // var note = "controls is: "
    // console.log(note, gyroPresent);

    if (gyroPresent){
        // Do gyro stuff!
    }

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];


    camera.lookAt(new THREE.Vector3(0,0,0));

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener('mousemove', onMouseMove, false);

    if (debug) {
        gui.add(params, 'printVars');
    }

    var pipeSpline = new THREE.CatmullRomCurve3( [
        new THREE.Vector3(0,0,0),
        new THREE.Vector3(1,0,0),
        new THREE.Vector3(2,0,0),
        new THREE.Vector3(3,0,0),
        new THREE.Vector3(4,0,0),
        new THREE.Vector3(5,0,0),
    ] );

    frond_maker();

    var sphereGeom = new THREE.IcosahedronGeometry(3, 1);
    var mirrorSphereMaterial = new THREE.MeshBasicMaterial( {
        color: 0xffc100
    } );

    mirrorSphere = new THREE.Mesh( sphereGeom, mirrorSphereMaterial );
    scene.add(mirrorSphere);

    // var tubeGeometry = new THREE.TubeBufferGeometry( pipeSpline, 12, .1, 7, true );
    //
    // var tubeMat = new THREE.MeshBasicMaterial( { color: 0x020102} );
    // var mesh = new THREE.Mesh( tubeGeometry, tubeMat );
    //
    // scene.add(mesh);
}

// Follows the mouse event
function onMouseMove(event) {
    // Update the mouse variable
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    mouse.x *= 4.0;
    mouse.y *= 4.0;

}

// // Follows the mouse event
// function onMouseDrag(event) {
//     // Update the mouse variable
//     event.preventDefault();
//     var dx = (event.clientX / window.innerWidth) * 2 - 1;
//     var dy = -(event.clientY / window.innerHeight) * 2 + 1;
//
// 	mouse.x += dx;
// 	mouse.y += dy;
// }


function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    composer.setSize( window.innerWidth, window.innerHeight );
    effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );

    render();

    if (debug){
        stats.update();
    }

    group.rotation.x += .01;
    //controls.update();
}

function render() {
    var time = performance.now();

    var scale = 5;
    camera.position.x += ( mouse.x * scale - camera.position.x ) * .05;
    camera.position.y += ( - mouse.y * scale - camera.position.y ) * .05;
    camera.lookAt( scene.position );

    // camera.position.x = Math.sin(time*.00001)*20;
    // camera.position.z = Math.cos(time*.00001)*20;
    // camera.lookAt(new THREE.Vector3(0,0,0));

    // material.uniforms.time.value = time;

    renderer.toneMappingExposure = Math.pow( params.exposure, 50.0 );
    //renderer.render( scene, camera );
    composer.render();

}

// addDeviceMotionListener();

// replace with addDeviceMotionListener from utils/orientation.js ????

window.addEventListener("devicemotion", function(event){
    if (event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma) {
        gyroPresent = true;
    }
});

window.onload = function() {
    init();
    animate();
}


