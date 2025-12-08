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

// Game Objects wohooo
const ball = {
  x: 0,
  y: 0,
  size: 0,
  velocity: 0,
  dx: 0,
  dy: 0,
  reset() {
    const scale = canvas.width / 900;
    this.size = 12 * scale;
    this.velocity = 5 * scale;
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.dx = this.velocity * (Math.random() < 0.5 ? -1 : 1);
    this.dy = -this.velocity;
  },
};

const paddle = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  speed: 0,
  dx: 0,
  reset() {
    const scale = canvas.width / 900;
    this.w = 100 * scale;
    this.h = 16 * scale;
    this.speed = 9 * scale;
    this.x = canvas.width / 2 - this.w / 2;
    this.y = canvas.height - 40 * scale;
    this.dx = 0;
  },
};

let brickInfo = {
  padding: 0,
  offsetX: 0,
  offsetY: 0,
};

let bricks = [];

// Build Bricks
function buildBricks() {
  const scaleX = canvas.width / 900;
  const scaleY = canvas.height / 675;
  brickInfo.w = 72 * scaleX;
  brickInfo.h = 24 * scaleY;
  brickInfo.padding = 12 * scaleX;
  brickInfo.offsetX = 35 * scaleX;
  brickInfo.offsetY = 70 * scaleY;

  bricks = [];
  for (let i = 0; i < brickRowCount; i++) {
    bricks[i] = [];
    for (let j = 0; j < brickColumnCount; j++) {
      const x = i * (brickInfo.w + brickInfo.padding) + brickInfo.offsetX;
      const y = j * (brickInfo.h + brickInfo.padding) + brickInfo.offsetY;
      bricks[i][j] = {
        x,
        y,
        w: brickInfo.w,
        h: brickInfo.h,
        visible: true,
        color: neonColors[j % neonColors.length],
      };
    }
  }
}

// Drawing with Glows
function setGlow(color, blur = 25) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function resetGlow() {
  ctx.shadowBlur = 0;
}

function drawBall() {}
