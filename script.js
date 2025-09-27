// ===== ADVANCED MANUAL DRAWS SYSTEM =====
// Enhanced script.js with start_time, stop_time, fixed_digit2, fixed_digit3

// Global variables
let resultHistory = JSON.parse(localStorage.getItem('resultHistory')) || [];
let currentDrawState = {
    '2D': { status: 'idle', currentDraw: null },
    '3D': { status: 'idle', currentDraw: null }
};

// ===== ADVANCED MANUAL DRAWS CONFIGURATION =====
const manualDraws = [
    {
        id: 'draw_1',
        start_time: '09:00:00',
        stop_time: '09:02:00',    // 2 मिनट का draw
        fixed_digit2: '42',       // 2D winning number
        fixed_digit3: '123',      // 3D winning number
        name: 'Morning Draw'
    },
    {
        id: 'draw_2', 
        start_time: '12:00:00',
        stop_time: '12:01:30',    // 1.5 मिनट का draw
        fixed_digit2: '17',
        fixed_digit3: '456',
        name: 'Noon Draw'
    },
    {
        id: 'draw_3',
        start_time: '15:00:00', 
        stop_time: '15:03:00',    // 3 मिनट का draw
        fixed_digit2: '89',
        fixed_digit3: '789',
        name: 'Afternoon Draw'
    },
    {
        id: 'draw_4',
        start_time: '18:00:00',
        stop_time: '18:02:30',    // 2.5 मिनट का draw
        fixed_digit2: '33', 
        fixed_digit3: '012',
        name: 'Evening Draw'
    },
    {
        id: 'draw_5',
        start_time: '21:00:00',
        stop_time: '21:01:00',    // 1 मिनट का draw
        fixed_digit2: '56',
        fixed_digit3: '345', 
        name: 'Night Draw'
    },
    // ===== WEEKEND SPECIAL DRAWS =====
    {
        id: 'weekend_1',
        start_time: '10:30:00',
        stop_time: '10:35:00',    // 5 मिनट special draw
        fixed_digit2: '77',
        fixed_digit3: '777',
        name: 'Weekend Special',
        days: ['saturday', 'sunday'] // केवल weekend पर
    },
    // ===== HOURLY MINI DRAWS =====
    {
        id: 'mini_1',
        start_time: '11:00:00',
        stop_time: '11:00:30',    // 30 सेकंड quick draw
        fixed_digit2: '25',
        fixed_digit3: '250',
        name: 'Mini Draw 1'
    },
    {
        id: 'mini_2', 
        start_time: '14:00:00',
        stop_time: '14:00:45',    // 45 सेकंड quick draw
        fixed_digit2: '88',
        fixed_digit3: '888',
        name: 'Mini Draw 2'
    }
];

// ===== DRAW STATE MANAGEMENT =====
function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:MM:SS format
}

function getCurrentDay() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
}

function timeToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

// ===== ENHANCED MANUAL DRAWS CHECKER =====
function checkAdvancedManualDraws() {
    const currentTime = getCurrentTime();
    const currentSeconds = timeToSeconds(currentTime);
    const currentDay = getCurrentDay();

    manualDraws.forEach((draw) => {
        // Check if draw is for today (if days specified)
        if (draw.days && !draw.days.includes(currentDay)) {
            return;
        }

        const startSeconds = timeToSeconds(draw.start_time);
        const stopSeconds = timeToSeconds(draw.stop_time);
        
        // ===== DRAW TIMING LOGIC =====
        if (currentSeconds < startSeconds) {
            // UPCOMING DRAW
            const timeUntilStart = startSeconds - currentSeconds;
            updateAdvancedDrawStatus('upcoming', draw, timeUntilStart);
            
        } else if (currentSeconds >= startSeconds && currentSeconds <= stopSeconds) {
            // ACTIVE DRAW
            const timeUntilStop = stopSeconds - currentSeconds;
            updateAdvancedDrawStatus('active', draw, timeUntilStop);
            
            // Start animations if not already started
            if (currentDrawState['2D'].status !== 'active') {
                startAdvancedLotteryAnimation();
                playDrawStartSound();
            }
            currentDrawState['2D'].status = 'active';
            currentDrawState['3D'].status = 'active';
            currentDrawState['2D'].currentDraw = draw;
            currentDrawState['3D'].currentDraw = draw;
            
        } else if (currentSeconds > stopSeconds && currentSeconds <= stopSeconds + 30) {
            // JUST COMPLETED (30 seconds buffer)
            updateAdvancedDrawStatus('completed', draw, 0);
            
            // Stop animations and show results
            if (currentDrawState['2D'].status === 'active') {
                stopAdvancedScrollAnimation(draw);
                addToAdvancedResultHistory(draw);
                playDrawStopSound();
                
                // Check bets for win/loss
                if (typeof checkBetsForWinLoss === 'function') {
                    checkBetsForWinLoss({
                        '2D': draw.fixed_digit2,
                        '3D': draw.fixed_digit3
                    });
                }
            }
            currentDrawState['2D'].status = 'completed';
            currentDrawState['3D'].status = 'completed';
            
        } else {
            // IDLE STATE - Find next draw
            const nextDraw = getNextAdvancedDraw();
            if (nextDraw) {
                const nextStartSeconds = timeToSeconds(nextDraw.start_time);
                const timeUntilNext = nextStartSeconds > currentSeconds ? 
                    nextStartSeconds - currentSeconds : 
                    (24 * 3600) + nextStartSeconds - currentSeconds; // Next day
                    
                updateAdvancedDrawStatus('upcoming', nextDraw, timeUntilNext);
            }
            
            if (currentDrawState['2D'].status !== 'idle') {
                startAdvancedLotteryAnimation(); // Continue normal animation
            }
            currentDrawState['2D'].status = 'idle';
            currentDrawState['3D'].status = 'idle';
        }
    });
}

