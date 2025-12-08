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

function drawBall() {
  ballTrail.forEach((pos, i) => {
    const alpha = (i / ballTrail.length) * 0.4;
    ctx.save();
    ctx.globalAlpha = alpha;
    setGlow("#39FF14", 15 * alpha);
    ctx.beginPath();
    ctx.arc(
      pos.x,
      pos.y,
      ball.size * (i / ballTrail.length + 0.3),
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "#39FF14";
    ctx.fill();
    ctx.restore();
  });

  const gradient = ctx.createRadialGradient(
    ball.x - ball.size * 0.4,
    ball.y - ball.size * 0.4,
    0,
    ball.x,
    ball.y,
    ball.size
  );
  gradient.addColorStop(0, "#FFF23F");
  gradient.addColorStop(0.6, "#39FF14");
  gradient.addColorStop(1, "#00F5FF");

  setGlow("#39FF14", 30);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  resetGlow();
}

function drawPaddle() {
  const gradient = ctx.createLinearGradient(
    paddle.x,
    paddle.y,
    paddle.x + paddle.w,
    paddle.y + paddle.h
  );
  gradient.addColorStop(0, "#BB86FC");
  gradient.addColorStop(0.5, "#FF69B4");
  gradient.addColorStop(1, "#8B00FF");

  setGlow("#BB86FC", 25);
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.fillStyle = gradient;
  ctx.fill();
  resetGlow();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#00F5FF";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00F5FF";
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawBricks() {
  bricks.forEach((column) => {
    column.forEach((brick) => {
      if (brick.visible) {
        setGlow(brick.color, 20);
        ctx.beginPath();
        ctx.rect(brick.x, brick.y, brick.w, brick.h);
        ctx.fillStyle = brick.color;
        ctx.fill();
        resetGlow();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FFF";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFF";
        ctx.strokeRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2);
        ctx.shadowBlur = 0;
      }
    });
  });
}

function drawUI() {
  const scale = canvas.width / 900;
  const fontSize = Math.max(22 * scale, 20);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  setGlow("#00F5FF", 20);
  ctx.font = `800 ${fontSize}px Orbitron, monospace`;
  ctx.fillStyle = "#00F5FF";
  ctx.fillText(`SCORE ${score.toLocaleString()}`, canvas.width - 30, 45);

  ctx.font = `700 ${fontSize * 0.85}px Orbitron, monospace`;
  ctx.fillStyle = "#FF69B4";
  setGlow("#FF69B4", 15);
  ctx.fillText(`BEST ${highScore.toLocaleString()}`, canvas.width - 30, 75);

  ctx.fillStyle = "#39FF14";
  setGlow("#39FF14", 15);
  ctx.font = `700 ${fontSize * 0.85}px Orbitron, monospace`;
  ctx.fillText(`LEVEL ${level}`, canvas.width - 30, 105);

  ctx.textAlign = "left";
  resetGlow();
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawUI();
  drawParticles();
}

function drawParticles() {
  particles.forEach((p, i) => {
    ctx.save();
    ctx.globalAlpha = p.life;
    setGlow(p.color, 15 * p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= 0.025;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function movePaddle() {
  paddle.x += paddle.dx;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
}

function moveBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  ball.velocity += 0.008;
  if (ball.velocity > 18) ball.velocity = 18;

  if (ball.x + ball.size > canvas.width || ball.x - ball.size < 0) {
    ball.dx *= -1;
    playSound(350 + Math.random() * 100, 0.08, "square", 0.2);
  }
  if (ball.y - ball.size < 0) {
    ball.dy *= -1;
    playSound(450, 0.08);
  }

  if (
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.size > paddle.y &&
    ball.y < paddle.y + paddle.h
  ) {
    ball.dy = -ball.velocity;
    const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.dx = ball.velocity * hitPos * 1.4;
    playSound(440 + Math.random() * 200, 0.12, "sawtooth", 0.25);
  }

  bricks.forEach((column) => {
    column.forEach((brick) => {
      if (
        brick.visible &&
        ball.x - ball.size < brick.x + brick.w &&
        ball.x + ball.size > brick.x &&
        ball.y - ball.size < brick.y + brick.h &&
        ball.y + ball.size > brick.y
      ) {
        ball.dy *= -1;
        brick.visible = false;
        increaseScore();
        playSound(600 + Math.random() * 300, 0.06, "sine", 0.4);

        for (let k = 0; k < 12; k++) {
          particles.push({
            x: brick.x + brick.w / 2,
            y: brick.y + brick.h / 2,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 1,
            color: brick.color,
          });
        }
      }
    });
  });

  ballTrail.push({ x: ball.x, y: ball.y });
  if (ballTrail.length > 18) ballTrail.shift();

  if (ball.y + ball.size > canvas.height) {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("neonBreakoutHS", highScore.toString());
    }
    playSound(180, 0.8, "sawtooth", 0.5);
    resetGame();
  }
}

function increaseScore() {
  score++;
  level = Math.floor(score / totalBricksPerLevel) + 1;

  let bricksLeft = 0;
  bricks.forEach((column) =>
    column.forEach((brick) => {
      if (brick.visible) bricksLeft++;
    })
  );
  if (bricksLeft === 0) {
    playSound(880, 0.3, "sine");
    showAllBricks();
    ball.velocity += 1.2;
  }
}

function showAllBricks() {
  bricks.forEach((column) => column.forEach((brick) => (brick.visible = true)));
}

function resetGame() {
  score = 0;
  level = 1;
  ball.reset();
  paddle.reset();
  buildBricks();
  particles = [];
  ballTrail = [];
  ball.velocity = 5 * (canvas.width / 900);
}

let isDragging = false;

function handleInput(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const targetX = (clientX - rect.left) * scaleX - paddle.w / 2;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, targetX));
}

canvas.addEventListener("mousedown", (e) => {
  initAudio();
  isDragging = true;
  handleInput(e.clientX);
});
canvas.addEventListener("mousemove", (e) => {
  if (isDragging) handleInput(e.clientX);
});
canvas.addEventListener("mouseup", () => (isDragging = false));
canvas.addEventListener("mouseleave", () => (isDragging = false));

canvas.addEventListener(
  "touchstart",
  (e) => {
    initAudio();
    e.preventDefault();
    isDragging = true;
    handleInput(e.touches[0].clientX);
  },
  { passive: false }
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    handleInput(e.touches[0].clientX);
  },
  { passive: false }
);
canvas.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    isDragging = false;
  },
  { passive: false }
);

document.addEventListener("keydown", (e) => {
  initAudio();
  if (e.key === "ArrowRight" || e.key === "Right") paddle.dx = paddle.speed;
  if (e.key === "ArrowLeft" || e.key === "Left") paddle.dx = -paddle.speed;
});
document.addEventListener("keyup", (e) => {
  if (["ArrowLeft", "ArrowRight", "Left", "Right"].includes(e.key)) {
    paddle.dx = 0;
  }
});

rulesButton.addEventListener("click", () => rules.classList.add("show"));
closeButton.addEventListener("click", () => rules.classList.remove("show"));
rules.addEventListener("click", (e) => {
  if (e.target === rules) rules.classList.remove("show");
});

function update() {
  movePaddle();
  moveBall();
  updateParticles();
  draw();
  requestAnimationFrame(update);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
update();
