// ======================= Supabase Initialization =======================
const supabaseUrl = 'https://rbmacioczbhakjlbcinn.supabase.co';
const supabaseKey = 'sb_publishable_f43s3f4cM-5iRNoq5fXBEg_YmlD4g0B';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ======================= Constellation Data =======================
const constellationsData = {
    cygnus: {
        name: 'Cygnus',
        starCount: 7,
        positions: [
            { left: '20%', top: '30%' },
            { left: '35%', top: '25%' },
            { left: '50%', top: '28%' },
            { left: '65%', top: '35%' },
            { left: '55%', top: '50%' },
            { left: '40%', top: '55%' },
            { left: '25%', top: '48%' }
        ],
        connections: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1]
        ]
    },
    cassiopeia: {
        name: 'Cassiopeia',
        starCount: 5,
        positions: [
            { left: '30%', top: '40%' },
            { left: '45%', top: '35%' },
            { left: '60%', top: '38%' },
            { left: '50%', top: '55%' },
            { left: '35%', top: '60%' }
        ],
        connections: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 0]
        ]
    }
};

// ======================= Global Variables =======================
let currentUser = null;
let currentConstellation = 'cygnus';
let starElements = [];
let litStatus = [];

// ======================= User Data Management =======================
function getUsers() {
    const users = localStorage.getItem('starlight_users');
    return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
    localStorage.setItem('starlight_users', JSON.stringify(users));
}

function initUserData(username) {
    const users = getUsers();
    if (!users[username]) return;
    if (!users[username].data) users[username].data = {};
    for (let constId in constellationsData) {
        if (!users[username].data[constId]) {
            users[username].data[constId] = {
                litStatus: new Array(constellationsData[constId].starCount).fill(false),
                lastCheckin: '',
                starNotes: new Array(constellationsData[constId].starCount).fill(''),
                notes: ''
            };
        } else if (!users[username].data[constId].starNotes) {
            users[username].data[constId].starNotes = new Array(constellationsData[constId].starCount).fill('');
        }
    }
    saveUsers(users);
}

async function register(email, password) {
    if (!email || !password) return 'Email/Password cannot be empty';

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: `${window.location.origin}/login.html`
        }
    });

    if (error) {
        return error.message;
    }

    if (data.user) {
        const users = getUsers();
        if (!users[email]) {
            users[email] = {
                password: password,
                data: {}
            };
            saveUsers(users);
            initUserData(email);
        }
        return 'success';
    }

    return 'Registration failed';
}

async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        return error.message;
    }

    if (data.user) {
        currentUser = data.user.email;
        localStorage.setItem('starlight_currentUser', data.user.email);
        return 'success';
    }

    return 'Login failed';
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    localStorage.removeItem('starlight_currentUser');
    window.location.href = "./login.html";
}

function checkAutoLogin() {
    const savedUser = localStorage.getItem('starlight_currentUser');
    if (savedUser && getUsers()[savedUser]) {
        currentUser = savedUser;
        return true;
    }
    return false;
}

function getUserDataForConstellation(constellationId) {
    if (!currentUser) return null;
    const users = getUsers();
    if (!users[currentUser] || !users[currentUser].data) {
        initUserData(currentUser);
        return getUserDataForConstellation(constellationId);
    }
    return users[currentUser].data[constellationId] || null;
}

function getLitStatusForConstellation(constellationId) {
    const data = getUserDataForConstellation(constellationId);
    if (!data) return new Array(constellationsData[constellationId].starCount).fill(false);
    return data.litStatus || new Array(constellationsData[constellationId].starCount).fill(false);
}

function saveLitStatusForConstellation(constellationId, status) {
    if (!currentUser) return;
    const users = getUsers();
    if (!users[currentUser].data[constellationId]) {
        users[currentUser].data[constellationId] = {};
    }
    users[currentUser].data[constellationId].litStatus = status;
    saveUsers(users);
}

function getLastCheckin(constellationId) {
    const data = getUserDataForConstellation(constellationId);
    return data ? data.lastCheckin : '';
}

function setLastCheckin(constellationId, dateStr) {
    if (!currentUser) return;
    const users = getUsers();
    if (!users[currentUser].data[constellationId]) {
        users[currentUser].data[constellationId] = {};
    }
    users[currentUser].data[constellationId].lastCheckin = dateStr;
    saveUsers(users);
}

function getNoteForConstellation(constellationId) {
    const data = getUserDataForConstellation(constellationId);
    return data ? data.notes : '';
}

function setNoteForConstellation(constellationId, note) {
    if (!currentUser) return;
    const users = getUsers();
    if (!users[currentUser].data[constellationId]) {
        users[currentUser].data[constellationId] = {};
    }
    users[currentUser].data[constellationId].notes = note;
    saveUsers(users);
}

