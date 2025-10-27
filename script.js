// ======== References ========
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const fileInput = document.getElementById("fileInput");
const audioEl = document.getElementById("audioElement");
const floatingPlayer = document.getElementById("floatingPlayer");
const expandedSongNameCenter = document.getElementById("expandedSongNameCenter");
const playPauseBtn = document.getElementById("playPause");
const songDisplay = document.getElementById("songDisplay");
const expandedSongDisplay = document.getElementById("expandedSongDisplay");
const homeSongTitle = document.getElementById("homeSongTitle");
const analyzeBtn = document.getElementById("analyzeBtn");
// Burger menu open/close
const hamburgerBtn = document.getElementById('hamburgerBtn');
const floatingMenu = document.getElementById('floatingMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
hamburgerBtn.onclick = () => { floatingMenu.style.display = 'block'; };
closeMenuBtn.onclick = () => { floatingMenu.style.display = 'none'; };

let isPlaying = false;
let spotifyPlayer;
let deviceId = null;

// ======== Player Icon Logic ========
function updatePlayPauseIcon() {
  playPauseBtn.innerHTML = isPlaying
    ? '<i class="fa-solid fa-pause"></i>'
    : '<i class="fa-solid fa-play"></i>';
  playPauseBtn.title = isPlaying ? "Pause" : "Play";
}
updatePlayPauseIcon();

// ======== Spotify Web Playback SDK Setup ========
window.onSpotifyWebPlaybackSDKReady = () => {
  fetch("http://localhost:3000/api/token")
    .then(res => res.json())
    .then(({ access_token }) => {
      spotifyPlayer = new Spotify.Player({
        name: "AI Mood Mixer Web Player",
        getOAuthToken: cb => cb(access_token),
        volume: 0.8,
      });

      spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Spotify Player Ready with Device ID:", device_id);
        deviceId = device_id;
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.warn("Device ID has gone offline", device_id);
      });

      spotifyPlayer.connect();
    });
};

// ======== Spotify Play Function ========
async function playTrack(trackUri) {
  if (!deviceId) {
    alert("Spotify player not ready yet. Please wait a moment.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uri: trackUri }),
    });

    if (!res.ok) throw new Error("Playback failed");
    floatingPlayer.style.display = "block";
    isPlaying = true;
    updatePlayPauseIcon();
  } catch (err) {
    console.error("Spotify play error:", err);
    alert("Could not play this track with Spotify.");
  }
}

// ======== Play / Pause Button ========
playPauseBtn.onclick = () => {
  if (!audioEl.src && !spotifyPlayer) return;
  isPlaying = !isPlaying;
  if (audioEl.src) {
    if (isPlaying)
      audioEl.play().catch(() => {
        isPlaying = false;
        updatePlayPauseIcon();
      });
    else audioEl.pause();
  } else if (spotifyPlayer) {
    spotifyPlayer.togglePlay();
  }
  updatePlayPauseIcon();
};

// ======== Close Floating Player ========
document.getElementById("closePlayerBtn").onclick = () => {
  floatingPlayer.style.display = "none";
  audioEl.pause();
  isPlaying = false;
  updatePlayPauseIcon();
};

// ======== Upload Button ========
document.getElementById("uploadBtn").onclick = () => fileInput.click();

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Load the selected audio file
  audioEl.src = URL.createObjectURL(file);
  audioEl.load();

  // Update UI
  floatingPlayer.style.display = "block";
  expandedSongNameCenter.textContent = file.name;
  songDisplay.innerHTML = `<p>${file.name}</p>`;
  expandedSongDisplay.style.display = "block";
  homeSongTitle.textContent = file.name;

  // Reset play state
  isPlaying = false;
  updatePlayPauseIcon();

  // Optional: auto-play on upload
  // audioEl.play(); isPlaying = true; updatePlayPauseIcon();
});

