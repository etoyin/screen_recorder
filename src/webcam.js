
document.addEventListener('DOMContentLoaded', async function(){
    const streamWebCam = await navigator.mediaDevices.getUserMedia({video: true});
    const webCam = document.getElementById('webCam');
    webCam.srcObject = streamWebCam;
    webCam.play();
})

