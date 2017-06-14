if ( !Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var geometry;
var camera, scene, renderer, effect;

var gui = new dat.GUI();

var guiData = {
    'stereo' : false,
    'range' : 1
};

function loaderGuts(plyLoader){
    loaderPositions = plyLoader.attributes.position.array;
    loaderNormals = plyLoader.attributes.normal.array;
    particles = loaderPositions.length / 3;

    var radius = 3;

    plyLoader = new THREE.BufferGeometry();

    var color = new THREE.Color();

    var scale = 800;

    var triangles = 1;
    var instances = particles;

    geometry = new THREE.InstancedBufferGeometry();

    geometry.maxInstancedCount = instances;
    gui.add( geometry, "maxInstancedCount", 0, instances ).listen();

    var vertices = new THREE.BufferAttribute( new Float32Array( triangles * 3 * 3 ), 3 );

    vertices.setXYZ( 0, 0.0005, -.001, 0 );
    vertices.setXYZ( 1, -0.001, 0.001, 0 );
    vertices.setXYZ( 2, 0, 0, 0.1 );

    geometry.addAttribute( 'position', vertices );

    var scale = 1.0;
    var offsets = new THREE.InstancedBufferAttribute( new Float32Array( instances * 3 ), 3, 1 );
    for ( var i = 0, ul = offsets.count; i < ul; i++ ) {
        var x = loaderPositions[i*3]   * scale;
        var y = loaderPositions[i*3+1] * scale;
        var z = loaderPositions[i*3+2] * scale;
        offsets.setXYZ( i, x, y, z);
    }

    geometry.addAttribute( 'offset', offsets );

    var colors = new THREE.InstancedBufferAttribute( new Float32Array( instances * 4 ), 4, 1 );
    for ( var i = 0, ul = colors.count; i < ul; i++ ) {

        colors.setXYZW(i, 1,1,1,.4);

    }
    geometry.addAttribute( 'color', colors );

    var vector = new THREE.Vector4();
    var range = guiData.range;

    var orientationsStart = new THREE.InstancedBufferAttribute( new Float32Array( instances * 4 ), 4, 1 );
    for ( var i = 0, ul = orientationsStart.count; i < ul; i++ ) {

        var x = loaderPositions[i*3]   * scale;
        var y = loaderPositions[i*3+1] * scale;
        var z = loaderPositions[i*3+2] * scale;
        vector.set(x, y, z,1);

        vector.set(	x - range * Math.random() - (range/2.0),
            y - range * Math.random() - (range/2.0),
            z - range * Math.random() - (range/2.0),
            1.0 - range * Math.random() - (range/2.0));

        vector.normalize();

        orientationsStart.setXYZW( i, vector.x, vector.y, vector.z, vector.w );

    }
    geometry.addAttribute( 'orientationStart', orientationsStart );

    var orientationsEnd = new THREE.InstancedBufferAttribute( new Float32Array( instances * 4 ), 4, 1 );
    for ( var i = 0, ul = orientationsEnd.count; i < ul; i++ ) {

        vector.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
        vector.normalize();

        orientationsEnd.setXYZW( i, vector.x, vector.y, vector.z, vector.w );

    }
    geometry.addAttribute( 'orientationEnd', orientationsEnd );

    var material = new THREE.RawShaderMaterial( {

        uniforms: {
            time: { value: 1.0 },
            sineTime: { value: 1.0 },
            range: {value: 1.0}
        },
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
        side: THREE.DoubleSide,
        transparent: true

    } );

    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    geometry.maxInstancedCount = Math.min(100000, geometry.maxInstancedCount);
}

function init() {
	gui.add( guiData, "stereo");
	gui.add( guiData, "range", 0, 1 );
    container = document.getElementById( 'container' );
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, .01, 1000000 );
    camera.position.z = 2;

    scene = new THREE.Scene();
	
    var loader = new THREE.PLYLoader();
    loader.load( '../assets/models/apse-simple.ply', loaderGuts);

    renderer = new THREE.WebGLRenderer();

    if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
        document.getElementById( "notSupported" ).style.display = "";
        return;
    }

    renderer.setClearColor( 0x101010 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );


    effect = new THREE.StereoEffect( renderer );
    effect.setSize( window.innerWidth, window.innerHeight );

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );

    render();
    stats.update();
}

function render() {
    var time = performance.now();
    var object = scene.children[0];

    if (!!object){
        guiData.range = Math.sin(time*.001);

        object.rotation.y = time * 0.005;
        object.material.uniforms.time.value = time * 0.005;
        object.material.uniforms.range.value = guiData.range;
        object.material.uniforms.sineTime.value = Math.sin( object.material.uniforms.time.value * 0.05 );

        if (guiData.stereo) {
            effect.render( scene, camera );
        } else {
            renderer.setSize( window.innerWidth, window.innerHeight );
            renderer.render( scene, camera );
        }
    }
}

init();
animate();
