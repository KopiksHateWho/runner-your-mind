const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const scoreDisplay = document.getElementById('score-display');
const energyBar = document.getElementById('energy-bar');
const energyText = document.getElementById('energy-text');
const quizModal = document.getElementById('quiz-modal');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const timerValue = document.getElementById('timer-value');
const quizFeedback = document.getElementById('quiz-feedback');
const finalScore = document.getElementById('final-score');
const performanceRating = document.getElementById('performance-rating');
const performanceMessage = document.getElementById('performance-message');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const mobileJumpBtn = document.getElementById('mobileJumpBtn');

let gameState = 'start';
let score = 0;
let energy = 3;
let maxEnergy = 3;
let gameSpeed = 5;
let baseSpeed = 5;
let maxSpeed = 12;
let lastTime = 0;
let quizTimer = null;
let quizCountdown = 10;
let isPaused = false;
let consecutiveCorrect = 0;

const player = {
    x: 100,
    y: 0,
    width: 50,
    height: 70,
    velocityY: 0,
    gravity: 0.6,
    jumpStrength: -15,
    isJumping: false,
    groundY: 0,
    color: '#FF6B6B',
    invincible: false,
    invincibleTimer: 0,
    speedBoost: false,
    speedBoostTimer: 0
};

let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 2500;
let minObstacleInterval = 1800;

let mosques = [];
let mosqueTimer = 0;
let mosqueInterval = 1200;

class Mosque {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.drawn = false;
    }
    
    draw() {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x, this.y + 30, this.width, this.height - 30);
        
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y + 30, this.width, this.height - 30);
        
        ctx.fillStyle = '#00C853';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 30, 25, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(this.x + this.width / 2 - 8, this.y + this.height - 25, 16, 25);
        
        ctx.fillStyle = '#90CAF9';
        ctx.fillRect(this.x + 8, this.y + 45, 12, 12);
        ctx.fillRect(this.x + this.width - 20, this.y + 45, 12, 12);
    }
    
    update(deltaTime) {
        this.x -= gameSpeed * (deltaTime / 16);
    }
}

function spawnMosque() {
    const mosque = new Mosque(canvas.width, player.groundY - 80);
    mosques.push(mosque);
}

function updateMosques(deltaTime) {
    mosques.forEach((mosque, index) => {
        mosque.update(deltaTime);
        if (mosque.x + mosque.width < 0) {
            mosques.splice(index, 1);
        }
    });
}

function checkMosqueCollisions() {
    mosques.forEach((mosque, index) => {
        if (player.x < mosque.x + mosque.width &&
            player.x + player.width > mosque.x &&
            player.y < mosque.y + mosque.height &&
            player.y + player.height > mosque.y) {
            
            if (energy < maxEnergy) {
                energy++;
                updateHUD();
            }
            
            mosques.splice(index, 1);
        }
    });
}

function drawMosques() {
    mosques.forEach(mosque => mosque.draw());
}

let backgroundX = 0;
let groundX = 0;

let lastQuizTime = 0;
let quizInterval = 12000;
let currentQuestion = null;
let currentQuestionIndex = -1;
let animationFrameId = null;

const questionBank = [
    { subject: 'Mathematics', question: 'What is 25 + 37?', options: ['52', '62', '72', '42'], correctIndex: 1 },
    { subject: 'Mathematics', question: 'What is 144 ÷ 12?', options: ['10', '12', '14', '11'], correctIndex: 1 },
    { subject: 'Mathematics', question: 'What is 3/4 + 1/4?', options: ['1/2', '1', '4/8', '1 1/4'], correctIndex: 1 },
    { subject: 'Mathematics', question: 'If a runner runs 100m in 10s, speed?', options: ['5 m/s', '10 m/s', '15 m/s', '20 m/s'], correctIndex: 1 },
    { subject: 'Mathematics', question: 'What is 15 × 8?', options: ['110', '115', '120', '125'], correctIndex: 2 },
    { subject: 'Islamic Education', question: 'How many pillars of Islam?', options: ['3', '4', '5', '6'], correctIndex: 2 },
    { subject: 'Islamic Education', question: 'What is Zakat?', options: ['Pillars of Islam', 'Names of Allah', 'Months of Hijri', 'Prophets'], correctIndex: 0 },
    { subject: 'Islamic Education', question: 'Daily prayers (Shalat)?', options: ['3', '4', '5', '7'], correctIndex: 2 },
    { subject: 'Islamic Education', question: 'NOT recommended in Islam?', options: ['Honesty', 'Patience', 'Arrogance', 'Generosity'], correctIndex: 2 },
    { subject: 'Islamic Education', question: '"Assalamu Alaikum" means?', options: ['Thank you', 'Peace be upon you', 'God is great', 'In the name of God'], correctIndex: 1 },
    { subject: 'Physical Education', question: 'Ideal resting heart rate?', options: ['30-40 bpm', '60-100 bpm', '120-140 bpm', '150-180 bpm'], correctIndex: 1 },
    { subject: 'Physical Education', question: 'Which organ gets stronger?', options: ['Lungs', 'Heart', 'Stomach', 'Liver'], correctIndex: 1 },
    { subject: 'Physical Education', question: 'Sleep for teens?', options: ['4-6 hours', '6-8 hours', '8-10 hours', '12-14 hours'], correctIndex: 2 },
    { subject: 'Physical Education', question: 'Best hydration during exercise?', options: ['Drink soda', 'Drink water', 'Don\'t drink', 'Drink coffee'], correctIndex: 1 },
    { subject: 'Physical Education', question: 'NOT cardiovascular?', options: ['Running', 'Swimming', 'Weight lifting', 'Cycling'], correctIndex: 2 }
];

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (gameState === 'playing' && (e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault();
        if (!player.isJumping) jump();
    }
});

