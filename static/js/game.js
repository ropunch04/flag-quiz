document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const startButton = document.getElementById('start-button');
    const flagContainer = document.getElementById('flag-container');
    const countryInput = document.getElementById('country-input');
    const guessButton = document.getElementById('guess-button');
    const nextButton = document.getElementById('next-button');
    const playAgainButton = document.getElementById('play-again-button');
    const feedback = document.getElementById('feedback');
    const currentGuessSpan = document.getElementById('current-guess');
    const resultMessage = document.getElementById('result-message');
    const countryList = document.getElementById('country-list');

    // Game state
    let currentCountry = null;
    let guessCount = 0;
    let maxGuesses = 3;
    let validCountries = Array.from(countryList.options).map(option => option.value.toLowerCase());

    // Event listeners
    startButton.addEventListener('click', startGame);
    guessButton.addEventListener('click', submitGuess);
    nextButton.addEventListener('click', loadNextFlag);
    playAgainButton.addEventListener('click', startGame);
    countryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });

    // Start the game
    function startGame() {
        startScreen.classList.add('d-none');
        resultScreen.classList.add('d-none');
        gameScreen.classList.remove('d-none');
        loadNextFlag();
    }

    // Load a new flag
    function loadNextFlag() {
        // Reset game state
        guessCount = 0;
        currentGuessSpan.textContent = '1';
        countryInput.value = '';
        feedback.innerHTML = '';
        nextButton.classList.add('d-none');
        
        // Enable guess controls
        countryInput.disabled = false;
        guessButton.disabled = false;
        
        // Fetch a random flag
        fetch('/get_random_flag')
            .then(response => response.json())
            .then(country => {
                currentCountry = country;
                displayFlag(country.code);
            })
            .catch(error => console.error('Error:', error));
    }

    // Display the flag image
    function displayFlag(countryCode) {
        flagContainer.innerHTML = `
            <img 
                src="/proxy_flag/${countryCode}"
                width="256"
                height="192"
                alt="Flag"
                class="img-fluid">
        `;
    }

    // Process the user's guess
    function submitGuess() {
        if (!countryInput.value.trim()) return;
        
        const userGuess = countryInput.value.trim();
        const correctAnswer = currentCountry.name;
        
        // Check if the guess is a valid country name
        if (!validCountries.includes(userGuess.toLowerCase())) {
            feedback.innerHTML = `<div class="alert alert-warning">Please enter a valid country name.</div>`;
            countryInput.value = '';
            countryInput.focus();
            return;
        }
        
        if (userGuess.toLowerCase() === correctAnswer.toLowerCase()) {
            // Correct guess - don't increment guess count
            feedback.innerHTML = `<div class="alert alert-success">Correct! The answer is ${correctAnswer}.</div>`;
            countryInput.disabled = true;
            guessButton.disabled = true;
            nextButton.classList.remove('d-none');
        } else {
            // Incorrect guess - increment guess count
            guessCount++;
            currentGuessSpan.textContent = Math.min(guessCount + 1, maxGuesses);
            
            if (guessCount >= maxGuesses) {
                // Out of guesses
                feedback.innerHTML = `<div class="alert alert-danger">Sorry, you're out of guesses. The correct answer is ${correctAnswer}.</div>`;
                countryInput.disabled = true;
                guessButton.disabled = true;
                nextButton.classList.remove('d-none');
            } else {
                // Still have guesses
                feedback.innerHTML = `<div class="alert alert-warning">Incorrect guess. Try again. You have ${maxGuesses - guessCount} guesses left.</div>`;
                countryInput.value = '';
                countryInput.focus();
            }
        }
    }
}); 