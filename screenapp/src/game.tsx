import React, { useEffect, useRef, useCallback } from 'react';

let gameStartedHandler: () => void = () => { };
let gameOverHandler: () => void = () => { };

const DEFAULT_GAP = 85;
const DEFAULT_GRAVITY = 1;
const DEFAULT_THRUST = 3.6;
const G = .125;

let GRAVITY = G * DEFAULT_GRAVITY;
let GAP = DEFAULT_GAP;
let THRUST = DEFAULT_THRUST;

const RAD = Math.PI / 180;

let frames = 0;
let dx = 2;

const state = {
  curr: 0,
  getReady: 0,
  Play: 1,
  gameOver: 2,
}

const SFX = {
  start: new Audio(),
  flap: new Audio(),
  score: new Audio(),
  hit: new Audio(),
  die: new Audio(),
  played: false
}

const gnd = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function (sctx: CanvasRenderingContext2D, scrn: HTMLCanvasElement) {
    this.y = (scrn.height - this.sprite.height);
    sctx?.drawImage(this.sprite, this.x, this.y);
  },
  update: function () {
    if (state.curr !== state.Play) return;
    this.x -= dx;
    this.x = this.x % (this.sprite.width / 2);
  }
};

const bg = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function (sctx: CanvasRenderingContext2D, scrn: HTMLCanvasElement) {
    this.y = (scrn.height - this.sprite.height);
    sctx?.drawImage(this.sprite, this.x, this.y);
  }
};

const pipe = {
  top: { sprite: new Image() },
  bot: { sprite: new Image() },
  moved: true,
  pipes: [] as { x: number, y: number }[],
  draw: function (sctx: CanvasRenderingContext2D, scrn: HTMLCanvasElement) {
    for (let i = 0; i < this.pipes.length; i++) {
      let p = this.pipes[i];
      sctx?.drawImage(this.top.sprite, p.x, p.y)
      sctx?.drawImage(this.bot.sprite, p.x, p.y + (this.top.sprite.height) + GAP)
    }
  },
  update: function (screen: HTMLCanvasElement) {
    if (state.curr !== state.Play) return;
    if (frames % 100 === 0) {
      this.pipes.push({ x: (screen.width), y: -210 * Math.min(Math.random() + 1, 1.8) });
    }
    this.pipes.forEach(pipe => {
      pipe.x -= dx;
    })

    if (this.pipes.length && this.pipes[0].x < -this.top.sprite.width) {
      this.pipes.shift();
      this.moved = true;
    }

  }
};



const bird = {
  animations: [
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
  ],
  rotatation: 0,
  x: 50,
  y: 100,
  speed: 0,
  frame: 0,
  draw: function (sctx: CanvasRenderingContext2D, scrn: HTMLCanvasElement) {
    let h = this.animations[this.frame].sprite.height;
    let w = this.animations[this.frame].sprite.width;
    sctx?.save();
    sctx?.translate(this.x, this.y);
    sctx?.rotate(this.rotatation * RAD);
    sctx?.drawImage(this.animations[this.frame].sprite, -w / 2, -h / 2);
    sctx?.restore();
  },
  update: function () {
    let r = (this.animations[0].sprite.width) / 2;
    switch (state.curr) {
      case state.getReady:
        this.rotatation = 0;
        this.y += (frames % 10 === 0) ? Math.sin(frames * RAD) : 0;
        this.frame += (frames % 10 === 0) ? 1 : 0;
        break;
      case state.Play:
        this.frame += (frames % 5 === 0) ? 1 : 0;
        this.y += this.speed;
        this.setRotation()
        this.speed += GRAVITY;
        if (this.y + r >= gnd.y || this.collisioned()) {
          state.curr = state.gameOver;
          gameOverHandler();
        }

        break;
      case state.gameOver:
        this.frame = 1;
        if (this.y + r < gnd.y) {
          this.y += this.speed;
          this.setRotation()
          this.speed += GRAVITY * 2;
        }
        else {
          this.speed = 0;
          this.y = gnd.y - r;
          this.rotatation = 90;
          if (!SFX.played) {
            SFX.die.play();
            SFX.played = true;
          }
        }

        break;
    }
    this.frame = this.frame % this.animations.length;
  },
  flap: function () {
    if (this.y > 0) {
      SFX.flap.play();
      this.speed = -THRUST;
    }
  },
  setRotation: function () {
    if (this.speed <= 0) {
      this.rotatation = Math.max(-25, -25 * this.speed / (-1 * THRUST));
    }
    else if (this.speed > 0) {
      this.rotatation = Math.min(90, 90 * this.speed / (THRUST * 2));
    }
  },
  collisioned: function () {
    if (!pipe.pipes.length) return;
    let bird = this.animations[0].sprite;
    let x = pipe.pipes[0].x;
    let y = pipe.pipes[0].y;
    let r = bird.height / 4 + bird.width / 4;
    let roof = y + (pipe.top.sprite.height);
    let floor = roof + GAP;
    let w = (pipe.top.sprite.width);
    if (this.x + r >= x) {
      if (this.x + r < x + w) {
        if (this.y - r <= roof || this.y + r >= floor) {
          SFX.hit.play();
          return true;
        }

      }
      else if (pipe.moved) {
        UI.score.curr++;
        SFX.score.play();
        pipe.moved = false;
      }
    }
  }
};

