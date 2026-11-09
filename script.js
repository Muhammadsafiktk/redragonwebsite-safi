if (!window.__gamesLoaded) {
window.__gamesLoaded = true;

/* ============ TIC TAC TOE ============ */
(function () {
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const mode2Btn = document.getElementById("mode2");
  const modeCpuBtn = document.getElementById("modeCpu");
  const levelSel = document.getElementById("level");
  const nameX = document.getElementById("nameX");
  const nameO = document.getElementById("nameO");
  const winsXEl = document.getElementById("winsX");
  const winsOEl = document.getElementById("winsO");
  const drawsEl = document.getElementById("draws");

  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  let cells = Array(9).fill("");
  let turn = "X";
  let over = false;
  let vsCpu = false;
  let score = { X: 0, O: 0, D: 0 };
  let cpuTimer = null;

  // build the 9 cells (3x3)
  boardEl.innerHTML = "";
  const cellEls = [];
  for (let i = 0; i < 9; i++) {
    const b = document.createElement("button");
    b.className = "cell";
    b.setAttribute("aria-label", "Cell " + (i + 1));
    b.addEventListener("click", () => humanMove(i));
    boardEl.appendChild(b);
    cellEls.push(b);
  }

  function winnerOf(b) {
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line: [a, c, d] };
    }
    return null;
  }

  function render() {
    cells.forEach((v, i) => {
      cellEls[i].textContent = v;
      cellEls[i].classList.remove("win");
      cellEls[i].disabled = over || v !== "";
    });
    const w = winnerOf(cells);
    if (w) w.line.forEach(i => cellEls[i].classList.add("win"));
    winsXEl.textContent = score.X;
    winsOEl.textContent = score.O;
    drawsEl.textContent = score.D;
  }

  function setStatus() {
    if (over) return;
    if (vsCpu) {
      statusEl.textContent = turn === "X" ? "Your turn (X)" : "Computer is thinking...";
    } else {
      statusEl.textContent = (turn === "X" ? "Player 1" : "Player 2") + "'s turn (" + turn + ")";
    }
  }

  function finishIfNeeded() {
    const w = winnerOf(cells);
    if (w) {
      over = true;
      score[w.who]++;
      if (vsCpu) {
        statusEl.textContent = w.who === "X" ? "You win! 🎉" : "Computer wins!";
      } else {
        statusEl.textContent = (w.who === "X" ? "Player 1" : "Player 2") + " wins! 🎉";
      }
      render();
      return true;
    }
    if (cells.every(v => v)) {
      over = true;
      score.D++;
      statusEl.textContent = "It's a draw!";
      render();
      return true;
    }
    return false;
  }

  function place(i) {
    cells[i] = turn;
    render();
    if (finishIfNeeded()) return;
    turn = turn === "X" ? "O" : "X";
    setStatus();
  }

  function humanMove(i) {
    if (over || cells[i]) return;
    if (vsCpu && turn !== "X") return;
    place(i);
    if (vsCpu && !over && turn === "O") {
      cpuTimer = setTimeout(cpuMove, 450);
    }
  }

  // ---- computer ----
  function cpuMove() {
    if (over) return;
    const empty = cells.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
    let pick;
    if (levelSel.value === "hard") {
      pick = bestMove();
    } else {
      pick = empty[Math.floor(Math.random() * empty.length)];
    }
    place(pick);
  }

  function minimax(b, isO) {
    const w = winnerOf(b);
    if (w) return w.who === "O" ? 10 : -10;
    if (b.every(v => v)) return 0;
    let best = isO ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = isO ? "O" : "X";
      const s = minimax(b, !isO);
      b[i] = "";
      // prefer faster wins / slower losses
      const adj = s > 0 ? s - 1 : s < 0 ? s + 1 : 0;
      best = isO ? Math.max(best, adj) : Math.min(best, adj);
    }
    return best;
  }

  function bestMove() {
    let bestScore = -Infinity, move = -1;
    const b = cells.slice();
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = "O";
      const s = minimax(b, false);
      b[i] = "";
      if (s > bestScore) { bestScore = s; move = i; }
    }
    return move;
  }

  // ---- controls ----
  function newRound() {
    clearTimeout(cpuTimer);
    cells = Array(9).fill("");
    turn = "X";
    over = false;
    render();
    setStatus();
  }

  function resetScore() {
    score = { X: 0, O: 0, D: 0 };
    newRound();
  }

  function setMode(cpu) {
    vsCpu = cpu;
    mode2Btn.classList.toggle("active", !cpu);
    modeCpuBtn.classList.toggle("active", cpu);
    levelSel.classList.toggle("hidden", !cpu);
    levelSel.style.display = cpu ? "" : "none";
    nameX.textContent = cpu ? "You (X)" : "Player 1 (X)";
    nameO.textContent = cpu ? "Computer (O)" : "Player 2 (O)";
    resetScore();
  }

  mode2Btn.addEventListener("click", () => setMode(false));
  modeCpuBtn.addEventListener("click", () => setMode(true));
  levelSel.addEventListener("change", newRound);
  document.getElementById("newRound").addEventListener("click", newRound);
  document.getElementById("resetScore").addEventListener("click", resetScore);

  setMode(false);
})();


