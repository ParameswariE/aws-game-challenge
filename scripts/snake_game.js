// Show Introduction Page first
document.getElementById("introPage").style.display = "flex";

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = "assets/images/background.png"; // Replace with the correct path to your background image

const foodImages = {
    apple: new Image(),
    mushroom: new Image(),
    rat: new Image(),
    egg: new Image(),
    rock: new Image(),  // Rock as an obstacle
};

foodImages.apple.src = "assets/images/apple.png";
foodImages.mushroom.src = "assets/images/mushroom.png";
foodImages.rat.src = "assets/images/rat-2.png";
foodImages.egg.src = "assets/images/egg.png";
foodImages.rock.src = "assets/images/rocks.png"; // Add rock image path

let playerName = ""; // Player's name
let speed = 100; // Speed of the game (in milliseconds)
let isReversed = false; // Track reverse controls
let reverseControlInterval = null; // Store the interval for reverse controls
// Get audio elements
const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");
const levelUpSound = document.getElementById("levelUpSound");
const poisonSound = document.getElementById("poisonSound");



// Hide Introduction Page and show Start Game Modal
document.getElementById("startGameButton").addEventListener("click", () => {
    document.getElementById("introPage").style.display = "none"; // Hide intro page
    document.getElementById("gameContent").style.display = "block";
    document.getElementById("startGameModal").style.display = "flex"; // Show start game modal
    console.log("Introduction Page hidden, Start Game Modal displayed.");
});

document.querySelectorAll(".difficulty").forEach(button => {
    button.addEventListener("click", () => {
        console.log("Difficulty button clicked."); // Debug log

        const inputName = document.getElementById("playerName").value.trim();
        if (!inputName) {
            alert("Please enter your name to start the game!");
            return; // Exit if no name is entered
        }

        playerName = inputName; // Store the player's name
        console.log(`Player Name: ${playerName}`);

        speed = parseInt(button.dataset.speed); // Get speed from button's data attribute
        console.log(`Speed set to: ${speed}`);

        // Hide the start game modal
//        const modal = document.getElementById("gameContent");
        const modal = document.getElementById("startGameModal");
        modal.style.display = "none";
        console.log("Start Game Modal hidden."); // Debug log

        // Start the game
        startGame(); // Call the startGame function
    });
});




// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Canvas and Grid Settings
const canvasSize = 600; // Width and height of the canvas
const boxSize = 22; // Size of each grid cell (and snake segment size)
const gridRows = canvasSize / boxSize;
const gridCols = canvasSize / boxSize;

// Set canvas dimensions
canvas.width = canvasSize;
canvas.height = canvasSize;

// Game Variables
let snake = [{ x: 10 * boxSize, y: 10 * boxSize }]; // Initial snake position
let food = generateFood(); // Generate the first food
let obstacles = [];
let direction = "RIGHT";
let score = 0;
let level = 1;
let levelUpScore = 10; // Score required to level up
let isPaused = false;
let gameStarted = false;
let gameInterval = null;
let highscore = localStorage.getItem("highScore") || 0; // High score saved locally
let timeLeft = 60; // Total time in seconds
let gameTimerInterval = null;
let regularFood = { x: randomPosition(canvas.width), y: randomPosition(canvas.height), type: "regular" };
let specialFood = null; // Initially, no special food
let specialFoodTimer = null; // Timer for special food
const specialFoodTypes = ["poison", "special", "reverse"]; // Special food types

// Logs for canvas setup
console.log(`Canvas setup: ${canvasSize}px x ${canvasSize}px with ${gridRows} rows and ${gridCols} columns.`);
console.log(`Grid cell size (boxSize): ${boxSize}px.`);


function startTimer() {
    console.log("Timer started!");
//    const timerText = document.getElementById("timerText");
    const timerVideo = document.getElementById("timerVideo");

    timeLeft = 60; // Reset the timer to 60 seconds
//    timerText.innerText = timeLeft; // Display initial time
    timerVideo.currentTime = 0; // Reset video to the start
    timerVideo.play(); // Play the video

    // Clear any existing timer interval before starting a new one
    if (gameTimerInterval) clearInterval(gameTimerInterval);

    // Update the timer every second
    gameTimerInterval = setInterval(() => {
        timeLeft--;
//        timerText.innerText = timeLeft;

        // End the game or level when the timer reaches 0
        if (timeLeft <= 0) {
            clearInterval(gameTimerInterval);
            timerVideo.pause(); // Pause the video
            endGame(); // Trigger game over logic
        }
    }, 1000); // Update every second
}