mobileJumpBtn.addEventListener('click', () => {
    if (gameState === 'playing' && !player.isJumping) {
        jump();
    }
});

mobileJumpBtn.addEventListener('touchstart', (e) => {
    if (gameState === 'playing' && !player.isJumping) {
        e.preventDefault();
        jump();
    }
}, { passive: false });

document.querySelectorAll('.option-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        if (gameState === 'quiz' && currentQuestion) handleAnswer(index);
    });
});

window.addEventListener('resize', () => {
    player.groundY = canvas.height - 80;
});

function initGame() {
    player.groundY = canvas.height - 80;
    player.y = player.groundY - player.height;
    obstacles = [];
    mosques = [];
    score = 0;
    energy = maxEnergy;
    gameSpeed = baseSpeed;
    backgroundX = 0;
    groundX = 0;
    obstacleTimer = 0;
    lastQuizTime = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.invincible = false;
    player.speedBoost = false;
    consecutiveCorrect = 0;
    updateHUD();
}

function startGame() {
    initGame();
    startScreen.classList.remove('active');
    gameoverScreen.classList.remove('active');
    gameScreen.classList.add('active');
    gameState = 'playing';
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (!isPaused && gameState === 'playing') {
        update(deltaTime);
        checkQuizTrigger(currentTime);
    }
    
    render();
    
    if (gameState === 'playing' || gameState === 'quiz') {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function update(deltaTime) {
    updatePlayer();
    updateObstacles(deltaTime);
    updateMosques(deltaTime);
    updateBackground(deltaTime);
    updatePowerUps(deltaTime);
    updateDifficulty();
    checkCollisions();
    checkMosqueCollisions();
    
    if (energy <= 0) endGame();
}

function updatePlayer() {
    player.velocityY += player.gravity;
    player.y += player.velocityY;
    
    if (player.y >= player.groundY - player.height) {
        player.y = player.groundY - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
}

function jump() {
    if (!player.isJumping) {
        player.velocityY = player.jumpStrength;
        player.isJumping = true;
    }
}

function updateBackground(deltaTime) {
    const scrollSpeed = gameSpeed * (deltaTime / 16);
    groundX += scrollSpeed;
    if (groundX >= canvas.width) groundX = 0;
    backgroundX += scrollSpeed * 0.5;
    if (backgroundX >= canvas.width) backgroundX = 0;
}

function updateObstacles(deltaTime) {
    obstacleTimer += deltaTime;
    
    if (obstacleTimer >= obstacleInterval) {
        spawnObstacle();
        obstacleTimer = 0;
        obstacleInterval = Math.random() * 500 + minObstacleInterval;
    }
    
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed * (deltaTime / 16);
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            score += 10;
            updateHUD();
        }
    });
}

function spawnObstacle() {
    const isTall = Math.random() > 0.5;
    const obstacle = {
        x: canvas.width,
        y: player.groundY - (isTall ? 80 : 50),
        width: isTall ? 30 : 40,
        height: isTall ? 80 : 50,
        color: '#FFD700',
        type: isTall ? 'tall' : 'short'
    };
    obstacles.push(obstacle);
}

function checkCollisions() {
    obstacles.forEach((obstacle, index) => {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            handleCollision(index);
        }
    });
}


