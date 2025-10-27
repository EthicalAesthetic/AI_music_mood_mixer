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

// Wire uploaded file to hidden audio element for playback       19 OCT 2025 8:25
const audioEl = document.getElementById('audioElement');
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;
    const objectUrl = URL.createObjectURL(file);
    audioEl.src = objectUrl;
    audioEl.load();
    // Auto-open player when file selected
    floatingPlayer.style.display = 'block';
    floatingPlayer.querySelector('#expandedSongNameCenter').textContent = file.name;
    // start paused — user can press play
    isPlaying = false;
    updatePlayPauseIcon();
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
    if(!audioEl.src){
        // No audio loaded — give a subtle feedback
        playPauseBtn.classList.add('shake');
        setTimeout(()=> playPauseBtn.classList.remove('shake'), 400);
        return;
    }
    isPlaying = !isPlaying;
    updatePlayPauseIcon();
    if(isPlaying){
        audioEl.play().catch(()=>{
            isPlaying = false; updatePlayPauseIcon();
        });
        document.querySelector('.floating-player').classList.add('playing');
    } else {
        audioEl.pause();
        document.querySelector('.floating-player').classList.remove('playing');
    }
};
updatePlayPauseIcon();

// Keep UI in sync when playback ends
audioEl.addEventListener('ended', ()=>{
    isPlaying = false; updatePlayPauseIcon();
    document.querySelector('.floating-player').classList.remove('playing');
});

// small CSS-feedback for missing audio
const style = document.createElement('style');
style.textContent = `
.player-btn.shake{ animation: shakeIt 0.36s; }
@keyframes shakeIt{ 0%{ transform: translateX(0);} 25%{ transform: translateX(-6px);} 50%{ transform: translateX(6px);} 75%{ transform: translateX(-3px);} 100%{ transform: translateX(0);} }
`;
document.head.appendChild(style);