function resetTimer() {
    clearInterval(gameTimerInterval); // Clear the existing interval
    timeLeft = 60; // Reset the timer to 60 seconds
    const timerVideo = document.getElementById("timerVideo");
    timerVideo.currentTime = 0; // Reset video to the start
//    document.getElementById("timerText").innerText = timeLeft; // Update the display
}

function randomPosition(max) {
    return Math.floor(Math.random() * (max / boxSize)) * boxSize;
}

// Generate obstacles
function generateObstacles() {
    console.log("Generating obstacles...");
    const obstacleCount = 6 + level; // Increase obstacles with levels
    obstacles = Array.from({ length: obstacleCount }, () => ({
        x: randomPosition(canvas.width),
        y: randomPosition(canvas.height),
        type: "rock",
    }));
    console.log(`Generated ${obstacles.length} obstacles:`, obstacles);
}

function generateFood(type) {
    return {
        x: randomPosition(canvas.width),
        y: randomPosition(canvas.height),
        type: type,
    };
}

// Function to draw food
function drawFood() {
    // Draw regular food (Apple)
    if (regularFood.type === "regular") {
        ctx.drawImage(foodImages.apple, regularFood.x, regularFood.y, boxSize, boxSize);
    }

    // Draw special food
    if (specialFood) {
        if (specialFood.type === "reverse") {
            ctx.drawImage(foodImages.mushroom, specialFood.x, specialFood.y, boxSize, boxSize); // Reverse Food (Mushroom)
        } else if (specialFood.type === "special") {
            ctx.drawImage(foodImages.rat, specialFood.x, specialFood.y, boxSize, boxSize); // Special Food (Rat)
        } else if (specialFood.type === "poison") {
            ctx.drawImage(foodImages.egg, specialFood.x, specialFood.y, boxSize, boxSize); // Poison Food (Egg)
        }
    }
}


function handleFoodEffect(food) {
    if (food.type === "regular") {
        score++; // Increase score
        console.log("Regular food eaten. Score:", score);
        snake.push({}); // Grow snake
        eatSound.play(); // Play eat sound
        regularFood = generateFood("regular"); // Generate new regular food
    } else if (food.type === "poison") {
        score -= 2; // Decrease score
        console.log("Poison food eaten. Score:", score);
        eatSound.play();
//        poisonSound.play();
        // Shrink snake, but ensure it doesn't disappear
        if (snake.length > 2) {
            snake = snake.slice(0, -2); // Shrink snake by 2 segments
        } else {
            snake = [snake[0]]; // Keep at least one segment
        }
        specialFood = null; // Remove special food
    } else if (food.type === "special") {
        score += 2; // Increase score
        console.log("Special food eaten. Score:", score);
        eatSound.play(); // Play eat sound
        // Increase snake size by 2 segments
        snake.push({});
        snake.push({});
        console.log("Snake grew by 2 segments.");
        specialFood = null; // Remove special food
    } else if (food.type === "reverse") {
        score += 2; // Increase score
        console.log("Reverse food eaten. Score:", score);
        eatSound.play(); // Play eat sound
        activateReverseControls(); // Activate reverse controls
        specialFood = null; // Remove special food
    }

    // Check for level-up
    if (score >= levelUpScore) {
        levelUp(); // Trigger the level-up logic
    }
}


function drawScore() {
    ctx.fillStyle = "white"; // Text color
    ctx.font = "20px Arial"; // Font style
    ctx.fillText(`Score: ${score}`, 10, 30); // Position on the top-right
}


