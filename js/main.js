if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var scene, camera, renderer;
scene = new THREE.Scene();
scene.background = new THREE.Color( 0x222222 );
camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var gui = new dat.GUI();

var debug = false;
var urlParams = new URLSearchParams(window.location.search);
var debug = debug || urlParams.get('debug') != null;

const gridPosition = {x : 0, y : 0, z : 0};
// const gridPosition = {x : 4.5, y : -0.5, z : 0};

var objects = {}

var guiParams = {
    'gridSize' : 10,
    'blocksTransparent' : true,
    'cubeSize' : 1,
    'maxBuildingWidth' : 30,
    'maxBuildingFloors' : 80,
    'x' : 0,
    'makeNewBuilding' : function () {
        makeBuilding(guiParams.x, 0, 3, 3)
        guiParams.x++;
    }
}

var gridRotation = {x : 60.25};

var gridColor = 0x2eafac;
// gridColor = 'white';

function makeGrid() {
    objects.grid = new THREE.GridHelper(guiParams.gridSize, guiParams.gridSize, gridColor, gridColor);
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
    var geometry = new THREE.BoxGeometry(1,1,1);
    var c = 0x2EAFAC;
    if (!!optionalArgs && optionalArgs.color) {
        c = optionalArgs.color;
    }
    var material = new THREE.MeshBasicMaterial( {color : c, transparent: guiParams.blocksTransparent, opacity: 0.6, side: THREE.DoubleSide} );
    var cube = new THREE.Mesh( geometry, material );

    // gridPosition.<whatever> - 0.5 is because the grid is fucking misaligned
    cube.position.x = gridPosition.x - 0.5 +  x;
    cube.position.y =  0 - (gridPosition.y + y + 0.5);
    cube.position.z = gridPosition.z - 0.5 +  z;

    if (!!optionalArgs && optionalArgs.outOfBuilding) {
        cube.rotation.x = gridRotation.x;
        scene.add(cube);
    }
    if (debug)
        console.log("Making:", x,y,z);

    return cube;
}

function makeBuilding(x, z, width, floors) {
    if (width > guiParams.maxBuildingWidth) {
        alert("Building not made: tried to make building with more than ",guiParams.maxBuildingWidth, " floors.");
    } else if (floors > guiParams.maxBuildingFloors) {
        alert("Building not made: tried to make building with more than ",guiParams.maxBuildingFloors, " width.");
    } else {
        var building = new THREE.Object3D();;

        if (!objects.buildings) {
            objects.buildings = [];
        }

        objects.buildings.push(building);

        var wSquared = (width * width);
        wSquared = width;

        var count = 0;

        // Unnecessary???
        var spacing = guiParams.cubeSize - 1;

        for (var xCoord = 0; xCoord < wSquared; xCoord++) {
            for (var yCoord = 0; yCoord < floors; yCoord++) {
                for (var zCoord = 0; zCoord < wSquared; zCoord++) {
                    count++;
                    building.add(makeBuildingCube(
                        x + xCoord + spacing,
                        yCoord + spacing,
                        z + zCoord + spacing
                    ));
                }
            }
        }
        if (debug)
            console.log("Made " + count + " blocks for: ", {width,floors});

        building.rotation.x = gridRotation.x;

        scene.add(building);

    }
}

function scaleCubes(value) {
    // objects.buildings[0].children[0].scale.x = 3
    for (x in objects.buildings) {
        for (y in objects.buildings[x].children) {
            console.log({x,y});
            objects.buildings[x].children[y].scale.x = value;
            objects.buildings[x].children[y].scale.y = value;
            objects.buildings[x].children[y].scale.z = value;
        }
    }
}

function addGuiControls() {
    var sizeController = gui.add(guiParams, 'gridSize', 1, 100).step(1);
    sizeController.onFinishChange(changeGrid);

    // gui.add(guiParams, 'printParams');

    var cubeSizeController = gui.add(guiParams, 'cubeSize', 1, 10);
    cubeSizeController.onFinishChange(scaleCubes);

    gui.add(guiParams, 'blocksTransparent');
    gui.add(guiParams, 'makeNewBuilding');
    gui.add(guiParams, 'x');

    // gui.add( camera.position , 'x', -50, 50 ).step(5)
    // gui.add( camera.position , 'y', -500, 500 ).step(5)
    // gui.add( camera.position , 'z', -500, 500 ).step(5)
}

function init() {
    renderer = new THREE.WebGLRenderer({antialias : true});
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    makeGrid();
    // makeBuilding(0,0, 1, 1);
    // makeBuilding(0,0, 4, 2);
    // makeBuilding(1, 0, 5, 50);
    // makeBuilding(0, 0, 5, 50);

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
