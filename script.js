window.addEventListener("load", () => {
  const canvas = document.getElementById("canvas");
  //Drawing Context is a bulit in object that contains all methods and properties that allow us to draw and animate colors, shapes and other graphics on HTML canvas
  const ctx = canvas.getContext("2d");
  canvas.width = 1000;
  canvas.height = 500;

  //InputHandler will keep track of specified user inputs
  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (event) => {
        if (
          (event.key === "ArrowUp" || event.key === "ArrowDown") &&
          this.game.keys.indexOf(event.key) === -1
        ) {
          this.game.keys.push(event.key);
        } else if (event.key === " ") {
          this.game.player.shootFromHead();
        }
      });

      window.addEventListener("keyup", (event) => {
        const index = this.game.keys.indexOf(event.key);
        if (index > -1) {
          this.game.keys.splice(index, 1);
        }
      });
    }
  }
  //Projectile will handle player lasers
  class Projectile {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 36.25;
      this.height = 20;
      this.frameX = 0;
      this.maxFrame = 3;
      this.timer = 0;
      this.fps = 20;
      this.interval = 1000 / this.fps;
      this.speed = Math.random() * 0.2 + 2.8;
      this.markedForDeletion = false;
      //this.image = document.getElementById("projectile");
      this.image = document.getElementById("fireball");
    }

    update(deltaTime) {
      this.x += this.speed;
      if (this.timer > this.interval) {
        if (this.frameX < this.maxFrame) {
          this.frameX++;
        } else {
          this.frameX = 0;
        }
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }

      //0.9 -> 90% of the game area.
      //If horizontal coordinate of the lasers is more than 90% of width of the main area set, it will be marked for deleting procedure.
      if (this.x > this.game.width * 0.9) {
        this.markedForDeletion = true;
      }
    }

    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }
  //Particle will deal with falling screws, corks and bolts come from damaged enemies
  class Particle {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.image = document.getElementById("gears");
      this.frameX = Math.floor(Math.random() * 3);
      this.frameY = Math.floor(Math.random() * 3);
      //different random size for particles
      this.spriteSize = 50;
      this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
      this.size = this.spriteSize * this.sizeModifier;
      //speed of particles
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * -15;
      this.gravity = 0.5;
      this.markedForDeletion = false;
      this.angle = 0;
      this.velocityOfAngle = Math.random() * 0.2 - 0.1;
      this.bounced = 0;
      //Particles will start to bounce from a range between 60 and 140pxs.
      this.bottomBounceBoundary = Math.random() * 80 + 60;
    }

    update() {
      this.angle += this.velocityOfAngle;
      this.speedY += this.gravity;
      this.x -= this.speedX + this.game.speed;
      this.y += this.speedY;
      if (this.y > this.game.height + this.size || this.x < 0 - this.size) {
        this.markedForDeletion = true;
      }
      if (
        this.y > this.game.height - this.bottomBounceBoundary &&
        this.bounced < 2
      ) {
        this.bounced++;
        this.speedY *= -0.7;
      }
    }
    draw(context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.frameX * this.spriteSize,
        this.frameY * this.spriteSize,
        this.spriteSize,
        this.spriteSize,
        this.size * -0.5,
        this.size * -0.5,
        this.size,
        this.size
      );
      context.restore();
    }
  }

  class Shield {
    constructor(game) {
      this.game = game;
      this.width = this.game.player.width;
      this.height = this.game.player.height;
      this.frameX = 0;
      this.maxFrame = 24;
      this.image = document.getElementById("shield");
      this.fps = 60;
      this.timer = 0;
      this.interval = 1000 / this.fps;
    }

    update(deltaTime) {
      if (this.frameX <= this.maxFrame) {
        if (this.timer > this.interval) {
          this.frameX++;
          this.timer = 0;
        } else {
          this.timer += deltaTime;
        }
      }
    }
    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.game.player.x,
        this.game.player.y,
        this.width,
        this.height
      );
    }
    reset() {
      this.frameX = 0;
      this.game.sound.playShieldSound();
    }
  }

  //Sound effects
  class Sound {
    constructor() {
      this.powerUpSound = document.getElementById("powerup");
      this.powerDownSound = document.getElementById("powerdown");
      this.shotSound = document.getElementById("shot");
      this.hitSound = document.getElementById("hit");
      this.explosionSound = document.getElementById("explosion");
      this.shieldSound = document.getElementById("shield-sound");
    }

    playPowerUpSound() {
      this.powerUpSound.currentTime = 0;
      this.powerUpSound.play();
    }

    playPowerDownSound() {
      this.powerDownSound.currentTime = 0;
      this.powerDownSound.play();
    }

    playShotSound() {
      this.shotSound.currentTime = 0;
      this.shotSound.play();
    }

    playHitSound() {
      this.hitSound.currentTime = 0;
      this.hitSound.play();
    }

    playExplosionSound() {
      this.explosionSound.currentTime = 0;
      this.explosionSound.play();
    }

    playShieldSound() {
      this.shieldSound.currentTime = 0;
      this.shieldSound.play();
    }
  }
  //smoke and explosion effects
  class Explosion {
    constructor(game, x, y) {
      this.game = game;
      this.frameX = 0;
      this.maxFrame = 8;
      this.spriteHeight = 200;
      this.spriteWidth = 200;
      this.fps = 18;
      this.timer = 0;
      this.interval = 1000 / this.fps;
      this.width = this.spriteWidth;
      this.height = this.spriteHeight;
      this.x = x - this.width * 0.5;
      this.y = y - this.height * 0.5;
      this.markedForDeletion = false;
    }
    update(deltaTime) {
      this.x -= this.game.speed;
      if (this.timer > this.interval) {
        this.frameX++;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }

      if (this.frameX > this.maxFrame) {
        this.markedForDeletion = true;
      }
    }
    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  class SmokeExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y);

      this.image = document.getElementById("smoke");
    }
  }

  class FireExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y);
      this.image = document.getElementById("fire");
    }
  }

  //Player will control the main charachter
  class Player {
    constructor(game) {
      this.game = game;
      this.width = 120;
      this.height = 190;
      this.x = 20;
      this.y = 150;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37; // There are 38 images in a frame, and we start to count from zero
      this.speedY = 0;
      this.maxSpeed = 2;
      this.projectiles = [];
      this.powerUp = false;
      this.powerUpTimer = 0;
      this.powerUpLimit = 10000;
      this.image = document.getElementById("player");
    }
    update(deltaTime) {
      if (this.game.keys.includes("ArrowUp")) this.speedY = -1;
      else if (this.game.keys.includes("ArrowDown")) this.speedY = 1;
      else this.speedY = 0;
      this.y += this.speedY;
      //vertical boundaries
      if (this.y > this.game.height - this.height * 0.5) {
        this.y = this.game.height - this.height * 0.5;
      }
      //horizontal boundaries
      else if (this.y < -this.height * 0.5) {
        this.y = -this.height * 0.5;
      }

      // handle projectiles
      this.projectiles.forEach((projectile) => {
        projectile.update(deltaTime);
      });
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );
      //sprite animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
      //power up logic
      if (this.powerUp) {
        if (this.powerUpTimer > this.powerUpLimit) {
          this.powerUpTimer = 0;
          this.powerUp = false;
          this.frameY = 0;
          this.game.sound.playPowerDownSound();
        } else {
          this.powerUpTimer += deltaTime;
          this.frameY = 1;
          this.game.ammo += 0.1;
        }
      }
    }
    draw(context) {
      //context.strokeRect(this.x, this.y, this.width, this.height);
      //parameters are: image, source x, source y, source width, source height(source image) & destination x, y, width and height(destination of canvas)
      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    shootFromHead() {
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new Projectile(this.game, this.x + 80, this.y + 30)
        );
        this.game.ammo--;
      }
      this.game.sound.playShotSound();
      if (this.powerUp) this.shootFromTail();
    }
    shootFromTail() {
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new Projectile(this.game, this.x + 80, this.y + 175)
        );
      }
    }

    enterPowerup() {
      this.powerUpTimer = 0;
      this.powerUp = true;
      if (this.game.ammo < this.game.maxAmmo)
        this.game.ammo = this.game.maxAmmo;
      this.game.sound.playPowerUpSound();
    }
  }
  //Enemy class will be the main blueprint handling many different enemy types
  class Enemy {
    constructor(game) {
      this.game = game;
      this.x = this.game.width;
      this.speedX = Math.random() * -1.5 - 0.5;
      this.markedForDeletion = false;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
    }
    update() {
      this.x += this.speedX - this.game.speed;
      if (this.x + this.width < 0) {
        this.markedForDeletion = true;
      }
      //sprite animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
    }
    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
      // context.font = "20px Helvetica";
      // context.fillText(this.lives, this.x, this.y);
    }
  }

  class AnglerFish extends Enemy {
    constructor(game) {
      super(game);
      this.height = 169;
      this.width = 228;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("angler-fish");
      this.frameY = Math.floor(Math.random() * 3);
      this.lives = 2;
      this.score = this.lives;
    }
  }

  class NightAngler extends Enemy {
    constructor(game) {
      super(game);
      this.height = 165;
      this.width = 213;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("night-angler");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 6;
      this.score = this.lives;
    }
  }

  class LuckyFish extends Enemy {
    constructor(game) {
      super(game);
      this.height = 95;
      this.width = 99;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("lucky-fish");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 5;
      this.score = 15;
      this.type = "lucky";
    }
  }
  class HiveWhale extends Enemy {
    constructor(game) {
      super(game);
      this.height = 227;
      this.width = 400;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("hive-whale");
      this.frameY = 0;
      this.lives = 20;
      this.score = this.lives + 5;
      this.type = "hive-whale";
      this.speedX = Math.random() * -1.2 - 0.2;
    }
  }

  class BulbWhale extends Enemy {
    constructor(game) {
      super(game);
      this.height = 219;
      this.width = 270;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("bulb-whale");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 20;
      this.score = this.lives;
      this.type = "hive-whale";
      this.speedX = Math.random() * -1.2 - 0.2;
    }
  }

  class MoonFish extends Enemy {
    constructor(game) {
      super(game);
      this.height = 240;
      this.width = 227;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById("moon-fish");
      this.frameY = 0;
      this.lives = 10;
      this.score = this.lives;
      this.speedX = Math.random() * -1.2 - 2;
      this.type = "moon";
    }
  }

  class Drone extends Enemy {
    constructor(game, x, y) {
      super(game);
      this.height = 95;
      this.width = 115;
      this.y = y;
      this.x = x;
      this.image = document.getElementById("drone");
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 3;
      this.score = this.lives;
      this.type = "drone";
      this.speedX = Math.random() * -4.2 - 0.5;
    }
  }

  //Layer will handle individual bg layers in our parallax, seamlessy, scrolling, multilayered bg
  class Layer {
    constructor(image, game, speedModifier) {
      this.image = image;
      this.game = game;
      this.speedModifier = speedModifier;
      this.width = 1768;
      this.height = 500;
      this.x = 0;
      this.y = 0;
    }

    update() {
      if (this.x <= -this.width) {
        this.x = 0;
      }
      this.x -= this.game.speed * this.speedModifier;
    }

    draw(context) {
      context.drawImage(this.image, this.x, this.y);
      context.drawImage(this.image, this.x + this.width, this.y);
    }
  }
  //Background will put all layer objects together to animate the entire game
  class Background {
    constructor(game) {
      this.game = game;
      this.image1 = document.getElementById("layer1");
      this.image2 = document.getElementById("layer2");
      this.image3 = document.getElementById("layer3");
      this.image4 = document.getElementById("layer4");
      this.layer1 = new Layer(this.image1, this.game, 0.2);
      this.layer2 = new Layer(this.image2, this.game, 0.4);
      this.layer3 = new Layer(this.image3, this.game, 1);
      this.layer4 = new Layer(this.image4, this.game, 1.5);
      this.layers = [this.layer1, this.layer2, this.layer3];
    }
    update() {
      this.layers.forEach((layer) => layer.update());
    }
    draw(context) {
      this.layers.forEach((layer) => layer.draw(context));
    }
  }
  // UI will draw score, timer and other information that needs to be displayed for the user
  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = "Bangers";
      this.color = "white";
    }

    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.shadowColor = "black";
      context.font = `${this.fontSize}px ${this.fontFamily}`;
      //score
      context.fillText(`Score: ${this.game.score}`, 20, 40);

      //timer
      const formattedTimeText = (this.game.gameTime * 0.001).toFixed();
      context.fillText(`Timer: ${formattedTimeText}`, 20, 100);
      //ammo
      if (this.game.player.powerUp) context.fillStyle = "#ffffbd";
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillRect(20 + 5 * i, 50, 3, 20);
      }
      //game over message
      if (this.game.gameOver) {
        context.textAlign = "center";
        let message1;
        let message2;
        if (this.game.score > this.game.winningScore) {
          message1 = "Winner!";
          message2 = "Wonderful! You are a champion!";
        } else {
          message1 = "Oops!";
          message2 = "Get my repair kit and try again!";
        }
        context.font = `170px ${this.fontFamily}`;
        context.fillText(
          message1,
          this.game.width * 0.5,
          this.game.height * 0.5 - 40
        );
        context.font = `50px ${this.fontFamily}`;
        context.fillText(
          message2,
          this.game.width * 0.5,
          this.game.height * 0.5 + 40
        );
      }

      context.restore();
    }
  }
  //All logic will come together. It's the brain of the game project
  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
      this.background = new Background(this);
      this.input = new InputHandler(this);
      this.ui = new UI(this);
      this.sound = new Sound();
      this.shield = new Shield(this);
      this.keys = [];
      this.enemies = [];
      this.particles = [];
      this.explosions = [];
      this.ammo = 20; //we have 20 lasers
      this.ammoTimer = 0;
      this.ammoInterval = 350;
      this.maxAmmo = 50;
      this.enemyTimer = 0;
      this.enemyInterval = 2000;
      this.gameOver = false;
      this.score = 0;
      this.winningScore = 100;
      this.gameTime = 0;
      this.timeLimit = 60000;
      this.speed = 1;
    }

    update(deltaTime) {
      if (!this.gameOver) {
        //Delta time is the difference in milliseconds between timestamp from this animation loop and the timestamp from the previous loop.So it's the amount of milliseconds between frames by adding Delta time to game time.Every time we draw a new frame, we are keeping track of how many milliseconds passed since the game started.Game time variable is simply just accumulating milliseconds since the game started.
        this.gameTime += deltaTime;
      }
      if (this.gameTime > this.timeLimit) {
        this.gameOver = true;
      }
      this.background.update();
      this.background.layer4.update();
      this.player.update(deltaTime);
      if (this.ammoTimer > this.ammoInterval) {
        if (this.ammo < this.maxAmmo) {
          this.ammo++;
        }
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }
      this.shield.update(deltaTime);
      this.particles.forEach((particle) => particle.update());
      this.particles = this.particles.filter(
        (particle) => !particle.markedForDeletion
      );
      this.explosions.forEach((explosion) => explosion.update(deltaTime));
      this.explosions = this.explosions.filter(
        (explosion) => !explosion.markedForDeletion
      );
      this.enemies.forEach((enemy) => {
        enemy.update();

        if (this.checkCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
          this.addExplosion(enemy);
          this.sound.playHitSound();
          this.shield.reset();
          for (let i = 0; i < enemy.score; i++) {
            this.particles.push(
              new Particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );
          }
          if (enemy.type === "lucky") {
            this.player.enterPowerup();
          } else if (!this.gameOver) {
            this.score--;
          }
        }
        this.player.projectiles.forEach((projectile) => {
          if (this.checkCollision(projectile, enemy)) {
            enemy.lives--;
            projectile.markedForDeletion = true;
            this.particles.push(
              new Particle(
                this,
                enemy.x + enemy.width * 0.5,
                enemy.y + enemy.height * 0.5
              )
            );
            if (enemy.lives <= 0) {
              enemy.markedForDeletion = true;
              this.addExplosion(enemy);
              this.sound.playExplosionSound();
              for (let i = 0; i < enemy.score; i++) {
                this.particles.push(
                  new Particle(
                    this,
                    enemy.x + enemy.width * 0.5,
                    enemy.y + enemy.height * 0.5
                  )
                );
              }
              if (enemy.type === "moon") {
                this.player.enterPowerup();
              }
              if (enemy.type === "hive-whale") {
                for (let i = 0; i < 5; i++) {
                  this.enemies.push(
                    new Drone(
                      this,
                      enemy.x + Math.random() * enemy.width,
                      enemy.y + Math.random() * 0.5
                    )
                  );
                }
              }
              if (!this.gameOver) {
                this.score += enemy.score;
              }
              // if (this.score > this.winningScore) {
              //   this.gameOver = true;
              // }
            }
          }
        });
      });
      this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);

      if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }
    draw(context) {
      this.background.draw(context);
      this.player.draw(context);
      this.shield.draw(context);
      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
      this.particles.forEach((particle) => {
        particle.draw(context);
      });
      this.explosions.forEach((explosion) => {
        explosion.draw(context);
      });

      this.background.layer4.draw(context);
      this.ui.draw(context);
    }

    addEnemy() {
      const randomize = Math.random();
      if (randomize < 0.3) this.enemies.push(new AnglerFish(this));
      else if (randomize < 0.6) this.enemies.push(new NightAngler(this));
      else if (randomize < 0.7) this.enemies.push(new HiveWhale(this));
      else if (randomize < 0.8) this.enemies.push(new BulbWhale(this));
      else if (randomize < 0.9) this.enemies.push(new MoonFish(this));
      else this.enemies.push(new LuckyFish(this));
    }

    addExplosion(enemy) {
      const randomize = Math.random();
      if (randomize < 0.5) {
        this.explosions.push(
          new SmokeExplosion(
            this,
            enemy.x + enemy.width * 0.5,
            enemy.y + enemy.height * 0.5
          )
        );
      } else {
        this.explosions.push(
          new FireExplosion(
            this,
            enemy.x + enemy.width * 0.5,
            enemy.y + enemy.height * 0.5
          )
        );
      }
    }

    checkCollision(object1, object2) {
      return (
        object1.x < object2.x + object2.width &&
        object1.x + object1.width > object2.x &&
        object1.y < object2.y + object2.height &&
        object1.height + object1.y > object2.y
      );
    }
  }
  const newGame = new Game(canvas.width, canvas.height);
  //lastTime will store a value of time stamp from the previous animation
  let lastTime = 0;
  //animation loop
  function animate(timeStamp) {
    //timeStamp comes from:Request Animation Frame Method has a special feature.It automatically passes a timestamp as an argument to the function it calls.In our case, animate. timestamp is a number in mseconds.
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    newGame.draw(ctx);
    newGame.update(deltaTime);
    //built in request animation frame request animation frame method sits on the window object.
    //It tells the browser that we wish to perform an animation and it requests that the browser calls a specified function to update an animation before the next repaint.
    //we pass animate (the name of parent function) to create an endless animation loop
    requestAnimationFrame(animate);
  }
  //pass 0 as the first time stamp here
  animate(0);
});
