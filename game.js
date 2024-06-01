const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let ballRadius = 10;
let x;
let y;
let dx;
let dy;

let paddleHeight = 10;
let paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

let rightPressed = false;
let leftPressed = false;

const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

let score = 0;
let lives = 3;

const starImage = new Image();
starImage.src = 'start.svg';

const paddleImage = new Image();
paddleImage.src = 'deer.svg';

const tailParticles = [];  // For storing meteor tail particles

document.addEventListener("mousemove", mouseMoveHandler, false);

function mouseMoveHandler(e) {
    let relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status == 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    generateCollisionEffect(b.x + brickWidth / 2, b.y + brickHeight / 2);  // Generate brick hitting effects
                    if (score == brickRowCount * brickColumnCount) {
                        showMessage("Victory! Start a new game?", resetGame);
                    }
                }
            }
        }
    }
}


function drawBall() {
    ctx.drawImage(starImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
}


function drawPaddle() {
    const scaleFactor = 1.2;  // Scaling factor to slightly increase width and height
    const scaledWidth = paddleWidth * scaleFactor;
    const scaledHeight = paddleHeight * scaleFactor * 6;
    const offsetX = (scaledWidth - paddleWidth) / 2;
    const offsetY = (scaledHeight - paddleHeight) / 2;

    ctx.drawImage(paddleImage, paddleX - offsetX, canvas.height - paddleHeight - offsetY, scaledWidth, scaledHeight);
}

function drawBricks() {
    const colors = ["#ff7675", "#fd79a8", "#a29bfe", "#74b9ff", "#55efc4"];
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status == 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = colors[r % colors.length];
                ctx.fill();
                ctx.strokeStyle = "#2d3436";
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#2d3436";
    ctx.fillText("Score: " + score, 8, 20);
}

function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#2d3436";
    ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
}


function drawTailParticles() {
    for (let i = 0; i < tailParticles.length; i++) {
        let particle = tailParticles[i];
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
        ctx.fill();
        ctx.closePath();
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.alpha *= 0.98;
        particle.radius *= 0.98;
        if (particle.alpha < 0.05 || particle.radius < 1) {
            tailParticles.splice(i, 1);
            i--;
        }
    }
}

function generateTailParticle(x, y) {
    tailParticles.push({
        x: x,
        y: y,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        radius: ballRadius / 2,
        alpha: 1.0
    });
}

function generateCollisionEffect(x, y) {
    for (let i = 0; i < 10; i++) {
        tailParticles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            radius: ballRadius / 2,
            alpha: 1.0
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawTailParticles();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();
    collisionDetection();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
            generateCollisionEffect(x, canvas.height - paddleHeight);  // 生成碰撞反弹板效果
        } else {
            lives--;
            if (lives > 0) {
                showMessage("Fail! Another round?", resumeGame);
            } else {
                showMessage("Fail! Start a new game?", resetGame);
            }
            return; // Stops the current drawing loop and waits for user input.
        }
    }

    x += dx;
    y += dy;
    generateTailParticle(x, y);  // Generate meteor tail particles
    requestAnimationFrame(draw);
}

function showMessage(message, callback) {
    const messageBox = document.getElementById("messageBox");
    const messageText = document.getElementById("messageText");
    const messageButton = document.getElementById("messageButton");

    messageText.textContent = message;
    messageBox.classList.remove("hidden");

    messageButton.onclick = () => {
        messageBox.classList.add("hidden");
        callback();
    };
}

function resetGame() {
    lives = 3;
    score = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
    initGame();
}

function resumeGame() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 4;
    dy = -4;
    draw();
}

function initGame() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 4;
    dy = -4;
    draw();
}

document.addEventListener("DOMContentLoaded", () => {
    showMessage("Start the game?", initGame);
});