function activateReverseControls() {
    const originalDirection = direction;
    if (isReversed) return; // Prevent multiple activations

    isReversed = true;
    console.log("Reverse controls activated!");

    // Reverse Timer Setup
    const reverseTimerElement = document.getElementById("reverseTimer");
    let reverseTimeLeft = 5; // Reverse controls last for 5 seconds
    reverseTimerElement.innerText = `Reverse: ${reverseTimeLeft}s`;
    reverseTimerElement.style.display = "block"; // Show the reverse timer

    // Reverse controls listener
    const reverseListener = (event) => {
        if (event.key === "ArrowUp" && originalDirection !== "UP") direction = "DOWN";
        if (event.key === "ArrowDown" && originalDirection !== "DOWN") direction = "UP";
        if (event.key === "ArrowLeft" && originalDirection !== "LEFT") direction = "RIGHT";
        if (event.key === "ArrowRight" && originalDirection !== "RIGHT") direction = "LEFT";
    };

    document.addEventListener("keydown", reverseListener);

    // Countdown Interval
    reverseControlInterval = setInterval(() => {
        reverseTimeLeft--;
        if (reverseTimeLeft > 0) {
            reverseTimerElement.innerText = `Reverse: ${reverseTimeLeft}s`;
        } else {
            clearInterval(reverseControlInterval); // Stop the interval
            reverseTimerElement.style.display = "none"; // Hide the timer
            isReversed = false; // Reset reverse state
            document.removeEventListener("keydown", reverseListener); // Remove the reverse listener
            console.log("Reverse controls deactivated!");
        }
    }, 1000);
}


function generateSpecialFood() {
    if (!specialFood) {
        // Check score and snake length before generating food type
        let foodTypes = ["reverse", "special"];

        if (score >= 2 && snake.length >= 2) {
            foodTypes.push("poison"); // Include poison food only if conditions are met
        }

        const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        specialFood = generateFood(randomType);
        console.log(`Special food (${randomType}) generated at:`, specialFood);

        // Remove special food after 10 seconds if not eaten
        clearTimeout(specialFoodTimer);
        specialFoodTimer = setTimeout(() => {
            specialFood = null;
            console.log("Special food removed after timeout.");
        }, 10000);
    }
}


function checkFoodCollision(head) {
    console.log(`Checking collision for head at (${head.x}, ${head.y})`);

    // Check for regular food collision
    if (head.x === regularFood.x && head.y === regularFood.y) {
        console.log("Regular food collision detected!");
        handleFoodEffect(regularFood);
    }
    // Check for special food collision
    else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        console.log(`Special food (${specialFood.type}) collision detected!`);
        handleFoodEffect(specialFood);
    }
    else {
        console.log("No food collision detected.");
    }
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === "rock") {
            ctx.drawImage(foodImages.rock, obstacle.x, obstacle.y, boxSize, boxSize);
        }
    });
    console.log("Rocks drawn as obstacles.");
}


function moveSnake() {
    let head = { ...snake[0] }; // Get the current head position

    // Update the snake's head position based on direction
    if (direction === "UP") head.y -= boxSize;
    if (direction === "DOWN") head.y += boxSize;
    if (direction === "LEFT") head.x -= boxSize;
    if (direction === "RIGHT") head.x += boxSize;

    console.log(`Snake head moved to (${head.x}, ${head.y})`);

    // Check boundaries to prevent out-of-bounds movement
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        endGame();
        return; // Stop further processing
    }

    // Add the new head to the snake
    snake.unshift(head);

    // Check for food collision
    checkFoodCollision(head);

    // If no food is eaten, remove the tail
    if (!(head.x === regularFood.x && head.y === regularFood.y)) {
        snake.pop();
    }

    // Check collisions with self or obstacles (rock)
    if (
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ||
        obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y && obstacle.type === "rock")
    ) {
        console.log("Collision with rock detected!");
        endGame();
    }
}



// Draw the snake
function drawSnake() {
    ctx.fillStyle = "lime"; // Snake color
    snake.forEach(segment => {
        ctx.beginPath();
        ctx.arc(
            segment.x + boxSize / 2, // Center x
            segment.y + boxSize / 2, // Center y
            boxSize / 2, // Radius
            0, // Start angle
            Math.PI * 2 // End angle
        );
        ctx.fill();
        ctx.closePath();
    });
//    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, boxSize, boxSize));
    console.log("Snake drawn:", snake);
}

