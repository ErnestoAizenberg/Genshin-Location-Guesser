const MAP_IMAGE_SIZE = [1000, 1000];
const ROUND_TIME = 30; // seconds per round

let gameState = {
  timer: 0,
  timerInterval: null,
  currentGuess: null,
  isSubmitted: false,
  currentTask: null
};

const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -1,
  maxZoom: 4,
  zoomControl: false
});

// Initialize map with image overlay
const imageBounds = [[0, 0], MAP_IMAGE_SIZE];
L.imageOverlay('/static/images/fontainmap.jpeg', imageBounds).addTo(map);
map.fitBounds(imageBounds);
L.control.zoom({ position: 'topright' }).addTo(map);

const targetImageElement = document.getElementById('target-image');
const submitButton = document.getElementById('submit-btn');
const timerElement = document.getElementById('timer');
const resultElement = document.getElementById('result');

async function fetchTask() {
  try {
    const response = await fetch('/get_task');
    const task = await response.json();
    gameState.currentTask = task;
    targetImageElement.src = task.targetImageUrl;
  } catch (error) {
    console.error('Error fetching task:', error);
  }
}

function startNewRound() {
  resetGameState();
  resetUI();
  startTimer();
}

function resetGameState() {
  gameState.isSubmitted = false;
  gameState.currentGuess = null;
  clearMapLayers();
}

function resetUI() {
  submitButton.disabled = true;
  resultElement.innerHTML = '';
  timerElement.textContent = 'Time: 0s';
}

function clearMapLayers() {
  map.eachLayer(layer => {
    if (!(layer instanceof L.ImageOverlay)) {
      map.removeLayer(layer);
    }
  });
}

function startTimer() {
  gameState.timer = 0;
  clearInterval(gameState.timerInterval);
  
  gameState.timerInterval = setInterval(() => {
    gameState.timer++;
    timerElement.textContent = `Time: ${gameState.timer}s`;

    if (gameState.timer >= ROUND_TIME) {
      clearInterval(gameState.timerInterval);
      submitButton.disabled = true;
      if (!gameState.isSubmitted) {
        submitGuess();
      }
    }
  }, 1000);
}

function calculateScore(distance, time) {
  const maxDistance = Math.sqrt(
    Math.pow(MAP_IMAGE_SIZE[0], 2) + Math.pow(MAP_IMAGE_SIZE[1], 2)
  );

  const distanceScore = Math.max(0, 5000 * (1 - distance / maxDistance));
  const timeBonus = Math.max(0, 1000 * (1 - time / ROUND_TIME));

  return Math.round(distanceScore + timeBonus);
}

async function submitGuess() {
  if (!gameState.currentGuess || gameState.isSubmitted || !gameState.currentTask) {
    return;
  }

  gameState.isSubmitted = true;
  clearInterval(gameState.timerInterval);
  submitButton.disabled = true;

  const guessCoords = gameState.currentGuess.coords;
  const { id: taskId } = gameState.currentTask;

  try {
    const response = await fetch('/submit_result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: taskId,
        guessCoords: guessCoords,
        time: gameState.timer
      })
    });

    const data = await response.json();
    showResult(gameState.currentGuess, data.correctLocation, gameState.timer);
    
    await delay(2000);
    await fetchTask();
    startNewRound();
  } catch (error) {
    console.error('Error submitting result:', error);
  }
}

function showResult(currentGuess, correctLocation, timer) {
  const distance = Math.sqrt(
    Math.pow(currentGuess.coords[0] - correctLocation[0], 2) +
    Math.pow(currentGuess.coords[1] - correctLocation[1], 2)
  );

  // Add correct location marker
  L.circleMarker([correctLocation[0], correctLocation[1]], {
    radius: 6,
    fillColor: "green",
    color: "#fff",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
  }).addTo(map);

  // Draw line between guess and correct location
  L.polyline([
    [currentGuess.coords[0], currentGuess.coords[1]],
    [correctLocation[0], correctLocation[1]]
  ], { color: 'blue' }).addTo(map);

  // Display results
  const score = calculateScore(distance, timer);
  resultElement.innerHTML = `
    Distance: ${Math.round(distance)} pixels<br>
    Time: ${timer}s<br>
    Score: ${score} points
  `;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle map clicks for user guesses
map.on('click', e => {
  if (gameState.isSubmitted) return;

  // Remove previous guess marker if exists
  if (gameState.currentGuess?.marker) {
    map.removeLayer(gameState.currentGuess.marker);
  }

  // Add new guess marker
  const marker = L.circleMarker(e.latlng, {
    radius: 6,
    fillColor: 'red',
    color: '#fff',
    weight: 2,
    fillOpacity: 0.8,
    opacity: 1
  }).addTo(map);

  gameState.currentGuess = {
    coords: [e.latlng.lat, e.latlng.lng],
    marker: marker
  };
  
  submitButton.disabled = false;
});

submitButton.addEventListener('click', submitGuess);

// Initialize game
window.onload = () => {
  fetchTask();
  startNewRound();
};