/* ============ SNAKE ============ */
(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const speedSel = document.getElementById("speed") || document.querySelectorAll("select")[1];
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const snakeResetBtn = document.getElementById("snakeReset");

  const SIZE = 20;                       // cell size in px
  const COLS = canvas.width / SIZE;
  const ROWS = canvas.height / SIZE;
  const SPEEDS = { easy: 160, normal: 110, hard: 70 };
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  let snake, dir, nextDir, food, points, timer, running, dead;
  let best = 0;
  try { best = parseInt(localStorage.getItem("snakeBest"), 10) || 0; } catch (e) {}
  bestEl.textContent = best;

  function reset() {
    clearInterval(timer);
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = DIRS.right;
    nextDir = DIRS.right;
    points = 0;
    running = false;
    dead = false;
    scoreEl.textContent = 0;
    placeFood();
    draw();
  }

  function placeFood() {
    do {
      food = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
    } while (snake.some(s => s.x === food.x && s.y === food.y));
  }

  function start() {
    if (running) return;
    if (dead) reset();
    running = true;
    clearInterval(timer);
    timer = setInterval(step, SPEEDS[speedSel.value] || SPEEDS.normal);
  }

  function setDirection(name) {
    const d = DIRS[name];
    if (!d) return;
    // no reversing into yourself
    if (d.x === -dir.x && d.y === -dir.y) return;
    nextDir = d;
    if (!running && !dead) start();   // first key press starts the game
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
    const hitSelf = snake.some(s => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      points++;
      scoreEl.textContent = points;
      if (points > best) {
        best = points;
        bestEl.textContent = best;
        try { localStorage.setItem("snakeBest", best); } catch (e) {}
      }
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    clearInterval(timer);
    running = false;
    dead = true;
    draw();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = "16px sans-serif";
    ctx.fillText("Score: " + points, canvas.width / 2, canvas.height / 2 + 20);
  }

  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // food
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.arc(food.x * SIZE + SIZE / 2, food.y * SIZE + SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // snake
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#76ff03" : "#4caf50";
      ctx.fillRect(s.x * SIZE + 1, s.y * SIZE + 1, SIZE - 2, SIZE - 2);
    });
  }

  // keyboard
  document.addEventListener("keydown", e => {
    const map = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
      W: "up", S: "down", A: "left", D: "right"
    };
    const name = map[e.key];
    if (!name) return;
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "SELECT" || tag === "INPUT") return;
    e.preventDefault();
    setDirection(name);
  });

  // on-screen pad
  document.querySelectorAll(".pad button[data-dir]").forEach(b => {
    b.addEventListener("click", () => setDirection(b.dataset.dir));
  });

  // buttons
  startBtn.addEventListener("click", start);
  restartBtn.addEventListener("click", () => { reset(); start(); });
  // reset points: clears current score AND best score, stops the game
  snakeResetBtn.addEventListener("click", () => {
    best = 0;
    bestEl.textContent = 0;
    try { localStorage.removeItem("snakeBest"); } catch (e) {}
    reset();
  });
  speedSel.addEventListener("change", () => {
    if (running) { clearInterval(timer); timer = setInterval(step, SPEEDS[speedSel.value]); }
  });

  reset();
})();


