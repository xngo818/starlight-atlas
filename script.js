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

function register(username, password) {
    if (!username || !password) return 'Username/Password cannot be empty';
    const users = getUsers();
    if (users[username]) return 'Username already exists';
    users[username] = {
        password: password,
        data: {}
    };
    saveUsers(users);
    initUserData(username);
    return 'success';
}

function login(username, password) {
    const users = getUsers();
    if (!users[username]) return 'User does not exist';
    if (users[username].password !== password) return 'Incorrect password';
    currentUser = username;
    localStorage.setItem('starlight_currentUser', username);
    return 'success';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('starlight_currentUser');
    window.location.href = "./login.html";
}

function checkAutoLogin() {
    const savedUser = localStorage.getItem('starlight_currentUser');
    if (savedUser && getUsers()[savedUser]) {
        currentUser = savedUser;
        initUserData(currentUser);
        return true;
    }
    return false;
}

// ======================= Data Read/Write (User-based) =======================
function getUserDataForConstellation(constId) {
    if (!currentUser) return null;
    const users = getUsers();
    return users[currentUser].data[constId];
}

function saveLitStatusForConstellation(constId, status) {
    if (!currentUser) return;
    const users = getUsers();
    users[currentUser].data[constId].litStatus = status;
    saveUsers(users);
}

function getLitStatus(constId) {
    const data = getUserDataForConstellation(constId);
    return data ? data.litStatus : new Array(constellationsData[constId].starCount).fill(false);
}

function setLastCheckin(constId, dateStr) {
    const users = getUsers();
    users[currentUser].data[constId].lastCheckin = dateStr;
    saveUsers(users);
}

function getLastCheckin(constId) {
    const data = getUserDataForConstellation(constId);
    return data ? data.lastCheckin : '';
}

function setNoteForConstellation(constId, note) {
    const users = getUsers();
    users[currentUser].data[constId].notes = note;
    saveUsers(users);
}

function getNoteForConstellation(constId) {
    const data = getUserDataForConstellation(constId);
    return data ? data.notes : '';
}

function getStarNote(constId, starIndex) {
    const data = getUserDataForConstellation(constId);
    return data && data.starNotes ? data.starNotes[starIndex] : '';
}

function setStarNote(constId, starIndex, note) {
    if (!currentUser) return;
    const users = getUsers();
    if (!users[currentUser].data[constId].starNotes) {
        users[currentUser].data[constId].starNotes = new Array(constellationsData[constId].starCount).fill('');
    }
    users[currentUser].data[constId].starNotes[starIndex] = note;
    saveUsers(users);
}

// ======================= View Switching =======================
function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.style.display = 'none';
    });
    const target = document.getElementById(viewId);
    if (target) target.style.display = 'block';
}

// ======================= Load Constellation Data =======================
function loadConstellationData(constellationId) {
    const data = constellationsData[constellationId];
    if (!data) return;

    document.getElementById('current-constellation-name').innerText = data.name;

    const container = document.getElementById('star-chart');
    container.innerHTML = '';
    starElements = [];

    for (let i = 0; i < data.starCount; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.setAttribute('data-star-index', i);
        star.style.left = data.positions[i].left;
        star.style.top = data.positions[i].top;
        container.appendChild(star);
        starElements.push(star);
    }

    // 绘制星座连线
    drawConstellationLines(data);

    litStatus = getLitStatus(constellationId).slice();

    litStatus.forEach((isLit, idx) => {
        if (isLit && starElements[idx]) starElements[idx].classList.add('lit');
        else if (starElements[idx]) starElements[idx].classList.remove('lit');
    });

    // 检查是否所有星星都已点亮
    checkAllStarsLit();
}

