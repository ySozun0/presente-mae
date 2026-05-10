/* ===== GROOVE: vanilla JS player =====
   Drop MP3 files into assets/songs and images into assets/images
   Update the `tracks` array below with filenames and metadata.
*/

 const tracks = [
  {
    id: "t1",
    title: "Eu Te Devoro",
    artist: "Djavan",
    src: "assets/songs/Djavan - Eu Te Devoro.m4a",
    cover: "assets/images/foto1.jpg",
    duration: 0
  },
  {
    id: "t2",
    title: "Passarinhos feat. Vanessa da Mata",
    artist: "Emicida",
    src: "assets/songs/Emicida - Passarinhos feat. Vanessa da Mata (Áudio Oficial).m4a",
    cover: "assets/images/foto12.jpg",
    duration: 0
  },
  {
    id: "t3",
    title: "Quem Sabe Isso Quer Dizer Amor",
    artist: "Milton Nascimento",
    src: "assets/songs/Quem Sabe Isso Quer Dizer Amor.m4a",
    cover: "assets/images/foto17.jpg",
    duration: 0
  }
];

/* Elements */
const audio = document.getElementById('audio');
const songListEl = document.getElementById('songList');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const albumArtEl = document.getElementById('albumArt');

const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');

const seek = document.getElementById('seek');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

const volume = document.getElementById('volume');
const muteBtn = document.getElementById('muteBtn');
const searchInput = document.getElementById('search');

/* State */
let index = 0;
let isPlaying = false;
let isShuffling = false;
let repeatMode = 0; // 0 = off, 1 = repeat all, 2 = repeat one
let updateTimer = null;

/* UTIL */
const fmt = s => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2,'0');
  return `${m}:${sec}`;
};

/* Build playlist UI */
function buildList(filter = '') {
  songListEl.innerHTML = '';
  const q = filter.trim().toLowerCase();
  tracks.forEach((t, i) => {
    if (q && !(t.title + ' ' + t.artist).toLowerCase().includes(q)) return;
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.dataset.index = i;
    li.innerHTML = `
      <img class="song-thumb" src="${t.cover}" alt="${t.title} cover" onerror="this.src='assets/images/placeholder.jpg'">
      <div class="song-meta">
        <div class="song-title">${t.title}</div>
        <div class="song-artist">${t.artist}</div>
      </div>
    `;
    li.addEventListener('click', () => loadTrack(i));
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadTrack(i); });
    songListEl.appendChild(li);
  });
  highlightCurrent();
}

/* Load a track */
function loadTrack(i) {
  index = i;
  const t = tracks[index];
  audio.src = t.src;
  titleEl.textContent = t.title;
  artistEl.textContent = t.artist;
  albumArtEl.src = t.cover;
  Array.from(songListEl.children).forEach(li => li.classList.remove('active'));
  const li = Array.from(songListEl.children).find(n => Number(n.dataset.index) === i);
  if (li) li.classList.add('active');
  audio.load();
  // Autoplay if already playing
  if (isPlaying) audio.play();
}

/* Play / Pause */
playBtn.addEventListener('click', () => {
  if (!audio.src) loadTrack(index);
  if (audio.paused) audio.play();
  else audio.pause();
});
audio.addEventListener('play', () => {
  isPlaying = true; playBtn.textContent = '⏸'; playBtn.setAttribute('aria-pressed','true');
});
audio.addEventListener('pause', () => {
  isPlaying = false; playBtn.textContent = '▶'; playBtn.setAttribute('aria-pressed','false');
});

/* Prev / Next */
prevBtn.addEventListener('click', () => {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  index = (index - 1 + tracks.length) % tracks.length;
  loadTrack(index);
  audio.play();
});
nextBtn.addEventListener('click', () => nextTrack());

function nextTrack() {
  if (isShuffling) {
    index = Math.floor(Math.random() * tracks.length);
  } else {
    index = (index + 1) % tracks.length;
  }
  loadTrack(index);
  audio.play();
}

/* Shuffle / Repeat */
shuffleBtn.addEventListener('click', () => {
  isShuffling = !isShuffling;
  shuffleBtn.setAttribute('aria-pressed', String(isShuffling));
  shuffleBtn.style.opacity = isShuffling ? 1 : 0.9;
});

repeatBtn.addEventListener('click', () => {
  repeatMode = (repeatMode + 1) % 3;
  repeatBtn.setAttribute('aria-pressed', String(repeatMode !== 0));
  repeatBtn.textContent = repeatMode === 0 ? '🔁' : repeatMode === 1 ? '🔁' : '🔂';
});

/* Time updates */
audio.addEventListener('loadedmetadata', () => {
  seek.max = audio.duration;
  durationEl.textContent = fmt(audio.duration);
});
audio.addEventListener('timeupdate', () => {
  seek.value = audio.currentTime;
  currentTimeEl.textContent = fmt(audio.currentTime);
});
seek.addEventListener('input', () => {
  audio.currentTime = Number(seek.value);
});

/* When track ends */
audio.addEventListener('ended', () => {
  if (repeatMode === 2) { // repeat one
    audio.currentTime = 0; audio.play();
  } else if (repeatMode === 1) { // repeat all
    nextTrack();
  } else {
    // no repeat
    if (isShuffling) nextTrack();
    else if (index < tracks.length - 1) nextTrack();
    else { audio.pause(); audio.currentTime = 0; }
  }
});

/* Volume / Mute */
volume.addEventListener('input', () => {
  audio.volume = Number(volume.value);
  muteBtn.textContent = audio.volume > 0.01 ? '🔈' : '🔇';
});
muteBtn.addEventListener('click', () => {
  if (audio.volume > 0.01) { volume.dataset.prev = audio.volume; audio.volume = 0; volume.value = 0; muteBtn.textContent = '🔇' }
  else { const prev = Number(volume.dataset.prev || 0.8); audio.volume = prev; volume.value = prev; muteBtn.textContent = '🔈' }
});

/* Keyboard shortcuts */
window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  // ignore when typing in inputs
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
  if (e.code === 'Space') { e.preventDefault(); if (audio.paused) audio.play(); else audio.pause(); }
  if (e.code === 'ArrowRight') { audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || Infinity); }
  if (e.code === 'ArrowLeft') { audio.currentTime = Math.max(audio.currentTime - 5, 0); }
  if (e.code === 'ArrowUp') { audio.volume = Math.min((audio.volume || 0) + 0.05, 1); volume.value = audio.volume; }
  if (e.code === 'ArrowDown') { audio.volume = Math.max((audio.volume || 0) - 0.05, 0); volume.value = audio.volume; }
});

/* Search */
searchInput.addEventListener('input', (e) => buildList(e.target.value));

/* Highlight current list item */
function highlightCurrent() {
  Array.from(songListEl.children).forEach(li => {
    li.classList.toggle('active', Number(li.dataset.index) === index);
  });
}

/* On load */
(function init(){
  // ensure audio volume initial
  audio.volume = Number(volume.value || 0.8);
  buildList();
  loadTrack(0);

  // Preload durations (optional): set duration property by loading meta quietly
  tracks.forEach((t, i) => {
    const a = new Audio();
    a.src = t.src;
    a.addEventListener('loadedmetadata', () => { tracks[i].duration = a.duration; });
  });
})();
