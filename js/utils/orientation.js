// need a global (maybe a map object?) with called gyroPresent

function addDeviceMotionListener() {
    window.addEventListener("devicemotion", function(event){
        if (gyroPresent === false && (event.rotationRate.alpha || event.rotationRate.beta || event.rotationRate.gamma)) {
            gyroPresent = true;
        }
    });
}
