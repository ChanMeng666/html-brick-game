// 立即执行初始化
(function() {
    console.log('Immediate initialization...');
    
    // 等待DOM准备好
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInitialState);
    } else {
        setupInitialState();
    }
    
    function setupInitialState() {
        console.log('Setting up initial state...');
        
        // 强制显示开始菜单
        setTimeout(() => {
            const startMenu = document.getElementById('startMenu');
            if (startMenu) {
                startMenu.classList.remove('hidden');
                startMenu.classList.add('active');
                console.log('Start menu forced to show with active class');
            }
            
            // 强制隐藏其他菜单
            const menusToHide = ['pauseMenu', 'instructionsMenu', 'highScoreMenu', 'gameMenu'];
            menusToHide.forEach(menuId => {
                const menu = document.getElementById(menuId);
                if (menu) {
                    menu.classList.remove('active');
                    menu.classList.add('hidden');
                    console.log('Hidden menu:', menuId);
                }
            });
        }, 50);
    }
})();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// 音效函数
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playBrickHitSound() {
    playSound(800, 0.1, 'square', 0.2);
    setTimeout(() => playSound(600, 0.1, 'square', 0.15), 50);
}

function playPaddleHitSound() {
    playSound(200, 0.2, 'sawtooth', 0.3);
}

function playVictorySound() {
    playSound(523, 0.3, 'sine', 0.4);
    setTimeout(() => playSound(659, 0.3, 'sine', 0.4), 150);
    setTimeout(() => playSound(784, 0.3, 'sine', 0.4), 300);
    setTimeout(() => playSound(1047, 0.5, 'sine', 0.4), 450);
}

function playGameOverSound() {
    playSound(400, 0.5, 'sawtooth', 0.3);
    setTimeout(() => playSound(300, 0.5, 'sawtooth', 0.3), 200);
    setTimeout(() => playSound(200, 0.8, 'sawtooth', 0.3), 400);
}

// 背景音乐
let backgroundMusicPlaying = false;
function playBackgroundMusic() {
    if (!backgroundMusicPlaying) {
        backgroundMusicPlaying = true;
        const playMelody = () => {
            const melody = [262, 294, 330, 349, 392, 440, 494, 523];
            let noteIndex = 0;
            
            const playNote = () => {
                if (backgroundMusicPlaying) {
                    playSound(melody[noteIndex], 0.8, 'sine', 0.1);
                    noteIndex = (noteIndex + 1) % melody.length;
                    setTimeout(playNote, 1000);
                }
            };
            playNote();
        };
        playMelody();
    }
}

let ballRadius = 10;
let x = 0;
let y = 0;
let dx = 0;
let dy = 0;

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

// 鼠标和触摸事件处理
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("touchmove", touchMoveHandler, { passive: false });
document.addEventListener("touchstart", touchStartHandler, { passive: false });

function mouseMoveHandler(e) {
    let relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

function touchMoveHandler(e) {
    e.preventDefault(); // 防止页面滚动
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

function touchStartHandler(e) {
    e.preventDefault(); // 防止页面滚动
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
}

function collisionDetection() {
    // 确保球的位置值是有效的
    if (!isFinite(x) || !isFinite(y)) {
        return;
    }
    
    // 预计算球的边界
    const ballLeft = x - ballRadius;
    const ballRight = x + ballRadius;
    const ballTop = y - ballRadius;
    const ballBottom = y + ballRadius;
    
    // 只检测球可能碰撞的砖块区域
    const startCol = Math.max(0, Math.floor((ballLeft - brickOffsetLeft) / (brickWidth + brickPadding)));
    const endCol = Math.min(brickColumnCount - 1, Math.floor((ballRight - brickOffsetLeft) / (brickWidth + brickPadding)));
    const startRow = Math.max(0, Math.floor((ballTop - brickOffsetTop) / (brickHeight + brickPadding)));
    const endRow = Math.min(brickRowCount - 1, Math.floor((ballBottom - brickOffsetTop) / (brickHeight + brickPadding)));
    
    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            let b = bricks[c][r];
            if (b.status == 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    generateCollisionEffect(b.x + brickWidth / 2, b.y + brickHeight / 2);  // Generate brick hitting effects
                    playBrickHitSound();  // 播放砖块击中音效
                    if (score == brickRowCount * brickColumnCount) {
                        playVictorySound();  // 播放胜利音效
                        saveHighScore(score);  // 保存高分
                        gameState = 'menu';
                        backgroundMusicPlaying = false;
                        showMessage("🎉 Victory! 🎉", () => {
                            resetGame();
                            showMenu('startMenu');
                        });
                    }
                    return; // 只处理第一个碰撞
                }
            }
        }
    }
}


