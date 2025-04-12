// Game state
let currentCountry = null;
let currentItem = null;
let currentGuess = 1;
let correctCount = 0;
let startTime = null;
let timerInterval = null;
let selectedContinent = null;
let usedCountries = new Set();
let usedItems = new Set();
let gameMode = 'flag'; // 'flag' or 'category'
let currentCategory = null;
let categoryData = null;

// Categories from scraper.py
const categories = [
    "architecture", "bollards", "followCars", "googleVehicles", "licensePlates",
    "nature", "postBoxes", "rifts", "sceneries", "sidewalks", "signs",
    "trafficLights", "utilityPoles"
];

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const quizContainer = document.getElementById('quiz-container');
const countryInput = document.getElementById('country-input');
const suggestionText = document.getElementById('suggestion-text');
const feedback = document.getElementById('feedback');
const timer = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const progressCount = document.getElementById('progress-count');
const currentGuessDisplay = document.getElementById('current-guess');
const nextButton = document.getElementById('next-button');
const guessButton = document.getElementById('guess-button');
const resetButton = document.getElementById('reset-button');
const giveUpButton = document.getElementById('give-up-button');
const playAgainButton = document.getElementById('play-again-button');
const startAllButton = document.getElementById('start-all-button');
const startContinentButton = document.getElementById('start-continent-button');
const continentCards = document.getElementById('continent-cards');
const categoryCards = document.getElementById('category-cards');
const hintContainer = document.getElementById('hint-container');
const hintText = document.getElementById('hint-text');

// Setup event listeners
function setupEventListeners() {
    // Game control buttons
    startAllButton.addEventListener('click', () => startGame('flag'));
    startContinentButton.addEventListener('click', () => startGame('flag', selectedContinent));
    nextButton.addEventListener('click', nextItem);
    resetButton.addEventListener('click', resetGame);
    giveUpButton.addEventListener('click', giveUp);
    playAgainButton.addEventListener('click', resetGame);

    // Input handling
    countryInput.addEventListener('input', handleInput);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (!countryInput.disabled && countryInput.dataset.currentSuggestion && countryInput.value !== countryInput.dataset.currentSuggestion) {
                // If there's a suggestion and it's not fully typed, complete it
                countryInput.value = countryInput.dataset.currentSuggestion;
                suggestionText.textContent = '';
            } else if (!nextButton.classList.contains('d-none')) {
                // If next button is visible, trigger it
                nextItem();
            } else if (!countryInput.disabled) {
                // Otherwise do the normal guess if input is enabled
                checkGuess();
            }
        } else if (e.key === 'Tab' && countryInput.dataset.currentSuggestion) {
            e.preventDefault();
            countryInput.value = countryInput.dataset.currentSuggestion;
            suggestionText.textContent = '';
        }
    });
    guessButton.addEventListener('click', checkGuess);

    // Continent card selection
    document.querySelectorAll('.continent-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.continent-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedContinent = card.dataset.continent;
            startContinentButton.disabled = false;
        });
    });
}

// Initialize the game
function init() {
    // Initialize category data from the global geohints_data variable
    categoryData = {};
    categories.forEach(category => {
        categoryData[category] = geohints_data.filter(item => item.category === category);
    });
    
    // Setup the rest of the game
    setupEventListeners();
    initializeTabs();
    populateContinentCards();
    populateCategoryCards();
    updateProgressBar();
}

// Format category name for display
function formatCategoryName(category) {
    return category
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
}

