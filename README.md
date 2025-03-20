# Flag Quiz Game

A simple web application that tests your knowledge of country flags.

## Features

- Random flag selection from 196 countries
- Dropdown selection for country names to avoid spelling issues
- Three attempts to guess the correct country
- Feedback on guesses and display of correct answer when out of guesses

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open your browser and navigate to `http://127.0.0.1:5000`

## Technologies Used

- Python Flask for backend
- HTML, CSS, and JavaScript for frontend
- Bootstrap for styling
- FlagCDN API for flag images

## How to Play

1. Click the "Start Game" button
2. A random flag will be displayed
3. Type or select a country name from the dropdown
4. Click "Guess" or press Enter to submit your guess
5. You have three attempts to guess correctly
6. After each round, click "Next Flag" to continue 