function drawBall() {
    // 确保位置值是有效的
    if (!isFinite(x) || !isFinite(y) || x <= 0 || y <= 0) {
        return;
    }
    
    // 添加光晕效果
    ctx.beginPath();
    ctx.arc(x, y, ballRadius * 2, 0, Math.PI * 2);
    
    // 确保半径值是有效的
    const radius = ballRadius * 2;
    if (radius > 0) {
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        glowGradient.addColorStop(0.5, "rgba(0, 212, 255, 0.2)");
        glowGradient.addColorStop(1, "rgba(0, 212, 255, 0)");
        ctx.fillStyle = glowGradient;
        ctx.fill();
    }
    ctx.closePath();
    
    // 绘制星星
    if (starImage.complete) {
    ctx.drawImage(starImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
    }
}


function drawPaddle() {
    // 确保挡板位置值是有效的
    if (!isFinite(paddleX)) {
        return;
    }
    
    const scaleFactor = 1.2;  // Scaling factor to slightly increase width and height
    const scaledWidth = paddleWidth * scaleFactor;
    const scaledHeight = paddleHeight * scaleFactor * 6;
    const offsetX = (scaledWidth - paddleWidth) / 2;
    const offsetY = (scaledHeight - paddleHeight) / 2;

    // 添加底部光晕效果
    ctx.beginPath();
    ctx.ellipse(paddleX + paddleWidth/2, canvas.height - paddleHeight/2, 
                scaledWidth/2, scaledHeight/4, 0, 0, Math.PI * 2);
    const paddleGlow = ctx.createRadialGradient(
        paddleX + paddleWidth/2, canvas.height - paddleHeight/2, 0,
        paddleX + paddleWidth/2, canvas.height - paddleHeight/2, scaledWidth/2
    );
    paddleGlow.addColorStop(0, "rgba(0, 255, 100, 0.3)");
    paddleGlow.addColorStop(1, "rgba(0, 255, 100, 0)");
    ctx.fillStyle = paddleGlow;
    ctx.fill();
    ctx.closePath();

    ctx.drawImage(paddleImage, paddleX - offsetX, canvas.height - paddleHeight - offsetY, scaledWidth, scaledHeight);
}

function drawBricks() {
    const colors = [
        ["#ff6b6b", "#ff5252"],
        ["#4ecdc4", "#26a69a"],
        ["#45b7d1", "#2196f3"],
        ["#96ceb4", "#66bb6a"],
        ["#feca57", "#ffb74d"]
    ];
    
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status == 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                // 创建渐变效果
                const gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
                gradient.addColorStop(0, colors[r % colors.length][0]);
                gradient.addColorStop(1, colors[r % colors.length][1]);
                
                // 绘制砖块主体
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 8);
                } else {
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                }
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // 添加发光边框
                ctx.strokeStyle = colors[r % colors.length][0];
                ctx.lineWidth = 2;
                ctx.shadowColor = colors[r % colors.length][0];
                ctx.shadowBlur = 5;
                ctx.stroke();
                ctx.shadowBlur = 0;
                
                // 添加高光效果
                const highlightGradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight/3);
                highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
                highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                ctx.fillStyle = highlightGradient;
                ctx.fill();
                
                ctx.closePath();
            }
        }
    }
}

function drawScore() {
    ctx.font = "bold 18px 'Orbitron', monospace";
    ctx.fillStyle = "#00d4ff";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 10;
    ctx.fillText("SCORE: " + score, 15, 30);
    ctx.shadowBlur = 0;
}

function drawLives() {
    ctx.font = "bold 18px 'Orbitron', monospace";
    ctx.fillStyle = "#00d4ff";
    ctx.shadowColor = "#00d4ff";
    ctx.shadowBlur = 10;
    ctx.fillText("LIVES: " + lives, canvas.width - 110, 30);
    ctx.shadowBlur = 0;
}