// Populate category cards
function populateCategoryCards() {
    if (!categoryCards) {
        console.error('Category cards container not found');
        return;
    }

    categoryCards.innerHTML = categories.map(category => {
        const count = categoryData[category]?.length || 0;
        return `
            <div class="col">
                <div class="card category-card" data-category="${category}">
                    <div class="card-body">
                        <h5 class="card-title">${formatCategoryName(category)}</h5>
                        <p class="card-text category-count">${count} items</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click event listeners to category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            currentCategory = category;
            startGame('category');
        });
    });
}

// Initialize Bootstrap tabs
function initializeTabs() {
    const tabElements = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', event => {
            if (event.target.id === 'categories-tab') {
                populateCategoryCards();
            }
        });
    });
}

// Populate continent cards
function populateContinentCards() {
    const continents = getUniqueContinents();
    continentCards.innerHTML = continents.map(continent => {
        const count = getCountriesByContinent(continent).length;
        return `
            <div class="col">
                <div class="card continent-card" data-continent="${continent}">
                    <div class="card-body">
                        <h5 class="card-title">${continent}</h5>
                        <p class="card-text continent-count">${count} countries</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Start the game
function startGame(mode, continent = null) {
    gameMode = mode;
    startScreen.classList.add('d-none');
    gameScreen.classList.remove('d-none');
    resultScreen.classList.add('d-none');
    
    currentGuess = 1;
    correctCount = 0;
    usedCountries.clear();
    usedItems.clear();
    startTime = new Date();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
    
    if (mode === 'flag') {
        if (continent) {
            selectedContinent = continent;
        }
        showNextFlag();
    } else if (mode === 'category') {
        showNextCategoryItem();
    }
}

// Show next flag
function showNextFlag() {
    currentCountry = getRandomCountry(selectedContinent ? getCountriesByContinent(selectedContinent) : countries);
    while (usedCountries.has(currentCountry.name)) {
        currentCountry = getRandomCountry(selectedContinent ? getCountriesByContinent(selectedContinent) : countries);
    }
    usedCountries.add(currentCountry.name);
    
    quizContainer.innerHTML = `<span style="font-size: 120px;">${currentCountry.flag}</span>`;
    countryInput.value = '';
    countryInput.disabled = false;
    guessButton.disabled = false;
    suggestionText.innerHTML = '';
    feedback.textContent = '';
    currentGuess = 1;
    currentGuessDisplay.textContent = currentGuess;
    nextButton.classList.add('d-none');
    hintContainer.classList.add('d-none');
    hintText.textContent = '';
    countryInput.focus();
}

// Show next category item
function showNextCategoryItem() {
    const items = categoryData[currentCategory];
    if (!items || items.length === 0) {
        console.error('No items available for category:', currentCategory);
        return;
    }

    currentItem = getRandomItem(items);
    while (usedItems.has(currentItem.id)) {
        currentItem = getRandomItem(items);
    }
    usedItems.add(currentItem.id);
    
    quizContainer.innerHTML = `
        <img src="${currentItem.img_url}" alt="${currentCategory} image" class="quiz-image">
    `;
    
    countryInput.value = '';
    countryInput.disabled = false;
    guessButton.disabled = false;
    suggestionText.innerHTML = '';
    feedback.textContent = '';
    currentGuess = 1;
    currentGuessDisplay.textContent = currentGuess;
    nextButton.classList.add('d-none');
    hintContainer.classList.add('d-none');
    hintText.textContent = '';
    countryInput.focus();
}

// Get random item from array
function getRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

// Handle input
function handleInput() {
    const input = countryInput.value;
    const suggestions = getCountrySuggestions(input);
    
    if (suggestions.length > 0) {
        const firstSuggestion = suggestions[0];
        countryInput.dataset.currentSuggestion = firstSuggestion;
        
        // Match the capitalization of the input
        const matchedSuggestion = input + firstSuggestion.slice(input.length);
        suggestionText.textContent = matchedSuggestion;
    } else {
        suggestionText.textContent = '';
        delete countryInput.dataset.currentSuggestion;
    }
}

// Check guess
function checkGuess() {
    const guess = countryInput.value.trim();
    if (!guess) return;
    
    // Check if the guess is a valid country name
    const isValidCountry = countries.some(country => country.name.toLowerCase() === guess.toLowerCase());
    if (!isValidCountry) {
        feedback.textContent = 'Please enter a valid country name';
        feedback.className = 'incorrect';
        return;
    }
    
    let isCorrect = false;
    let correctAnswer = '';
    
    if (gameMode === 'flag') {
        isCorrect = guess.toLowerCase() === currentCountry.name.toLowerCase();
        correctAnswer = currentCountry.name;
    } else if (gameMode === 'category') {
        isCorrect = guess.toLowerCase() === currentItem.country.toLowerCase();
        correctAnswer = currentItem.country;
    }
    
    if (isCorrect) {
        feedback.textContent = 'Correct!';
        feedback.className = 'correct';
        correctCount++;
        updateProgressBar();
        nextButton.classList.remove('d-none');
        currentGuess = 1;
        // Disable input after correct guess
        countryInput.disabled = true;
        guessButton.disabled = true;
    } else {
        feedback.textContent = 'Incorrect!';
        feedback.className = 'incorrect';
        currentGuess++;
        countryInput.value = '';
        suggestionText.textContent = '';
        
        if (currentGuess > 3) {
            feedback.textContent = `The correct answer was ${correctAnswer}`;
            nextButton.classList.remove('d-none');
            currentGuess = 1;
            // Disable input after all guesses used
            countryInput.disabled = true;
            guessButton.disabled = true;
        } else if (gameMode === 'flag') {
            showHint();
        }
    }
}

// Show hint
function showHint() {
    hintContainer.classList.remove('d-none');
    const hint = currentCountry.name.substring(0, currentGuess);
    hintText.textContent = `Hint: ${hint}${'_'.repeat(currentCountry.name.length - currentGuess)}`;
}

// Next item
function nextItem() {
    if (gameMode === 'flag') {
        if (usedCountries.size >= (selectedContinent ? getCountriesByContinent(selectedContinent).length : countries.length)) {
            endGame();
        } else {
            showNextFlag();
        }
    } else if (gameMode === 'category') {
        if (usedItems.size >= categoryData[currentCategory].length) {
            endGame();
        } else {
            showNextCategoryItem();
        }
    }
}

// Update timer
function updateTimer() {
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    timer.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update progress bar
function updateProgressBar() {
    let total = 0;
    if (gameMode === 'flag') {
        total = selectedContinent ? getCountriesByContinent(selectedContinent).length : countries.length;
    } else if (gameMode === 'category') {
        total = categoryData[currentCategory]?.length || 0;
    }
    
    const progress = (correctCount / total) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${Math.round(progress)}%`;
    progressCount.textContent = `${correctCount}/${total} items`;
}

// End game
function endGame() {
    clearInterval(timerInterval);
    gameScreen.classList.add('d-none');
    resultScreen.classList.remove('d-none');
    
    let total = 0;
    if (gameMode === 'flag') {
        total = selectedContinent ? getCountriesByContinent(selectedContinent).length : countries.length;
    } else if (gameMode === 'category') {
        total = categoryData[currentCategory]?.length || 0;
    }
    
    const finalTime = timer.textContent.replace('Time: ', '');
    
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('final-time').textContent = finalTime;
    
    const resultMessage = document.getElementById('result-message');
    if (correctCount === total) {
        resultMessage.textContent = `Congratulations! You got all the ${gameMode === 'flag' ? 'flags' : 'items'} correct!`;
        resultMessage.className = 'result';
    } else {
        resultMessage.textContent = `You got ${correctCount} out of ${total} ${gameMode === 'flag' ? 'flags' : 'items'} correct.`;
    }
}

// Reset game
function resetGame() {
    clearInterval(timerInterval);
    if (gameMode === 'flag') {
        startGame('flag', selectedContinent);
    } else {
        startGame('category');
    }
}

// Give up
function giveUp() {
    let correctAnswer = '';
    if (gameMode === 'flag') {
        correctAnswer = currentCountry.name;
    } else if (gameMode === 'category') {
        correctAnswer = currentItem.country;
    }
    
    feedback.textContent = `The correct answer was ${correctAnswer}`;
    feedback.className = 'incorrect';
    nextButton.classList.remove('d-none');
    currentGuess = 1;
}

// Go home
function goHome() {
    clearInterval(timerInterval);
    gameScreen.classList.add('d-none');
    resultScreen.classList.add('d-none');
    startScreen.classList.remove('d-none');
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', init); 