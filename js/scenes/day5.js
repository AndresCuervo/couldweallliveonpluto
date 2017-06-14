if ( !Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var geometry;
var camera, scene, renderer, effect;
var hemiLight, dirLight;

var ourMesh;

var gui = new dat.GUI();

var guiData = {
    'stereo' : false
};

function createGeometry() {
    var triangles = 6;
    var vertices = new THREE.BufferAttribute( new Float32Array( triangles * 3 * 3 ), 3 );

    var s = 0.005;
    vertices.setXYZ(0, -s,-s,-s);
    vertices.setXYZ(1, 0,-s/10.0, s);
    vertices.setXYZ(2, -s, s, s);
    vertices.setXYZ(3, s, s,-s);
    vertices.setXYZ(4, 0,-s/10.0,-s);
    vertices.setXYZ(5, -s, s,-s);
    /*
    vertices.setXYZ(6, s,-s, s);
    vertices.setXYZ(7, -s,-s,-s);
    vertices.setXYZ(8, s,-s,-s);
    vertices.setXYZ(9, s, s,-s);
    vertices.setXYZ(10, s,-s,-s);
    vertices.setXYZ(11, -s,-s,-s);
    vertices.setXYZ(12, -s,-s,-s);
    vertices.setXYZ(13, -s, s, s);
    vertices.setXYZ(14, -s, s,-s);
    vertices.setXYZ(15, s,-s, s);
    vertices.setXYZ(16, -s,-s, s);
    vertices.setXYZ(17, -s,-s,-s);
    vertices.setXYZ(18, -s, s, s);
    vertices.setXYZ(19, -s,-s, s);
    vertices.setXYZ(20, s,-s, s);
    vertices.setXYZ(21, s, s, s);
    vertices.setXYZ(22, s,-s,-s);
    vertices.setXYZ(23, s, s,-s);
    vertices.setXYZ(24, s,-s,-s);
    vertices.setXYZ(25, s, s, s);
    vertices.setXYZ(26, s,-s, s);
    vertices.setXYZ(27, s, s, s);
    vertices.setXYZ(28, s, s,-s);
    vertices.setXYZ(29, -s, s,-s);
    vertices.setXYZ(30, s, s, s);
    vertices.setXYZ(31, -s, s,-s);
    vertices.setXYZ(32, -s, s, s);
    vertices.setXYZ(33, s, s, s);
    vertices.setXYZ(34, -s, s, s);
    vertices.setXYZ(35, s,-s, s);
    */

    return vertices;
}

function loaderGuts ( plyLoader ) {
    loaderPositions = plyLoader.attributes.position.array;
    loaderNormals = plyLoader.attributes.normal.array;
    loaderColors = plyLoader.attributes.color.array;

    particles = loaderPositions.length / 3;

    var radius = 3;

    plyLoader = new THREE.BufferGeometry();

    var color = new THREE.Color();

    var instances = particles;

    geometry = new THREE.InstancedBufferGeometry();

    geometry.maxInstancedCount = instances;
    gui.add( geometry, "maxInstancedCount", 0, instances ).listen();

    var vertices = createGeometry();

    geometry.addAttribute( 'position', vertices );

    var scale = 1200.0;
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

        colors.setXYZW(i, .1*loaderColors[i*3], 0.0*loaderColors[i*3 + 1], 1.3*loaderColors[i*3 + 2]);

    }
    geometry.addAttribute( 'color', colors );

    var vector = new THREE.Vector4();
    var range = 1;

    var orientationsStart = new THREE.InstancedBufferAttribute( new Float32Array( instances * 4 ), 4, 1 );
    for ( var i = 0, ul = orientationsStart.count; i < ul; i++ ) {

        var x = loaderPositions[i*3]   * scale;
        var y = loaderPositions[i*3+1] * scale;
        var z = loaderPositions[i*3+2] * scale;
        vector.set(x, y, z,1);

        vector.set( x - range * Math.random() - (range/2.0),
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
        transparent: false

    } );

    ourMesh = new THREE.Mesh( geometry, material );
    ourMesh.castShadow = true;
    ourMesh.receiveShadow = true;

    ourMesh.scale = 10.0;
    
    scene.add( ourMesh );

    geometry.maxInstancedCount = Math.min(100000, geometry.maxInstancedCount);
}

function init() {
    gui.add( guiData, "stereo");
    container = document.getElementById( 'container' );
    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, .01, 1000000 );
    // camera.position.z = 60;
    camera.position.x = -500;
    camera.position.y = -5.5;
    camera.position.z = 200;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );

    // geometry

    var loader = new THREE.PLYLoader();
    loader.load( '../assets/models/tree-scan-small.ply', loaderGuts);


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

    // LIGHTS

    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    hemiLight.castShadow = true;
    scene.add( hemiLight );
    console.log(scene.children);

    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 50 );
    scene.add( dirLight );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    var d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;

    // Controls
    var orientationControls= new THREE.DeviceOrientationControls( camera );
    controls = new THREE.OrbitControls( camera );
    controls.target.set( 0, 0, 0 );
    controls.update();
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
    var object = ourMesh;
    // camera.rotation.y = Math.cos(time*.001);
    // camera.position.y += Math.cos(time*.001);
    if (!!object){
        object.material.uniforms.time.value = time * 0.005;
        object.material.uniforms.range.value = Math.sin(time*.001);
        object.material.uniforms.sineTime.value = Math.sin( object.material.uniforms.time.value * 0.05 );


        ourMesh.rotation.x = Math.cos(time*.001) * 0.1;
        ourMesh.rotation.y = Math.sin(time*.001) * 0.1;

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