function drawTailParticles() {
    // 限制粒子数量以提高性能
    const maxParticles = 100;
    if (tailParticles.length > maxParticles) {
        tailParticles.splice(0, tailParticles.length - maxParticles);
    }
    
    for (let i = tailParticles.length - 1; i >= 0; i--) {
        let particle = tailParticles[i];
        
        // 更新粒子位置和属性
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.alpha *= 0.98;
        particle.radius *= 0.98;
        
        // 移除过期的粒子
        if (particle.alpha < 0.05 || particle.radius < 1) {
            tailParticles.splice(i, 1);
            continue;
        }
        
        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        
        // 使用预设颜色而不是每次创建渐变
        if (particle.type === 'trail') {
            ctx.fillStyle = `rgba(100, 150, 255, ${particle.alpha})`;
        } else if (particle.type === 'explosion') {
            ctx.fillStyle = `rgba(255, 100, 100, ${particle.alpha})`;
        }
        
        ctx.fill();
        ctx.closePath();
    }
}

function generateTailParticle(x, y) {
    // 确保位置值是有效的
    if (!isFinite(x) || !isFinite(y)) {
        return;
    }
    
    tailParticles.push({
        x: x,
        y: y,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        radius: ballRadius / 3,
        alpha: 1.0,
        type: 'trail'
    });
}

function generateCollisionEffect(x, y) {
    // 确保位置值是有效的
    if (!isFinite(x) || !isFinite(y)) {
        return;
    }
    
    for (let i = 0; i < 15; i++) {
        tailParticles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            radius: ballRadius / 2 + Math.random() * 3,
            alpha: 1.0,
            type: 'explosion'
        });
    }
}

function draw() {
    // 确保游戏状态有效
    if (gameState !== 'playing') {
        return;
    }
    
    // 确保关键变量已初始化
    if (!isFinite(x) || !isFinite(y) || !isFinite(dx) || !isFinite(dy)) {
        console.error('Game variables not properly initialized');
        return;
    }
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置默认绘制状态
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    
    // 按层次绘制
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
            playPaddleHitSound();  // 播放挡板击中音效
        } else {
            lives--;
            if (lives > 0) {
                showMessage("💔 Life Lost!", () => {
                    x = canvas.width / 2;
                    y = canvas.height - 30;
                    dx = 4;
                    dy = -4;
                    draw();
                });
            } else {
                playGameOverSound();  // 播放游戏结束音效
                saveHighScore(score);  // 保存高分
                gameState = 'menu';
                backgroundMusicPlaying = false;
                showMessage("💀 Game Over!", () => {
                    resetGame();
                    showMenu('startMenu');
                });
            }
            return; // Stops the current drawing loop and waits for user input.
        }
    }

    x += dx;
    y += dy;
    generateTailParticle(x, y);  // Generate meteor tail particles
    
    if (gameState === 'playing') {
        animationId = requestAnimationFrame(draw);
    }
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



function initGame() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 4;
    dy = -4;
    gameState = 'playing';
    playBackgroundMusic();  // 开始播放背景音乐
    draw();
}

// 菜单管理
let gameState = 'menu'; // 'menu', 'playing', 'paused'
let animationId;

// 高分榜系统
let highScores = JSON.parse(localStorage.getItem('starlightBreakerHighScores')) || [];

function saveHighScore(score) {
    highScores.push(score);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 10); // 只保留前10个高分
    localStorage.setItem('starlightBreakerHighScores', JSON.stringify(highScores));
}

function displayHighScores() {
    const highScoreList = document.getElementById('highScoreList');
    if (highScores.length === 0) {
        highScoreList.innerHTML = '<div class="score-item"><span>No high scores yet!</span></div>';
        return;
    }
    
    highScoreList.innerHTML = highScores.map((score, index) => `
        <div class="score-item">
            <span class="score-rank">#${index + 1}</span>
            <span class="score-value">${score}</span>
        </div>
    `).join('');
}

function showMenu(menuId) {
    console.log('Showing menu:', menuId);
    
    // 隐藏所有菜单
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
        menu.classList.add('hidden');
        console.log('Hidden menu:', menu.id);
    });
    
    // 显示指定菜单
    const targetMenu = document.getElementById(menuId);
    if (targetMenu) {
        targetMenu.classList.remove('hidden');
        targetMenu.classList.add('active');
        console.log('Showed menu:', menuId, 'with active class');
    } else {
        console.error('Menu not found:', menuId);
    }
    
    // 隐藏游戏UI
    const gameMenu = document.getElementById('gameMenu');
    if (gameMenu) {
        gameMenu.classList.remove('active');
        gameMenu.classList.add('hidden');
    }
}

