// Burger menu open/close
const hamburgerBtn = document.getElementById('hamburgerBtn');
const floatingMenu = document.getElementById('floatingMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
hamburgerBtn.onclick = () => { floatingMenu.style.display = 'block'; };
closeMenuBtn.onclick = () => { floatingMenu.style.display = 'none'; };

// Wave icon player open/close
const waveIconBtn = document.getElementById('waveIconBtn');
const floatingPlayer = document.getElementById('floatingPlayer');
const closePlayerBtn = document.getElementById('closePlayerBtn');
waveIconBtn.onclick = () => {
    floatingPlayer.style.display = 'block';
    floatingPlayer.querySelector('#expandedSongNameCenter').textContent =
        document.getElementById('homeSongTitle').textContent || 'No song selected';
};
closePlayerBtn.onclick = () => { floatingPlayer.style.display = 'none'; };

// Search bar icon focus logic
const searchInput = document.getElementById('searchInput');
const searchIcon = document.querySelector('.searchengin-icon');
searchInput.addEventListener('focus', ()=> searchIcon.style.opacity = '1');
searchInput.addEventListener('blur', ()=> { if(!searchInput.value) searchIcon.style.opacity = '0'; });

// Upload Button triggers file input
document.getElementById('uploadBtn').onclick = function() {
    document.getElementById('fileInput').click();
};
document.getElementById('fileInput').addEventListener('change', function(e){
    const file = e.target.files[0];
    document.getElementById('songDisplay').innerHTML = file
        ? `<p><strong>Selected:</strong> ${file.name}</p>`
        : `<p>No song selected</p>`;
    document.getElementById('homeSongTitle').textContent = file
        ? file.name : "No song selected";
    floatingPlayer.querySelector('#expandedSongNameCenter').textContent = file
        ? file.name : "No song selected";
});

// Player Button Logic (play/pause icon)
let isPlaying = false;
const playPauseBtn = document.getElementById('playPause');
function updatePlayPauseIcon() {
    playPauseBtn.innerHTML = isPlaying
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';
    playPauseBtn.title = isPlaying ? "Pause" : "Play";
}
playPauseBtn.onclick = function() {
    isPlaying = !isPlaying;
    updatePlayPauseIcon();
};
updatePlayPauseIcon();