const UI = {
  getReady: { sprite: new Image() },
  gameOver: { sprite: new Image() },
  tap: [{ sprite: new Image() },
  { sprite: new Image() }],
  score: {
    curr: 0,
    best: 0,
  },
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  frame: 0,
  draw: function (sctx: CanvasRenderingContext2D, scrn: HTMLCanvasElement) {
    switch (state.curr) {
      case state.getReady:
        this.y = (scrn.height - this.getReady.sprite.height) / 2;
        this.x = (scrn.width - this.getReady.sprite.width) / 2;
        this.tx = (scrn.width - this.tap[0].sprite.width) / 2;
        this.ty = this.y + this.getReady.sprite.height - this.tap[0].sprite.height;
        sctx?.drawImage(this.getReady.sprite, this.x, this.y);
        sctx?.drawImage(this.tap[this.frame].sprite, this.tx, this.ty)
        break;
      case state.gameOver:
        this.y = (scrn.height - this.gameOver.sprite.height) / 2;
        this.x = (scrn.width - this.gameOver.sprite.width) / 2;
        this.tx = (scrn.width - this.tap[0].sprite.width) / 2;
        this.ty = this.y + this.gameOver.sprite.height - this.tap[0].sprite.height;
        sctx?.drawImage(this.gameOver.sprite, this.x, this.y);
        sctx?.drawImage(this.tap[this.frame].sprite, this.tx, this.ty)
        break;
    }
    this.drawScore(sctx, scrn);
  },
  drawScore: function (sctx: CanvasRenderingContext2D, scrn: HTMLCanvasElement) {
    if (!sctx) return;
    sctx.fillStyle = "#FFFFFF";
    sctx.strokeStyle = "#000000";
    switch (state.curr) {
      case state.Play:
        sctx.lineWidth = 2;
        sctx.font = "bold 35px Tahoma";
        sctx?.fillText('' + this.score.curr, scrn.width / 2 - 5, 50);
        sctx?.strokeText('' + this.score.curr, scrn.width / 2 - 5, 50);
        break;
      case state.gameOver:
        sctx.lineWidth = 2;
        sctx.font = "bold 32px Tahoma";
        let sc = `SCORE : ${this.score.curr}`;
        try {
          this.score.best = Math.max(this.score.curr, parseInt(localStorage.getItem("best") || "0", 10));
          localStorage.setItem("best", '' + this.score.best);
          let bs = `BEST  : ${this.score.best}`;
          sctx?.fillText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx?.strokeText(sc, scrn.width / 2 - 80, scrn.height / 2 + 0);
          sctx?.fillText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
          sctx?.strokeText(bs, scrn.width / 2 - 80, scrn.height / 2 + 30);
        }
        catch (e) {
          sctx?.fillText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
          sctx?.strokeText(sc, scrn.width / 2 - 85, scrn.height / 2 + 15);
        }

        break;
    }
  },
  update: function () {
    if (state.curr === state.Play) return;
    this.frame += (frames % 10 === 0) ? 1 : 0;
    this.frame = this.frame % this.tap.length;
  }
};

gnd.sprite.src = "img/ground.png";
bg.sprite.src = "img/BG.png";
pipe.top.sprite.src = "img/toppipe.png";
pipe.bot.sprite.src = "img/botpipe.png";
UI.gameOver.sprite.src = "img/go.png";
UI.getReady.sprite.src = "img/getready.png";
UI.tap[0].sprite.src = "img/tap/t0.png";
UI.tap[1].sprite.src = "img/tap/t1.png";
bird.animations[0].sprite.src = "img/bird/b0.png";
bird.animations[1].sprite.src = "img/bird/b1.png";
bird.animations[2].sprite.src = "img/bird/b2.png";
bird.animations[3].sprite.src = "img/bird/b0.png";
SFX.start.src = "sfx/start.wav"
SFX.flap.src = "sfx/flap.wav"
SFX.score.src = "sfx/score.wav"
SFX.hit.src = "sfx/hit.wav"
SFX.die.src = "sfx/die.wav"

function gameLoop(screen: HTMLCanvasElement) {
  const sctx = screen.getContext("2d");
  if (!sctx) throw new Error('Unable to get context');
  screen.tabIndex = 1;

  const loop = () => {
    bird.update();
    gnd.update();
    pipe.update(screen);
    UI.update();

    sctx.fillStyle = "#30c0df";
    sctx.fillRect(0, 0, screen.width, screen.height);

    bg.draw(sctx, screen);
    pipe.draw(sctx, screen);
    bird.draw(sctx, screen);
    gnd.draw(sctx, screen);
    UI.draw(sctx, screen);

    frames++;
    requestAnimationFrame(loop);
  }
  loop();
}

const flap = () => {
  switch (state.curr) {
    case state.getReady:
      state.curr = state.Play;
      SFX.start.play();
      break;
    case state.Play:
      bird.flap();
      break;
    case state.gameOver:
      gameStartedHandler();
      state.curr = state.getReady;
      bird.speed = 0;
      bird.y = 100;
      pipe.pipes = [];
      UI.score.curr = 0;
      SFX.played = false;
      break;
  }
}

export const useFlap = () => flap;

type GameSettings = {
  gravity?: number,
  gap?: number,
  thrust?: number,
}

export const Game = (settings: GameSettings) => {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvas.current) {
      gameLoop(canvas.current);
    }
  }, []);

  useEffect(() => {
    GRAVITY = G * (settings.gravity || DEFAULT_GRAVITY);
    GAP = settings.gap || DEFAULT_GAP;
    THRUST = settings.thrust || DEFAULT_THRUST;
  }, [settings.gravity, settings.gap, settings.thrust]);

  return (
    <canvas ref={canvas} width="276" height="414"></canvas>
  );
}

export const useGameStarted = (cb: () => void, deps: any[]) => {
  gameStartedHandler = useCallback(cb, deps);
}

export const useGameOver = (cb: () => void, deps: any[]) => {
  gameOverHandler = useCallback(cb, deps);
}

export default { Game, useFlap, useGameStarted, useGameOver }