function drawConstellationLines(data) {
    const container = document.getElementById('star-chart');
    if (!data.connections) return;

    data.connections.forEach((connection, index) => {
        const [startIndex, endIndex] = connection;
        const startStar = starElements[startIndex];
        const endStar = starElements[endIndex];

        if (startStar && endStar) {
            const line = document.createElement('div');
            line.className = 'constellation-line';
            line.id = `line-${index}`;

            const startRect = startStar.getBoundingClientRect();
            const endRect = endStar.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const startX = startRect.left - containerRect.left + startRect.width / 2;
            const startY = startRect.top - containerRect.top + startRect.height / 2;
            const endX = endRect.left - containerRect.left + endRect.width / 2;
            const endY = endRect.top - containerRect.top + endRect.height / 2;

            const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

            line.style.width = `${length}px`;
            line.style.height = '2px';
            line.style.left = `${startX}px`;
            line.style.top = `${startY}px`;
            line.style.transformOrigin = '0 0';
            line.style.transform = `rotate(${angle}deg)`;

            container.appendChild(line);
        }
    });
}

function checkAllStarsLit() {
    const allLit = litStatus.every(status => status === true);
    if (allLit) {
        // 显示星座连线
        const lines = document.querySelectorAll('.constellation-line');
        lines.forEach((line, index) => {
            setTimeout(() => {
                line.classList.add('visible');
            }, index * 200);
        });

        // 显示星座图片
        setTimeout(() => {
            const container = document.getElementById('star-chart');
            const image = document.createElement('div');
            image.className = 'constellation-image';
            // 这里可以根据星座ID设置不同的图片
            // image.style.backgroundImage = `url('${currentConstellation}-constellation.png')`;
            container.appendChild(image);

            setTimeout(() => {
                image.classList.add('visible');
            }, 500);
        }, 1500);
    }
}

// ======================= Check-in Logic =======================
function getTodayStr() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function hasCheckedInToday() {
    const last = getLastCheckin(currentConstellation);
    return last === getTodayStr();
}

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
}

