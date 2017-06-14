if ( !Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, scene, renderer;

var controls;

var tree_trunk, lights;

var gyroPresent;

var bloomPass, renderScene;
var composer;

var params = {
    projection: 'normal',
    background: false,
    exposure: 1.0,
    bloomStrength: 1.5,
    bloomThreshold: 0.85,
    bloomRadius: 0.4,

    'printVars' : function() {
        console.log("gyroPresent: ");
        console.log(gyroPresent);
    },
};

var mouse = {x: 0, y: 0};

var debug = false;

function tree_maker(center, light_color){
    var size = .04;
    var geometry = new THREE.BoxBufferGeometry( size, size, size );

    var colors = [];

    for ( var i = 0, l = geometry.attributes.position.count; i < l; i ++ ) {
        colors.push(light_color.r + (Math.random()*.1 - 0.05),
            light_color.g + (Math.random()*.1 - 0.05),
            light_color.b + (Math.random()*.1 - 0.05));
    }

    geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.VertexColors } );

    var mesh = new THREE.Mesh( geometry, material );

    var INSTANCE_COUNT = 30;
    var HEIGHT = 100;
    var PER_HEIGHT = .5;
    var NOISE_SCALE = .03;
    var NOISE_DISPLACEMENT = .5;

    var START_RAD = .5;
    var END_RAD = 0.1;

    var geometry2 = new THREE.InstancedBufferGeometry().copy( geometry );

    var instancePositions = [];
    var instanceQuaternions = [];
    var instanceScales = [];

    noise.seed(Math.random());

    var trunk = new THREE.Geometry();

    var TOTAL_INSTANCES = INSTANCE_COUNT * HEIGHT;

    for ( var i = 0; i < TOTAL_INSTANCES; i ++ ) {

        var mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        var position = mesh.position;

        var quaternion = mesh.quaternion;
        var scale = mesh.scale;

        var cur_radius = (1.0 - i/TOTAL_INSTANCES)*START_RAD + (i/TOTAL_INSTANCES)*END_RAD;

        var radians = Math.PI * 2.0 * (i % INSTANCE_COUNT) / INSTANCE_COUNT;
        position.set( Math.cos(radians)*cur_radius, Math.sin(radians)*cur_radius, -PER_HEIGHT*i / INSTANCE_COUNT);
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

        position.x += center.x;
        position.y += center.y;
        position.z += center.z;

        trunk.vertices.push(position);

        if (i > INSTANCE_COUNT){
            trunk.faces.push(new THREE.Face3(i, i-INSTANCE_COUNT+1, i-INSTANCE_COUNT));
            trunk.faces.push(new THREE.Face3(i, i-INSTANCE_COUNT, i-1));
        }

        quaternion.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
        quaternion.normalize();

        //scale.set( Math.random() * 2, Math.random() * 2, Math.random() * 2 );

        instancePositions.push( position.x, position.y, position.z );
        instanceQuaternions.push( quaternion.x, quaternion.y, quaternion.z, quaternion.w );
        //instanceScales.push( scale.x, scale.y, scale.z );
    }

    var material = new THREE.MeshBasicMaterial( { color: 0x020810} );
    tree_trunk = new THREE.Mesh(trunk, material);
    scene.add(tree_trunk);

    var attribute = new THREE.InstancedBufferAttribute( new Float32Array( instancePositions ), 3 );
    geometry2.addAttribute( 'instancePosition', attribute );

    /*
    var attribute = new THREE.InstancedBufferAttribute( new Float32Array( instanceQuaternions ), 4 );
    lights.addAttribute( 'instanceQuaternion', attribute );

    var attribute = new THREE.InstancedBufferAttribute( new Float32Array( instanceScales ), 3 );
    lights.addAttribute( 'instanceScale', attribute );
    */
    var material = new THREE.ShaderMaterial( {

        uniforms: {},
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent

    } );

    lights = new THREE.Mesh( geometry2, material );
    //mesh2.position.x = 0.1;
    scene.add( lights );


}

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 100 );
    camera.position.z = 20;


    scene = new THREE.Scene();

    var colors = [	new THREE.Color( 0x7ec8c8 ),
        new THREE.Color( 0xcc86d7 ),
        new THREE.Color( 0xd9cde4 ),
        new THREE.Color( 0xadc7c7 )]

    var tree_count = 0;
    var POP = 3;

    for (var i=0; i < POP; i++){
        // for (var i=-10; i<11; i += 20){
        // 	for (var j=-15; j<16; j+= 30){
        //tree_maker(new THREE.Vector3(j, i, 0), colors[tree_count % colors.length]);
        tree_maker(new THREE.Vector3((Math.random()-.5)*10.0,(Math.random()-.5)*10.0,0),
            colors[tree_count % colors.length]);
        tree_count++;
        // 	}
        // }
    }

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
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), .8, 0.2, 0.4);//1.0, 9, 0.5, 512);
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
        gui.add( params, 'bloomRadius', 0.0, .1 ).onChange( function(value) {
            bloomPass.radius = Number(value);
        });
        gui.open();
    }

    // Controls
    controls = new THREE.DeviceOrientationControls( camera );
    // controls.target.set( 0, 0, 0 );
    // controls.update();

    controls.enabled = gyroPresent;
    var note = "controls is: "
    console.log(note, gyroPresent);

    if (gyroPresent){
        // Do gyro stuff!
    }

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

    if (!gyroPresent) {
        camera.position.x = mouse.x;
        camera.position.y = mouse.y;
        camera.lookAt(new THREE.Vector3(0,0,-20));
    }

    render();

    if (debug){
        stats.update();
    }

    controls.update();
}

function render() {
    var time = performance.now();
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

