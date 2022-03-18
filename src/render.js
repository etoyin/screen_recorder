
const path = require('path');
const { desktopCapturer, remote} = require('electron');
const BrowserWindow  = remote.BrowserWindow;
const { writeFile } = require('fs');

const {dialog, Menu} = remote;

// Global state
let mediaRecorder, mixedStream
const recordedChunks = [];



// Buttons
const videoElement = document.getElementById('screen');

const startBtn = document.getElementById('startBtn');
// let webCam;
const camSwitch = document.getElementById('camSwitch');
const stopBtn = document.getElementById('stopBtn');

let win = null;



win = new BrowserWindow({show: false,frame: false, width: 260, height: 200, alwaysOnTop: true});


camSwitch.addEventListener('change', async function(){
  
  // const offCam = await navigator.mediaDevices.getUserMedia({video: false})
  // alert(camSwitch.checked);
  if(camSwitch.checked){
    const modalPath = path.join('file://', __dirname, 'webcam.html');
    win = new BrowserWindow({show: false, frame: false, width: 260, height: 200, alwaysOnTop: true});
    //set video position
    win.setPosition(screen.width - 280, screen.height - 250)
    win.on('close', function(){
      win = null;
      document.getElementById('camSwitch').checked = false;
      //webCam.srcObject = undefined;
    })
    win.loadURL(modalPath);
    win.show();
    win.focus();
  }
  else{
    // win = null;
    // console.log(win)
    // win.hide();
    // remote.getCurrentWindow().close();
    win.close();
    // console.log("jjjjjjj");
    // webCam.srcObject = undefined;
    // webCam.stop();
  }
})


startBtn.onclick = e => {
  getVideoSources(function(){
    mediaRecorder.start();
    startBtn.style.backgroundColor =  "#ff3300"
    // startBtn.innerText = 'Recording';
  })
  
};

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.style.backgroundColor =  "#fff"
  // startBtn.classList.remove('is-danger');

  // startBtn.innerText = 'Start Recording';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources(callback) {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = await Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => {
          // console.log("A");
          return selectSource(source, function(){
            callback();
          })
        }
      }
    })
    
  );

  await videoOptionsMenu.popup();
  // console.log("B")
  // callback()
  // const sources = 
  // await ipcRenderer.invoke('electron-menu', sources);

}

async function selectSource(source, callback) {
  console.log(source);

  videoSelectBtn.innerText = source.name;

  const vidconstraints = {
    //video yes alone will display camera video
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  const audconstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(vidconstraints);
  const audio = await navigator.mediaDevices.getUserMedia(audconstraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();
  //videoElement.muted = true;

  // Create the Media Recorder
  const options = {
    mimeType: 'video/webm' 
  };
  mixedStream = new MediaStream([
    ...stream.getTracks(),
    ...audio.getTracks()
  ])
  mediaRecorder = new MediaRecorder(mixedStream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  
  callback()
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  
  const {filePath} = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath:  `screen-recording-${Date.now()}.mp4`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }

}
