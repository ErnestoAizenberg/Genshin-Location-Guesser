const MAP_IMAGE_SIZE = [1000, 1000];
const ROUND_TIME = 30; // seconds per round

let gameState = {
  timer: 0,
  timerInterval: null,
  currentGuess: null,
  isSubmitted: false,
  currentTask: null,
  currentRegion: 'mondstadt'
};

// Define regions with their image URLs and sizes
const regions = {
  mondstadt: {
    imageUrl: '/static/images/maps/mondstadt.png',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  },
  liyue: {
    imageUrl: '/static/images/maps/liyue_map.jpeg',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  },
  inazuma: {
    imageUrl: '/static/images/maps/inazuma_map.jpeg',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  },
  sumeru: {
    imageUrl: '/static/images/maps/sumeru_map.jpeg',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  },
  fontaine: {
	  imageUrl: '/static/images/maps/fontaine.jpeg',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  },
  natlan: {
    imageUrl: '/static/images/maps/natlan_map.jpeg',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  },
  snezhnaya: {
    imageUrl: '/static/images/maps/snezhnaya_map.jpeg',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  },
  khaenriah: {
    imageUrl: '/static/images/maps/khaenriah_map.jpeg',
    bounds: [[0, 0], MAP_IMAGE_SIZE]
  }
};

// Initialize the map
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -1,
  maxZoom: 4,
  zoomControl: false
});

L.control.zoom({ position: 'topright' }).addTo(map);

// Store the current overlay so we can remove it later
let currentOverlay = null;

// Function to load a region map
function loadRegion(regionKey) {
  const region = regions[regionKey];
  if (!region) {
    console.error('Region not found:', regionKey);
    return;


    list_of_tasks = [
        {"id": 1, "targetImageUrl": "/static/images/fontain_task_1.png", "correctLocation": [500, 500]},
        {"id": 2, "targetImageUrl": "/static/images/task_fontaine_2.jpg", "correctLocation": [323, 457]},
        {"id": 3, "targetImageUrl": "/static/images/task_fontaine_3.jpg", "correctLocation": [13, 100]},
        {"id": 4, "targetImageUrl": "/static/images/task_fontaine_4.jpg", "correctLocation": [600, 550]},
        {"id": 5, "targetImageUrl": "/static/images/task_fontaine_5.jpg", "correctLocation": [110, 500]},
        {"id": 6, "targetImageUrl": "/static/images/task_fontaine_6.jpg", "correctLocation": [810, 213]}
    ]
    list_of_tasks = [
        {"id": 1, "targetImageUrl": "/static/images/fontain_task_1.png", "correctLocation": [500, 500]},
        {"id": 2, "targetImageUrl": "/static/images/task_fontaine_2.jpg", "correctLocation": [323, 457]},
        {"id": 3, "targetImageUrl": "/static/images/task_fontaine_3.jpg", "correctLocation": [13, 100]},
        {"id": 4, "targetImageUrl": "/static/images/task_fontaine_4.jpg", "correctLocation": [600, 550]},
        {"id": 5, "targetImageUrl": "/static/images/task_fontaine_5.jpg", "correctLocation": [110, 500]},
        {"id": 6, "targetImageUrl": "/static/images/task_fontaine_6.jpg", "correctLocation": [810, 213]}
    ]
  }

  // Remove existing overlay if any
  if (currentOverlay) {
    map.removeLayer(currentOverlay);
  }

  // Add new overlay
  currentOverlay = L.imageOverlay(region.imageUrl, region.bounds).addTo(map);
  map.fitBounds(region.bounds);
}

// Initialize with default region
loadRegion(gameState.currentRegion);

// Add event listener for region selection changes
const selectElement = document.getElementById('region-selector');
selectElement.addEventListener('change', function() {
  gameState.currentRegion = this.value;
  loadRegion(gameState.currentRegion);
  fetchTask();
  startNewRound();
  document.title = `Genshin GeoGuessr ${selectElement.innerText}`;
});

// Other DOM elements
const targetImageElement = document.getElementById('target-image');
const submitButton = document.getElementById('submit-btn');
const timerElement = document.getElementById('timer');
const resultElement = document.getElementById('result');

async function fetchTask() {
  try {
    console.log(`fetching new task, currentTask is: ${gameState.currentTask}`)
    const params = new URLSearchParams({
	"region": gameState.currentRegion,
    });
    const response = await fetch(`/get_task?${params}`);
    const task = await response.json();
    gameState.currentTask = task;
    targetImageElement.src = task.targetImageUrl;
    console.log(`Task fetched: ${ JSON.stringify(task) }`);
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

    selectElement
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
