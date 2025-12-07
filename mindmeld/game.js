const SUPABASE_URL = 'https://yujkdidzecwtwpknuarz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amtkaWR6ZWN3dHdwa251YXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMzAwNTksImV4cCI6MjA4MDcwNjA1OX0.BqLRmTljkqtzsZMBgIwtafgzgG8eH61BlkJi4tEuBa8';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Game state
let gameState = {
    roomCode: null,
    playerId: null,
    playerNumber: null,
    currentRoom: null,
    subscription: null,
    gamePhase: 'waiting', // waiting, initial, converging, meld
    currentWords: { player1: null, player2: null },
    history: [],
    timer: null,
    timerSeconds: 10
};

// DOM Elements
const screens = {
    start: document.getElementById('startScreen'),
    room: document.getElementById('roomScreen'),
    game: document.getElementById('gameScreen')
};

const elements = {
    createRoomBtn: document.getElementById('createRoomBtn'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    backBtn: document.getElementById('backBtn'),
    roomCode: document.getElementById('roomCode'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    createRoomSection: document.getElementById('createRoomSection'),
    joinRoomSection: document.getElementById('joinRoomSection'),
    roomCodeInput: document.getElementById('roomCodeInput'),
    joinBtn: document.getElementById('joinBtn'),
    currentRoomCode: document.getElementById('currentRoomCode'),
    connectionStatus: document.getElementById('connectionStatus'),
    leaveGameBtn: document.getElementById('leaveGameBtn'),
    wordInput: document.getElementById('wordInput'),
    submitWordBtn: document.getElementById('submitWordBtn'),
    player1Word: document.getElementById('player1Word'),
    player2Word: document.getElementById('player2Word'),
    meldWord: document.getElementById('meldWord'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    gameHistory: document.getElementById('gameHistory'),
    wordInputSection: document.getElementById('wordInputSection'),
    waitingForOther: document.getElementById('waitingForOther'),
    waitingForPlayers: document.getElementById('waitingForPlayers'),
    initialWords: document.getElementById('initialWords'),
    convergingWords: document.getElementById('convergingWords'),
    mindMeldSuccess: document.getElementById('mindMeldSuccess'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerSeconds: document.getElementById('timerSeconds')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupEventListeners();
    generatePlayerId();
}

function generatePlayerId() {
    gameState.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
}

function setupEventListeners() {
    elements.createRoomBtn.addEventListener('click', createRoom);
    elements.joinRoomBtn.addEventListener('click', showJoinRoom);
    elements.backBtn.addEventListener('click', backToStart);
    elements.copyCodeBtn.addEventListener('click', copyRoomCode);
    elements.joinBtn.addEventListener('click', joinRoom);
    elements.leaveGameBtn.addEventListener('click', leaveGame);
    elements.submitWordBtn.addEventListener('click', submitWord);
    elements.playAgainBtn.addEventListener('click', playAgain);
    elements.wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitWord();
    });
    elements.roomCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    elements.wordInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function createRoom() {
    const roomCode = generateRoomCode();
    gameState.roomCode = roomCode;
    gameState.playerNumber = 1;
    
    try {
        // Create room in database
        const { data, error } = await supabase
            .from('rooms')
            .insert([{
                code: roomCode,
                player1_id: gameState.playerId,
                player2_id: null,
                game_state: 'waiting',
                current_round: 0,
                player1_word: null,
                player2_word: null,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
            
        if (error) throw error;
        
        gameState.currentRoom = data;
        
        // Subscribe to room updates
        subscribeToRoom(roomCode);
        
        // Show room screen with code
        elements.roomCode.textContent = roomCode;
        elements.createRoomSection.classList.remove('hidden');
        elements.joinRoomSection.classList.add('hidden');
        showScreen('room');
        
        showToast('Room created! Share the code with your friend.', 'success');
        
    } catch (error) {
        console.error('Error creating room:', error);
        showToast('Failed to create room. Please try again.', 'error');
    }
}

function showJoinRoom() {
    elements.createRoomSection.classList.add('hidden');
    elements.joinRoomSection.classList.remove('hidden');
    showScreen('room');
    elements.roomCodeInput.focus();
}

async function joinRoom() {
    const roomCode = elements.roomCodeInput.value.trim().toUpperCase();
    
    if (roomCode.length !== 5) {
        showToast('Please enter a valid 5-character room code', 'error');
        return;
    }
    
    try {
        // Check if room exists
        const { data: room, error: fetchError } = await supabase
            .from('rooms')
            .select('*')
            .eq('code', roomCode)
            .single();
            
        if (fetchError || !room) {
            showToast('Room not found. Please check the code.', 'error');
            return;
        }
        
        if (room.player2_id && room.player2_id !== gameState.playerId) {
            showToast('Room is full. Please try another room.', 'error');
            return;
        }
        
        // Join room as player 2
        const { data, error: updateError } = await supabase
            .from('rooms')
            .update({ 
                player2_id: gameState.playerId,
                game_state: 'playing'
            })
            .eq('code', roomCode)
            .select()
            .single();
            
        if (updateError) throw updateError;
        
        gameState.roomCode = roomCode;
        gameState.playerNumber = 2;
        gameState.currentRoom = data;
        
        // Subscribe to room updates
        subscribeToRoom(roomCode);
        
        // Start game
        startGame();
        
    } catch (error) {
        console.error('Error joining room:', error);
        showToast('Failed to join room. Please try again.', 'error');
    }
}

function subscribeToRoom(roomCode) {
    gameState.subscription = supabase
        .channel(`room:${roomCode}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `code=eq.${roomCode}`
            },
            (payload) => handleRoomUpdate(payload)
        )
        .subscribe();
}

function handleRoomUpdate(payload) {
    const room = payload.new;
    gameState.currentRoom = room;
    
    // Check if player 2 joined
    if (gameState.playerNumber === 1 && room.player2_id) {
        showToast('Player 2 has joined!', 'success');
        startGame();
    }
    
    // Update game state based on room data
    if (room.game_state === 'playing') {
        updateGameDisplay(room);
    }
    
    // Check for mind meld (convert to uppercase for comparison)
    if (room.player1_word && room.player2_word && 
        room.player1_word.toUpperCase() === room.player2_word.toUpperCase()) {
        handleMindMeld(room.player1_word.toUpperCase());
    }
}

function startGame() {
    elements.currentRoomCode.textContent = gameState.roomCode;
    showScreen('game');
    updateGamePhase('initial');
    showToast('Game started! Think of any word to begin.', 'success');
}

function updateGamePhase(phase) {
    gameState.gamePhase = phase;
    
    // Hide all state messages
    elements.waitingForPlayers.classList.add('hidden');
    elements.initialWords.classList.add('hidden');
    elements.convergingWords.classList.add('hidden');
    elements.mindMeldSuccess.classList.add('hidden');
    
    // Stop any existing timer
    stopTimer();
    
    // Show appropriate state
    switch (phase) {
        case 'waiting':
            elements.waitingForPlayers.classList.remove('hidden');
            elements.wordInputSection.classList.add('hidden');
            elements.waitingForOther.classList.add('hidden');
            break;
        case 'initial':
            elements.initialWords.classList.remove('hidden');
            elements.wordInputSection.classList.remove('hidden');
            elements.waitingForOther.classList.add('hidden');
            startTimer();
            break;
        case 'converging':
            elements.convergingWords.classList.remove('hidden');
            elements.wordInputSection.classList.remove('hidden');
            elements.waitingForOther.classList.add('hidden');
            startTimer();
            break;
        case 'waiting_for_other':
            elements.wordInputSection.classList.add('hidden');
            elements.waitingForOther.classList.remove('hidden');
            stopTimer();
            break;
        case 'meld':
            elements.mindMeldSuccess.classList.remove('hidden');
            elements.wordInputSection.classList.add('hidden');
            elements.waitingForOther.classList.add('hidden');
            stopTimer();
            break;
    }
}

function startTimer() {
    gameState.timerSeconds = 10;
    elements.timerDisplay.classList.remove('hidden');
    elements.timerDisplay.classList.remove('warning');
    elements.timerSeconds.textContent = gameState.timerSeconds;
    
    gameState.timer = setInterval(() => {
        gameState.timerSeconds--;
        elements.timerSeconds.textContent = gameState.timerSeconds;
        
        if (gameState.timerSeconds <= 3) {
            elements.timerDisplay.classList.add('warning');
        }
        
        if (gameState.timerSeconds <= 0) {
            stopTimer();
            // Auto-submit empty word if time runs out
            submitWord(true);
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    elements.timerDisplay.classList.add('hidden');
    elements.timerDisplay.classList.remove('warning');
}

async function submitWord(timedOut = false) {
    const word = elements.wordInput.value.trim().toUpperCase();
    
    if (!word) {
        if (!timedOut) {
            showToast('Please enter a word', 'error');
            return;
        } else {
            // If timed out with no word, submit "TIMEOUT"
            const timedOutWord = 'TIMEOUT';
            elements.wordInput.value = '';
            await submitWordToDatabase(timedOutWord);
            return;
        }
    }
    
    if (word.length > 30) {
        showToast('Word is too long (max 30 characters)', 'error');
        return;
    }
    
    elements.wordInput.value = '';
    stopTimer();
    await submitWordToDatabase(word);
}

async function submitWordToDatabase(word) {
    try {
        const updateField = gameState.playerNumber === 1 ? 'player1_word' : 'player2_word';
        const otherField = gameState.playerNumber === 1 ? 'player2_word' : 'player1_word';
        
        // Get current room state
        const { data: currentRoom, error: fetchError } = await supabase
            .from('rooms')
            .select('*')
            .eq('code', gameState.roomCode)
            .single();
            
        if (fetchError) throw fetchError;
        
        // Update player's word
        const { error: updateError } = await supabase
            .from('rooms')
            .update({ [updateField]: word })
            .eq('code', gameState.roomCode);
            
        if (updateError) throw updateError;
        
        // Check if other player has submitted
        if (currentRoom[otherField]) {
            // Both words submitted, reveal them (ensure uppercase)
            const player1Word = updateField === 'player1_word' ? word : currentRoom[otherField].toUpperCase();
            const player2Word = updateField === 'player2_word' ? word : currentRoom[otherField].toUpperCase();
            
            updateGamePhase('converging');
            elements.player1Word.textContent = player1Word;
            elements.player2Word.textContent = player2Word;
            
            // Add to history
            addToHistory(player1Word, player2Word);
            
            // Check for mind meld (both already uppercase)
            if (word === currentRoom[otherField].toUpperCase()) {
                handleMindMeld(word);
            } else {
                // Reset for next round after a delay
                setTimeout(() => resetRound(), 3000);
            }
        } else {
            // Waiting for other player
            updateGamePhase('waiting_for_other');
        }
        
    } catch (error) {
        console.error('Error submitting word:', error);
        showToast('Failed to submit word. Please try again.', 'error');
    }
}

function updateGameDisplay(room) {
    if (room.player1_word && room.player2_word) {
        // Both words submitted (ensure uppercase)
        const word1 = room.player1_word.toUpperCase();
        const word2 = room.player2_word.toUpperCase();
        elements.player1Word.textContent = word1;
        elements.player2Word.textContent = word2;
        updateGamePhase('converging');
        
        // Add to history if not already added
        if (!gameState.history.some(h => 
            h.player1 === word1 && h.player2 === word2)) {
            addToHistory(word1, word2);
        }
        
        // Reset for next round after delay
        if (word1 !== word2) {
            setTimeout(() => resetRound(), 3000);
        }
    } else if ((gameState.playerNumber === 1 && room.player1_word) ||
               (gameState.playerNumber === 2 && room.player2_word)) {
        // Current player has submitted, waiting for other
        updateGamePhase('waiting_for_other');
    }
}

async function resetRound() {
    try {
        // Clear words for next round
        const { error } = await supabase
            .from('rooms')
            .update({ 
                player1_word: null,
                player2_word: null,
                current_round: gameState.currentRoom.current_round + 1
            })
            .eq('code', gameState.roomCode);
            
        if (error) throw error;
        
        updateGamePhase('converging');
        elements.wordInput.focus();
        
    } catch (error) {
        console.error('Error resetting round:', error);
    }
}

function handleMindMeld(word) {
    updateGamePhase('meld');
    elements.meldWord.textContent = word;
    addToHistory(word, word, true);
    showToast('🎉 MIND MELD ACHIEVED! 🎉', 'success');
}

function addToHistory(word1, word2, isMeld = false) {
    const historyItem = {
        player1: word1,
        player2: word2,
        isMeld: isMeld,
        round: gameState.history.length + 1
    };
    
    gameState.history.push(historyItem);
    
    const historyElement = document.createElement('div');
    historyElement.className = `history-item ${isMeld ? 'meld' : ''}`;
    historyElement.innerHTML = isMeld 
        ? `<span>Round ${historyItem.round}</span><span>🎯 ${word1}</span>`
        : `<span>Round ${historyItem.round}</span><span>${word1} ↔ ${word2}</span>`;
    
    elements.gameHistory.insertBefore(historyElement, elements.gameHistory.firstChild);
}

async function playAgain() {
    try {
        // Reset game
        const { error } = await supabase
            .from('rooms')
            .update({ 
                player1_word: null,
                player2_word: null,
                current_round: 0
            })
            .eq('code', gameState.roomCode);
            
        if (error) throw error;
        
        gameState.history = [];
        elements.gameHistory.innerHTML = '';
        updateGamePhase('initial');
        elements.wordInput.focus();
        showToast('New game started!', 'success');
        
    } catch (error) {
        console.error('Error starting new game:', error);
        showToast('Failed to start new game.', 'error');
    }
}

async function leaveGame() {
    if (gameState.subscription) {
        await gameState.subscription.unsubscribe();
    }
    
    // If player 1 leaves, delete the room
    if (gameState.playerNumber === 1) {
        await supabase
            .from('rooms')
            .delete()
            .eq('code', gameState.roomCode);
    } else {
        // Player 2 leaves, just remove from room
        await supabase
            .from('rooms')
            .update({ player2_id: null, game_state: 'waiting' })
            .eq('code', gameState.roomCode);
    }
    
    resetGameState();
    showScreen('start');
}

function resetGameState() {
    gameState = {
        roomCode: null,
        playerId: gameState.playerId, // Keep player ID
        playerNumber: null,
        currentRoom: null,
        subscription: null,
        gamePhase: 'waiting',
        currentWords: { player1: null, player2: null },
        history: [],
        timer: null,
        timerSeconds: 10
    };
    elements.roomCodeInput.value = '';
    elements.wordInput.value = '';
    elements.gameHistory.innerHTML = '';
}

function backToStart() {
    resetGameState();
    showScreen('start');
}

function copyRoomCode() {
    const code = elements.roomCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('Room code copied!', 'success');
    }).catch(() => {
        showToast('Failed to copy code', 'error');
    });
}

function showToast(message, type = '') {
    const toast = document.getElementById('messageToast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
