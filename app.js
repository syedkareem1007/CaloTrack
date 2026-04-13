// Basic state
const state = {
  calorieGoal: 2000,
  waterGoal: 8,
  today: {
    calories: 0,
    water: 0,
    foods: []
  },
  history: []
};

// Elements
const elDate = document.getElementById('currentDate');
const elCalorieFill = document.getElementById('calorieFill');
const elCalorieCurrent = document.getElementById('calorieCurrent');
const elWaterFill = document.getElementById('waterFill');
const elWaterCurrent = document.getElementById('waterCurrent');
const elFoodList = document.getElementById('foodList');
const elScannerStatus = document.getElementById('scannerStatus');
const btnWater = document.getElementById('addWaterBtn');
const btnScan = document.getElementById('scanFoodBtn');
const elTableBody = document.getElementById('summaryTableBody');

const elCameraModal = document.getElementById('cameraModal');
const elCameraFeed = document.getElementById('cameraFeed');
const btnCapture = document.getElementById('captureBtn');
const btnCloseCamera = document.getElementById('closeCameraBtn');

let mediaStream = null;
// Mock Data for AI
const mockFoods = [
  { name: 'Apple', kcal: 95 },
  { name: 'Grilled Sandwich', kcal: 350 },
  { name: 'Bowl of Rice', kcal: 205 },
  { name: 'Cheeseburger', kcal: 500 },
  { name: 'Caesar Salad', kcal: 330 },
  { name: 'Slice of Pizza', kcal: 285 }
];

// Initialize App
function init() {
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  elDate.innerText = dateStr;

  loadData();
  renderApp();
  generateWeeklySummary();
}

function loadData() {
  const saved = localStorage.getItem('trackerState');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.today && parsed.today.date === new Date().toDateString()) {
      state.today = parsed.today;
    } else {
      // New day, push old to history
      if (parsed.today) {
        if(!parsed.history) parsed.history = [];
        parsed.history.push({ ...parsed.today });
      }
      state.history = parsed.history || [];
      state.today = {
        date: new Date().toDateString(),
        calories: 0,
        water: 0,
        foods: []
      };
    }
  } else {
    state.today.date = new Date().toDateString();
  }
}

function saveData() {
  localStorage.setItem('trackerState', JSON.stringify({
    today: state.today,
    history: state.history
  }));
}

function renderApp() {
  // Update Calories
  elCalorieCurrent.innerText = state.today.calories;
  const calPercent = Math.min(100, (state.today.calories / state.calorieGoal) * 100);
  elCalorieFill.style.width = calPercent + '%';

  // Update Water
  elWaterCurrent.innerText = state.today.water;
  const waterPercent = Math.min(100, (state.today.water / state.waterGoal) * 100);
  elWaterFill.style.height = waterPercent + '%';

  // Update Food List
  elFoodList.innerHTML = '';
  state.today.foods.forEach(food => {
    const li = document.createElement('li');
    li.innerText = `${food.name} - ${food.kcal} kcal`;
    elFoodList.appendChild(li);
  });
}

function generateWeeklySummary() {
  // We'll just generate some dummy past days if history is empty
  let displayHistory = state.history.slice(-7);
  
  if (displayHistory.length === 0) {
    // Generate dummy data
    for(let i=3; i>0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      displayHistory.push({
        date: d.toDateString(),
        calories: Math.floor(Math.random() * 800) + 1200,
        water: Math.floor(Math.random() * 5) + 3
      });
    }
  }
  
  elTableBody.innerHTML = '';
  displayHistory.forEach(day => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${day.date.substring(0, 10)}</td>
      <td>${day.calories}</td>
      <td>${day.water}</td>
    `;
    elTableBody.appendChild(tr);
  });
}

// Event Listeners
btnWater.addEventListener('click', () => {
  state.today.water += 1;
  saveData();
  renderApp();
});

btnScan.addEventListener('click', async () => {
  try {
    // Attempt to access the user's camera
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    elCameraFeed.srcObject = mediaStream;
    elCameraModal.classList.remove('hidden');
  } catch (err) {
    console.error("Camera access failed", err);
    alert("Unable to access camera. Please allow camera permissions or check if a camera is connected.");
  }
});

function stopCamera() {
  elCameraModal.classList.add('hidden');
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
}

btnCloseCamera.addEventListener('click', stopCamera);

btnCapture.addEventListener('click', () => {
  // "Snap" the photo and stop camera
  stopCamera();

  // Show processing tape
  elScannerStatus.classList.remove('hidden');
  elScannerStatus.innerText = 'ANALYZING IMAGE DATA... ■■■■□';

  setTimeout(() => {
    const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
    elScannerStatus.innerText = `MATCH FOUND: ${randomFood.name.toUpperCase()} (+${randomFood.kcal} KCAL)`;
    
    // Add to state
    state.today.foods.push(randomFood);
    state.today.calories += randomFood.kcal;
    
    saveData();
    renderApp();

    setTimeout(() => {
      elScannerStatus.classList.add('hidden');
    }, 4000);
  }, 1500);
});

// Run
init();
