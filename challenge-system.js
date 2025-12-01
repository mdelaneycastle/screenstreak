const challenges = [
    { 
        id: 1,
        movie: "Die Hard with a Vengeance (1995)", 
        name: "Water Jug Problem",
        gameType: "waterJug",
        description: "Use 3-gallon and 5-gallon jugs to measure exactly 4 gallons"
    },
    { 
        id: 2,
        movie: "The Matrix (1999)", 
        name: "Code Rain Decoder",
        gameType: "codeRain",
        description: "Decode falling green characters to find hidden words"
    },
    { 
        id: 3,
        movie: "Indiana Jones and the Last Crusade (1989)", 
        name: "Temple Pattern Memory",
        gameType: "patternMemory",
        description: "Memorize and recreate the temple tile sequence"
    },
    { 
        id: 4,
        movie: "National Treasure (2004)", 
        name: "Caesar Cipher",
        gameType: "caesarCipher",
        description: "Decode historical messages using cipher techniques"
    },
    { 
        id: 5,
        movie: "Saw (2004)", 
        name: "Escape Room Timer",
        gameType: "escapeRoom",
        description: "Solve logic puzzles before time runs out"
    },
    { 
        id: 6,
        movie: "The Imitation Game (2014)", 
        name: "Enigma Decoder",
        gameType: "enigma",
        description: "Break coded messages using pattern recognition"
    },
    { 
        id: 7,
        movie: "Sherlock (BBC)", 
        name: "Deduction Grid",
        gameType: "deductionGrid",
        description: "Use clues to solve a logic grid puzzle"
    },
    { 
        id: 8,
        movie: "Contact (1997)", 
        name: "Prime Number Sequence",
        gameType: "primeSequence",
        description: "Find patterns in number sequences"
    },
    { 
        id: 9,
        movie: "The Da Vinci Code (2006)", 
        name: "Anagram Solver",
        gameType: "anagram",
        description: "Unscramble letters to reveal hidden messages"
    },
    { 
        id: 10,
        movie: "Inception (2010)", 
        name: "Maze Navigator",
        gameType: "maze",
        description: "Navigate through a shifting maze"
    },
    { 
        id: 11,
        movie: "Harry Potter", 
        name: "Potion Mixing",
        gameType: "potionMixing",
        description: "Mix ingredients in the correct order"
    },
    { 
        id: 12,
        movie: "Mission Impossible", 
        name: "Wire Defusal",
        gameType: "wireDefusal",
        description: "Cut wires in the correct sequence"
    },
    { 
        id: 13,
        movie: "Arrival (2016)", 
        name: "Alien Language Pattern",
        gameType: "alienLanguage",
        description: "Decode circular alien symbols"
    },
    { 
        id: 14,
        movie: "Ready Player One (2018)", 
        name: "80s Trivia Speed Round",
        gameType: "trivia80s",
        description: "Quick-fire 80s pop culture trivia"
    },
    { 
        id: 15,
        movie: "Squid Game (2021)", 
        name: "Red Light Green Light",
        gameType: "redLightGreenLight",
        description: "Stop at the right moments in this reaction game"
    },
    { 
        id: 16,
        movie: "The Prestige (2006)", 
        name: "Three Card Monte",
        gameType: "threeCardMonte",
        description: "Track the correct card through shuffles"
    },
    { 
        id: 17,
        movie: "Zodiac (2007)", 
        name: "Cryptogram Solver",
        gameType: "cryptogram",
        description: "Decode the Zodiac cipher puzzles"
    },
    { 
        id: 18,
        movie: "Alice in Wonderland (2010)", 
        name: "Logic Riddles",
        gameType: "logicRiddles",
        description: "Solve paradoxical riddles and logic problems"
    },
    { 
        id: 19,
        movie: "The Accountant (2016)", 
        name: "Number Pattern Recognition",
        gameType: "numberPattern",
        description: "Find patterns in number grids"
    },
    { 
        id: 20,
        movie: "Westworld", 
        name: "Maze Path Finding",
        gameType: "mazePath",
        description: "Find the path through a complex maze"
    }
];

function getChallengeForDate(date) {
    const startDate = new Date('2024-11-30');
    const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
        return challenges[0];
    } else if (daysDiff === 1) {
        return challenges[15];
    } else {
        const adjustedIndex = ((daysDiff - 2) % 18) + 1;
        const skipIndices = [0, 15];
        let finalIndex = adjustedIndex;
        if (finalIndex >= 15) finalIndex += 2;
        else if (finalIndex >= 1) finalIndex += 1;
        return challenges[finalIndex];
    }
}

function getTodaysChallenge() {
    return getChallengeForDate(new Date());
}

function getYesterdaysChallenge() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getChallengeForDate(yesterday);
}

function formatDateForDisplay(date) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function loadChallengeByDate(dateString) {
    const date = dateString ? new Date(dateString) : new Date();
    const challenge = getChallengeForDate(date);
    
    document.querySelector('.movie-title').textContent = challenge.movie;
    document.querySelector('.challenge-number').textContent = `Challenge #${challenge.id}`;
    document.querySelector('.challenge-name').textContent = challenge.name;
    document.querySelector('.challenge-description').textContent = challenge.description;
    
    return challenge;
}

function initializeChallenge(challenge) {
    const gameContainers = document.querySelectorAll('.game-specific');
    gameContainers.forEach(container => {
        container.classList.add('hidden');
    });
    
    switch(challenge.gameType) {
        case 'waterJug':
            document.getElementById('waterJugGame').classList.remove('hidden');
            break;
        case 'threeCardMonte':
            document.getElementById('threeCardMonteGame').classList.remove('hidden');
            initializeMonteGame();
            break;
        default:
            document.getElementById('comingSoonGame').classList.remove('hidden');
            document.getElementById('comingSoonMessage').textContent = 
                `${challenge.name} is coming soon! For now, enjoy the Water Jug puzzle.`;
            document.getElementById('waterJugGame').classList.remove('hidden');
    }
}