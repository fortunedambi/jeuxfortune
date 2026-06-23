// Banque d'émojis globale de référence pour habiller le jeu
const EMOJI_BANK = ['🎨', '🎵', '📸', '💻', '🎮', '🚀', '🔮', '🍀', '🍕', '🌍', '🐱', '🦊'];

// Objet d'état de l'application en cours
const gameState = {
    difficulty: 'easy',
    cards: [],
    flippedCards: [],
    moves: 0,
    matchedPairs: 0,
    totalPairs: 8,
    timerInterval: null,
    secondsElapsed: 0,
    isLocked: false,
    timerStarted: false
};

// Cache d'accès simplifié pour les éléments du DOM
const dom = {
    homeScreen: document.getElementById('home-screen'),
    gameScreen: document.getElementById('game-screen'),
    victoryModal: document.getElementById('victory-modal'),
    grid: document.getElementById('game-grid'),
    timer: document.getElementById('timer-val'),
    moves: document.getElementById('moves-val'),
    bestEasy: document.getElementById('best-easy'),
    bestHard: document.getElementById('best-hard'),
    modalDiff: document.getElementById('modal-diff'),
    modalTime: document.getElementById('modal-time'),
    modalMoves: document.getElementById('modal-moves'),
    newRecordRow: document.getElementById('new-record-row'),
    btnEasy: document.getElementById('btn-easy'),
    btnHard: document.getElementById('btn-hard'),
    btnQuit: document.getElementById('btn-quit'),
    btnReplay: document.getElementById('btn-replay')
};

// Extrait et affiche les records du LocalStorage sur l'écran d'accueil
function displayBestScores() {
    const bestEasy = localStorage.getItem('best_score_easy');
    const bestHard = localStorage.getItem('best_score_hard');
    
    dom.bestEasy.textContent = bestEasy ? formatTime(parseInt(bestEasy)) : '--:--';
    dom.bestHard.textContent = bestHard ? formatTime(parseInt(bestHard)) : '--:--';
}

// Initialise et configure une nouvelle partie
function initGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.moves = 0;
    gameState.matchedPairs = 0;
    gameState.secondsElapsed = 0;
    gameState.flippedCards = [];
    gameState.isLocked = false;
    gameState.timerStarted = false;
    
    clearInterval(gameState.timerInterval);
    
    dom.moves.textContent = '0';
    dom.timer.textContent = '00:00';

    if (difficulty === 'easy') {
        gameState.totalPairs = 8;
        dom.grid.className = 'grid grid-easy';
    } else {
        gameState.totalPairs = 12;
        dom.grid.className = 'grid grid-hard';
    }

    dom.homeScreen.classList.add('hidden');
    dom.victoryModal.classList.add('hidden');
    dom.gameScreen.classList.remove('hidden');

    buildGrid();
}

// Quitte l'arène de jeu en cours pour revenir à l'accueil
function quitGame() {
    clearInterval(gameState.timerInterval);
    dom.gameScreen.classList.add('hidden');
    dom.victoryModal.classList.add('hidden');
    dom.homeScreen.classList.remove('hidden');
    displayBestScores();
}

// Extrait la sous-liste, double les cartes et les distribue de façon aléatoire
function buildGrid() {
    dom.grid.innerHTML = '';
    
    // Sélection exacte des émojis selon la configuration (Sécurité EMOJI_BANK)
    const subEmojiList = EMOJI_BANK.slice(0, gameState.totalPairs);
    let gameEmojis = [...subEmojiList, ...subEmojiList];

    // Algorithme de mélange de Fisher-Yates
    for (let i = gameEmojis.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameEmojis[i], gameEmojis[j]] = [gameEmojis[j], gameEmojis[i]];
    }

    // Création physique et injection des nœuds HTML cartes
    gameEmojis.forEach((emoji, index) => {
        const cardEl = document.createElement('div');
        cardEl.classList.add('card');
        cardEl.dataset.id = index;
        cardEl.dataset.emoji = emoji;

        cardEl.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front">${emoji}</div>
        `;

        cardEl.addEventListener('click', handleCardClick);
        dom.grid.appendChild(cardEl);
    });
}

// Intercepteur lors d'un clic utilisateur sur une carte
function handleCardClick() {
    const clickedCard = this;

    if (gameState.isLocked || clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) {
        return;
    }

    // Démarrage paresseux de l'horloge au premier clic
    if (!gameState.timerStarted) {
        gameState.timerStarted = true;
        startTimer();
    }

    clickedCard.classList.add('flipped');
    gameState.flippedCards.push(clickedCard);

    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        dom.moves.textContent = gameState.moves;
        checkMatch();
    }
}

// Analyse la conformité de la paire sélectionnée
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    const isMatch = card1.dataset.emoji === card2.dataset.emoji;

    if (isMatch) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        gameState.matchedPairs++;
        gameState.flippedCards = [];

        if (gameState.matchedPairs === gameState.totalPairs) {
            endGame();
        }
    } else {
        // En cas d'erreur : gel temporaire puis retournement automatique à 0,8 seconde
        gameState.isLocked = true;
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            gameState.flippedCards = [];
            gameState.isLocked = false;
        }, 800); 
    }
}

// Gestion incrémentale du chronomètre
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.secondsElapsed++;
        dom.timer.textContent = formatTime(gameState.secondsElapsed);
    }, 1000);
}

// Formate un entier brut de secondes en chaîne exploitable MM:SS
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}`;
}

// Arrête l'horloge et ouvre le bilan de triomphe
function endGame() {
    clearInterval(gameState.timerInterval);
    
    const finalTime = gameState.secondsElapsed;
    const storageKey = `best_score_${gameState.difficulty}`;
    const previousRecord = localStorage.getItem(storageKey);
    let isNewRecord = false;

    if (!previousRecord || finalTime < parseInt(previousRecord)) {
        localStorage.setItem(storageKey, finalTime);
        isNewRecord = true;
    }

    dom.modalDiff.textContent = gameState.difficulty === 'easy' ? 'Facile (4×4)' : 'Difficile (6×4)';
    dom.modalTime.textContent = formatTime(finalTime);
    dom.modalMoves.textContent = gameState.moves;
    dom.newRecordRow.style.display = isNewRecord ? 'flex' : 'none';

    dom.victoryModal.classList.remove('hidden');
}

/* ==========================================================================
   ÉCOUTEURS D'ÉVÉNEMENTS (LISTENERS) INTERFACE
   ========================================================================== */
dom.btnEasy.addEventListener('click', () => initGame('easy'));
dom.btnHard.addEventListener('click', () => initGame('hard'));
dom.btnQuit.addEventListener('click', quitGame);
dom.btnReplay.addEventListener('click', () => initGame(gameState.difficulty));

// Premier cycle d'affichage des scores au chargement natif
displayBestScores();