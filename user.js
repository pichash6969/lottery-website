// User management variables
let currentUser = localStorage.getItem('currentUser');
let users = JSON.parse(localStorage.getItem('users')) || {};

// Redeem codes
const redeemCodes = {
    'WELCOME100': 100,
    'LUCKY50': 50,
    'VIP200': 200,
    'BONUS75': 75,
    'GOLD300': 300
};

// VIP thresholds
const vipThresholds = {
    1: 0,
    2: 1000,
    3: 5000
};

// Initialize user system
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupLogoutButton();
});

// Check login status
function checkLoginStatus() {
    if (currentUser && users[currentUser]) {
        updateUserInfo();
        updateLoginButton();
        
        // Redirect from login page if already logged in
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
    } else {
        // Redirect to login if not logged in and not on login page
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
}

// Login function
function login() {
    const username = document.getElementById('usernameInput').value.trim();

    if (!username) {
        showNotification('Please enter username', 'error');
        return;
    }

    if (!users[username]) {
        showNotification('User not found. Please sign up first.', 'error');
        return;
    }

    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    window.location.href = 'index.html';
}

// Signup function
function signup() {
    const username = document.getElementById('usernameInput').value.trim();
    const profileImage = document.getElementById('profileImageInput').value.trim() || 'https://via.placeholder.com/60';

    if (!username) {
        showNotification('Please enter username', 'error');
        return;
    }

    if (users[username]) {
        showNotification('Username already exists', 'error');
        return;
    }

    users[username] = {
        balance: 500,
        vip: 1,
        profileImage: profileImage,
        createdAt: new Date().toISOString(),
        redeemedCodes: []
    };

    localStorage.setItem('users', JSON.stringify(users));

    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    window.location.href = 'index.html';
}

// Update user info display
function updateUserInfo() {
    if (!currentUser || !users[currentUser]) return;

    const user = users[currentUser];
    
    // Update VIP level
    const vipLevel = getVIPLevel(user.balance);
    user.vip = vipLevel;

    // Update main user info
    const userInfo = document.getElementById('userInfo');
    const username = document.getElementById('username');
    const balance = document.getElementById('balance');
    const vipBadge = document.getElementById('vipBadge');
    const profileImage = document.getElementById('profileImage');

    if (userInfo) userInfo.style.display = 'flex';
    if (username) username.textContent = currentUser;
    if (balance) balance.textContent = user.balance;
    if (profileImage) profileImage.src = user.profileImage;
    if (vipBadge) {
        vipBadge.textContent = 'VIP' + vipLevel;
        vipBadge.className = 'vip-badge vip' + vipLevel;
    }

    // Save updated user data
    users[currentUser] = user;
    localStorage.setItem('users', JSON.stringify(users));
}

// Update balance page
function updateBalancePage() {
    if (!currentUser || !users[currentUser]) return;

    const user = users[currentUser];
    const balanceUsername = document.getElementById('balanceUsername');
    const balanceAmount = document.getElementById('balanceAmount');
    const balanceVipBadge = document.getElementById('balanceVipBadge');
    const balanceProfileImage = document.getElementById('balanceProfileImage');

    if (balanceUsername) balanceUsername.textContent = currentUser;
    if (balanceAmount) balanceAmount.textContent = user.balance;
    if (balanceProfileImage) balanceProfileImage.src = user.profileImage;
    if (balanceVipBadge) {
        balanceVipBadge.textContent = 'VIP' + user.vip;
        balanceVipBadge.className = 'vip-badge vip' + user.vip;
    }
}

// Get VIP level based on balance
function getVIPLevel(balance) {
    if (balance >= vipThresholds[3]) return 3;
    if (balance >= vipThresholds[2]) return 2;
    return 1;
}

// Redeem code function
function redeemCode() {
    if (!currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    const code = document.getElementById('redeemCode').value.trim().toUpperCase();
    if (!code) {
        showNotification('Please enter a redeem code', 'error');
        return;
    }

    if (!redeemCodes[code]) {
        showNotification('Invalid redeem code', 'error');
        return;
    }

    const user = users[currentUser];
    
    // Check if code already used
    if (!user.redeemedCodes) user.redeemedCodes = [];
    if (user.redeemedCodes.includes(code)) {
        showNotification('Code already redeemed', 'error');
        return;
    }

    // Redeem code
    const redeemAmount = redeemCodes[code];
    user.balance += redeemAmount;
    user.redeemedCodes.push(code);
    users[currentUser] = user;
    localStorage.setItem('users', JSON.stringify(users));

    // Update UI
    updateUserInfo();
    updateBalancePage();
    animateBalance();
    
    document.getElementById('redeemCode').value = '';
    showNotification(`Successfully redeemed ${redeemAmount} coins!`, 'success');
}

// Balance animation
function animateBalance() {
    const balance = document.getElementById('balance');
    const balanceAmount = document.getElementById('balanceAmount');
    
    [balance, balanceAmount].forEach(element => {
        if (element) {
            element.classList.add('balance-animation');
            setTimeout(() => {
                element.classList.remove('balance-animation');
            }, 500);
        }
    });
}

// Update login button
function updateLoginButton() {
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.textContent = currentUser ? 'Logout' : 'Login';
    }
}

// Setup logout functionality
function setupLogoutButton() {
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUser) {
                // Logout
                currentUser = null;
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            } else {
                window.location.href = 'login.html';
            }
        });
    }
}
