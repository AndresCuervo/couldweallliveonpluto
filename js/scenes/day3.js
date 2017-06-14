// Global so you can pass em along 😬
var points, geo, oPositions;
var colorAvg;
var flashPoints = false;
var guiData = {
    'colorWhite' : true,
    'moreCam' : false,
    'delta' : 130,
    'particleSize' : 1,
    'sinFactor' : 0.01
};

var stats;

function loaderGuts(geometry){
    uniforms = {
        color:     { value: new THREE.Color( 0xffffff ) },
        texture:   { value: new THREE.TextureLoader().load( "../textures/spark.png" ) }
    };
    var shaderMaterial = new THREE.ShaderMaterial( {

        uniforms:       uniforms,
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

        blending:       THREE.NormalBlending,
        depthTest:      true,
        transparent:    true,


    });

    g = geometry.attributes.position.array;

    c = geometry.attributes.normal.array;

    particles = g.length / 3;

    var radius = 3;

    geometry = new THREE.BufferGeometry();

    var positions = new Float32Array( particles * 3 );
    var colors = new Float32Array( particles * 3 );
    var normals=  new Float32Array( particles * 3);
    var sizes = new Float32Array( particles );

    var color = new THREE.Color();

    var scale = 800;

    for ( var i = 0; i < positions.length; i += 3 ) {

        // positions
        var x = g[i];
        var y = g[i+1];
        var z = g[i+2];

        positions[ i ]     = x * scale;
        positions[ i + 1 ] = y * scale;
        positions[ i + 2 ] = z * scale;


        normals[ i ]     = c[i + 0];
        normals[ i + 1 ] = c[i + 1];
        normals[ i + 2 ] = c[i + 2];

        colorAvg = (c[ i ] + c[ i + 1] + c[ i + 2]) / 3;
        colors[ i + 0 ] = guiData.colorWhite ? 1 : colorAvg;
        colors[ i + 1 ] = guiData.colorWhite ? 1 : colorAvg;
        colors[ i + 2 ] = guiData.colorWhite ? 1 : colorAvg;

        sizes[i/3] = guiData.particleSize;
    }

    oPositions = positions.slice();

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    geometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

    particleSystem = new THREE.Points( geometry, shaderMaterial );

    document.querySelector('a-scene').object3D.add( particleSystem );

    geo = geometry;

    var width = window.innerWidth || 2;
    var height = window.innerHeight || 2;
    effect = new THREE.AnaglyphEffect( renderer );
    effect.setSize( width, height )
}

function init(){

    var scene = document.querySelector('a-scene').object3D;
    var loader = new THREE.PLYLoader();
    loader.load( '../assets/models/apse-simple.ply', loaderGuts);


    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    var container = document.querySelector('body');
    // container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );

    var gui = new dat.GUI();
    gui.add(guiData, 'colorWhite');
    gui.add(guiData, 'moreCam');
    gui.add(guiData, 'delta', 0, 1000);
    gui.add(guiData, 'particleSize', 0, 10);
    gui.add(guiData, 'sinFactor', 0, 0.1);

    // window.addEventListener( 'resize', onWindowResize, false );

}

function animate() {
    requestAnimationFrame( animate );
    render();
    if (stats) {
    	stats.update();
    }
}

function render() {
    var time = document.querySelector('a-scene').time * 0.001;
    var camDirection = document.querySelector('a-camera').object3D.getWorldDirection();

    var range = .1;
    if (!!geo){
        var sizes = geo.attributes.size.array;
        var positions = geo.attributes.position.array;
        var normals =   geo.attributes.normal.array;
        var colors =   geo.attributes.customColor.array;

        for ( var i = 0; i < particles; i++ ) {
            var x = positions[i*3];
            var y = positions[i*3 + 1];
            var z = positions[i*3 + 2];
            var nx = normals[i*3];
            var ny = normals[i*3 + 1];
            var nz = normals[i*3 + 2];

            var dot = camDirection.x * nx + camDirection.y * ny + camDirection.z * nz;

            if (guiData.moreCam) {
                dot *= guiData.delta * Math.sin(y * (camDirection.x * guiData.sinFactor) + time);
            } else {
                dot *= guiData.delta * Math.sin(y * guiData.sinFactor + time);
            }

            positions[i*3 + 0] = oPositions[i*3 + 0] + dot * nx;
            positions[i*3 + 1] = oPositions[i*3 + 1] + dot * ny;
            positions[i*3 + 2] = oPositions[i*3 + 2] + dot * nz;


            colorAvg = (normals[ i ] + normals[ i + 1] + normals[ i + 2]) / 3;
            colors[i*3 + 0] = guiData.colorWhite ? 1 : colorAvg;
            colors[i*3 + 1] = guiData.colorWhite ? 1 : colorAvg;
            colors[i*3 + 1] = guiData.colorWhite ? 1 : colorAvg;

            sizes[ i ] = guiData.particleSize;
        }

        geo.attributes.position.needsUpdate = true;
        geo.attributes.customColor.needsUpdate = true;
        geo.attributes.size.needsUpdate = true;
    }
}

AFRAME.registerComponent('make-point-cloud', {
    init: function () {
        init();
		animate();
    }
});
