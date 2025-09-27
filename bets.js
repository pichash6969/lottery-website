// bets.js

let betHistory = JSON.parse(localStorage.getItem('betHistory')) || [];

// ---------- PLACE BET ----------
function placeBet(type, number, amount) {
    if (!currentUser) {
        alert('Login first!');
        return false;
    }
    if (amount > currentUser.balance) {
        alert('Not enough balance!');
        return false;
    }

    currentUser.balance -= amount;
    saveUserData();

    const bet = {
        user: currentUser.username,
        type: type, // 2D or 3D
        number: number,
        amount: amount,
        time: new Date().toLocaleTimeString()
    };

    betHistory.push(bet);
    localStorage.setItem('betHistory', JSON.stringify(betHistory));
    notify(`Bet placed: ${type} - ${number} for ${amount} 🪙`);
    return true;
}

// ---------- CHECK BET WIN/LOSS ----------
function checkBetResult(twoDigitResult, threeDigitResult) {
    if (!currentUser) return;
    betHistory.forEach(bet => {
        if (bet.user === currentUser.username) {
            let won = false;
            let reward = 0;
            if (bet.type === '2D' && bet.number === twoDigitResult) {
                won = true;
                reward = bet.amount * 100;
            }
            if (bet.type === '3D' && bet.number === threeDigitResult) {
                won = true;
                reward = bet.amount * 1000;
            }
            if (won) {
                currentUser.balance += reward;
                animateCoin(reward);
                notify(`You won ${reward} 🪙!`);
            }
        }
    });
    saveUserData();
}

// ---------- DISPLAY BET HISTORY ----------
function displayBetHistory() {
    const container = document.querySelector('.bet-history');
    if (!container) return;
    container.innerHTML = '<h3>Bet History</h3>';
    betHistory.slice().reverse().forEach(bet => {
        const div = document.createElement('div');
        div.textContent = `${bet.time} - ${bet.user} - ${bet.type}:${bet.number} - ${bet.amount} 🪙`;
        container.appendChild(div);
    });
}

// Refresh bet history every 2 seconds
setInterval(displayBetHistory, 2000);