function handleCollision(obstacleIndex) {
    obstacles.splice(obstacleIndex, 1);
    energy--;
    updateHUD();
    
    canvas.style.transform = 'translateX(5px)';
    setTimeout(() => {
        canvas.style.transform = 'translateX(-5px)';
        setTimeout(() => canvas.style.transform = 'translateX(0)', 50);
    }, 50);
    
    player.invincible = true;
    player.invincibleTimer = 1000;
}

function updatePowerUps(deltaTime) {
    if (player.invincible) {
        player.invincibleTimer -= deltaTime;
        if (player.invincibleTimer <= 0) player.invincible = false;
    }
    
    if (player.speedBoost) {
        player.speedBoostTimer -= deltaTime;
        if (player.speedBoostTimer <= 0) {
            player.speedBoost = false;
            gameSpeed = Math.max(gameSpeed - 3, baseSpeed);
        }
    }
}

function updateDifficulty() {
    const targetSpeed = baseSpeed + Math.floor(score / 100) * 0.5;
    if (gameSpeed < Math.min(targetSpeed, maxSpeed)) {
        gameSpeed += 0.01;
    }
}

function updateHUD() {
    scoreDisplay.textContent = score;
    const energyPercent = (energy / maxEnergy) * 100;
    energyBar.style.width = `${energyPercent}%`;
    energyText.textContent = `${energy}/${maxEnergy}`;
    
    energyBar.classList.remove('medium', 'low');
    if (energy === 2) energyBar.classList.add('medium');
    else if (energy === 1) energyBar.classList.add('low');
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGround();
    drawObstacles();
    drawMosques();
    drawPlayer();
}

function drawBackground() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 80);
    skyGradient.addColorStop(0, '#0d1b3e');
    skyGradient.addColorStop(0.5, '#15295c');
    skyGradient.addColorStop(1, '#1a237e');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
        const starX = (i * 73 + backgroundX * 0.1) % canvas.width;
        const starY = (i * 47) % (canvas.height - 150);
        const size = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(starX, starY, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.arc(650, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#0a1429';
    const buildingOffset = backgroundX % canvas.width;
    drawBuilding(buildingOffset, canvas.height - 80, 120);
    drawBuilding(buildingOffset + 300, canvas.height - 80, 80);
    drawBuilding(buildingOffset + 500, canvas.height - 80, 100);
    drawBuilding(buildingOffset + canvas.width, canvas.height - 80, 120);
    drawBuilding(buildingOffset + canvas.width + 300, canvas.height - 80, 80);
}

function drawBuilding(x, baseY, height) {
    ctx.fillRect(x + 20, baseY - height, 60, height);
    ctx.beginPath();
    ctx.arc(x + 50, baseY - height, 25, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + 5, baseY - height - 30, 15, 30);
    ctx.beginPath();
    ctx.arc(x + 12, baseY - height - 35, 10, Math.PI, 0);
    ctx.fill();
}

function drawGround() {
    ctx.fillStyle = '#00c853';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    ctx.fillStyle = '#00695c';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 5);
    
    ctx.fillStyle = '#2e7d32';
    const grassOffset = groundX % 30;
    for (let i = -1; i < canvas.width / 30 + 1; i++) {
        ctx.fillRect(i * 30 - grassOffset, canvas.height - 80, 3, 15);
    }
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, obstacle.width / 2, obstacle.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, obstacle.width / 2.5, obstacle.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1E88E5';
        ctx.beginPath();
        ctx.arc(centerX, obstacle.y + 8, obstacle.width / 3, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, obstacle.y + obstacle.height - 8, obstacle.width / 3, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX + 3, centerY - 3);
        ctx.lineTo(centerX + 10, centerY - 3);
        ctx.lineTo(centerX + 5, centerY + 3);
        ctx.lineTo(centerX + 7, centerY + 10);
        ctx.lineTo(centerX, centerY + 6);
        ctx.lineTo(centerX - 7, centerY + 10);
        ctx.lineTo(centerX - 5, centerY + 3);
        ctx.lineTo(centerX - 10, centerY - 3);
        ctx.lineTo(centerX - 3, centerY - 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    });
}

function drawPlayer() {
    ctx.save();
    
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    const px = player.x;
    const py = player.y;
    
    if (!player.isJumping) {
        const legOffset = Math.sin(Date.now() / 100) * 10;
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(px + 12 + legOffset, py + player.height - 5, 10, 18);
        ctx.fillRect(px + 28 - legOffset, py + player.height - 5, 10, 18);
    } else {
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(px + 12, py + player.height - 8, 10, 12);
        ctx.fillRect(px + 28, py + player.height - 8, 10, 12);
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px + 5, py + 20, 40, 30);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 5, py + 20, 40, 30);
    
    ctx.fillStyle = '#FFD4B8';
    ctx.fillRect(px + 12, py + 2, 26, 22);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 4);
    ctx.lineTo(px + 25, py - 8);
    ctx.lineTo(px + 40, py + 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.fillRect(px + 18, py + 10, 4, 4);
    ctx.fillRect(px + 28, py + 10, 4, 4);
    
    if (player.speedBoost) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.strokeRect(px - 5, py - 15, player.width + 10, player.height + 30);
    }
    
    ctx.restore();
}