// Draw the game
function drawGame() {
//    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
// Draw the background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    drawSnake(); // Draw the snake
    drawFood(); // Draw the food
    drawObstacles(); // Draw the obstacles
//    drawCanvasOutline(); // Draw the canvas outline
    drawScore(); // Draw the score on the screen
}


// End the game
function endGame() {
    clearInterval(gameInterval);
    clearInterval(gameTimerInterval); // Stop the timer

    // Pause the timer video
    const timerVideo = document.getElementById("timerVideo");
    if (timerVideo) {
        timerVideo.pause(); // Pause the video
        timerVideo.currentTime = 0; // Optionally reset the video to the start
    }
    console.log("Game Over! Final score:", score);
    gameOverSound.play(); // Play game-over sound

    // Save the score to the database
    saveScoreToDatabase(playerName, score);

    // Refresh the leaderboard
    fetchLeaderboardFromDatabase();
    // Display the Game Over Modal
    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOverModal").style.display = "flex";

    // Save high score to local storage
    if (score > highscore) {
        highscore = score;
        localStorage.setItem("highScore", highscore);
        console.log("New high score saved:", highscore);
    }
}

function resetGameState() {
    console.log("Resetting game state..."); // Debug log
    snake = [{ x: 10 * boxSize, y: 10 * boxSize }]; // Reset snake position
    regularFood = generateFood("regular"); // Generate new regular food
    specialFood = null; // Clear special food
    obstacles = []; // Clear obstacles
    generateObstacles(); // Generate new obstacles
    direction = "RIGHT"; // Reset direction
    score = 0;
    level = 1;
    gameStarted = false;
    isPaused = false;

    // Clear intervals
    if (gameInterval) clearInterval(gameInterval);
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    // Reset reverse controls
    if (reverseControlInterval) {
        clearInterval(reverseControlInterval);
        reverseControlInterval = null;
    }
    isReversed = false;
    document.getElementById("reverseTimer").style.display = "none";
    updateLevelDisplay();
    console.log("Game state reset."); // Debug log
}



// Handle player input for snake movement
document.addEventListener("keydown", event => {
    if (!gameStarted) return;

    if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
    if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
    if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
    if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";

    console.log("Direction changed to:", direction);
});

// Pause/Resume functionality with button
document.getElementById("pauseResumeButton").addEventListener("click", togglePauseResume);

// Pause/Resume functionality with Spacebar
document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        togglePauseResume();
    }
});

// Retry button functionality
document.getElementById("retryButton").addEventListener("click", () => {
    resetGameState(); // Reset the game state
    document.getElementById("gameOverModal").style.display = "none"; // Hide Game Over Modal
    startGame(); // Start a new game
});

// Quit button functionality
document.getElementById("quitButton").addEventListener("click", () => {
    resetGameState(); // Reset the game state
    document.getElementById("gameOverModal").style.display = "none"; // Hide Game Over Modal
    document.getElementById("gameContent").style.display = "none"; // Hide the game content
    document.getElementById("introPage").style.display = "flex"; // Show the introduction page
});


// Function to toggle Pause/Resume
function togglePauseResume() {
    const button = document.getElementById("pauseResumeButton");
    const timerVideo = document.getElementById("timerVideo"); // Get the timer video element


    if (isPaused) {
        gameInterval = setInterval(() => {
            moveSnake();
            drawGame();
        }, speed);

        // Resume the timer interval
        gameTimerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
//                document.getElementById("timerText").innerText = timeLeft;
                console.log(`Time Left: ${timeLeft}s`);
            } else {
                clearInterval(gameTimerInterval);
                endGame();
            }
        }, 1000);

        // Resume the video
        if (timerVideo) {
            timerVideo.play();
        }

        button.innerText = "Pause";
        isPaused = false;
        console.log("Game Resumed. Interval restarted.");
    } else {
        clearInterval(gameInterval);
        // Pause the timer interval
        clearInterval(gameTimerInterval);

        // Pause the video
        if (timerVideo) {
            timerVideo.pause();
        }
        button.innerText = "Resume";
        isPaused = true;
        console.log("Game Paused. Interval cleared.");
    }
}

