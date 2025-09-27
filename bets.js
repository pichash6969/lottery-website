// Betting system variables
let betHistory = JSON.parse(localStorage.getItem('betHistory')) || {};

// Initialize betting system
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('betting.html')) {
        setupBettingPage();
    }
});

// Setup betting page
function setupBettingPage() {
    displayBetHistory();
    
    // Update bet number validation based on type
    const betType = document.getElementById('betType');
    if (betType) {
        betType.addEventListener('change', function() {
            const betNumber = document.getElementById('betNumber');
            if (betNumber) {
                if (this.value === '2D') {
                    betNumber.max = 99;
                    betNumber.placeholder = 'Enter 2-digit number (0-99)';
                } else {
                    betNumber.max = 999;
                    betNumber.placeholder = 'Enter 3-digit number (0-999)';
                }
                betNumber.value = '';
            }
        });
    }
}

// Place bet function
function placeBet() {
    if (!currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    const betType = document.getElementById('betType').value;
    const betNumber = document.getElementById('betNumber').value;
    const betCoins = parseInt(document.getElementById('betCoins').value);

    // Validation
    if (!betNumber || !betCoins) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    const user = users[currentUser];
    if (betCoins > user.balance) {
        showNotification('Insufficient balance', 'error');
        return;
    }

    // Validate number range
    const maxNumber = betType === '2D' ? 99 : 999;
    if (parseInt(betNumber) > maxNumber || parseInt(betNumber) < 0) {
        showNotification(`Number must be between 0 and ${maxNumber}`, 'error');
        return;
    }

    const bet = {
        type: betType,
        number: betNumber.padStart(betType === '2D' ? 2 : 3, '0'),
        coins: betCoins,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    // Deduct coins
    user.balance -= betCoins;
    users[currentUser] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // Add bet to history
    if (!betHistory[currentUser]) {
        betHistory[currentUser] = [];
    }
    betHistory[currentUser].unshift(bet);
    localStorage.setItem('betHistory', JSON.stringify(betHistory));

    // Update UI
    updateUserInfo();
    animateBalance();
    displayBetHistory();
    
    // Clear form
    document.getElementById('betNumber').value = '';
    document.getElementById('betCoins').value = '';

    showNotification(`Bet placed: ${betType} - ${bet.number} (${betCoins} coins)`, 'success');
}

// Display bet history
function displayBetHistory() {
    const historyContainer = document.getElementById('betHistory');
    if (!historyContainer || !currentUser) return;

    historyContainer.innerHTML = '';

    const userBets = betHistory[currentUser] || [];
    userBets.slice(0, 20).forEach(bet => {
        const betItem = document.createElement('div');
        betItem.className = 'bet-item';
        
        const statusClass = bet.status === 'win' ? 'status-win' : 
                          bet.status === 'lose' ? 'status-lose' : 'status-pending';
        
        const winAmount = bet.status === 'win' ? ` (+${bet.coins * (bet.type === '2D' ? 90 : 900)})` : '';
        
        betItem.innerHTML = `
            <div>
                <strong>${bet.type}: ${bet.number}</strong><br>
                <small>${new Date(bet.timestamp).toLocaleString()}</small>
            </div>
            <div>
                <div>${bet.coins} coins${winAmount}</div>
                <span class="bet-status ${statusClass}">${bet.status.toUpperCase()}</span>
            </div>
        `;
        historyContainer.appendChild(betItem);
    });

    if (userBets.length === 0) {
        historyContainer.innerHTML = '<div class="bet-item"><span>No bets placed yet</span></div>';
    }
}

// Check bets for win/loss
function checkBetsForWinLoss(winningNumbers) {
    if (!currentUser || !betHistory[currentUser]) return;

    const userBets = betHistory[currentUser];
    let hasWin = false;
    let totalWinnings = 0;

    userBets.forEach(bet => {
        if (bet.status !== 'pending') return;

        const winningNumber = winningNumbers[bet.type];
        if (bet.number === winningNumber) {
            // Win!
            bet.status = 'win';
            const multiplier = bet.type === '2D' ? 90 : 900;
            const winAmount = bet.coins * multiplier;
            
            users[currentUser].balance += winAmount;
            totalWinnings += winAmount;
            hasWin = true;
        } else {
            // Lose
            bet.status = 'lose';
        }
    });

    if (hasWin) {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('betHistory', JSON.stringify(betHistory));
        updateUserInfo();
        animateBalance();
        
        if (totalWinnings >= 1000) {
            showJackpotAnimation();
            playJackpotSound();
        }
        
        showNotification(`🎉 You won ${totalWinnings} coins!`, 'success');
    } else {
        localStorage.setItem('betHistory', JSON.stringify(betHistory));
        const lostBets = userBets.filter(bet => bet.status === 'lose').length;
        if (lostBets > 0) {
            showNotification(`Better luck next time!`, 'info');
        }
    }

    // Update bet history display
    displayBetHistory();
}

// Jackpot animations and sounds
function showJackpotAnimation() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.classList.add('jackpot-animation');
        setTimeout(() => {
            userInfo.classList.remove('jackpot-animation');
        }, 2000);
    }
}

function playJackpotSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                gain.gain.setValueAtTime(0.2, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.3);
            }, index * 200);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}