// ===== GET NEXT DRAW =====
function getNextAdvancedDraw() {
    const currentTime = getCurrentTime();
    const currentSeconds = timeToSeconds(currentTime);
    const currentDay = getCurrentDay();
    
    // Filter draws for today
    const todayDraws = manualDraws.filter(draw => 
        !draw.days || draw.days.includes(currentDay)
    );
    
    // Find next draw today
    for (let draw of todayDraws) {
        const startSeconds = timeToSeconds(draw.start_time);
        if (startSeconds > currentSeconds) {
            return draw;
        }
    }
    
    // If no more draws today, return first draw of tomorrow
    return todayDraws[0] || manualDraws[0];
}

// ===== ADVANCED DRAW STATUS UPDATE =====
function updateAdvancedDrawStatus(status, draw, timeRemaining) {
    const manual2D = document.getElementById('manual2D');
    const manual3D = document.getElementById('manual3D');

    const formatTime = (seconds) => {
        if (seconds <= 0) return '00:00:00';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ===== UPDATE 2D DISPLAY =====
    if (manual2D) {
        const drawTime = manual2D.querySelector('.draw-time');
        const drawStatus = manual2D.querySelector('.draw-status');
        const winningNumber = manual2D.querySelector('.winning-number');
        const drawName = manual2D.querySelector('.draw-name') || createDrawNameElement(manual2D);

        if (drawName) drawName.textContent = draw.name;
        
        if (status === 'upcoming') {
            if (drawTime) drawTime.innerHTML = `⏰ Next Draw: ${draw.start_time}<br><small>Starts in: ${formatTime(timeRemaining)}</small>`;
            if (winningNumber) winningNumber.textContent = '--';
        } else if (status === 'active') {
            if (drawTime) drawTime.innerHTML = `🔥 LIVE: ${draw.start_time} - ${draw.stop_time}<br><small>Ends in: ${formatTime(timeRemaining)}</small>`;
            if (winningNumber) winningNumber.textContent = '??';
        } else if (status === 'completed') {
            if (drawTime) drawTime.innerHTML = `✅ Completed: ${draw.stop_time}<br><small>Draw finished</small>`;
            if (winningNumber) winningNumber.textContent = draw.fixed_digit2;
        }
        
        if (drawStatus) {
            drawStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            drawStatus.className = `draw-status status-${status}`;
        }
    }

    // ===== UPDATE 3D DISPLAY =====
    if (manual3D) {
        const drawTime = manual3D.querySelector('.draw-time');
        const drawStatus = manual3D.querySelector('.draw-status');
        const winningNumber = manual3D.querySelector('.winning-number');
        const drawName = manual3D.querySelector('.draw-name') || createDrawNameElement(manual3D);

        if (drawName) drawName.textContent = draw.name;
        
        if (status === 'upcoming') {
            if (drawTime) drawTime.innerHTML = `⏰ Next Draw: ${draw.start_time}<br><small>Starts in: ${formatTime(timeRemaining)}</small>`;
            if (winningNumber) winningNumber.textContent = '---';
        } else if (status === 'active') {
            if (drawTime) drawTime.innerHTML = `🔥 LIVE: ${draw.start_time} - ${draw.stop_time}<br><small>Ends in: ${formatTime(timeRemaining)}</small>`;
            if (winningNumber) winningNumber.textContent = '???';
        } else if (status === 'completed') {
            if (drawTime) drawTime.innerHTML = `✅ Completed: ${draw.stop_time}<br><small>Draw finished</small>`;
            if (winningNumber) winningNumber.textContent = draw.fixed_digit3;
        }
        
        if (drawStatus) {
            drawStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            drawStatus.className = `draw-status status-${status}`;
        }
    }
}

// ===== CREATE DRAW NAME ELEMENT =====
function createDrawNameElement(parent) {
    const nameElement = document.createElement('div');
    nameElement.className = 'draw-name';
    nameElement.style.cssText = 'font-size: 0.9rem; color: #ffd700; font-weight: bold; margin-bottom: 0.5rem;';
    parent.insertBefore(nameElement, parent.firstChild);
    return nameElement;
}

// ===== ADVANCED LOTTERY ANIMATION =====
function startAdvancedLotteryAnimation() {
    const scroll2D = document.getElementById('scroll2D');
    const scroll3D = document.getElementById('scroll3D');

    if (scroll2D) {
        let numbers2D = '';
        for (let i = 0; i < 30; i++) { // More numbers for longer animation
            const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
            numbers2D += `<div>${num}</div>`;
        }
        scroll2D.innerHTML = numbers2D;
        scroll2D.classList.remove('stopped');
    }

    if (scroll3D) {
        let numbers3D = '';
        for (let i = 0; i < 30; i++) { // More numbers for longer animation
            const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            numbers3D += `<div>${num}</div>`;
        }
        scroll3D.innerHTML = numbers3D;
        scroll3D.classList.remove('stopped');
    }
}

// ===== STOP ANIMATION WITH FIXED NUMBERS =====
function stopAdvancedScrollAnimation(draw) {
    const scroll2D = document.getElementById('scroll2D');
    const scroll3D = document.getElementById('scroll3D');

    // Stop 2D animation with fixed number
    if (scroll2D) {
        scroll2D.classList.add('stopped');
        scroll2D.innerHTML = `<div class="winning-number">${draw.fixed_digit2}</div>`;
    }

    // Stop 3D animation with fixed number  
    if (scroll3D) {
        scroll3D.classList.add('stopped');
        scroll3D.innerHTML = `<div class="winning-number">${draw.fixed_digit3}</div>`;
    }

    // Show celebration effects
    setTimeout(() => {
        showWinningNumberEffect(draw);
    }, 500);

    // Resume normal animation after 10 seconds
    setTimeout(() => {
        if (scroll2D) scroll2D.classList.remove('stopped');
        if (scroll3D) scroll3D.classList.remove('stopped');
        startAdvancedLotteryAnimation();
    }, 10000);
}

// ===== WINNING NUMBER EFFECTS =====
function showWinningNumberEffect(draw) {
    // Add special effects for winning numbers
    const scroll2D = document.getElementById('scroll2D');
    const scroll3D = document.getElementById('scroll3D');
    
    if (scroll2D) {
        scroll2D.style.animation = 'winningGlow 2s ease-in-out';
    }
    if (scroll3D) {
        scroll3D.style.animation = 'winningGlow 2s ease-in-out';
    }
    
    // Reset animation
    setTimeout(() => {
        if (scroll2D) scroll2D.style.animation = '';
        if (scroll3D) scroll3D.style.animation = '';
    }, 2000);
}

// ===== RESULT HISTORY =====
function addToAdvancedResultHistory(draw) {
    const result = {
        id: draw.id,
        name: draw.name,
        '2D': draw.fixed_digit2,
        '3D': draw.fixed_digit3,
        start_time: draw.start_time,
        stop_time: draw.stop_time,
        timestamp: new Date().toISOString()
    };

    resultHistory.unshift(result);
    if (resultHistory.length > 100) { // Keep more history
        resultHistory = resultHistory.slice(0, 100);
    }

    localStorage.setItem('resultHistory', JSON.stringify(resultHistory));
    displayAdvancedResultHistory();
}

// ===== DISPLAY ADVANCED RESULT HISTORY =====
function displayAdvancedResultHistory() {
    const historyContainer = document.getElementById('resultHistory');
    if (!historyContainer) return;

    historyContainer.innerHTML = '';

    resultHistory.slice(0, 15).forEach(result => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <strong>${result.name || 'Draw'}</strong><br>
                <span>2D: ${result['2D']} | 3D: ${result['3D']}</span>
            </div>
            <div style="text-align: right; font-size: 0.8rem;">
                <div>${result.start_time} - ${result.stop_time}</div>
                <small>${new Date(result.timestamp).toLocaleDateString()}</small>
            </div>
        `;
        historyContainer.appendChild(historyItem);
    });

    if (resultHistory.length === 0) {
        historyContainer.innerHTML = '<div class="history-item"><span>No results yet</span></div>';
    }
}

// ===== ENHANCED SOUND EFFECTS =====
function playDrawStartSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Start sound - ascending tones
        [440, 523, 659].forEach((freq, index) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.3);
            }, index * 100);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playDrawStopSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Stop sound - descending tones
        [1047, 784, 659, 523].forEach((freq, index) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                gain.gain.setValueAtTime(0.15, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.4);
            }, index * 150);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ===== INITIALIZE ADVANCED SYSTEM =====
document.addEventListener('DOMContentLoaded', function() {
    updateClock();
    setInterval(updateClock, 1000);
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        startAdvancedLotteryAnimation();
        checkAdvancedManualDraws();
        setInterval(checkAdvancedManualDraws, 1000); // Check every second
        displayAdvancedResultHistory();
    }
});

// ===== CLOCK FUNCTION =====
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

// ===== NOTIFICATIONS =====
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

// ===== EXPORT FOR TESTING =====
window.manualDrawsSystem = {
    manualDraws,
    checkAdvancedManualDraws,
    getNextAdvancedDraw,
    currentDrawState
};
