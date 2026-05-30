const playerImg = new Image(); playerImg.src = 'assets/images/human.jpg'; 
const zombieImg = new Image(); zombieImg.src = 'assets/images/zombie.jpg';
const swordSwing = new Audio('assets/sounds/sword-swing.mp3');
const zombietakedamage = new Audio('assets/sounds/zombie-taking-damage.wav');
const zombiedie = new Audio('assets/sounds/zombie-die.wav');
const lowhealthwarning = new Audio('assets/sounds/low-health-warning.mp3');

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- UI ELEMENTS ---
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const usernameInput = document.getElementById("usernameInput");
const scoreDisplay = document.getElementById("score");
const waveDisplay = document.getElementById("wave");
const healthDisplay = document.getElementById("health");
const zombieCountDisplay = document.getElementById("zombieCount");
const waveNotification = document.getElementById("waveNotification");
const playerNameDisplay = document.getElementById("playerNameDisplay");
const finalPlayerName = document.getElementById("finalPlayerName");
const finalScore = document.getElementById("finalScore");

// --- GAME VARIABLES ---
let isPlaying = false;
let isWaveBreak = false;
let score = 0;
let wave = 1;
let health = 100;
let zombies = [];
let zombiesToSpawn = 5;
let maxZombieLimit = 5;
let totalZombiesInWave = 5; 
let spawnIntervalId = null;
let gameLoopId = null;
let isSlashing = false;
let lowHealthPlayed = false;
let lowhealthredbackground = false;

const player = { x: 500, y: 300, radius: 16, speed: 4, angle: 0, name: "Survivor" };
const keys = { w: false, a: false, s: false, d: false };
const mouse = { x: 0, y: 0 };

// Gitul-id ang paghimo sa Go Signal Button para sa Wave Break
let nextWaveButton = document.getElementById("nextWaveButton");
if (!nextWaveButton) {
    nextWaveButton = document.createElement("button");
    nextWaveButton.id = "nextWaveButton";
    nextWaveButton.textContent = "Start Next Wave";
    nextWaveButton.style.position = "absolute";
    nextWaveButton.style.top = "60%";
    nextWaveButton.style.left = "50%";
    nextWaveButton.style.transform = "translate(-50%, -50%)";
    nextWaveButton.style.zIndex = "20";
    nextWaveButton.style.display = "none";
    canvas.parentElement.appendChild(nextWaveButton);
}

// --- CONTROLS & LISTENERS ---
window.addEventListener("keydown", (e) => { 
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true; 
});
window.addEventListener("keyup", (e) => { 
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false; 
});
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; 
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener("mousedown", () => { if (isPlaying && !isWaveBreak) slash_sword(); });
startButton.addEventListener("click", start_game);
restartButton.addEventListener("click", start_game);
nextWaveButton.addEventListener("click", next_wave);

function game_whole_interface_design() {
    ctx.fillStyle = lowhealthredbackground ? "darkred" : "#0c101b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Zombies
    zombies.forEach(z => { 
        if (zombieImg.complete && zombieImg.naturalWidth !== 0) { 
            ctx.drawImage(zombieImg, z.x - 20, z.y - 20, 40, 40); 
        } else { 
            ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.arc(z.x, z.y, 14, 0, Math.PI * 2); ctx.fill(); 
        }
    });
    
    // Draw Player
    ctx.save(); 
    ctx.translate(player.x, player.y); 
    ctx.rotate(player.angle);
    if (playerImg.complete && playerImg.naturalWidth !== 0) { 
        ctx.drawImage(playerImg, -25, -25, 50, 50); 
    } else { 
        ctx.fillStyle = "#1565c0"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); 
    }
    if (isSlashing) { 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 40, -0.5, 0.5); ctx.stroke(); 
    }
    ctx.restore();

    // Flashlight Cone Effect
    let mask = document.createElement('canvas'); 
    mask.width = canvas.width; 
    mask.height = canvas.height;
    let mCtx = mask.getContext('2d');
    
    // 1. Fill the screen with the ambient darkness overlay
    mCtx.fillStyle = "rgba(4, 5, 12, 0.92)"; 
    mCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Set blend mode to carve out the light
    mCtx.globalCompositeOperation = 'destination-out';
    
    // 3. Create a circular radial gradient centered directly on the player
    // Adjust 180 (inner full light radius) and 250 (outer fade out limit) to change your torch size!
    let torchGrad = mCtx.createRadialGradient(player.x, player.y, 20, player.x, player.y, 220);
    torchGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');      // Bright center core
    torchGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.8)');  // High visibility area
    torchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');      // Soft falloff into darkness
    
    mCtx.fillStyle = torchGrad;
    mCtx.beginPath(); 
    mCtx.arc(player.x, player.y, 220, 0, Math.PI * 2); 
    mCtx.fill();
    
    ctx.drawImage(mask, 0, 0);
}

function player_health_warning(){ 
    if (health <= 20 && !lowHealthPlayed) {
        lowhealthwarning.currentTime = 0;
        lowhealthwarning.play();
        lowHealthPlayed = true;
        lowhealthredbackground = true;
    }
}

