let currentDate = new Date();
let isViewingPast = false;

function initializeNavigation() {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
        currentDate = new Date(dateParam + 'T00:00:00');
        isViewingPast = true;
        document.getElementById('challengeDate').textContent = formatDateHeader(currentDate);
    } else {
        currentDate = new Date();
        isViewingPast = false;
    }
    
    loadChallengeForCurrentDate();
    updateNavigationButtons();
    updateRecentChallenges();
    
    document.getElementById('prevChallenge').addEventListener('click', goToPreviousDay);
    document.getElementById('nextChallenge').addEventListener('click', goToNextDay);
}

function formatDateHeader(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
        return "Today's Challenge";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.getTime() === yesterday.getTime()) {
        return "Yesterday's Challenge";
    }
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function loadChallengeForCurrentDate() {
    const challenge = getChallengeForDate(currentDate);
    
    if (!challenge) {
        document.querySelector('.movie-title').textContent = 'No Challenge Available';
        document.querySelector('.challenge-number').textContent = '';
        
        const nameElements = document.querySelectorAll('.challenge-name');
        nameElements.forEach(el => el.textContent = 'Check back on challenge days!');
        
        document.querySelector('.challenge-description').textContent = 'Challenges are only available on November 30th and December 1st.';
        document.getElementById('startGameBtn').style.display = 'none';
        updateDateDisplay();
        return;
    }
    
    document.querySelector('.movie-title').textContent = challenge.movie;
    document.querySelector('.challenge-number').textContent = `Challenge #${challenge.id}`;
    
    const nameElements = document.querySelectorAll('.challenge-name');
    nameElements.forEach(el => el.textContent = challenge.name);
    
    document.querySelector('.challenge-description').textContent = challenge.description;
    
    updateDateDisplay();
    
    setupGameForChallenge(challenge);
    
    // Always check if the challenge was completed, regardless of viewing past or present
    checkIfAlreadyPlayedDate(currentDate);
    
    if (isViewingPast) {
        document.getElementById('startGameBtn').textContent = 'Play Past Challenge';
    }
}

function setupGameForChallenge(challenge) {
    document.querySelectorAll('.game-specific').forEach(el => el.classList.add('hidden'));
    
    switch(challenge.gameType) {
        case 'waterJug':
            document.querySelector('.movie-quote').textContent = 
                '"On the fountain are two jugs. Do you see them? A 5-gallon and a 3-gallon. Fill one jug with exactly 4 gallons of water and place it on the scale, and the timer will stop."';
            document.querySelector('.instructions').textContent = 
                'Use the 3-gallon and 5-gallon jugs to measure exactly 4 gallons. Click on jugs to fill, empty, or pour between them.';
            break;
            
        case 'threeCardMonte':
            document.querySelector('.movie-quote').textContent = 
                '"Are you watching closely? Every magic trick consists of three parts..."';
            document.querySelector('.instructions').textContent = 
                'Track the heart card through 5 increasingly difficult rounds of shuffles. Click the correct card after each shuffle!';
            break;
            
        default:
            document.querySelector('.movie-quote').textContent = 
                `"${challenge.name}" challenge coming soon!`;
            document.querySelector('.instructions').textContent = 
                'This challenge is under development. For now, try the Water Jug puzzle!';
            break;
    }
}

function updateDateDisplay() {
    const dateDisplay = document.getElementById('dateDisplay');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    dateDisplay.textContent = currentDate.toLocaleDateString('en-US', options);
}

function updateNavigationButtons() {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;
    
    const prevBtn = document.getElementById('prevChallenge');
    const nextBtn = document.getElementById('nextChallenge');
    
    if (currentDateStr === '2024-11-30') {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
        prevBtn.style.cursor = 'not-allowed';
        
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
    } else if (currentDateStr === '2025-12-01') {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
        prevBtn.style.cursor = 'pointer';
        
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
        nextBtn.style.cursor = 'not-allowed';
    } else {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
        prevBtn.style.cursor = 'not-allowed';
        
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
        nextBtn.style.cursor = 'not-allowed';
    }
}

function goToPreviousDay() {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;
    
    if (currentDateStr === '2025-12-01') {
        window.location.href = `?date=2024-11-30`;
    }
}

function goToNextDay() {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;
    
    if (currentDateStr === '2024-11-30') {
        window.location.href = `?date=2025-12-01`;
    }
}

function updateRecentChallenges() {
    const nov30 = new Date('2024-11-30');
    const nov30Challenge = getChallengeForDate(nov30);
    if (nov30Challenge) {
        document.getElementById('nov30Challenge').textContent = 'Previous Challenge';
    }
    
    const challengeLinks = document.querySelector('.challenge-links');
    challengeLinks.innerHTML = '';
    
    const availableDates = [
        new Date('2024-11-30'),
        new Date('2025-12-01')
    ];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    availableDates.forEach(date => {
        if (date <= today) {
            const challenge = getChallengeForDate(date);
            if (challenge) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const displayDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                
                const link = document.createElement('a');
                link.href = `?date=${dateStr}`;
                link.className = 'challenge-link';
                link.innerHTML = `${displayDate}`;
                
                challengeLinks.appendChild(link);
            }
        }
    });
}

function checkIfAlreadyPlayedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dateKey = `screenstreak_${dateStr}`;
    const played = localStorage.getItem(dateKey);
    
    const btn = document.getElementById('startGameBtn');
    
    // Reset button state first
    btn.classList.remove('completed', 'attempted');
    btn.style.display = 'block';
    
    if (played) {
        const result = JSON.parse(played);
        if (result.completed) {
            btn.textContent = '✓ Completed';
            btn.classList.add('completed');
        } else {
            btn.textContent = 'Already Attempted';
            btn.classList.add('attempted');
        }
    } else {
        // No previous attempt - reset to default
        btn.textContent = 'Start Challenge';
    }
}

function modifiedStartGame() {
    const originalStartGame = window.startGame || window.startMonteGame;
    
    return function() {
        const challenge = getChallengeForDate(currentDate);
        
        if (challenge.gameType === 'threeCardMonte') {
            document.getElementById('gameIntro').classList.add('hidden');
            document.getElementById('threeCardMonteGame').classList.remove('hidden');
            startMonteGame();
        } else {
            document.getElementById('gameIntro').classList.add('hidden');
            document.getElementById('waterJugGame').classList.remove('hidden');
            originalStartGame();
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    
    const startBtn = document.getElementById('startGameBtn');
    startBtn.removeEventListener('click', startGame);
    startBtn.addEventListener('click', modifiedStartGame());
});