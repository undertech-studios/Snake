// ─────────────────────────────────────────────────────────────────────────────
// script.js  —  Snake Zen · Motor de Juego
// Requiere que sound.js haya cargado antes (sonidoMuerte, sonidoComer globales)
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Configuración ────────────────────────────────────────────────────────
  const CANVAS_SIZE = 600;
  const GRID        = 20;               // nº de celdas por lado
  const CELL        = CANVAS_SIZE / GRID; // 30 px por celda
  const FPS         = 9;
  const MS_PER_TICK = 1000 / FPS;

  // ── Paleta ───────────────────────────────────────────────────────────────
  const C = {
    bg:          '#ffffff',
    grid:        'rgba(0,0,0,0.025)',
    snakeBody:   '#8fbe8f',
    snakeHead:   '#5a9e5a',
    appleBody:   '#e05a5a',
    appleStalk:  '#6b3f2a',
    appleLeaf:   '#7aab5a',
    overlaybg:   'rgba(240,237,232,0.84)',
    overlayText: '#3a3530',
    overlayMuted:'#a09890',
  };

  // ── Referencias DOM ───────────────────────────────────────────────────────
  const canvas  = document.getElementById('gameCanvas');
  const ctx     = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');

  // ── Estado ────────────────────────────────────────────────────────────────
  let snake, dir, nextDir, apple, score, dead, rafId, lastTick;

  // ─────────────────────────────────────────────────────────────────────────
  // INIT  —  arranca (o reinicia) la partida
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    snake    = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir      = { x: 1, y: 0 };
    nextDir  = { x: 1, y: 0 };
    score    = 0;
    dead     = false;
    lastTick = 0;

    scoreEl.textContent = '0';
    placeApple();

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOOP PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────
  function loop(ts) {
    if (dead) return;
    rafId = requestAnimationFrame(loop);

    if (ts - lastTick < MS_PER_TICK) return;
    lastTick = ts;

    tick();
    draw();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TICK  —  lógica de un paso
  // ─────────────────────────────────────────────────────────────────────────
  function tick() {
    // Giro prohibido: no puede girar 180° sobre sí misma
    if (!(nextDir.x === -dir.x && nextDir.y === -dir.y)) {
      dir = { x: nextDir.x, y: nextDir.y };
    }

    const head = {
      x: (snake[0].x + dir.x + GRID) % GRID,
      y: (snake[0].y + dir.y + GRID) % GRID,
    };

    // Colisión consigo misma
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        killSnake();
        return;
      }
    }

    snake.unshift(head);

    // ¿Comió la manzana?
    if (head.x === apple.x && head.y === apple.y) {
      score++;
      scoreEl.textContent = score;
      bumpScore();
      if (typeof sonidoComer === 'function') sonidoComer();
      placeApple();
    } else {
      snake.pop();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MUERTE
  // ─────────────────────────────────────────────────────────────────────────
  function killSnake() {
    dead = true;
    cancelAnimationFrame(rafId);
    if (typeof sonidoMuerte === 'function') sonidoMuerte();
    // Dibuja el estado final y superpone el cartel
    draw();
    drawGameOver();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MANZANA  —  posición aleatoria fuera del cuerpo
  // ─────────────────────────────────────────────────────────────────────────
  function placeApple() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    apple = pos;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DIBUJO
  // ─────────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawGrid();
    drawApple();
    drawSnake();
  }

  // Cuadrícula tenue
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth   = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(CANVAS_SIZE, i * CELL);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Serpiente: trazo continuo redondeado + cabeza destacada + ojos
  function drawSnake() {
    if (snake.length === 0) return;

    const R = CELL * 0.42;

    ctx.save();
    ctx.lineWidth   = R * 2;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.strokeStyle = C.snakeBody;

    ctx.beginPath();
    ctx.moveTo(
      snake[0].x * CELL + CELL / 2,
      snake[0].y * CELL + CELL / 2
    );
    for (let i = 1; i < snake.length; i++) {
      ctx.lineTo(
        snake[i].x * CELL + CELL / 2,
        snake[i].y * CELL + CELL / 2
      );
    }
    ctx.stroke();

    // Cabeza
    const hx = snake[0].x * CELL + CELL / 2;
    const hy = snake[0].y * CELL + CELL / 2;

    ctx.fillStyle = C.snakeHead;
    ctx.beginPath();
    ctx.arc(hx, hy, R * 0.86, 0, Math.PI * 2);
    ctx.fill();

    // Ojos
    const eOff = R * 0.44;
    const eR   = R * 0.18;
    const px   = -dir.y;   // perpendicular al avance
    const py   =  dir.x;

    [-1, 1].forEach(side => {
      const ex = hx + dir.x * eOff * 0.4 + px * eOff * side;
      const ey = hy + dir.y * eOff * 0.4 + py * eOff * side;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, eR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e3a1e';
      ctx.beginPath();
      ctx.arc(
        ex + dir.x * eR * 0.35,
        ey + dir.y * eR * 0.35,
        eR * 0.52, 0, Math.PI * 2
      );
      ctx.fill();
    });

    ctx.restore();
  }

  // Manzana detallada: cuerpo + brillo + tallo + hoja
  function drawApple() {
    const cx = apple.x * CELL + CELL / 2;
    const cy = apple.y * CELL + CELL / 2;
    const r  = CELL * 0.34;

    ctx.save();

    // Cuerpo
    ctx.fillStyle = C.appleBody;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.08, r, 0, Math.PI * 2);
    ctx.fill();

    // Brillo especular
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.27, cy - r * 0.22, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Tallo
    ctx.strokeStyle = C.appleStalk;
    ctx.lineWidth   = 1.6;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.82);
    ctx.quadraticCurveTo(cx + r * 0.28, cy - r * 1.45, cx + r * 0.08, cy - r * 1.68);
    ctx.stroke();

    // Hoja
    ctx.fillStyle = C.appleLeaf;
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.36, cy - r * 1.28, r * 0.28, r * 0.12, 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Cartel de Game Over
  function drawGameOver() {
    const W = 300, H = 148;
    const bx = CANVAS_SIZE / 2 - W / 2;
    const by = CANVAS_SIZE / 2 - H / 2;

    ctx.save();

    // Panel
    ctx.fillStyle = C.overlaybg;
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur  = 24;
    ctx.beginPath();
    roundRect(ctx, bx, by, W, H, 18);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Título
    ctx.fillStyle    = C.overlayText;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = "bold 30px 'Shippori Mincho', serif";
    ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 22);

    // Puntuación
    ctx.fillStyle = C.overlayMuted;
    ctx.font      = "13px 'DM Mono', monospace";
    ctx.fillText(`puntuación: ${score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 14);

    // Instrucción reinicio
    ctx.font = "11px 'DM Mono', monospace";
    ctx.fillText('pulsa cualquier tecla para reiniciar', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 40);

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────────────────────────────

  // Rounded-rect compatible con todos los navegadores
  function roundRect(c, x, y, w, h, r) {
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // Animación CSS en el marcador
  function bumpScore() {
    scoreEl.classList.remove('bump');
    void scoreEl.offsetWidth; // fuerza reflow para reiniciar la animación
    scoreEl.classList.add('bump');
    setTimeout(() => scoreEl.classList.remove('bump'), 200);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONTROLES
  // ─────────────────────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    // Reinicio tras muerte
    if (dead) {
      init();
      return;
    }

    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': nextDir = { x:  0, y: -1 }; break;
      case 'ArrowDown':  case 's': case 'S': nextDir = { x:  0, y:  1 }; break;
      case 'ArrowLeft':  case 'a': case 'A': nextDir = { x: -1, y:  0 }; break;
      case 'ArrowRight': case 'd': case 'D': nextDir = { x:  1, y:  0 }; break;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ARRANQUE
  // ─────────────────────────────────────────────────────────────────────────
  init();

})();