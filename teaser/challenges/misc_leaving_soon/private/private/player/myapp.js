async function play_episode(number) {
	res = await fetch(`http://catflix.local/api/episodes/${number}`)
	data = await res.json()
	console.log(data)
	initPlayer(data.manifest, data.license_server)
}

function replaceVideoElement() {
    const existingVideo = document.querySelector('video');

    if (existingVideo) {
        existingVideo.remove();
    }

    const newVideo = document.createElement('video');
    newVideo.id = 'video';
    newVideo.width = 480;
    newVideo.controls = true;
    newVideo.autoplay = true;

    document.body.insertAdjacentElement('afterbegin', newVideo);
}


function initApp() {
  shaka.polyfill.installAll();
}

async function initPlayer(manifestUri, licenseUri) {
  replaceVideoElement();
  // Create a Player instance.
  const video = document.getElementById('video');
  const player = new shaka.Player();
  player.configure({
      drm: {
        servers: { 'com.widevine.alpha': licenseUri }
      }
    });
  await player.attach(video);

  // Attach player to the window to make it easy to access in the JS console.
  window.player = player;

  // Listen for error events.
  player.addEventListener('error', onErrorEvent);

  // Try to load a manifest.
  // This is an asynchronous process.
  try {
    await player.load(manifestUri);
    // This runs if the asynchronous load is successful.
    console.log('The video has now been loaded!');
  } catch (e) {
    // onError is executed if the asynchronous load fails.
    onError(e);
  }
}

function onErrorEvent(event) {
  // Extract the shaka.util.Error object from the event.
  onError(event.detail);
}

function onError(error) {
  // Log the error.
  console.error('Error code', error.code, 'object', error);
}

document.addEventListener('DOMContentLoaded', initApp);