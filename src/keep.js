
const { desktopCapturer, remote} = require('electron');

const { writeFile } = require('fs');

const {dialog, Menu} = remote;

// Global state
let mixedStream;
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start Recording';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      }
    })
  );

  videoOptionsMenu.popup();

  // const sources = 
  // await ipcRenderer.invoke('electron-menu', sources);

}

async function selectSource(source) {
  console.log(source);

  videoSelectBtn.innerText = source.name;

  const vidconstraints = {
    video: true
  };

  const audconstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  };
  // Create a Stream
  const stream = await navigator.mediaDevices.getDisplayMedia(vidconstraints);
  const audio = await navigator.mediaDevices.getUserMedia(audconstraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();
  //videoElement.muted = true;

  // Create the Media Recorder
  const options = {
    mimeType: 'video/webm; codecs=vp9' 
  };
  mixedStream = new MediaStream([
    ...stream.getTracks(),
    ...audio.getTracks()
  ])
  mediaRecorder = new MediaRecorder(mixedStream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  
  const {filePath} = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath:  `screen-recording-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }

}