function getStarNote(constellationId, starIndex) {
    const data = getUserDataForConstellation(constellationId);
    if (!data || !data.starNotes) return '';
    return data.starNotes[starIndex] || '';
}

function setStarNote(constellationId, starIndex, note) {
    if (!currentUser) return;
    const users = getUsers();
    if (!users[currentUser].data[constellationId]) {
        users[currentUser].data[constellationId] = {};
    }
    if (!users[currentUser].data[constellationId].starNotes) {
        users[currentUser].data[constellationId].starNotes = new Array(constellationsData[constellationId].starCount).fill('');
    }
    users[currentUser].data[constellationId].starNotes[starIndex] = note;
    saveUsers(users);
}

// ======================= Date Utilities =======================
function getTodayStr() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function hasCheckedInToday() {
    const lastCheckin = getLastCheckin(currentConstellation);
    return lastCheckin === getTodayStr();
}

// ======================= Star Chart Rendering =======================
function loadConstellationData(constellationId) {
    const container = document.getElementById('star-chart');
    if (!container) return;

    container.innerHTML = '';
    starElements = [];

    const data = constellationsData[constellationId];
    if (!data) return;

    litStatus = getLitStatusForConstellation(constellationId);

    data.positions.forEach((pos, index) => {
        const star = document.createElement('div');
        star.className = `star ${litStatus[index] ? 'lit' : ''}`;
        star.style.left = pos.left;
        star.style.top = pos.top;
        star.setAttribute('data-index', index);
        container.appendChild(star);
        starElements.push(star);
    });

    // Draw constellation lines if all stars are lit
    if (litStatus.every(s => s === true)) {
        drawConstellationLines(data);
    }

    updateProgress();
}

function drawConstellationLines(data) {
    const container = document.getElementById('star-chart');
    if (!container) return;

    data.connections.forEach((conn, index) => {
        const star1 = starElements[conn[0]];
        const star2 = starElements[conn[1]];
        if (!star1 || !star2) return;

        const rect1 = star1.getBoundingClientRect();
        const rect2 = star2.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const x1 = rect1.left - containerRect.left + rect1.width / 2;
        const y1 = rect1.top - containerRect.top + rect1.height / 2;
        const x2 = rect2.left - containerRect.left + rect2.width / 2;
        const y2 = rect2.top - containerRect.top + rect2.height / 2;

        const line = document.createElement('div');
        line.className = 'constellation-line';
        line.style.setProperty('--x1', `${x1}px`);
        line.style.setProperty('--x2', `${x2}px`);
        line.style.setProperty('--y1', `${y1}px`);
        line.style.setProperty('--y2', `${y2}px`);

        setTimeout(() => {
            line.classList.add('visible');
        }, index * 200);

        container.appendChild(line);
    });

    setTimeout(() => {
        const container = document.getElementById('star-chart');
        const image = document.createElement('div');
        image.className = 'constellation-image';
        container.appendChild(image);

        setTimeout(() => {
            image.classList.add('visible');
        }, 100);
    }, data.connections.length * 200 + 300);
}

function updateProgress() {
    const progress = document.getElementById('progress');
    const litCount = litStatus.filter(s => s === true).length;
    const total = litStatus.length;
    if (progress) {
        progress.innerText = `${litCount}/${total}`;
    }
}

// ======================= Check-in Function =======================
function markCheckinToday() {
    setLastCheckin(currentConstellation, getTodayStr());
}

function checkIn() {
    if (!currentUser) return;

    if (hasCheckedInToday()) {
        alert('You already checked in today, come back tomorrow! ✨');
        return;
    }

    const nextIndex = litStatus.findIndex(status => status === false);

    if (nextIndex === -1) {
        alert('Congratulations! You have lit up all the stars and completed this constellation atlas! 🎉');
        return;
    }

    litStatus[nextIndex] = true;
    if (starElements[nextIndex]) starElements[nextIndex].classList.add('lit');
    saveLitStatusForConstellation(currentConstellation, litStatus);
    markCheckinToday();

    alert(`✨ Lit up star ${nextIndex + 1}! Keep going～`);

    updateProgress();

    if (litStatus.every(s => s === true)) {
        setTimeout(() => {
            drawConstellationLines(constellationsData[currentConstellation]);
        }, 500);
    }
}