function hideAllMenus() {
    console.log('Hiding all menus and showing game UI');
    
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
        menu.classList.add('hidden');
    });
    
    // 显示游戏UI
    const gameMenu = document.getElementById('gameMenu');
    if (gameMenu) {
        gameMenu.classList.remove('hidden');
        gameMenu.classList.add('active');
        console.log('Game UI is now active');
    }
}

function pauseGame() {
    gameState = 'paused';
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    showMenu('pauseMenu');
}

function resumeGame() {
    gameState = 'playing';
    hideAllMenus();
    draw();
}

function restartGame() {
    gameState = 'playing';
    hideAllMenus();
    resetGame();
}

function backToMainMenu() {
    gameState = 'menu';
    backgroundMusicPlaying = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    showMenu('startMenu');
}

// 事件监听器
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM Content Loaded - Initializing game...');
    
    // 确保初始状态正确
    gameState = 'menu';
    
    // 确保开始菜单显示
    setTimeout(() => {
        console.log('Setting up initial menu state...');
        showMenu('startMenu');
    }, 100);
    
    // 开始菜单按钮
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            console.log('Start game button clicked');
            gameState = 'playing';
            hideAllMenus();
            initGame();
        });
    } else {
        console.error('Start game button not found!');
    }
    
    // 其他菜单按钮
    const instructionsBtn = document.getElementById('instructionsBtn');
    if (instructionsBtn) {
        instructionsBtn.addEventListener('click', () => {
            console.log('Instructions button clicked');
            showMenu('instructionsMenu');
        });
    }
    
    const highScoreBtn = document.getElementById('highScoreBtn');
    if (highScoreBtn) {
        highScoreBtn.addEventListener('click', () => {
            console.log('High score button clicked');
            displayHighScores();
            showMenu('highScoreMenu');
        });
    }
    
    // 说明页面按钮
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            console.log('Back to menu button clicked');
            showMenu('startMenu');
        });
    }
    
    // 高分榜按钮
    const clearScoresBtn = document.getElementById('clearScoresBtn');
    if (clearScoresBtn) {
        clearScoresBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all high scores?')) {
                highScores = [];
                localStorage.removeItem('starlightBreakerHighScores');
                displayHighScores();
            }
        });
    }
    
    const backToMenuFromScoresBtn = document.getElementById('backToMenuFromScoresBtn');
    if (backToMenuFromScoresBtn) {
        backToMenuFromScoresBtn.addEventListener('click', () => {
            showMenu('startMenu');
        });
    }
    
    // 游戏UI按钮
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseGame);
    }
    
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', backToMainMenu);
    }
    
    // 暂停菜单按钮
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', resumeGame);
    }
    
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }
    
    const backToMainMenuBtn = document.getElementById('backToMainMenuBtn');
    if (backToMainMenuBtn) {
        backToMainMenuBtn.addEventListener('click', backToMainMenu);
    }
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameState === 'playing') {
            pauseGame();
        } else if (e.key === 'Escape' && gameState === 'paused') {
            resumeGame();
        }
    });
    
    console.log('All event listeners set up successfully');
});

// 全局调试函数 - 可以在控制台中调用
window.forceShowStartMenu = function() {
    console.log('Force showing start menu...');
    
    // 隐藏所有菜单
    document.querySelectorAll('.menu').forEach(menu => {
        menu.classList.remove('active');
        menu.classList.add('hidden');
    });
    
    // 显示开始菜单
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
        startMenu.classList.remove('hidden');
        startMenu.classList.add('active');
        console.log('Start menu is now visible with active class');
    }
    
    // 隐藏游戏UI
    const gameMenu = document.getElementById('gameMenu');
    if (gameMenu) {
        gameMenu.classList.remove('active');
        gameMenu.classList.add('hidden');
    }
    
    // 重置游戏状态
    gameState = 'menu';
    console.log('Game state reset to menu');
};

// 备用初始化 - 如果DOMContentLoaded没有触发
window.addEventListener('load', () => {
    console.log('Window load event - backup initialization');
    
    // 确保开始菜单显示
    const startMenu = document.getElementById('startMenu');
    if (startMenu) {
        startMenu.classList.remove('hidden');
        startMenu.classList.add('active');
        console.log('Backup: Start menu set to active');
    }
    
    // 确保其他菜单隐藏
    const otherMenus = ['pauseMenu', 'instructionsMenu', 'highScoreMenu', 'gameMenu'];
    otherMenus.forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.classList.remove('active');
            menu.classList.add('hidden');
            console.log('Backup: Hidden menu', menuId);
        }
    });
});