function slash_sword() {
    swordSwing.currentTime = 0; 
    swordSwing.play();
    isSlashing = true;
    setTimeout(() => { isSlashing = false; }, 150);
    zombies.forEach((z, i) => {
        if (Math.hypot(z.x - player.x, z.y - player.y) < 70) {
            z.hp -= 1; 

            zombietakedamage.currentTime = 0;
            zombietakedamage.play();

            if (z.hp <= 0) { 
                zombiedie.currentTime = 0;
                zombiedie.play();
                zombies.splice(i, 1);
                score += 50;
                scoreDisplay.textContent = score;
                totalZombiesInWave--;
                update_zombie_count();
            }
        }   
    });
}

function update_zombie_count() {
    if (zombieCountDisplay) {
        zombieCountDisplay.textContent = Math.max(0, totalZombiesInWave);
    }
}

function spawn_zombie() {
    if (!isPlaying || isWaveBreak || zombies.length >= maxZombieLimit || zombiesToSpawn <= 0) return;
    let x = Math.random() < 0.5 ? 0 : canvas.width;
    let y = Math.random() * canvas.height;
    
    zombies.push({ 
        x: x, 
        y: y, 
        radius: 14, 
        speed: 0.4 + (wave * 0.05), 
        hp: 1 + Math.floor(wave * 0.5) 
    });
    zombiesToSpawn--;
}

// 1. END OF THE WAVE (Mo-pause ug gawas ang Words)
function start_wave_break() {
    isWaveBreak = true; // Set true immediately to prevent loop frame spam
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    
    // Words after wave finished
    if (waveNotification) {
        waveNotification.innerHTML = `WAVE ${wave} COMPLETED!<br><span style="color: #ffd633; font-size: 24px;">GET READY FOR THE NEXT WAVE</span>`;
        waveNotification.classList.remove("hidden");
    }
    
    nextWaveButton.style.display = "block"; 
}

// 2. START OF THE WAVE (Naay countdown ug text, DILI MO SPAWN DIRITSO)
function next_wave() {
    isWaveBreak = true; 
    if (spawnIntervalId) clearInterval(spawnIntervalId);

    lowHealthPlayed = false; 
    lowhealthredbackground = false; 
    nextWaveButton.style.display = "none"; 

    wave++;
    waveDisplay.textContent = wave;
    
    if (waveNotification) {
        waveNotification.innerHTML = `WAVE ${wave} STARTING...<br><span style="color: #ff3333; font-size: 22px;">PREPARE YOUR DEFENSES!</span>`;
        waveNotification.classList.remove("hidden");
    }

    setTimeout(() => {
        if (waveNotification) waveNotification.classList.add("hidden");
        
        maxZombieLimit += 5;
        zombiesToSpawn = maxZombieLimit;
        totalZombiesInWave = maxZombieLimit;
        update_zombie_count(); 
        
        isWaveBreak = false; 
        spawnIntervalId = setInterval(spawn_zombie, 1000); 
    }, 2000); 
}

function update_engine() {
    if (!isPlaying) return;
    
    if (!isWaveBreak) {
        if (keys.w && player.y > player.radius) player.y -= player.speed; 
        if (keys.s && player.y < canvas.height - player.radius) player.y += player.speed;
        if (keys.a && player.x > player.radius) player.x -= player.speed; 
        if (keys.d && player.x < canvas.width - player.radius) player.x += player.speed;
        player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        
        zombies.forEach((z) => {
            let angle = Math.atan2(player.y - z.y, player.x - z.x);
            z.x += Math.cos(angle) * z.speed; 
            z.y += Math.sin(angle) * z.speed;
            
            if (Math.hypot(player.x - z.x, player.y - z.y) < 30) {
                health -= 0.15;
            }
        });
        
        healthDisplay.textContent = Math.max(0, Math.floor(health));
        if (health <= 0) { end_game(); return; } 
        player_health_warning(); 

        if (zombies.length === 0 && zombiesToSpawn === 0 && totalZombiesInWave === 0) {
            start_wave_break();
        }
    }
    
    game_whole_interface_design();
    gameLoopId = requestAnimationFrame(update_engine);
}

function end_game() {
    isPlaying = false; 
    if (spawnIntervalId) clearInterval(spawnIntervalId); 
    cancelAnimationFrame(gameLoopId);
    nextWaveButton.style.display = "none";
    finalPlayerName.textContent = player.name; 
    finalScore.textContent = score;
    gameOverScreen.classList.remove("hidden");
}

function start_game() {
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    if (gameLoopId) cancelAnimationFrame(gameLoopId);

    score = 0; wave = 1; health = 100; zombies = []; 
    zombiesToSpawn = 5; maxZombieLimit = 5; totalZombiesInWave = 5;
    isWaveBreak = false;
    lowHealthPlayed = false;
    lowhealthredbackground = false;
    
    player.x = 500; player.y = 300; player.name = usernameInput.value || "Survivor";
    playerNameDisplay.textContent = player.name; scoreDisplay.textContent = score;
    waveDisplay.textContent = wave; healthDisplay.textContent = health; 
    update_zombie_count(); 
    
    isPlaying = true; 
    startScreen.classList.add("hidden"); 
    gameOverScreen.classList.add("hidden");
    nextWaveButton.style.display = "none";
    if (waveNotification) waveNotification.classList.add("hidden");
    
    spawnIntervalId = setInterval(spawn_zombie, 1000); 
    update_engine(); 
}   