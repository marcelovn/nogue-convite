import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type GameChallengeId = 'snake' | 'space-shooter';

@Component({
  selector: 'app-game-challenge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-challenge.html',
  styleUrl: './game-challenge.scss',
})
export class GameChallengeComponent implements AfterViewInit, OnDestroy {
  @Input() gameId: GameChallengeId = 'snake';
  @Input() photoUrl: string | null = null;
  @Output() gamePassed = new EventEmitter<void>();

  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  status = signal<'idle' | 'playing' | 'won' | 'lost'>('idle');
  scoreSignal = signal(0);
  messageSignal = signal('');

  // ── shared ──────────────────────────────────────────────────────────────
  private ctx!: CanvasRenderingContext2D;
  private animId = 0;
  private keysDown = new Set<string>();
  private playerImg: HTMLImageElement | null = null;
  private readonly GOAL = 3; // items to collect / enemies to destroy

  // ── snake state ─────────────────────────────────────────────────────────
  private readonly CELL = 24;
  private readonly COLS = 16;
  private readonly ROWS = 16;
  private snake: { x: number; y: number }[] = [];
  private snakeDir = { x: 1, y: 0 };
  private nextDir = { x: 1, y: 0 };
  private food = { x: 5, y: 5 };
  private snakeScore = 0;
  private snakeTickMs = 150;
  private snakeLastTick = 0;

  // ── space-shooter state ──────────────────────────────────────────────────
  private readonly W = 320;
  private readonly H = 480;
  private ship = { x: 160, y: 430, w: 50, h: 50, speed: 180 };
  private bullets: { x: number; y: number; vy: number }[] = [];
  private enemies: { x: number; y: number; vx: number; vy: number; hp: number }[] = [];
  private shooterScore = 0;
  private lastTime = 0;
  private shootCooldown = 0;
  private enemySpawnTimer = 0;
  private readonly ENEMY_SPAWN_INTERVAL = 1.5;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    if (this.gameId === 'snake') {
      canvas.width = this.CELL * this.COLS;
      canvas.height = this.CELL * this.ROWS;
    } else {
      canvas.width = this.W;
      canvas.height = this.H;
    }

