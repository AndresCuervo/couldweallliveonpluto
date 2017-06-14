// For reference, toggle look-controls in an A-Frame scene
// document.querySelector('a-camera').setAttribute('look-controls', 'enabled', !(document.querySelector('a-camera').getAttribute('look-controls').enabled));

var paused = false;

var camSelector = 'a-camera';

function setLookControls(value) {
    document.querySelector(camSelector).setAttribute('look-controls', 'enabled', value);
}

function showAboutInfo(show) {
    // @show should be a bool

    var aboutEl = document.querySelector('#aboutInfo');
    if (show) {
        aboutEl.style.display = "block";
    } else {
        aboutEl.style.display = "none";
    }
}

function toggleAboutInfo() {
    showAboutInfo(!paused);
    setLookControls(paused);
    // toggle paused variable
    paused = !paused;
}

var params = {
    soundOn : true,
    backgroundAnimation: true,

    'print' : function() {
        console.log("test print fn");
    },
    'About' : toggleAboutInfo
};

var gui;

function stopAllSounds() {
    var allSoundEls = document.querySelectorAll('[sound]')
    for (var i = 0; i < allSoundEls.length; i++) {
        allSoundEls[i].components.sound.stopSound();
    }
}

window.onload = function() {
    // Customize GUI text
    // Taken from source: https://github.com/dataarts/dat.gui/blob/master/src/dat/gui/GUI.js#L467-L468
    dat.GUI.TEXT_CLOSED = 'Close';
    dat.GUI.TEXT_OPEN = 'Show options & about';

    gui = new dat.GUI();
    var soundController = gui.add( params, 'soundOn');
    soundController.onFinishChange(function(newValue) {
        // Fires on every change, drag, keypress, etc.
        // alert("The new value is " + value);

        if (newValue === false) {
            // Stop all sounds when someone wants to stop listening to them, just good UX
            stopAllSounds();
        }
    });

    var infoController = gui.add( params, 'About');

    // gui.add( params, 'print');

    // Hide the gui by default
    dat.GUI.toggleHide();
    // close instead:
    // gui.close();
}

AFRAME.registerComponent('loading-bar', {
    // `selector` must be a valid string for querySelectorAll
    schema : {selector : {default : camSelector}},
    init: function () {
        if (this.data.selector != camSelector) {
            camSelector = this.data.selector;
        }

        setLookControls(false);

        var manager = document.querySelector('a-assets').fileLoader.manager;

        var progress = document.createElement('div');
        var progressBar = document.createElement('div');

        var note = document.createElement('div');

        var barHeight = 5;

        note.innerHTML = 'Loading <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
        note.classNames += "bounce";

        progress.appendChild(note);

        progress.appendChild(progressBar);

        progress.id = "progress";
        progressBar.id = "progressBar";
        note.id = "progressNote";

        document.body.appendChild(progress);

        manager.onProgress = function ( item, loaded, total ) {
            var prog = (loaded / total * 100);
            progressBar.style.width = prog + '%';
            // console.log(prog);
        };

        manager.onLoad = function () {
            console.log("progress? ", progress);
            console.log("progress parent? ", progress.parentElement);
            setLookControls(true);
            // progress.parentElement.removeChild(progress);
        }
    }
});


// Make a custom mouseenter component that plays a sound lol

// Registering component in foo-component.js
AFRAME.registerComponent('enter-sound', {
    schema: {
        sound: {default: ''}
    },

    init: function () {
        this.el.addEventListener('mouseenter', function (evt) {
            // console.log('I was clicked at: ', evt.detail.intersection.point);
            // console.log(this.el);
            if (params.soundOn) {
                this.components.sound.playSound();
                // console.log("playing ...");
            }
        });
    },
  update: function () {},
  tick: function () {},
  remove: function () {},
  pause: function () {},
  play: function () {}
});