// ======================= Notes Sidebar =======================
function initNotesSidebar() {
    const sidebar = document.getElementById('notes-sidebar');
    const notesBtn = document.getElementById('notes-btn');
    const closeBtn = document.getElementById('close-sidebar');
    const saveBtn = document.getElementById('save-note');
    const noteTextarea = document.getElementById('note-content');
    const starSelect = document.getElementById('star-select');
    const historyList = document.getElementById('history-list');

    if (!sidebar || !notesBtn) return;

    notesBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        populateStarSelect();
        loadNoteForSelectedStar();
        loadNotesHistory();
    });

    if (starSelect) {
        starSelect.addEventListener('change', loadNoteForSelectedStar);
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
        if (starIndex === -1) {
            const savedNote = getNoteForConstellation(currentConstellation);
            noteTextarea.value = savedNote;
        } else {
            const savedNote = getStarNote(currentConstellation, starIndex);
            noteTextarea.value = savedNote;
        }
    }

    function loadNotesHistory() {
        if (!historyList) return;
        historyList.innerHTML = '';
        const data = getUserDataForConstellation(currentConstellation);
        if (!data) return;

        // Add global note history
        if (data.notes) {
            const globalNoteItem = document.createElement('div');
            globalNoteItem.className = 'history-item';
            globalNoteItem.innerHTML = `
                <div class="date">Global Note</div>
                <div class="content">${data.notes.substring(0, 50)}${data.notes.length > 50 ? '...' : ''}</div>
            `;
            historyList.appendChild(globalNoteItem);
        }

        // Add star notes history
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
            const constId = card.dataset.constellation;
            if (constId) {
                currentConstellation = constId;
                loadConstellationData(constId);
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

// ======================= 分享功能 =======================
function generateShareImage() {
    const starChart = document.getElementById('star-chart');
    if (!starChart) return;

    // 创建一个分享容器
    const shareContainer = document.createElement('div');
    shareContainer.style.position = 'absolute';
    shareContainer.style.top = '-9999px';
    shareContainer.style.left = '-9999px';
    shareContainer.style.width = '600px';
    shareContainer.style.height = '400px';
    shareContainer.style.background = '#1e1b14';
    shareContainer.style.border = '2px solid #d4af6a';
    shareContainer.style.borderRadius = '48px';
    shareContainer.style.padding = '20px';
    document.body.appendChild(shareContainer);

    // 复制星图内容
    const starChartCopy = starChart.cloneNode(true);
    starChartCopy.style.width = '100%';
    starChartCopy.style.height = '300px';
    shareContainer.appendChild(starChartCopy);

    // 添加标题
    const title = document.createElement('h2');
    title.style.textAlign = 'center';
    title.style.color = '#ecd9a3';
    title.style.marginTop = '10px';
    title.style.fontSize = '1.5rem';
    title.textContent = `${constellationsData[currentConstellation].name} - 星光图鉴`;
    shareContainer.appendChild(title);

    // 使用html2canvas生成图片
    html2canvas(shareContainer, {
        scale: 2,
        useCORS: true
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = `${currentConstellation}-star-chart.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Clean up temporary container
        document.body.removeChild(shareContainer);

        alert('Share image generated, please save! 📸');
    }).catch(error => {
        console.error('Failed to generate share image:', error);
        alert('Failed to generate share image, please try again');
        document.body.removeChild(shareContainer);
    });
}

function generateCertificate() {
    // Check if all stars are lit
    const allLit = litStatus.every(status => status === true);
    if (!allLit) {
        alert('Please light up all stars and complete the constellation atlas before generating the certificate!');
        return;
    }

    // Create certificate container
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

    // Add certificate title
    const title = document.createElement('h1');
    title.style.color = '#ecd9a3';
    title.style.fontSize = '2.5rem';
    title.style.marginBottom = '30px';
    title.style.textShadow = '0 2px 10px #000000';
    title.textContent = 'Starlight Atlas Completion Certificate';
    certificateContainer.appendChild(title);

    // Add decorative line
    const line = document.createElement('div');
    line.style.width = '600px';
    line.style.height = '2px';
    line.style.background = '#d4af6a';
    line.style.margin = '0 auto 30px';
    certificateContainer.appendChild(line);

    // Add certificate content
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

    // Add star chart
    const starChart = document.getElementById('star-chart');
    if (starChart) {
        const starChartCopy = starChart.cloneNode(true);
        starChartCopy.style.width = '400px';
        starChartCopy.style.height = '250px';
        starChartCopy.style.margin = '0 auto 30px';
        certificateContainer.appendChild(starChartCopy);
    }

    // Add date
    const date = document.createElement('p');
    date.style.color = '#bfa16c';
    date.style.fontSize = '1rem';
    date.textContent = `Date: ${new Date().toLocaleDateString()}`;
    certificateContainer.appendChild(date);

    // Generate certificate image using html2canvas
    html2canvas(certificateContainer, {
        scale: 2,
        useCORS: true
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = `${currentConstellation}-certificate.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Clean up temporary container
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
    const loginMsg = document.getElementById('login-message');
    const regMsg = document.getElementById('reg-message');
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
    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            loginMsg.innerText = 'Please enter username and password';
            return;
        }

        const result = login(username, password);

        if (result === 'success') {
            showView('constellation-selector');
            currentConstellation = 'cygnus';
            loadConstellationData('cygnus');
        }

        else {
            loginMsg.innerText = result;
        }
    });

    registerBtn.addEventListener('click', () => {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;

        if (!username || !password) {
            regMsg.innerText = 'Please enter username and password';
            return;
        }

        const result = register(username, password);

        if (result === 'success') {
            regMsg.innerText = 'Registration successful, please login';
            loginTab.click();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = '';
        }

        else {
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

// ======================= Initialization =======================
// Start
function init() {
    initAuth();
    bindEvents();
    initNotesSidebar();
    animateCards();
    if (checkAutoLogin()) {
        showView('constellation-selector');
        currentConstellation = 'cygnus';
        loadConstellationData('cygnus');
    } else {
        showView('auth-view');
    }
}

// 启动
init();