// ======== Analyze Mood ========
analyzeBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please upload a song first!");
    return;
  }

  analyzeBtn.textContent = "Analyzing...";
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("song", file);

    const response = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const mood = data.mood;
    homeSongTitle.textContent = `Mood: ${mood.toUpperCase()}`;

    const recRes = await fetch(
      `http://localhost:3000/api/recommendations?mood=${mood}`
    );
    const recData = await recRes.json();

    if (recData.tracks && recData.tracks.length > 0) {
      const recHTML = `
        <h3 style="margin-top:1rem;color:#333;">Recommended Songs (${mood} mood)</h3>
        <ul style="list-style:none;padding:0;margin-top:10px;">
          ${recData.tracks
            .map(
              (t) => `
            <li style="margin:6px 0;cursor:pointer;display:flex;align-items:center;gap:10px;"
                data-uri="${t.uri || ""}"
                data-preview="${t.preview_url || ""}">
                <img src="${t.image}" style="width:40px;height:40px;border-radius:6px;">
                <span>${t.name} - ${t.artist}</span>
            </li>`
            )
            .join("")}
        </ul>`;
      expandedSongDisplay.innerHTML = `
        <div id="mooditle">Mood: ${mood.toUpperCase()}</div>
        ${recHTML}`;
    } else {
      expandedSongDisplay.innerHTML = `<div id="homeSongTitle">Mood: ${mood.toUpperCase()}</div><p>No recommendations found.</p>`;
    }

    // ======== Click to Play Recommendation ========
    expandedSongDisplay.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        const uri = li.dataset.uri;
        const preview = li.dataset.preview;
        const trackName = li.querySelector("span").textContent;

        if (uri) {
          playTrack(uri);
          expandedSongNameCenter.textContent = trackName;
        } else if (preview) {
          audioEl.src = preview;
          audioEl.load();
          audioEl.play();
          expandedSongNameCenter.textContent = trackName;
          floatingPlayer.style.display = "block";
          isPlaying = true;
          updatePlayPauseIcon();
        } else {
          alert("No playback available for this song.");
        }
      });
    });
  } catch (err) {
    console.error(err);
    alert("Error analyzing mood. Try again.");
  }

  analyzeBtn.textContent = "Analyze Mood";
  analyzeBtn.disabled = false;
});

// ======== Search Dropdown ========
searchInput.addEventListener("keyup", async (e) => {
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.style.display = "none";
    return;
  }

  if (e.key === "Enter") {
    const firstLi = searchResults.querySelector("li[data-uri]");
    if (firstLi) firstLi.click();
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:3000/api/search?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (!data.tracks || data.tracks.length === 0) {
      searchResults.innerHTML = `<li>No results for "${query}"</li>`;
      searchResults.style.display = "block";
      return;
    }

    searchResults.innerHTML = data.tracks
      .map(
        (track) => `
        <li data-uri="${track.uri || ""}" data-preview="${track.preview_url || ""}">
          <img src="${track.image || ""}" alt="album cover">
          <span>${track.name} - ${track.artist}</span>
        </li>`
      )
      .join("");
    searchResults.style.display = "block";
  } catch (err) {
    console.error(err);
    searchResults.innerHTML = `<li>Error fetching data</li>`;
    searchResults.style.display = "block";
  }
});

// ======== Play from Search ========
searchResults.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  const uri = li.dataset.uri;
  const previewUrl = li.dataset.preview;
  const trackName = li.querySelector("span").textContent;

  if (uri) {
    playTrack(uri);
    expandedSongNameCenter.textContent = trackName;
  } else if (previewUrl) {
    audioEl.src = previewUrl;
    audioEl.load();
    audioEl.play().catch((err) => {
      console.error("Playback failed", err);
      alert("Playback failed. This track cannot be played.");
    });
    expandedSongNameCenter.textContent = trackName;
    floatingPlayer.style.display = "block";
    isPlaying = true;
    updatePlayPauseIcon();
  } else {
    alert("No preview or Spotify URI available for this track.");
  }

  searchResults.style.display = "none";
});

// ======== Hide Dropdown on Outside Click ========
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.style.display = "none";
  }
});

// ======== When Audio Ends ========
audioEl.addEventListener("ended", () => {
  isPlaying = false;
  updatePlayPauseIcon();
});