/* ============ MEMORY MATCH ============ */
(function () {
  const boardEl = document.getElementById("memBoard");
  if (!boardEl) return;
  const movesEl = document.getElementById("memMoves");
  const timeEl = document.getElementById("memTime");
  const bestEl = document.getElementById("memBest");
  const msgEl = document.getElementById("memMsg");
  const hintBtn = document.getElementById("memHint");
  const pauseBtn = document.getElementById("memPause");

  const ICONS = ["🐉", "🎮", "⌨️", "🖱️", "🎧", "🚀", "⭐", "🔥"];
  const MAX_HINTS = 3;

  let faces = [];                    // current layout (kept for Restart)
  let cards, first, lock, moves, matched, hints;
  let seconds, timer, started, paused, finished;
  let best = 0;                      // 0 = no record yet
  try { best = parseInt(localStorage.getItem("memBest"), 10) || 0; } catch (e) {}
  bestEl.textContent = best || "-";

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function fmt(s) {
    const m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function stopTimer() { clearInterval(timer); timer = null; }

  function startTimer() {
    if (timer || finished) return;
    timer = setInterval(() => {
      seconds++;
      timeEl.textContent = fmt(seconds);
    }, 1000);
  }

  // build the board from `faces`
  function build() {
    stopTimer();
    boardEl.innerHTML = "";
    boardEl.classList.remove("paused");
    cards = faces.map((face, i) => {
      const b = document.createElement("button");
      b.className = "mcard";
      b.textContent = "❓";
      b.setAttribute("aria-label", "Card " + (i + 1));
      b.addEventListener("click", () => flip(i));
      boardEl.appendChild(b);
      return { el: b, face: face, open: false, done: false };
    });
    first = null;
    lock = false;
    moves = 0;
    matched = 0;
    hints = MAX_HINTS;
    seconds = 0;
    started = false;
    paused = false;
    finished = false;
    movesEl.textContent = 0;
    timeEl.textContent = "0:00";
    hintBtn.textContent = "Hint (" + hints + ")";
    pauseBtn.textContent = "Pause";
    msgEl.textContent = "Find all the matching pairs!";
  }

  function newGame() {          // new shuffled cards
    faces = shuffle(ICONS.concat(ICONS));
    build();
  }

  function restartGame() {      // same cards, same places
    if (!faces.length) return newGame();
    build();
    msgEl.textContent = "Restarted! Same cards, try again.";
  }

  function show(c) { c.open = true;  c.el.textContent = c.face; c.el.classList.add("flipped"); }
  function hide(c) { c.open = false; c.el.textContent = "❓";   c.el.classList.remove("flipped"); }

  function flip(i) {
    const c = cards[i];
    if (lock || paused || finished || c.open || c.done) return;
    if (!started) { started = true; startTimer(); }
    show(c);

    if (first === null) { first = i; return; }

    moves++;
    movesEl.textContent = moves;
    const a = cards[first];
    const b = c;
    first = null;

    if (a.face === b.face) {
      a.done = b.done = true;
      a.el.classList.add("matched");
      b.el.classList.add("matched");
      matched++;
      if (matched === ICONS.length) win();
    } else {
      lock = true;
      setTimeout(() => { hide(a); hide(b); lock = false; }, 700);
    }
  }

  function win() {
    finished = true;
    stopTimer();
    let text = "You won in " + moves + " moves and " + fmt(seconds) + "! 🎉";
    if (!best || moves < best) {
      best = moves;
      bestEl.textContent = best;
      try { localStorage.setItem("memBest", best); } catch (e) {}
      text += " New best!";
    }
    msgEl.textContent = text;
  }

  // Hint: peek at all hidden cards for 1 second
  function hint() {
    if (lock || paused || finished) return;
    if (hints <= 0) { msgEl.textContent = "No hints left."; return; }
    hints--;
    hintBtn.textContent = "Hint (" + hints + ")";
    lock = true;
    cards.forEach(c => { if (!c.open && !c.done) show(c); });
    setTimeout(() => {
      cards.forEach((c, i) => { if (!c.done && i !== first) hide(c); });
      lock = false;
    }, 1000);
  }

  function togglePause() {
    if (finished) return;
    if (!started) { msgEl.textContent = "Flip a card first, then you can pause."; return; }
    paused = !paused;
    boardEl.classList.toggle("paused", paused);
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    if (paused) { stopTimer(); msgEl.textContent = "Game paused."; }
    else { startTimer(); msgEl.textContent = "Find all the matching pairs!"; }
  }

  document.getElementById("memRestart").addEventListener("click", restartGame);
  document.getElementById("memNew").addEventListener("click", newGame);
  hintBtn.addEventListener("click", hint);
  pauseBtn.addEventListener("click", togglePause);
  document.getElementById("memReset").addEventListener("click", () => {
    best = 0;
    bestEl.textContent = "-";
    try { localStorage.removeItem("memBest"); } catch (e) {}
    newGame();
  });

  newGame();
})();

}