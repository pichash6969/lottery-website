// script.js

// ---------- CLOCK ----------
function updateClock() {
    const clockEl = document.getElementById('clock');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB'); // HH:MM:SS
    clockEl.textContent = timeStr;
}
setInterval(updateClock, 1000);
updateClock();

// ---------- USER DATA ----------
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function updateUserUI() {
    if (currentUser) {
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('balance').textContent = `${currentUser.balance} 🪙`;
        document.getElementById('vipBadge').textContent = currentUser.vipLevel;
        if (currentUser.profileImg) {
            document.getElementById('profileImg').src = currentUser.profileImg;
        }
    }
}
updateUserUI();

// ---------- PROFILE IMAGE UPLOAD ----------
document.getElementById('upload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
            document.getElementById('profileImg').src = ev.target.result;
            currentUser.profileImg = ev.target.result;
            saveUserData();
        }
        reader.readAsDataURL(file);
    }
});

// ---------- MANUAL DRAWS ----------
let manualDraws = [
    { start: '00:00:05', stop: '00:00:10', fixed2: 12, fixed3: 345 },
    { start: '00:00:15', stop: '00:00:20', fixed2: 45, fixed3: 678 }
];

let scroll2El = document.getElementById('scroll2');
let scroll3El = document.getElementById('scroll3');

function generateNumbers(container, maxDigit, repeat = 10) {
    container.innerHTML = '';
    for (let r = 0; r < repeat; r++) {
        for (let i = 0; i <= maxDigit; i++) {
            let div = document.createElement('div');
            div.className = 'number-item';
            div.textContent = i.toString().padStart(maxDigit >= 100 ? 3 : 2, '0');
            container.appendChild(div);
        }
    }
}

// ---------- SCROLLING ----------
let scrollSpeed2 = 50; // ms per move
let scrollSpeed3 = 30;

let scroll2Interval, scroll3Interval;
function startScroll(el, speed) {
    let offset = 0;
    scroll2Interval = setInterval(() => {
        offset -= 1;
        el.style.transform = `translateY(${offset}px)`;
        if (offset <= -el.scrollHeight / 10) offset = 0;
    }, speed);
}
function startScroll3(el, speed) {
    let offset = 0;
    scroll3Interval = setInterval(() => {
        offset -= 1;
        el.style.transform = `translateY(${offset}px)`;
        if (offset <= -el.scrollHeight / 10) offset = 0;
    }, speed);
}

// ---------- STOP SCROLL ----------
function stopScroll(el, fixedNumber) {
    clearInterval(scroll2Interval);
    clearInterval(scroll3Interval);
    // Highlight
    let items = el.querySelectorAll('.number-item');
    items.forEach(item => item.classList.remove('highlight'));
    let idx = fixedNumber;
    if (fixedNumber > 99) idx = fixedNumber; // for 3-digit
    if (items[idx]) items[idx].classList.add('highlight');
}

// ---------- RESULT HISTORY ----------
function addResultHistory(twoDigit, threeDigit) {
    const container = document.getElementById('resultHistory');
    const now = new Date();
    const row = document.createElement('div');
    row.textContent = `${now.toLocaleTimeString()} - 2D: ${twoDigit.toString().padStart(2, '0')} | 3D: ${threeDigit.toString().padStart(3, '0')}`;
    container.prepend(row);
}

// ---------- NOTIFICATION ----------
function notify(msg) {
    const el = document.getElementById('notification');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ---------- USER DATA SAVE ----------
function saveUserData() {
    if (currentUser) {
        users[currentUser.username] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserUI();
    }
}

// ---------- RUN MANUAL DRAWS ----------
function runManualDraws() {
    generateNumbers(scroll2El, 99);
    generateNumbers(scroll3El, 999);

    startScroll(scroll2El, scrollSpeed2);
    startScroll3(scroll3El, scrollSpeed3);

    setInterval(() => {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
        manualDraws.forEach(draw => {
            if (timeStr === draw.start) {
                startScroll(scroll2El, scrollSpeed2);
                startScroll3(scroll3El, scrollSpeed3);
                notify(`Draw started!`);
            }
            if (timeStr === draw.stop) {
                stopScroll(scroll2El, draw.fixed2);
                stopScroll(scroll3El, draw.fixed3);
                addResultHistory(draw.fixed2, draw.fixed3);
                notify(`Draw stopped! 2D:${draw.fixed2} 3D:${draw.fixed3}`);
            }
        });
    }, 1000);
}

runManualDraws();