function checkQuizTrigger(currentTime) {
    if (currentTime - lastQuizTime >= quizInterval) {
        showQuiz();
        lastQuizTime = currentTime;
        quizInterval = Math.random() * 5000 + 10000;
    }
}

function showQuiz() {
    isPaused = true;
    gameState = 'quiz';
    
    currentQuestionIndex = Math.floor(Math.random() * questionBank.length);
    currentQuestion = questionBank[currentQuestionIndex];
    
    questionText.textContent = currentQuestion.question;
    
    const optionButtons = document.querySelectorAll('.option-btn');
    currentQuestion.options.forEach((option, index) => {
        optionButtons[index].textContent = option;
        optionButtons[index].classList.remove('correct', 'wrong');
        optionButtons[index].disabled = false;
    });
    
    quizModal.classList.remove('hidden');
    startQuizTimer();
}

function startQuizTimer() {
    quizCountdown = 10;
    timerValue.textContent = quizCountdown;
    timerValue.classList.remove('warning', 'danger');
    
    if (quizTimer) clearInterval(quizTimer);
    
    quizTimer = setInterval(() => {
        quizCountdown--;
        timerValue.textContent = quizCountdown;
        
        if (quizCountdown <= 3) timerValue.classList.add('danger');
        else if (quizCountdown <= 5) timerValue.classList.add('warning');
        
        if (quizCountdown <= 0) handleTimeout();
    }, 1000);
}

function handleAnswer(selectedIndex) {
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    clearInterval(quizTimer);
    
    if (selectedIndex === currentQuestion.correctIndex) {
        optionButtons[selectedIndex].classList.add('correct');
        showFeedback('Correct! +100 Points', true);
        score += 100;
        updateHUD();
        consecutiveCorrect++;
        if (consecutiveCorrect === 3) {
            spawnMosque();
            consecutiveCorrect = 0;
        }
        grantPowerUp();
    } else {
        optionButtons[selectedIndex].classList.add('wrong');
        optionButtons[currentQuestion.correctIndex].classList.add('correct');
        showFeedback('Wrong! -1 Energy', false);
        energy--;
        updateHUD();
        consecutiveCorrect = 0;
    }
    
    setTimeout(() => hideQuiz(), 1500);
}

function handleTimeout() {
    clearInterval(quizTimer);
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.disabled = true);
    optionButtons[currentQuestion.correctIndex].classList.add('correct');
    showFeedback('Time\'s Up! -1 Energy', false);
    energy--;
    updateHUD();
    consecutiveCorrect = 0;
    setTimeout(() => hideQuiz(), 1500);
}

function showFeedback(message, isCorrect) {
    quizFeedback.textContent = message;
    quizFeedback.classList.remove('hidden', 'correct', 'wrong');
    quizFeedback.classList.add(isCorrect ? 'correct' : 'wrong');
}

function hideQuiz() {
    quizModal.classList.add('hidden');
    quizFeedback.classList.add('hidden');
    isPaused = false;
    gameState = 'playing';
}

function grantPowerUp() {
    if (Math.random() > 0.5) {
        player.invincible = true;
        player.invincibleTimer = 5000;
    } else {
        player.speedBoost = true;
        player.speedBoostTimer = 5000;
        gameSpeed += 3;
    }
}

function endGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (quizTimer) clearInterval(quizTimer);
    quizModal.classList.add('hidden');
    
    gameState = 'gameover';
    finalScore.textContent = score;
    
    let rating, message;
    if (score >= 500) { rating = 'Excellent!'; message = 'Outstanding! Champion of knowledge!'; }
    else if (score >= 300) { rating = 'Great Job!'; message = 'Impressive! Becoming a knowledge athlete!'; }
    else if (score >= 150) { rating = 'Good Effort!'; message = 'Keep practicing to improve!'; }
    else if (score >= 50) { rating = 'Keep Practicing!'; message = 'Every attempt makes you better!'; }
    else { rating = 'Try Again!'; message = 'Don\'t give up! Practice makes perfect!'; }
    
    performanceRating.textContent = rating;
    performanceMessage.textContent = message;
    
    gameScreen.classList.remove('active');
    gameoverScreen.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    player.groundY = canvas.height - 80;
});

