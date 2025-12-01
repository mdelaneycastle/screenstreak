let monteGameState = {
    cards: [],
    targetCard: null,
    selectedCard: null,
    isShuffling: false,
    shuffleCount: 0,
    maxShuffles: 5,
    moves: 0,
    timerInterval: null,
    startTime: null,
    timeRemaining: 180,
    isPlaying: false,
    alreadyPlayed: false,
    todayResult: null,
    difficulty: 1
};

function initializeMonteGame() {
    monteGameState.cards = [
        { id: 1, type: 'heart', revealed: false },
        { id: 2, type: 'club', revealed: false },
        { id: 3, type: 'spade', revealed: false }
    ];
    monteGameState.targetCard = 1;
    monteGameState.selectedCard = null;
    monteGameState.shuffleCount = 0;
    monteGameState.moves = 0;
    monteGameState.difficulty = 1;
}

function startMonteGame() {
    if (monteGameState.alreadyPlayed && monteGameState.todayResult) {
        showPreviousResult();
        return;
    }
    
    document.getElementById('gameIntro').classList.add('hidden');
    document.getElementById('monteGameArea').classList.remove('hidden');
    
    monteGameState.isPlaying = true;
    monteGameState.startTime = Date.now();
    monteGameState.moves = 0;
    monteGameState.timeRemaining = 180;
    
    initializeMonteGame();
    renderCards();
    showTargetCard();
    startMonteTimer();
}

function startMonteTimer() {
    monteGameState.timerInterval = setInterval(() => {
        monteGameState.timeRemaining--;
        
        const minutes = Math.floor(monteGameState.timeRemaining / 60);
        const seconds = monteGameState.timeRemaining % 60;
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (monteGameState.timeRemaining <= 0) {
            endMonteGame(false);
        }
    }, 1000);
}

function renderCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    monteGameState.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.revealed ? 'revealed' : ''}`;
        cardElement.dataset.index = index;
        
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.innerHTML = '?';
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        if (card.id === monteGameState.targetCard) {
            cardBack.innerHTML = '♥';
            cardBack.style.color = 'red';
        } else if (card.type === 'club') {
            cardBack.innerHTML = '♣';
            cardBack.style.color = 'black';
        } else {
            cardBack.innerHTML = '♠';
            cardBack.style.color = 'black';
        }
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardElement.appendChild(cardInner);
        
        cardElement.addEventListener('click', () => selectCard(index));
        
        container.appendChild(cardElement);
    });
}

function showTargetCard() {
    setTimeout(() => {
        monteGameState.cards.forEach((card, index) => {
            if (card.id === monteGameState.targetCard) {
                document.querySelectorAll('.card')[index].classList.add('revealed');
            }
        });
        
        setTimeout(() => {
            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove('revealed');
            });
            
            setTimeout(() => {
                startShuffling();
            }, 500);
        }, 2000);
    }, 500);
}

function startShuffling() {
    monteGameState.isShuffling = true;
    const shuffleSpeed = 440 - (monteGameState.difficulty * 55);
    const numberOfShuffles = 5 + (monteGameState.difficulty * 2);
    
    let shufflesDone = 0;
    const shuffleInterval = setInterval(() => {
        if (shufflesDone >= numberOfShuffles) {
            clearInterval(shuffleInterval);
            monteGameState.isShuffling = false;
            return;
        }
        
        const idx1 = Math.floor(Math.random() * 3);
        let idx2 = Math.floor(Math.random() * 3);
        while (idx2 === idx1) {
            idx2 = Math.floor(Math.random() * 3);
        }
        
        swapCards(idx1, idx2);
        shufflesDone++;
    }, shuffleSpeed);
}

function swapCards(idx1, idx2) {
    const cards = document.querySelectorAll('.card');
    const card1 = cards[idx1];
    const card2 = cards[idx2];
    
    const temp = monteGameState.cards[idx1];
    monteGameState.cards[idx1] = monteGameState.cards[idx2];
    monteGameState.cards[idx2] = temp;
    
    card1.style.animation = 'slideRight 0.33s ease-in-out';
    card2.style.animation = 'slideLeft 0.33s ease-in-out';
    
    setTimeout(() => {
        renderCards();
    }, 330);
}

function selectCard(index) {
    if (monteGameState.isShuffling || !monteGameState.isPlaying) return;
    
    monteGameState.moves++;
    monteGameState.selectedCard = index;
    
    document.querySelectorAll('.card')[index].classList.add('revealed');
    
    setTimeout(() => {
        if (monteGameState.cards[index].id === monteGameState.targetCard) {
            if (monteGameState.difficulty < 5) {
                monteGameState.difficulty++;
                document.getElementById('roundNumber').textContent = monteGameState.difficulty;
                setTimeout(() => {
                    document.querySelectorAll('.card').forEach(card => {
                        card.classList.remove('revealed');
                    });
                    initializeMonteGame();
                    renderCards();
                    showTargetCard();
                }, 1500);
            } else {
                endMonteGame(true);
            }
        } else {
            document.querySelectorAll('.card').forEach((card, i) => {
                if (monteGameState.cards[i].id === monteGameState.targetCard) {
                    card.classList.add('revealed');
                }
            });
            setTimeout(() => {
                endMonteGame(false);
            }, 1500);
        }
    }, 1000);
}

function endMonteGame(won) {
    monteGameState.isPlaying = false;
    clearInterval(monteGameState.timerInterval);
    
    const timeTaken = 180 - monteGameState.timeRemaining;
    
    document.getElementById('monteGameArea').classList.add('hidden');
    document.getElementById('gameResult').classList.remove('hidden');
    
    if (won) {
        document.getElementById('resultTitle').textContent = 'Challenge Complete!';
        document.getElementById('resultTitle').className = 'success';
        document.getElementById('resultMessage').textContent = 
            'You tracked the card through all the shuffles! The Prestige would be proud.';
    } else {
        document.getElementById('resultTitle').textContent = 'Wrong Card!';
        document.getElementById('resultTitle').className = 'failure';
        document.getElementById('resultMessage').textContent = 
            'The trick fooled you this time. Better luck tomorrow!';
    }
    
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    document.getElementById('finalTime').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('finalMoves').textContent = monteGameState.moves;
    
    saveDailyScore(won, timeTaken, monteGameState.moves);
    
    monteGameState.alreadyPlayed = true;
}