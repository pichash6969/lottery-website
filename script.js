// Global variables
let resultHistory = JSON.parse(localStorage.getItem('resultHistory')) || [];

// Manual draw schedule
const manualDraws = [
    { time: '09:00:00', numbers: { '2D': '42', '3D': '123' } },
    { time: '12:00:00', numbers: { '2D': '17', '3D': '456' } },
    { time: '15:00:00', numbers: { '2D': '89', '3D': '789' } },
    { time: '18:00:00', numbers: { '2D': '33', '3D': '012' } },
    { time: '21:00:00', numbers: { '2D': '56', '3D': '345' } }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateClock();
    setInterval(updateClock, 1000);
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        startLotteryAnimation();
        checkManualDraws();
        setInterval(checkManualDraws, 1000);
        displayResultHistory();
    }
});

// Clock function
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

// Lottery animation
function startLotteryAnimation() {
    const scroll2D = document.getElementById('scroll2D');
    const scroll3D = document.getElementById('scroll3D');

    if (scroll2D) {
        let numbers2D = '';
        for (let i = 0; i < 20; i++) {
            const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
            numbers2D += `<div>${num}</div>`;
        }
        scroll2D.innerHTML = numbers2D;
    }

    if (scroll3D) {
        let numbers3D = '';
        for (let i = 0; i < 20; i++) {
            const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            numbers3D += `<div>${num}</div>`;
        }
        scroll3D.innerHTML = numbers3D;
    }
}

// Manual draws
function checkManualDraws() {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0];

    manualDraws.forEach((draw) => {
        const drawTime = new Date();
        const [hours, minutes, seconds] = draw.time.split(':');
        drawTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);

        const timeDiff = drawTime.getTime() - now.getTime();

        if (timeDiff > 0 && timeDiff <= 60000) {
            // Draw starting in next minute
            updateDrawStatus('upcoming', draw.time, '--', '--');
        } else if (timeDiff <= 0 && timeDiff > -30000) {
            // Draw is active (30 seconds)
            updateDrawStatus('active', draw.time, draw.numbers['2D'], draw.numbers['3D']);
            stopScrollAnimation();
            playDrawSound();
        } else if (timeDiff <= -30000 && timeDiff > -60000) {
            // Draw completed
            updateDrawStatus('completed', draw.time, draw.numbers['2D'], draw.numbers['3D']);
            addToResultHistory(draw.numbers['2D'], draw.numbers['3D'], draw.time);
            if (typeof checkBetsForWinLoss === 'function') {
                checkBetsForWinLoss(draw.numbers);
            }
        } else {
            // Find next draw
            const nextDraw = getNextDraw();
            if (nextDraw) {
                updateDrawStatus('upcoming', nextDraw.time, '--', '--');
                startLotteryAnimation();
            }
        }
    });
}

function getNextDraw() {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0];

    for (let draw of manualDraws) {
        if (draw.time > currentTime) {
            return draw;
        }
    }
    return manualDraws[0];
}

function updateDrawStatus(status, time, number2D, number3D) {
    const manual2D = document.getElementById('manual2D');
    const manual3D = document.getElementById('manual3D');

    if (manual2D) {
        const drawTime = manual2D.querySelector('.draw-time');
        const drawStatus = manual2D.querySelector('.draw-status');
        const winningNumber = manual2D.querySelector('.winning-number');

        if (drawTime) drawTime.textContent = status === 'upcoming' ? `Next Draw: ${time}` : `Draw Time: ${time}`;
        if (drawStatus) {
            drawStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            drawStatus.className = `draw-status status-${status}`;
        }
        if (winningNumber) winningNumber.textContent = number2D;
    }

    if (manual3D) {
        const drawTime = manual3D.querySelector('.draw-time');
        const drawStatus = manual3D.querySelector('.draw-status');
        const winningNumber = manual3D.querySelector('.winning-number');

        if (drawTime) drawTime.textContent = status === 'upcoming' ? `Next Draw: ${time}` : `Draw Time: ${time}`;
        if (drawStatus) {
            drawStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            drawStatus.className = `draw-status status-${status}`;
        }
        if (winningNumber) winningNumber.textContent = number3D;
    }
}

function stopScrollAnimation() {
    const scroll2D = document.getElementById('scroll2D');
    const scroll3D = document.getElementById('scroll3D');

    if (scroll2D) scroll2D.classList.add('stopped');
    if (scroll3D) scroll3D.classList.add('stopped');

    setTimeout(() => {
        if (scroll2D) scroll2D.classList.remove('stopped');
        if (scroll3D) scroll3D.classList.remove('stopped');
        startLotteryAnimation();
    }, 5000);
}

function playDrawSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Result history
function addToResultHistory(number2D, number3D, time) {
    const result = {
        '2D': number2D,
        '3D': number3D,
        time: time,
        timestamp: new Date().toISOString()
    };

    resultHistory.unshift(result);
    if (resultHistory.length > 50) {
        resultHistory = resultHistory.slice(0, 50);
    }

    localStorage.setItem('resultHistory', JSON.stringify(resultHistory));
    displayResultHistory();
}

function displayResultHistory() {
    const historyContainer = document.getElementById('resultHistory');
    if (!historyContainer) return;

    historyContainer.innerHTML = '';

    resultHistory.slice(0, 10).forEach(result => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span>2D: ${result['2D']} | 3D: ${result['3D']}</span>
            <span>${result.time}</span>
        `;
        historyContainer.appendChild(historyItem);
    });

    if (resultHistory.length === 0) {
        historyContainer.innerHTML = '<div class="history-item"><span>No results yet</span></div>';
    }
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (!notification || !notificationMessage) return;

    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