function levelUp() {
    level++; // Increment the level
    speed = Math.max(speed - 10, 50); // Increase speed (lower speed value means faster movement)
    levelUpScore += 10; // Increase the score required for the next level
    generateObstacles(); // Add more obstacles

    clearInterval(gameInterval); // Stop the current interval
    gameInterval = setInterval(() => {
        moveSnake();
        drawGame();
    }, speed); // Start a new interval with the updated speed

    updateLevelDisplay();
    // Reset and restart the timer
    resetTimer();
    startTimer();
    levelUpSound.play(); // Play level-up sound
    console.log(`Level Up! Current Level: ${level}, Speed: ${speed}, Obstacles: ${obstacles.length}`);
}

function updateLevelDisplay() {
    const levelDisplay = document.getElementById("levelDisplay");
    levelDisplay.innerText = `Level: ${level}`;
    levelDisplay.classList.add("level-flash");
    setTimeout(() => levelDisplay.classList.remove("level-flash"), 500); // Remove after animation
    console.log(`Updated Level Display: Level ${level}`);
}

async function saveScoreToDatabase(playerName, score) {
    const date = new Date().toISOString(); // Current date in ISO format
    const apiUrl = 'http://localhost:3000/leaderboard'; // Backend URL

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: playerName,
                score: score,
                date: date,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Leaderboard updated successfully:', data.leaderboard);
            // Refresh the leaderboard after updating
            fetchLeaderboardFromDatabase();
        } else {
            console.error('Error updating leaderboard:', data.error);
        }
    } catch (error) {
        console.error('Error saving score to the database:', error);
    }
}

async function fetchLeaderboardFromDatabase() {
    const apiUrl = 'http://localhost:3000/leaderboard'; // Backend URL

    try {
        const response = await fetch(apiUrl);
        const leaderboardData = await response.json();

        // Sort leaderboard data by score in descending order
        leaderboardData.sort((a, b) => b.score - a.score);

        // Limit to the top 10 entries
        const top10 = leaderboardData.slice(0, 10);

        // Get the leaderboard list container
        const leaderboardList = document.getElementById("leaderboardList");
        leaderboardList.innerHTML = ""; // Clear existing leaderboard entries

        // Populate the leaderboard with rank numbers
        top10.forEach((entry, index) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<span>${index + 1}</span> <span>${entry.name}</span> <span>${entry.score}</span>`;
            leaderboardList.appendChild(listItem);
        });

        console.log("Top 10 leaderboard updated successfully.");
    } catch (error) {
        console.error('Error fetching leaderboard from the database:', error);
    }
}

//function startTimerWithVideo() {
////    const timerText = document.getElementById("timerText");
//    const timerVideo = document.getElementById("timerVideo");
//
//    let timeLeft = 60; // Total time in seconds
////    timerText.innerText = timeLeft; // Display initial time
//
//
//    // Play the video from the start
//    timerVideo.currentTime = 0;
//    timerVideo.play();
//
//    // Update the timer every second
//    const timerInterval = setInterval(() => {
//        timeLeft--;
////        timerText.innerText = timeLeft;
//
//        // End the game when the timer reaches 0
//        if (timeLeft <= 0) {
//            clearInterval(timerInterval);
//            timerVideo.pause(); // Pause the video when the timer ends
//            endGame(); // Call the existing endGame function
//        }
//    }, 1000); // Update every second
//}



// Start the game
function startGame() {
    console.log("Game starting...");
    clearInterval(gameInterval); // Prevent multiple intervals
    resetGameState();
    resetTimer(); // Reset the timer to 60 seconds
    startTimer(); // Start the timer
//    // Call this function when the game starts
//    startTimerWithVideo();
    playerName = document.getElementById("playerName").value || "Player";
    console.log(`Player Name: ${playerName}`);
    generateObstacles();
    gameStarted = true;

    // Start generating special food randomly
    setInterval(generateSpecialFood, 15000); // Generate special food every 15 seconds

    gameInterval = setInterval(() => {
        moveSnake();
        drawGame();
    }, speed);

    console.log("Game started successfully.");
}