// ======================= Notes Sidebar =======================
function initNotesSidebar() {
    const sidebar = document.getElementById('notes-sidebar');
    const openBtn = document.getElementById('open-notes');
    const closeBtn = document.getElementById('close-notes');
    const saveBtn = document.getElementById('save-note');
    const starSelect = document.getElementById('star-select');
    const noteTextarea = document.getElementById('note-textarea');
    const historyList = document.getElementById('history-list');

    if (openBtn) {
        openBtn.addEventListener('click', () => sidebar.classList.add('open'));
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const starIndex = parseInt(starSelect.value);
            const note = noteTextarea.value;
            if (starIndex === -1) {
                setNoteForConstellation(currentConstellation, note);
            } else {
                setStarNote(currentConstellation, starIndex, note);
            }
            alert('Note saved 🌙');
            loadNotesHistory();
        });
    }

    function populateStarSelect() {
        if (!starSelect) return;
        starSelect.innerHTML = '<option value="-1">Constellation Global Note</option>';
        const data = constellationsData[currentConstellation];
        if (data) {
            for (let i = 0; i < data.starCount; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Star ${i + 1}`;
                starSelect.appendChild(option);
            }
        }
    }

    function loadNoteForSelectedStar() {
        if (!starSelect || !noteTextarea) return;
        const starIndex = parseInt(starSelect.value);
        let savedNote = '';
        if (starIndex === -1) {
            savedNote = getNoteForConstellation(currentConstellation);
        } else {
            savedNote = getStarNote(currentConstellation, starIndex);
        }
        noteTextarea.value = savedNote;
    }

    function loadNotesHistory() {
        if (!historyList) return;
        historyList.innerHTML = '';
        const data = getUserDataForConstellation(currentConstellation);
        if (!data) return;

        if (data.notes) {
            const globalNoteItem = document.createElement('div');
            globalNoteItem.className = 'history-item';
            globalNoteItem.innerHTML = `
                <div class="date">Global Note</div>
                <div class="content">${data.notes.substring(0, 50)}${data.notes.length > 50 ? '...' : ''}</div>
            `;
            historyList.appendChild(globalNoteItem);
        }

        if (data.starNotes) {
            data.starNotes.forEach((note, index) => {
                if (note) {
                    const starNoteItem = document.createElement('div');
                    starNoteItem.className = 'history-item';
                    starNoteItem.innerHTML = `
                        <div class="date">Star ${index + 1}</div>
                        <div class="content">${note.substring(0, 50)}${note.length > 50 ? '...' : ''}</div>
                    `;
                    historyList.appendChild(starNoteItem);
                }
            });
        }
    }

    if (starSelect) {
        starSelect.addEventListener('change', loadNoteForSelectedStar);
    }

    populateStarSelect();
    loadNotesHistory();
}

// ======================= Event Binding =======================
function bindEvents() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    const backBtn = document.getElementById('back-to-selector');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showView('constellation-selector');
        });
    }
    const cards = document.querySelectorAll('.constellation-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const constellationId = card.getAttribute('data-constellation');
            if (constellationId) {
                currentConstellation = constellationId;
                loadConstellationData(constellationId);
                showView('observation-view');
            }
        });
    });
    const checkinBtn = document.getElementById('checkin-btn');
    if (checkinBtn) checkinBtn.addEventListener('click', checkIn);
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.addEventListener('click', generateShareImage);
    const certificateBtn = document.getElementById('certificate-btn');
    if (certificateBtn) certificateBtn.addEventListener('click', generateCertificate);
}

// ======================= View Management =======================
function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.style.display = 'none';
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
    }
}

// ======================= Share Image Generation =======================
function generateShareImage() {
    const shareContainer = document.createElement('div');
    shareContainer.style.position = 'absolute';
    shareContainer.style.top = '-9999px';
    shareContainer.style.left = '-9999px';
    shareContainer.style.width = '600px';
    shareContainer.style.background = '#1a1a12';
    shareContainer.style.borderRadius = '20px';
    shareContainer.style.padding = '30px';
    document.body.appendChild(shareContainer);

    const title = document.createElement('h2');
    title.style.color = '#ecd9a3';
    title.style.fontSize = '1.8rem';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.textContent = `${constellationsData[currentConstellation].name} - Starlight Atlas`;
    shareContainer.appendChild(title);

    const starChart = document.getElementById('star-chart');
    if (starChart) {
        const starChartCopy = starChart.cloneNode(true);
        starChartCopy.style.width = '540px';
        starChartCopy.style.height = '300px';
        starChartCopy.style.margin = '0 auto';
        shareContainer.appendChild(starChartCopy);
    }

    const progressDiv = document.createElement('div');
    progressDiv.style.color = '#f0e6c5';
    progressDiv.style.fontSize = '1rem';
    progressDiv.style.textAlign = 'center';
    progressDiv.style.marginTop = '20px';
    const litCount = litStatus.filter(s => s === true).length;
    progressDiv.textContent = `Progress: ${litCount}/${litStatus.length} stars lit`;
    shareContainer.appendChild(progressDiv);

    html2canvas(shareContainer, {
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${currentConstellation}-star-chart.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        document.body.removeChild(shareContainer);

        alert('Share image generated, please save! 📸');
    }).catch(error => {
        console.error('Failed to generate share image:', error);
        alert('Failed to generate share image, please try again');
        document.body.removeChild(shareContainer);
    });
}

// ======================= Certificate Generation =======================
function generateCertificate() {
    const allLit = litStatus.every(status => status === true);
    if (!allLit) {
        alert('Please light up all stars and complete the constellation atlas before generating the certificate!');
        return;
    }

    const certificateContainer = document.createElement('div');
    certificateContainer.style.position = 'absolute';
    certificateContainer.style.top = '-9999px';
    certificateContainer.style.left = '-9999px';
    certificateContainer.style.width = '800px';
    certificateContainer.style.height = '600px';
    certificateContainer.style.background = '#1e1b14';
    certificateContainer.style.border = '4px solid #d4af6a';
    certificateContainer.style.borderRadius = '20px';
    certificateContainer.style.padding = '40px';
    certificateContainer.style.textAlign = 'center';
    document.body.appendChild(certificateContainer);

    const title = document.createElement('h1');
    title.style.color = '#ecd9a3';
    title.style.fontSize = '2.5rem';
    title.style.marginBottom = '30px';
    title.style.textShadow = '0 2px 10px #000000';
    title.textContent = 'Starlight Atlas Completion Certificate';
    certificateContainer.appendChild(title);

    const line = document.createElement('div');
    line.style.width = '600px';
    line.style.height = '2px';
    line.style.background = '#d4af6a';
    line.style.margin = '0 auto 30px';
    certificateContainer.appendChild(line);

    const content = document.createElement('div');
    content.style.color = '#f0e6c5';
    content.style.fontSize = '1.2rem';
    content.style.marginBottom = '40px';
    content.innerHTML = `
        <p>This is to certify that ${currentUser}</p>
        <p>has successfully completed</p>
        <p style="font-size: 1.5rem; font-weight: bold; margin: 20px 0;">${constellationsData[currentConstellation].name}</p>
        <p>all challenges of the constellation atlas</p>
    `;
    certificateContainer.appendChild(content);

    const starChart = document.getElementById('star-chart');
    if (starChart) {
        const starChartCopy = starChart.cloneNode(true);
        starChartCopy.style.width = '400px';
        starChartCopy.style.height = '250px';
        starChartCopy.style.margin = '0 auto 30px';
        certificateContainer.appendChild(starChartCopy);
    }

    const date = document.createElement('p');
    date.style.color = '#bfa16c';
    date.style.fontSize = '1rem';
    date.textContent = `Date: ${new Date().toLocaleDateString()}`;
    certificateContainer.appendChild(date);

    html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${currentConstellation}-certificate.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        document.body.removeChild(certificateContainer);

        alert('Completion certificate generated, please save! 🏆');
    }).catch(error => {
        console.error('Failed to generate certificate:', error);
        alert('Failed to generate certificate, please try again');
        document.body.removeChild(certificateContainer);
    });
}

// ======================= Login/Register Interface =======================
function initAuth() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const loginMsg = document.getElementById('login-msg');
    const regMsg = document.getElementById('reg-msg');

    if (!loginBtn || !registerBtn) {
        console.error("找不到登录/注册按钮，请检查HTML");
        return;
    }
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            loginMsg.innerText = 'Please enter email and password';
            return;
        }

        const result = await login(email, password);

        if (result === 'success') {
            window.location.href = "./index.html";
        } else {
            loginMsg.innerText = result;
        }
    });

    registerBtn.addEventListener('click', async () => {
        const email = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;

        if (!email || !password) {
            regMsg.innerText = 'Please enter email and password';
            return;
        }

        const result = await register(email, password);

        if (result === 'success') {
            regMsg.innerText = 'Registration successful! Please check your email for verification.';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
        } else {
            regMsg.innerText = result;
        }
    });
}

// ======================= Animation Utilities =======================
function animateCards() {
    const cards = document.querySelectorAll('.constellation-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${0.3 + index * 0.15}s`;
    });
}

// ======================= Page Protection =======================
async function checkAuthStatus() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Auth check error:', error);
        return false;
    }

    if (data.user) {
        currentUser = data.user.email;
        localStorage.setItem('starlight_currentUser', data.user.email);
        return true;
    }

    window.location.href = "./login.html";
    return false;
}

// ======================= Initialization =======================
async function init() {
    const isAuthenticated = await checkAuthStatus();

    initAuth();
    bindEvents();
    initNotesSidebar();
    animateCards();

    if (isAuthenticated) {
        showView('constellation-selector');
        currentConstellation = 'cygnus';
        loadConstellationData('cygnus');
    } else {
        showView('auth-view');
    }
}

init();
