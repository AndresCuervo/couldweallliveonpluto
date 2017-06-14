if ( !Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer;

var controls;
var material;

var tree_trunk, lights;

var gyroPresent;

var bloomPass, renderScene;
var composer;

var params = {
    projection: 'normal',
    background: false,
    exposure: 1.0,
    bloomStrength: 3.0,
    bloomThreshold: 0.1,
    bloomRadius: 0.4,

    'printVars' : function() {
        console.log("gyroPresent: ");
        console.log(gyroPresent);
    },
};

var mouse = {x: 0, y: 0};

var debug = false;

function starMaker () {
    geometry = new THREE.InstancedBufferGeometry();
    geometry.copy( new THREE.CircleBufferGeometry( 1, 6 ) );

    var particleCount = 75000;

    var translateArray = new Float32Array( particleCount * 3 );

    for ( var i = 0, i3 = 0, l = particleCount; i < l; i ++, i3 += 3 ) {

        translateArray[ i3 + 0 ] = Math.random() * 2 - 1;
        translateArray[ i3 + 1 ] = Math.random() * 2 - 1;
        translateArray[ i3 + 2 ] = Math.random() * 2 - 1;

    }

    geometry.addAttribute( "translate", new THREE.InstancedBufferAttribute( translateArray, 3, 1 ) );

    material = new THREE.RawShaderMaterial( {
        uniforms: {
            map: { value: new THREE.TextureLoader().load( "../textures/spark.png" ) },
            time: { value: 0.0 }
        },
        vertexShader: document.getElementById( 'vshader' ).textContent,
        fragmentShader: document.getElementById( 'fshader' ).textContent,
        depthTest: true,
        depthWrite: true
    } );

    mesh = new THREE.Mesh( geometry, material );
    mesh.scale.set( 500, 500, 500 );
    scene.add( mesh );
}

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 100 );
    camera.position.z = 20;


    scene = new THREE.Scene();

    starMaker();

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
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), params.bloomStrength, params.bloomThreshold, params.bloomRadius);//1.0, 9, 0.5, 512);
    composer = new THREE.EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(renderScene);
    composer.addPass(effectFXAA);
    composer.addPass(bloomPass);
    composer.addPass(copyShader);
    //renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;



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

    // // Controls
    // controls = new THREE.DeviceOrientationControls( camera );
    // // controls.target.set( 0, 0, 0 );
    // // controls.update();
    //
    // // controls.enabled = gyroPresent;
    // // var note = "controls is: "
    // // console.log(note, gyroPresent);
    //
    // if (gyroPresent){
    //     // Do gyro stuff!
    // }

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

    controls.update();
}

function render() {
    var time = performance.now();

    material.uniforms.time.value = time;

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


