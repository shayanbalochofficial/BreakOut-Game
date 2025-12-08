const rulesButton = document.getElementById("rules-btn");
const closeButton = document.getElementById("close-btn");
const rules = document.getElementById("rules");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let score = 0;
let highScore = parseInt(localStorage.getItem("neonBreakoutHS") || "0");
let level = 1;
const brickRowCount = 10;
const brickColumnCount = 6;
const totalBricksPerLevel = brickRowCount * brickColumnCount;
const neonColors = [
  "#BB86FC",
  "#FF69B4",
  "#00F5FF",
  "#39FF14",
  "#FFF23F",
  "#FF1493",
];

// Audio yaha
let audioCtx;
let audioInitialized = false;
function initAudio() {
  if (audioInitialized) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioInitialized = true;
}

function playSound(frequency, duration = 0.1, type = "sine", volume = 0.3) {
  if (!audioCtx || audioCtx.state === "suspended") return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = frequency;
  osc.type = type;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

// Particles andd Trail
let particles = [];
let ballTrail = [];

function resizeCanvas() {
  const containerWidth = Math.min(900, window.innerWidth * 0.95);
  const heightRatio = 0.75;
  const desiredWidth = containerWidth;
  const desiredHeight = desiredWidth * heightRatio;

  canvas.width = desiredWidth;
  canvas.height = desiredHeight;
  canvas.style.width = desiredWidth + "px";
  canvas.style.height = desiredHeight + "px";

  const scale = canvas.width / 900;

  resetGame();
}
