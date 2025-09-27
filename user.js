// user.js

// ---------- LOGIN / SIGNUP ----------
function signup(username) {
    users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username]) {
        alert('Username already exists!');
        return false;
    }
    let newUser = {
        username: username,
        balance: 1000, // default coins
        vipLevel: 'VIP1',
        profileImg: '',
        achievements: []
    };
    users[username] = newUser;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    currentUser = newUser;
    updateUserUI();
    notify(`Signed up! Welcome ${username}`);
    return true;
}

function login(username) {
    users = JSON.parse(localStorage.getItem('users')) || {};
    if (!users[username]) {
        alert('User not found!');
        return false;
    }
    currentUser = users[username];
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserUI();
    notify(`Logged in! Welcome back ${username}`);
    return true;
}

// ---------- VIP LEVEL ----------
function updateVIP() {
    if (!currentUser) return;
    const bal = currentUser.balance;
    if (bal >= 10000) currentUser.vipLevel = 'VIP3';
    else if (bal >= 5000) currentUser.vipLevel = 'VIP2';
    else currentUser.vipLevel = 'VIP1';
    saveUserData();
}

// ---------- REDEEM CODES ----------
const redeemCodes = {
    "WELCOME100": 100,
    "VIP500": 500
};

function redeemCode(code) {
    if (!currentUser) return;
    code = code.toUpperCase();
    if (redeemCodes[code]) {
        currentUser.balance += redeemCodes[code];
        updateVIP();
        saveUserData();
        notify(`Redeemed ${redeemCodes[code]} coins!`);
        delete redeemCodes[code]; // one-time use
    } else {
        alert('Invalid or already used code');
    }
}

// ---------- COIN ANIMATION ----------
function animateCoin(amount) {
    const el = document.getElementById('balance');
    const start = currentUser.balance - amount;
    let temp = start;
    const step = amount > 0 ? 1 : -1;
    const interval = setInterval(() => {
        temp += step;
        el.textContent = `${temp} 🪙`;
        if (temp === currentUser.balance) clearInterval(interval);
    }, 20);
}

// ---------- SAVE USER DATA ----------
function saveUserData() {
    if (currentUser) {
        users[currentUser.username] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserUI();
    }
}

// ---------- LOGOUT ----------
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.reload();
}
