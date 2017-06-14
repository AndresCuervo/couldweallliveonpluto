if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var scene, camera, renderer;
scene = new THREE.Scene();
scene.background = new THREE.Color( 0x333333 );
camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var gui = new dat.GUI();

var debug = false;

var urlParams = new URLSearchParams(window.location.search);
var debug = debug || urlParams.get('debug') != null;

const gridPosition = {x : 0.5, y : -0.5, z : 0};

var objects = {}

var guiParams = {
    'gridSize' : 10,
    'gridSections' : 10,
    'blocksTransparent' : true,
    'printParams' : function () {console.log(guiParams)}
}

var gridRotation = {x : 60.25};

var gridColor = 0x2eafac;
// gridColor = 'white';

function makeGrid() {
    objects.grid = new THREE.GridHelper(guiParams.gridSize, guiParams.gridSections, gridColor, gridColor);
    scene.add(objects.grid);
    objects.grid.position.x = gridPosition.x;
    objects.grid.position.y = gridPosition.y;
    objects.grid.position.z = gridPosition.z;

    objects.grid.rotation.x = gridRotation.x;
}

function changeGrid(value) {
    scene.remove(objects.grid);
    makeGrid();
}

function addResizeListener() {
    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    }
}

function adjustCamera() {
    camera.position.y = -1;
    camera.position.z = 10;
}

function makeBuildingCube(x, y, z, optionalArgs) {
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var c = 0x2EFAC;
    if (!!optionalArgs && optionalArgs.color) {
        c = optionalArgs.color;
    }
    var material = new THREE.MeshBasicMaterial( {color : c, transparent: guiParams.blocksTransparent, opacity: 0.3, side: THREE.DoubleSide} );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;

    if (!!optionalArgs && optionalArgs.outOfBuilding) {
        cube.rotation.x = gridRotation.x;
        scene.add(cube);
    }
    if (debug)
        console.log("Making:", x,y,z);

    return cube;
}

function makeBuilding(x, z, width, floors) {
    var building = new THREE.Object3D();;

    if (!objects.buildings) {
        objects.buildings = [];
    }

    objects.buildings.push(building);

    var wSquared = (width * width);
    wSquared = width;

    var count = 0;

    for (var xCoord = 0; xCoord < wSquared; xCoord++) {
        for (var yCoord = 0; yCoord < floors; yCoord++) {
            for (var zCoord = 0; zCoord < wSquared; zCoord++) {
                count++;
                building.add(makeBuildingCube(
                    gridPosition.x + xCoord,
                    gridPosition.y - yCoord,
                    gridPosition.z + zCoord,
                    {color : new THREE.Color('green')}
                ));
            }
        }
    }
    if (debug)
        console.log("Made " + count + " blocks for: ", {width,floors});

    building.rotation.x = gridRotation.x;

    scene.add(building);
}

function addGuiControls() {
    // var sizeController = gui.add(guiParams, 'gridSize', 1, 100).step(1);
    // sizeController.onFinishChange(changeGrid);
    //
    // gui.add(guiParams, 'printParams');
    var sectionsController = gui.add(guiParams, 'gridSections', 1, 25).step(1);
    sectionsController.onFinishChange(changeGrid);

    gui.add(guiParams, 'blocksTransparent');

    // gui.add( camera.position , 'x', -50, 50 ).step(5)
    // gui.add( camera.position , 'y', -500, 500 ).step(5)
    // gui.add( camera.position , 'z', -500, 500 ).step(5)
}

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    makeGrid();
    // makeBuilding(0,0, 1, 1);
    // makeBuilding(0,0, 4, 2);
    makeBuilding(1, 0, 2, 2);

    if (debug)
        controls = new THREE.OrbitControls( camera, renderer.domElement );

    adjustCamera();

    addGuiControls();
    // TODO :
    // Make a single building, make it accessible to guiParams manipulation
    // (just height and # ppl per building [e.g. perfect square numbers basically, dropdown list of like 1, 4, 9, 16, a few more?])
    // and leave a place for updating text about how many people this could house!
    //
    // Beginnings of text system for showing square footage :)

    addResizeListener();
}

function update() {
    // guiParams.gridSections = Math.random(5) * 100;
}

function render() {
    requestAnimationFrame( render );
    update();
    renderer.render(scene, camera);
};


init();
render();
