// spotify-auth.js
let player;
let deviceId;
let access_token;

window.onSpotifyWebPlaybackSDKReady = () => {
  access_token = new URLSearchParams(window.location.hash.substring(1)).get(
    "access_token"
  );
  if (!access_token) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<button id="loginBtn" style="position:fixed;top:20px;right:20px;z-index:999;padding:10px 16px;border:none;border-radius:20px;background:#1db954;color:#fff;font-weight:bold;cursor:pointer;">Login with Spotify</button>`
    );
    document.getElementById("loginBtn").onclick = () => {
      window.location.href = "/login";
    };
    return;
  }

  player = new Spotify.Player({
    name: "AI Mood Mixer Player",
    getOAuthToken: (cb) => {
      cb(access_token);
    },
    volume: 0.8,
  });

  // Player listeners
  player.addListener("ready", ({ device_id }) => {
    deviceId = device_id;
    console.log("✅ Player Ready with Device ID", deviceId);
  });

  player.addListener("not_ready", ({ device_id }) => {
    console.log("❌ Player offline", device_id);
  });

  player.addListener("initialization_error", (e) => console.error(e));
  player.addListener("authentication_error", (e) => console.error(e));
  player.addListener("account_error", (e) => console.error(e));

  player.connect();
};

// Play track function (call this when user clicks song)
async function playTrack(uri) {
  if (!access_token || !deviceId) {
    alert("Login to Spotify first!");
    return;
  }

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [uri] }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });
}
window.playTrack = playTrack;
