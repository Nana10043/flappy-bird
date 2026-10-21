const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const W = cvs.width, H = cvs.height;

// —— 元素引用 ——
const startScreen = document.getElementById('startScreen');
const overScreen = document.getElementById('overScreen');
const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// —— 游戏参数 ——
const GRAVITY = 0.42;
const FLAP = -7.2;
const PIPE_W = 60;
const PIPE_GAP = 150;
const PIPE_SPACE = 200;   // 两根管道水平间距
const SPEED = 2.2;
const GROUND_H = 80;      // 地面高度(像素)

// —— 状态 ——
let bird, pipes, score, best, frame, running, particles;

best = +(localStorage.getItem('flappy_best') || 0);

function reset() {
  bird = { x: 70, y: H / 2 - 20, w: 30, h: 24, vy: 0, rot: 0 };
  pipes = [];
  score = 0;
  frame = 0;
  running = true;
  particles = [];
  scoreEl.textContent = '0';
  hud.classList.add('show');
}

function flap() {
  if (!running) return;
  bird.vy = FLAP;
}

function spawnPipe() {
  const minTop = 60;
  const maxTop = H - GROUND_H - PIPE_GAP - minTop;
  const top = minTop + Math.random() * maxTop;
  pipes.push({ x: W, top, passed: false, w: PIPE_W });
}

function burst(x, y, color) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30 + Math.random() * 20,
      color,
      size: 3 + Math.random() * 4
    });
  }
}

function update() {
  if (!running) return;
  frame++;

  // 鸟
  bird.vy += GRAVITY;
  bird.y += bird.vy;
  bird.rot = Math.min(Math.max(bird.vy * 4, -25), 90);

  // 管道生成
  if (frame % Math.round(PIPE_SPACE / SPEED) === 1) spawnPipe();

  // 管道移动 & 碰撞
  for (let i = pipes.length - 1; i >= 0; i--) {
    const p = pipes[i];
    p.x -= SPEED;

    // 计分
    if (!p.passed && p.x + p.w < bird.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = score;
    }

    // 碰撞检测
    if (
      bird.x + bird.w * 0.6 > p.x &&
      bird.x - bird.w * 0.6 < p.x + p.w &&
      (bird.y - bird.h * 0.5 < p.top || bird.y + bird.h * 0.5 > p.top + PIPE_GAP)
    ) {
      return die();
    }

    if (p.x + p.w < -20) pipes.splice(i, 1);
  }

  // 撞地 / 飞出顶
  if (bird.y + bird.h / 2 >= H - GROUND_H) {
    bird.y = H - GROUND_H - bird.h / 2;
    return die();
  }
  if (bird.y - bird.h / 2 <= 0) {
    bird.y = bird.h / 2;
    bird.vy = 0;
  }

  // 粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.vy += 0.3;
    pt.y += pt.vy;
    pt.life--;
    if (pt.life <= 0) particles.splice(i, 1);
  }
}

function die() {
  running = false;
  hud.classList.remove('show');
  burst(bird.x, bird.y, '#f1c40f');
  burst(bird.x, bird.y, '#e74c3c');

  if (score > best) {
    best = score;
    localStorage.setItem('flappy_best', best);
  }
  finalScoreEl.textContent = score;
  bestScoreEl.textContent = best;

  setTimeout(() => overScreen.classList.add('show'), 600);
}

// —— 绘制 ——
function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate((bird.rot * Math.PI) / 180);

  // 身体
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.w / 2, bird.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 肚子
  ctx.fillStyle = '#f9e79f';
  ctx.beginPath();
  ctx.ellipse(2, 4, bird.w / 2 - 6, bird.h / 2 - 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 翅膀
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.ellipse(-4, 2, 7, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 眼睛
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(7, -5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 嘴
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.moveTo(10, -1);
  ctx.lineTo(18, 1);
  ctx.lineTo(10, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPipe(x, top) {
  const grd = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
  grd.addColorStop(0, '#2ecc71');
  grd.addColorStop(0.5, '#27ae60');
  grd.addColorStop(1, '#1e8449');
  ctx.fillStyle = grd;

  // 上管道
  ctx.fillRect(x, 0, PIPE_W, top);
  // 上管口
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(x - 3, top - 18, PIPE_W + 6, 18);

  const bottomY = top + PIPE_GAP;
  // 下管道
  ctx.fillStyle = grd;
  ctx.fillRect(x, bottomY, PIPE_W, H - GROUND_H - bottomY);
  // 下管口
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(x - 3, bottomY, PIPE_W + 6, 18);
}

function drawCloud(x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 14 * s, y - 6 * s, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 30 * s, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 16 * s, y + 4 * s, 18 * s, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  // 背景已在 CSS 里画好，这里只做云 + 游戏元素
  ctx.clearRect(0, 0, W, H);

  // 云
  const cloudOffset = (frame * 0.2) % W;
  drawCloud((120 - cloudOffset + W) % W, 90, 1);
  drawCloud((300 - cloudOffset + W) % W, 50, 0.7);
  drawCloud((60 - cloudOffset + W) % W, 160, 0.6);

  // 管道
  pipes.forEach(p => drawPipe(p.x, p.top));

  // 粒子
  particles.forEach(pt => {
    ctx.globalAlpha = Math.max(pt.life / 40, 0);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // 鸟
  if (running || particles.length) drawBird();

  // 地面
  ctx.fillStyle = '#8bc34a';
  ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
  ctx.fillStyle = '#689f38';
  for (let gx = 0; gx < W; gx += 24) {
    ctx.fillRect(gx, H - GROUND_H, 12, 6);
  }
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// —— 输入 ——
function tap() {
  if (overScreen.classList.contains('show') || startScreen.classList.contains('show')) return;
  flap();
}
cvs.addEventListener('mousedown', tap);
cvs.addEventListener('touchstart', e => { e.preventDefault(); tap(); }, { passive: false });
document.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); tap(); }
});

startBtn.onclick = () => {
  startScreen.classList.remove('show');
  reset();
};
restartBtn.onclick = () => {
  overScreen.classList.remove('show');
  reset();
};

// 初始画面也画一只鸟
bird = { x: 70, y: H / 2 - 20, w: 30, h: 24, vy: 0, rot: 0 };
requestAnimationFrame(loop);