    this.loadPlayerImg(() => this.drawIdle());
    this.setupKeyListeners();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    this.removeKeyListeners();
  }

  // ── start / restart ──────────────────────────────────────────────────────
  startGame(): void {
    if (this.gameId === 'snake') {
      this.initSnake();
    } else {
      this.initShooter();
    }
    this.status.set('playing');
    this.messageSignal.set('');
    this.stopLoop();
    this.animId = requestAnimationFrame(ts => this.loop(ts));
  }

  // ── main loop ─────────────────────────────────────────────────────────────
  private loop(ts: number): void {
    if (this.status() !== 'playing') return;

    if (this.gameId === 'snake') {
      this.snakeTick(ts);
    } else {
      const dt = Math.min((ts - this.lastTime) / 1000, 0.1);
      this.lastTime = ts;
      this.updateShooter(dt);
      this.drawShooter();
    }

    if (this.status() === 'playing') {
      this.animId = requestAnimationFrame(t => this.loop(t));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SNAKE
  // ─────────────────────────────────────────────────────────────────────────

  private initSnake(): void {
    this.snake = [
      { x: 4, y: 8 },
      { x: 3, y: 8 },
      { x: 2, y: 8 },
    ];
    this.snakeDir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.snakeScore = 0;
    this.scoreSignal.set(0);
    this.spawnFood();
    this.snakeLastTick = 0;
  }

  private snakeTick(ts: number): void {
    if (ts - this.snakeLastTick < this.snakeTickMs) {
      this.drawSnake();
      return;
    }
    this.snakeLastTick = ts;

    // apply buffered direction
    this.snakeDir = { ...this.nextDir };

    const head = {
      x: this.snake[0].x + this.snakeDir.x,
      y: this.snake[0].y + this.snakeDir.y,
    };

    // wall collision
    if (head.x < 0 || head.x >= this.COLS || head.y < 0 || head.y >= this.ROWS) {
      this.endGame(false);
      return;
    }

    // self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.endGame(false);
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.snakeScore++;
      this.scoreSignal.set(this.snakeScore);
      if (this.snakeScore >= this.GOAL) {
        this.drawSnake();
        this.endGame(true);
        return;
      }
      this.spawnFood();
    } else {
      this.snake.pop();
    }

    this.drawSnake();
  }

  private spawnFood(): void {
    let pos: { x: number; y: number };
    do {
      pos = {
        x: this.randomInt(0, this.COLS - 1),
        y: this.randomInt(0, this.ROWS - 1),
      };
    } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
    this.food = pos;
  }

  private drawSnake(): void {
    const c = this.ctx;
    const C = this.CELL;
    c.clearRect(0, 0, this.COLS * C, this.ROWS * C);

    // grid
    c.fillStyle = '#0f1117';
    c.fillRect(0, 0, this.COLS * C, this.ROWS * C);
    for (let x = 0; x < this.COLS; x++) {
      for (let y = 0; y < this.ROWS; y++) {
        c.fillStyle = (x + y) % 2 === 0 ? '#141920' : '#101318';
        c.fillRect(x * C, y * C, C, C);
      }
    }

    // food
    c.font = `${C - 4}px serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🍎', this.food.x * C + C / 2, this.food.y * C + C / 2);

    // body segments
    this.snake.forEach((seg, i) => {
      if (i === 0) return; // head drawn separately
      const alpha = 1 - (i / (this.snake.length + 1)) * 0.55;
      c.fillStyle = `rgba(74, 222, 128, ${alpha})`;
      c.strokeStyle = '#16a34a';
      c.lineWidth = 2;
      const pad = 2;
      c.beginPath();
      c.roundRect(seg.x * C + pad, seg.y * C + pad, C - pad * 2, C - pad * 2, 4);
      c.fill();
      c.stroke();
    });

    // head
    const head = this.snake[0];
    if (this.playerImg) {
      c.save();
      c.beginPath();
      c.arc(head.x * C + C / 2, head.y * C + C / 2, C / 2 - 1, 0, Math.PI * 2);
      c.clip();
      c.drawImage(this.playerImg, head.x * C + 1, head.y * C + 1, C - 2, C - 2);
      c.restore();
      // border
      c.beginPath();
      c.arc(head.x * C + C / 2, head.y * C + C / 2, C / 2 - 1, 0, Math.PI * 2);
      c.strokeStyle = '#4ade80';
      c.lineWidth = 2.5;
      c.stroke();
    } else {
      c.fillStyle = '#4ade80';
      c.fillRect(head.x * C + 2, head.y * C + 2, C - 4, C - 4);
    }

    // score HUD
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(0, 0, this.COLS * C, 22);
    c.fillStyle = '#ffffff';
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(`🍎 ${this.snakeScore} / ${this.GOAL}`, 8, 11);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SPACE SHOOTER
  // ─────────────────────────────────────────────────────────────────────────

  private initShooter(): void {
    this.ship = { x: this.W / 2, y: this.H - 60, w: 50, h: 50, speed: 180 };
    this.bullets = [];
    this.enemies = [];
    this.shooterScore = 0;
    this.scoreSignal.set(0);
    this.lastTime = performance.now();
    this.shootCooldown = 0;
    this.enemySpawnTimer = 0;
  }

  private updateShooter(dt: number): void {
    // move ship
    if (this.keysDown.has('ArrowLeft') || this.keysDown.has('a')) {
      this.ship.x = Math.max(this.ship.w / 2, this.ship.x - this.ship.speed * dt);
    }
    if (this.keysDown.has('ArrowRight') || this.keysDown.has('d')) {
      this.ship.x = Math.min(this.W - this.ship.w / 2, this.ship.x + this.ship.speed * dt);
    }

    // shoot
    this.shootCooldown -= dt;
    if ((this.keysDown.has(' ') || this.keysDown.has('ArrowUp')) && this.shootCooldown <= 0) {
      this.bullets.push({ x: this.ship.x, y: this.ship.y - this.ship.h / 2, vy: -480 });
      this.shootCooldown = 0.35;
    }

    // move bullets
    this.bullets = this.bullets
      .map(b => ({ ...b, y: b.y + b.vy * dt }))
      .filter(b => b.y > -10);

    // spawn enemies
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.enemySpawnTimer = this.ENEMY_SPAWN_INTERVAL;
      const ex = this.randomInt(30, this.W - 30);
      this.enemies.push({ x: ex, y: -30, vx: (Math.random() < 0.5 ? 1 : -1) * 40, vy: 80, hp: 1 });
    }

    // move enemies
    this.enemies = this.enemies
      .map(e => {
        let nx = e.x + e.vx * dt;
        let nvx = e.vx;
        if (nx < 20 || nx > this.W - 20) nvx = -e.vx;
        return { ...e, x: nx, y: e.y + e.vy * dt, vx: nvx };
      })
      .filter(e => e.y < this.H + 30);

    // bullet-enemy collisions
    const hitEnemyIds = new Set<number>();
    const hitBulletIds = new Set<number>();

    this.bullets.forEach((b, bi) => {
      this.enemies.forEach((e, ei) => {
        if (
          !hitEnemyIds.has(ei) &&
          Math.abs(b.x - e.x) < 22 &&
          Math.abs(b.y - e.y) < 22
        ) {
          hitEnemyIds.add(ei);
          hitBulletIds.add(bi);
        }
      });
    });

    if (hitEnemyIds.size > 0) {
      this.shooterScore += hitEnemyIds.size;
      this.scoreSignal.set(this.shooterScore);
      this.enemies = this.enemies.filter((_, i) => !hitEnemyIds.has(i));
      this.bullets = this.bullets.filter((_, i) => !hitBulletIds.has(i));

      if (this.shooterScore >= this.GOAL) {
        this.drawShooter();
        this.endGame(true);
        return;
      }
    }

    // enemy-ship collision
    const shipHit = this.enemies.some(
      e =>
        Math.abs(e.x - this.ship.x) < this.ship.w / 2 + 16 &&
        Math.abs(e.y - this.ship.y) < this.ship.h / 2 + 16
    );
    if (shipHit) {
      this.endGame(false);
    }
  }

  private drawShooter(): void {
    const c = this.ctx;
    c.clearRect(0, 0, this.W, this.H);

    // background
    c.fillStyle = '#02050f';
    c.fillRect(0, 0, this.W, this.H);

    // stars
    c.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 37 + 13) % this.W);
      const sy = ((i * 83 + 27) % this.H);
      c.fillRect(sx, sy, 1.5, 1.5);
    }

    // enemies
    this.enemies.forEach(e => {
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.moveTo(e.x, e.y - 18);
      c.lineTo(e.x + 14, e.y + 12);
      c.lineTo(e.x - 14, e.y + 12);
      c.closePath();
      c.fill();
      c.fillStyle = '#fca5a5';
      c.beginPath();
      c.arc(e.x, e.y, 6, 0, Math.PI * 2);
      c.fill();
    });

    // bullets
    c.fillStyle = '#facc15';
    this.bullets.forEach(b => {
      c.fillRect(b.x - 2, b.y - 8, 4, 14);
    });

    // ship
    if (this.playerImg) {
      const hw = this.ship.w / 2;
      const hh = this.ship.h / 2;
      c.save();
      c.beginPath();
      c.arc(this.ship.x, this.ship.y, hw, 0, Math.PI * 2);
      c.clip();
      c.drawImage(this.playerImg, this.ship.x - hw, this.ship.y - hh, this.ship.w, this.ship.h);
      c.restore();
      // glow
      c.beginPath();
      c.arc(this.ship.x, this.ship.y, hw, 0, Math.PI * 2);
      c.strokeStyle = '#818cf8';
      c.lineWidth = 2.5;
      c.stroke();
      // engine flame
      c.fillStyle = '#f97316';
      c.beginPath();
      c.moveTo(this.ship.x - 10, this.ship.y + hw);
      c.lineTo(this.ship.x + 10, this.ship.y + hw);
      c.lineTo(this.ship.x, this.ship.y + hw + 14);
      c.closePath();
      c.fill();
    } else {
      c.fillStyle = '#818cf8';
      c.beginPath();
      c.moveTo(this.ship.x, this.ship.y - 22);
      c.lineTo(this.ship.x + 18, this.ship.y + 20);
      c.lineTo(this.ship.x - 18, this.ship.y + 20);
      c.closePath();
      c.fill();
    }

    // HUD
    c.fillStyle = 'rgba(0,0,0,0.6)';
    c.fillRect(0, 0, this.W, 24);
    c.fillStyle = '#ffffff';
    c.font = 'bold 13px sans-serif';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillText(`💥 ${this.shooterScore} / ${this.GOAL}`, 8, 12);
    c.fillStyle = '#94a3b8';
    c.font = '11px sans-serif';
    c.textAlign = 'right';
    c.fillText('← → mover  ↑ ou espaço = tiro', this.W - 8, 12);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  COMMON
  // ─────────────────────────────────────────────────────────────────────────

  private drawIdle(): void {
    if (this.gameId === 'snake') {
      this.drawSnakeIdle();
    } else {
      this.drawShooterIdle();
    }
  }

  private drawSnakeIdle(): void {
    const c = this.ctx;
    const W = this.COLS * this.CELL;
    const H = this.ROWS * this.CELL;
    c.fillStyle = '#0f1117';
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.font = 'bold 22px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🐍 Jogo da Cobrinha', W / 2, H / 2 - 28);
    c.font = '14px sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.fillText(`Come ${this.GOAL} maçãs para desbloquear`, W / 2, H / 2 + 8);
    c.fillText('Use as setas ← ↑ ↓ →', W / 2, H / 2 + 30);
  }

  private drawShooterIdle(): void {
    const c = this.ctx;
    c.fillStyle = '#02050f';
    c.fillRect(0, 0, this.W, this.H);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.font = 'bold 22px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🚀 Atirador Espacial', this.W / 2, this.H / 2 - 28);
    c.font = '14px sans-serif';
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.fillText(`Destrua ${this.GOAL} inimigos para desbloquear`, this.W / 2, this.H / 2 + 8);
    c.fillText('← → mover  ↑ ou espaço = tiro', this.W / 2, this.H / 2 + 30);
  }

  private endGame(won: boolean): void {
    this.stopLoop();
    if (won) {
      this.status.set('won');
      this.messageSignal.set('🎉 Parabéns! Convite desbloqueado!');
      setTimeout(() => this.gamePassed.emit(), 800);
    } else {
      this.status.set('lost');
      this.messageSignal.set('😅 Fim de jogo! Tente de novo.');
    }
  }

  private stopLoop(): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  // ── image loading ─────────────────────────────────────────────────────────

  private loadPlayerImg(cb: () => void): void {
    if (!this.photoUrl) {
      cb();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.playerImg = img;
      cb();
    };
    img.onerror = () => cb();
    img.src = this.photoUrl;
  }

  // ── keyboard ──────────────────────────────────────────────────────────────

  private boundKeyDown!: (e: KeyboardEvent) => void;
  private boundKeyUp!: (e: KeyboardEvent) => void;

  private setupKeyListeners(): void {
    this.boundKeyDown = (e: KeyboardEvent) => {
      this.keysDown.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (this.gameId === 'snake' && this.status() === 'playing') {
        this.bufferSnakeDir(e.key);
      }
    };
    this.boundKeyUp = (e: KeyboardEvent) => this.keysDown.delete(e.key);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  private removeKeyListeners(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  private bufferSnakeDir(key: string): void {
    const cur = this.snakeDir;
    switch (key) {
      case 'ArrowUp':    if (cur.y !== 1)  this.nextDir = { x: 0, y: -1 }; break;
      case 'ArrowDown':  if (cur.y !== -1) this.nextDir = { x: 0, y: 1 };  break;
      case 'ArrowLeft':  if (cur.x !== 1)  this.nextDir = { x: -1, y: 0 }; break;
      case 'ArrowRight': if (cur.x !== -1) this.nextDir = { x: 1, y: 0 };  break;
    }
  }

  // ── mobile d-pad helpers ─────────────────────────────────────────────────

  /** Snake: single-tap direction change */
  onDpad(dir: string): void {
    if (this.gameId === 'snake') {
      this.bufferSnakeDir(dir);
    }
  }

  /** Shooter: start holding a direction key */
  onHoldStart(key: string): void {
    this.keysDown.add(key);
  }

  /** Shooter: stop holding a direction key */
  onHoldEnd(key: string): void {
    this.keysDown.delete(key);
  }

  onShoot(): void {
    this.keysDown.add(' ');
    setTimeout(() => this.keysDown.delete(' '), 80);
  }

  // ── swipe on canvas (snake) ───────────────────────────────────────────────

  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(e: TouchEvent): void {
    if (this.gameId !== 'snake' || this.status() !== 'playing') return;
    e.preventDefault();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  onTouchMove(e: TouchEvent): void {
    if (this.gameId !== 'snake') return;
    e.preventDefault();
  }

  onTouchEnd(e: TouchEvent): void {
    if (this.gameId !== 'snake' || this.status() !== 'playing') return;
    e.preventDefault();
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // too small
    if (Math.abs(dx) > Math.abs(dy)) {
      this.bufferSnakeDir(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    } else {
      this.bufferSnakeDir(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
  }

  // ── utils ─────────────────────────────────────────────────────────────────

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
