// Application State
let currentTab = 'home';
let currentQuizId = null;
let currentQuestionIndex = 0;
let timeRemaining = 0;
let timer = null;
let userAnswers = {};
let selectedAnswer = '';

// Sample data
let availableTags = ["Science", "Math", "History", "Language", "Technology", "Business", "Art", "Music", "Sports", "Health"];
let selectedTags = [];

const quizCards = [
    {
        id: "1",
        name: "Advanced JavaScript Concepts",
        score: 85,
        totalQuestions: 25,
        duration: "30 minutes",
        choiceType: "Multiple Choice",
        tags: ["Technology", "Programming", "JavaScript"]
    },
    {
        id: "2",
        name: "World History Timeline",
        score: 92,
        totalQuestions: 40,
        duration: "45 minutes",
        choiceType: "Multiple Choice",
        tags: ["History", "World Events"]
    },
    {
        id: "3",
        name: "Basic Calculus",
        score: 78,
        totalQuestions: 20,
        duration: "25 minutes",
        choiceType: "Short Answer",
        tags: ["Math", "Calculus", "Science"]
    },
    {
        id: "4",
        name: "English Literature Quiz",
        score: 88,
        totalQuestions: 15,
        duration: "20 minutes",
        choiceType: "Essay",
        tags: ["Language", "Literature", "English"]
    }
];

const quizData = {
    "1": {
        id: "1",
        name: "Advanced JavaScript Concepts",
        difficulty: "Intermediate",
        choiceType: "Multiple Choice",
        duration: 30,
        totalQuestions: 25,
        questions: [
            {
                id: "q1",
                question: "What is the output of the following JavaScript code: console.log(typeof typeof 1)?",
                type: "multiple-choice",
                options: ["number", "string", "undefined", "object"],
                correctAnswer: "string"
            },
            {
                id: "q2",
                question: "Which method is used to add an element to the end of an array in JavaScript?",
                type: "multiple-choice",
                options: ["push()", "pop()", "shift()", "unshift()"],
                correctAnswer: "push()"
            }
        ]
    },
    "2": {
        id: "2",
        name: "World History Timeline",
        difficulty: "Intermediate",
        choiceType: "Multiple Choice",
        duration: 45,
        totalQuestions: 40,
        questions: [
            {
                id: "q1",
                question: "In which year did World War II end?",
                type: "multiple-choice",
                options: ["1944", "1945", "1946", "1947"],
                correctAnswer: "1945"
            },
            {
                id: "q2",
                question: "Who was the first person to walk on the moon?",
                type: "multiple",
                options: ["Neil Armstrong", "Buzz Aldrin", "John Glenn", "Alan Shepard"],
                correctAnswer: "Neil Armstrong"
            }
        ]
    },
    "3": {
        id: "3",
        name: "Basic Calculus",
        difficulty: "Intermediate",
        choiceType: "Short Answer",
        duration: 25,
        totalQuestions: 20,
        questions: [
            {
                id: "q1",
                question: "What is the derivative of x²?",
                type: "short-answer",
                correctAnswer: "2x"
            },
            {
                id: "q2",
                question: "What is the integral of 2x?",
                type: "short-answer",
                correctAnswer: "x² + C"
            }
        ]
    },
    "4": {
        id: "4",
        name: "English Literature Quiz",
        difficulty: "Intermediate",
        choiceType: "Essay",
        duration: 20,
        totalQuestions: 15,
        questions: [
            {
                id: "q1",
                question: "Who wrote 'To Kill a Mockingbird'?",
                type: "essay"
            },
            {
                id: "q2",
                question: "What are the main themes in Shakespeare's Hamlet?",
                type: "essay"
            }
        ]
    }
};

// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    initializeTags();
    renderQuizCards();
    initAsksChat();

    const savedTab = localStorage.getItem("currentTab");
    if (savedTab) {
        switchTab(savedTab);
    } else {
        showPage('home'); // default
    }

}

window.createQuizApi = async function (payload) {
    try {
        const res = await fetch("https://cedt-backend-dev.rachatat.com/quiz/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || res.statusText);

        //console.log("Quiz created:", data);
        //alert("Quiz created successfully!");
        //document.getElementById("quizForm")?.reset?.();
    } catch (err) {
        console.error("Error creating quiz:", err);
        alert("สร้างควิซไม่สำเร็จ: " + err.message);
    }
};

function handleCreateQuizClick() {
    const title = document.getElementById("quizName")?.value?.trim();
    const description = document.getElementById("quizDetails")?.value?.trim();
    const numQuestions = parseInt(document.getElementById("numQuestions")?.value, 10);
    const questionType = document.getElementById("choiceType")?.value; // "multiple" หรือ "true-false"
    let duration = document.getElementById("duration")?.value;

    if (typeof editMode !== "undefined" && editMode && currentQuizId) {
        return createQuiz();
    }


    if (!title || !description || !numQuestions || !questionType || !duration) {
        alert("กรอกให้ครบ: ชื่อหัวข้อ/จำนวนข้อ/ประเภทคำถาม");
        return;
    }

    if (duration === "unlimited") {
        duration = 0
    }


    window.createQuizApi({ title, description, numQuestions, questionType, duration });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });
    }

    // Global click to close any open dropdowns when clicking outside
    document.addEventListener('click', function (e) {
        document.querySelectorAll('.quiz-card-dropdown').forEach(menu => {
            // Close if click is outside any menu wrapper
            if (!menu.closest('.quiz-card-menu-wrapper')?.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    });

    // Escape key closes all dropdowns
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.quiz-card-dropdown').forEach(menu => menu.style.display = 'none');
        }
    });

    // Quiz Creator
    const addTagBtn = document.getElementById('addTagBtn');
    const newTagInput = document.getElementById('newTag');
    const createQuizBtn = document.getElementById('createQuizBtn');

    if (addTagBtn) addTagBtn.addEventListener('click', addTag);
    if (newTagInput) {
        newTagInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
    }
    if (createQuizBtn) createQuizBtn.addEventListener('click', handleCreateQuizClick);

    // Search and filter
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            filterQuizCards();
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', function () {
            filterQuizCards();
        });
    }

    // Quiz taking navigation
    const backToCardsBtn = document.getElementById('backToCardsBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (backToCardsBtn) backToCardsBtn.addEventListener('click', backToCards);
    if (prevBtn) prevBtn.addEventListener('click', previousQuestion);
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    if (submitBtn) submitBtn.addEventListener('click', submitQuiz);

    // Edit page buttons
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', backToCards);
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveQuizEdits);
}

// ===== Asks Chat Frontend =====
function initAsksChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const msgs = document.getElementById('chatMessages');

    if (!input || !sendBtn || !msgs) return;

    // ส่งเมื่อกดปุ่ม
    sendBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) return;
        appendMessage('user', text);
        input.value = '';
        autoResizeTextarea(input);

        // === จุด Hook ต่อ backend ===
        // ตัวอย่าง fetch ไปยัง API ของคุณ:
        // sendToBackend(text).then(resText => appendMessage('assistant', resText));
        // ตอนนี้ mock เป็น "typing…" แล้วตอบกลับสั้นๆ
        showTyping();
        setTimeout(() => {
            hideTyping();
            appendMessage('assistant', 'รับทราบครับ — เดี๋ยวผมช่วยค้น/สรุปให้! (ตัวอย่างตอบกลับ)');
        }, 600);
    });

    // Enter = ส่ง, Shift+Enter = ขึ้นบรรทัดใหม่
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // auto-resize
    input.addEventListener('input', () => autoResizeTextarea(input));
    autoResizeTextarea(input);

    function autoResizeTextarea(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
}
function scrollToBottom() {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;

    // ถ้า #chatMessages เป็น scrollable container ให้เลื่อนอันนี้
    const style = window.getComputedStyle(msgs);
    const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll' || msgs.scrollHeight > msgs.clientHeight;

    if (isScrollable) {
        // ให้เกิดการเลื่อนหลังจาก layout เสร็จ (more reliable)
        requestAnimationFrame(() => {
            msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
        });
        return;
    }

    // Fallback: ถ้า container ไม่ scroll ให้เลื่อน message ตัวสุดท้าย ให้แน่ใจว่า visible
    const last = msgs.lastElementChild;
    if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
        // สุดท้ายก็เลื่อนหน้าเว็บทั้งหน้า
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

function appendMessage(role, text) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;

    const wrap = document.createElement('div');
    wrap.className = `msg ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);

    // เรียก scroll แบบปลอดภัย
    scrollToBottom();
}

// typing indicator (assistant)
let typingEl = null;
function showTyping() {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;
    typingEl = document.createElement('div');
    typingEl.className = 'msg assistant';
    typingEl.innerHTML = `
    <div class="avatar">AI</div>
    <div class="bubble">กำลังพิมพ์…</div>
  `;
    msgs.appendChild(typingEl);

    // เลื่อนให้เห็น typing
    scrollToBottom();
}
function hideTyping() {
    if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
        typingEl = null;
        // หลังจากลบแล้วอาจต้องเลื่อนให้ข้อความก่อนหน้า visible
        requestAnimationFrame(scrollToBottom);
    }
}

// ตัวอย่าง hook ต่อ backend (ไว้แทนที่ได้เลย)
async function sendToBackend(userText) {
    // เปลี่ยน URL ตาม backend ของคุณ เช่น /api/chat
    const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
    });
    const data = await resp.json();
    return data.reply || '(no reply)';
}


let editMode = false;

function mapChoiceToHomeSelect(type) {
    if (type === 'Multiple Choice') return 'multiple';
    if (type === 'True/False') return 'true-false';
    return '';
}

function mapHomeSelectToChoice(val) {
    if (val === 'multiple') return 'Multiple Choice';
    if (val === 'true-false') return 'True/False';
    return '';
}


function switchTab(tab) {
    currentTab = tab;

    localStorage.setItem("currentTab", tab);

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tab) {
            item.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        'home': 'Home',
        'cards': 'Cards Folder',
        'asks': 'Asks',
        'quiz-taking': 'Quiz',
        'quiz-edit': 'Edit Quiz'
    };
    const title = titles[tab] || 'Home';
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = title;

    showPage(tab);
}

function showPage(page) {
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });

    const pageContent = document.getElementById(page + '-content');
    if (pageContent) {
        pageContent.classList.add('active');
    }
}

// Quiz Creator Functions
function initializeTags() {
    const container = document.getElementById('tagsContainer');
    if (!container) return;

    container.innerHTML = '';
    availableTags.forEach(tag => {
        const tagElement = createTagElement(tag);
        container.appendChild(tagElement);
    });
}

function createTagElement(tagText) {
    const tag = document.createElement('span');
    tag.className = 'tag';

    tag.innerHTML = `
        <span class="tag-text">${tagText}</span>
        <button class="tag-remove" title="Remove tag">&times;</button>
    `;

    // toggle การเลือกแท็ก (เวลา click ที่ตัวหนังสือแท็ก)
    tag.querySelector('.tag-text').addEventListener('click', function () {
        toggleTag(tagText);
    });

    // ปุ่มลบ
    tag.querySelector('.tag-remove').addEventListener('click', function (e) {
        e.stopPropagation(); // กันไม่ให้ trigger toggle
        const idx = selectedTags.indexOf(tagText);
        if (idx > -1) selectedTags.splice(idx, 1);

        const idxAvailable = availableTags.indexOf(tagText);
        if (idxAvailable > -1) availableTags.splice(idxAvailable, 1);

        tag.remove();
    });

    if (selectedTags.includes(tagText)) {
        tag.classList.add('selected');
    }

    return tag;
}

function toggleTag(tagText) {
    // const index = selectedTags.indexOf(tagText);
    // if (index > -1) {
    //     selectedTags.splice(index, 1);
    // } else {
    //     selectedTags.push(tagText);
    // }

    // // Update visual state
    // const tagElements = document.querySelectorAll('.tag');
    // tagElements.forEach(tag => {
    //     if (tag.textContent === tagText) {
    //         tag.classList.toggle('selected');
    //     }
    // });
    const index = selectedTags.indexOf(tagText);
    if (index > -1) {
        selectedTags.splice(index, 1);
    } else {
        selectedTags.push(tagText);
    }

    // Update visual state
    const tagElements = document.querySelectorAll('.tag');
    tagElements.forEach(tag => {
        const textEl = tag.querySelector('.tag-text');
        if (textEl && textEl.textContent === tagText) {
            tag.classList.toggle('selected');
        }
    });
}

function addTag() {
    const newTagInput = document.getElementById('newTag');
    const newTag = newTagInput.value.trim();

    if (newTag && !availableTags.includes(newTag) && !selectedTags.includes(newTag)) {
        availableTags.push(newTag);
        selectedTags.push(newTag);
        newTagInput.value = '';
        initializeTags();
    }
}

function createQuiz() {
    const quizName = document.getElementById('quizName').value;
    const quizDetails = document.getElementById('quizDetails').value;
    const duration = document.getElementById('duration').value;
    const numQuestions = document.getElementById('numQuestions').value;
    const choiceType = document.getElementById('choiceType').value;

    if (!quizName.trim()) {
        alert('Please enter a quiz name');
        return;
    }

    // ถ้ามาจากการกด Edit บนการ์ด -> Regenerate (อัปเดตการ์ดเดิมด้วยค่าจากหน้า Home)
    if (editMode && currentQuizId) {
        const q = quizData[currentQuizId];
        if (q) {
            q.name = quizName || q.name;
            // duration ในหน้า Home เป็นนาทีหรือ 'unlimited' (หากเป็น unlimited จะคงค่าเดิมไว้)
            if (duration && duration !== 'unlimited') {
                const d = parseInt(duration, 10);
                if (!Number.isNaN(d)) q.duration = d;
            }
            if (numQuestions) {
                const n = parseInt(numQuestions, 10);
                if (!Number.isNaN(n)) q.totalQuestions = n;
            }
            if (choiceType) {
                const mapped = mapHomeSelectToChoice(choiceType);
                if (mapped) q.choiceType = mapped;
            }
        }

        const card = quizCards.find(c => c.id === currentQuizId);
        if (card) {
            card.name = q.name;
            card.totalQuestions = q.totalQuestions;
            card.duration = q.duration === 'unlimited' ? 'Unlimited' : `${q.duration} minutes`;
            card.choiceType = q.choiceType;
            card.tags = [...selectedTags];
        }

        alert('Regenerated quiz from Home settings!');
        renderQuizCards();

        // รีเซ็ตสถานะโหมด Regenerate
        editMode = false;
        currentQuizId = null;
        const createBtn = document.getElementById('createQuizBtn');
        if (createBtn) createBtn.textContent = 'Create Quiz';

        // กลับไปหน้า Cards
        switchTab('cards');
        return;
    }

    // โหมดสร้างใหม่ (พฤติกรรมเดิม)
    console.log('Creating quiz:', {
        name: quizName,
        details: quizDetails,
        duration: duration,
        numQuestions: numQuestions,
        choiceType: choiceType,
        tags: selectedTags
    });

    alert('Quiz created successfully!');

    // Reset form (พฤติกรรมเดิม)
    document.getElementById('quizName').value = '';
    document.getElementById('quizDetails').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('numQuestions').value = '';
    document.getElementById('choiceType').value = '';
    selectedTags = [];
    initializeTags();
}

// Cards Folder Functions
function renderQuizCards() {
    const container = document.getElementById('quizCardsContainer');
    if (!container) return;

    container.innerHTML = '';

    quizCards.forEach(card => {
        const cardElement = createQuizCardElement(card);
        container.appendChild(cardElement);
    });
}

function createQuizCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'quiz-card';
    cardDiv.setAttribute('data-quiz-id', card.id);

    cardDiv.innerHTML = `
        <div class="quiz-card-menu-wrapper">
            <button class="quiz-card-menu" title="More">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                </svg>
            </button>
            <div class="quiz-card-dropdown">
                <button class="dropdown-item quiz-card-edit">Edit</button>
                <button class="dropdown-item quiz-card-delete">Delete</button>
                <!-- Add more items if needed e.g. Delete, Duplicate -->
            </div>
        </div>
        
        <button class="quiz-card-play" title="Start quiz">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5,3 19,12 5,21"/>
            </svg>
        </button>

        <div class="quiz-card-content">
            <h3 class="quiz-card-name">${card.name}</h3>
            
            <div class="quiz-tags">
                ${card.tags.map(tag => `<span class="quiz-tag">${tag}</span>`).join('')}
            </div>
            
            <div class="quiz-details">
                <div class="quiz-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="6"/>
                        <circle cx="12" cy="12" r="2"/>
                    </svg>
                    <span>Score: ${card.score}%</span>
                </div>
                
                <div class="quiz-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                    </svg>
                    <span>${card.totalQuestions} questions</span>
                </div>
                
                <div class="quiz-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span>${card.duration}</span>
                </div>
                
                <div class="quiz-choice-type">${card.choiceType}</div>
            </div>
        </div>
    `;

    // Add click handlers
    const playBtn = cardDiv.querySelector('.quiz-card-play');
    const cardContent = cardDiv.querySelector('.quiz-card-content');
    const menuBtn = cardDiv.querySelector('.quiz-card-menu');
    const editBtn = cardDiv.querySelector('.quiz-card-edit');
    const dropdown = cardDiv.querySelector('.quiz-card-dropdown');
    const deleteBtn = cardDiv.querySelector('.quiz-card-delete');

    if (playBtn) {
        playBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            startQuiz(card.id);
        });
    }

    if (cardContent) {
        cardContent.addEventListener('click', function () {
            startQuiz(card.id);
        });
    }

    if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Close other open dropdowns first
            document.querySelectorAll('.quiz-card-dropdown').forEach(menu => {
                if (menu !== dropdown) menu.style.display = 'none';
            });
            // Toggle this dropdown
            dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            editViaHome(card.id); // <-- ใช้ฟังก์ชันใหม่
            if (dropdown) dropdown.style.display = 'none';
        });
    }

    // ปุ่ม Delete (เพิ่มใหม่)
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();

            // ยืนยันก่อนลบ
            const ok = confirm(`Delete "${card.name}"?\nThis action cannot be undone.`);
            if (!ok) {
                if (dropdown) dropdown.style.display = 'none';
                return;
            }

            // ถ้ากำลังเปิดทำควิซของการ์ดนี้อยู่ ให้กลับไปหน้า Cards ก่อน
            if (typeof currentQuizId !== 'undefined' && currentQuizId === card.id) {
                if (typeof backToCards === 'function') backToCards();
            }

            // ลบออกจากแหล่งข้อมูล
            try {
                if (typeof quizData !== 'undefined') {
                    delete quizData[card.id];
                }
                if (Array.isArray(quizCards)) {
                    const idx = quizCards.findIndex(c => c.id === card.id);
                    if (idx > -1) quizCards.splice(idx, 1);
                }
            } catch (err) {
                console.error('Delete error:', err);
                alert('Failed to delete this card.');
                if (dropdown) dropdown.style.display = 'none';
                return;
            }

            // รีเฟรชการ์ดบนหน้าจอ
            if (typeof renderQuizCards === 'function') {
                renderQuizCards();
            }

            if (dropdown) dropdown.style.display = 'none';
        });
    }

    return cardDiv;
}

function filterQuizCards() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value;

    let filteredCards = quizCards;

    // Apply search filter
    if (searchQuery) {
        filteredCards = filteredCards.filter(card =>
            card.name.toLowerCase().includes(searchQuery) ||
            card.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
    }

    // Apply category filter
    if (filterValue && filterValue !== 'all') {
        switch (filterValue) {
            case 'high-score':
                filteredCards = filteredCards.filter(card => card.score >= 80);
                break;
            case 'multiple-choice':
                filteredCards = filteredCards.filter(card => card.choiceType === 'Multiple Choice');
                break;
            case 'short-answer':
                filteredCards = filteredCards.filter(card => card.choiceType === 'Short Answer');
                break;
            case 'essay':
                filteredCards = filteredCards.filter(card => card.choiceType === 'Essay');
                break;
        }
    }

    // Render filtered cards
    const container = document.getElementById('quizCardsContainer');
    const noResultsMsg = document.getElementById('noQuizzesMessage');

    if (container) {
        container.innerHTML = '';

        if (filteredCards.length === 0) {
            noResultsMsg.style.display = 'block';
        } else {
            noResultsMsg.style.display = 'none';
            filteredCards.forEach(card => {
                const cardElement = createQuizCardElement(card);
                container.appendChild(cardElement);
            });
        }
    }
}

// Quiz Taking Functions
function startQuiz(quizId) {
    currentQuizId = quizId;
    currentQuestionIndex = 0;
    userAnswers = {};
    selectedAnswer = '';

    const quiz = quizData[quizId];
    if (!quiz) return;

    // Initialize timer
    timeRemaining = quiz.duration * 60; // Convert minutes to seconds

    // Update UI
    document.getElementById('quizTitle').textContent = quiz.name;
    // document.getElementById('quizDifficulty').textContent = quiz.difficulty;
    document.getElementById('quizChoiceType').textContent = quiz.choiceType;

    switchTab('quiz-taking');
    displayQuestion();
    startTimer();
}

function displayQuestion() {
    const quiz = quizData[currentQuizId];
    if (!quiz) return;

    const question = quiz.questions[currentQuestionIndex];
    if (!question) return;

    // Update progress
    const progress = ((currentQuestionIndex + 1) / quiz.totalQuestions) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quiz.totalQuestions;

    // Update question
    document.getElementById('questionText').textContent = question.question;

    // Update answers container
    const container = document.getElementById('answersContainer');
    container.innerHTML = '';

    // Get current answer
    selectedAnswer = userAnswers[question.id] || '';

    if (question.type === 'multiple-choice') {
        question.options.forEach((option, index) => {
            // multiple
            const button = document.createElement('button');
            button.className = 'answer-option';
            button.innerHTML = `
    <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
    ${option}
`;
            button.dataset.value = option;                 // << เพิ่มบรรทัดนี้

            if (selectedAnswer === option) button.classList.add('selected');
            button.addEventListener('click', function () { selectAnswer(option); });
            container.appendChild(button);


            button.addEventListener('click', function () {
                selectAnswer(option);
            });

            container.appendChild(button);
        });
    } else if (question.type === 'true-false') {
        ['True', 'False'].forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-option';
            button.innerHTML = `
                <span class="answer-letter">${option.charAt(0)}</span>
                ${option}
            `;
            button.dataset.value = option;

            if (selectedAnswer === option) {
                button.classList.add('selected');
            }

            button.addEventListener('click', function () {
                selectAnswer(option);
            });

            container.appendChild(button);
        });
    }
    //else if (question.type === 'short-answer') {
    //     const input = document.createElement('input');
    //     input.type = 'text';
    //     input.className = 'answer-input';
    //     input.placeholder = 'Enter your answer...';
    //     input.value = selectedAnswer;

    //     input.addEventListener('input', function () {
    //         selectAnswer(this.value);
    //     });

    //     container.appendChild(input);
    // } else if (question.type === 'essay') {
    //     const textarea = document.createElement('textarea');
    //     textarea.className = 'answer-textarea';
    //     textarea.placeholder = 'Write your essay answer here...';
    //     textarea.rows = 8;
    //     textarea.value = selectedAnswer;

    //     textarea.addEventListener('input', function () {
    //         selectAnswer(this.value);
    //     });

    //     container.appendChild(textarea);
    // }

    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex < quiz.questions.length - 1) {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    }
}

function selectAnswer(answer) {
    const quiz = quizData[currentQuizId];
    const question = quiz.questions[currentQuestionIndex];

    selectedAnswer = answer;
    userAnswers[question.id] = answer;

    // Update visual selection for multiple choice
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
        // จำกัดขอบเขตแค่คำถามปัจจุบัน
        const container = document.getElementById('answersContainer');
        const opts = container.querySelectorAll('.answer-option');
        opts.forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.value === answer) {
                opt.classList.add('selected');
            }
        });
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    const quiz = quizData[currentQuizId];
    if (currentQuestionIndex < quiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function submitQuiz() {
    if (timer) {
        clearInterval(timer);
    }

    console.log('Quiz submitted:', userAnswers);
    alert('Quiz submitted successfully!');
    backToCards();
}

function backToCards() {
    if (timer) {
        clearInterval(timer);
    }

    currentQuizId = null;
    currentQuestionIndex = 0;
    userAnswers = {};
    selectedAnswer = '';

    switchTab('cards');
}

function startTimer() {
    if (timer) {
        clearInterval(timer);
    }

    timer = setInterval(function () {
        timeRemaining--;

        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const timerElement = document.getElementById('timeRemaining');
        timerElement.textContent = timeString;

        if (timeRemaining < 300) { // 5 minutes
            timerElement.parentElement.classList.add('warning');
        }

        if (timeRemaining <= 0) {
            clearInterval(timer);
            alert('Time\'s up! Quiz will be submitted automatically.');
            submitQuiz();
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ---- Edit Flow ----
function editViaHome(quizId) {
    currentQuizId = quizId;
    editMode = true;

    const q = quizData[quizId];
    if (!q) return;

    const quizNameEl = document.getElementById('quizName');
    const quizDetailsEl = document.getElementById('quizDetails');
    const durationEl = document.getElementById('duration');
    const numQuestionsEl = document.getElementById('numQuestions');
    const choiceTypeEl = document.getElementById('choiceType');
    const createBtn = document.getElementById('createQuizBtn');

    if (quizNameEl) quizNameEl.value = q.name || '';
    if (quizDetailsEl) quizDetailsEl.value = ''; // เดิมไม่มีเก็บรายละเอียดไว้
    if (durationEl) durationEl.value = String(q.duration);
    if (numQuestionsEl) numQuestionsEl.value = String(q.totalQuestions);
    if (choiceTypeEl) choiceTypeEl.value = mapChoiceToHomeSelect(q.choiceType);

    // ตั้งแท็กตามการ์ดเดิม
    const card = quizCards.find(c => c.id === quizId);
    selectedTags = card ? [...card.tags] : [];
    availableTags = Array.from(new Set([...(availableTags || []), ...selectedTags]));
    initializeTags();


    if (createBtn) createBtn.textContent = 'Regenerate';

    // ไปหน้า Home เพื่อแก้ไขแล้วกด Regenerate
    switchTab('home');
}


function openEditQuiz(quizId) {
    currentQuizId = quizId;
    const q = quizData[quizId];
    if (!q) return;

    // Prefill form
    const nameEl = document.getElementById('editQuizName');
    const durEl = document.getElementById('editDuration');
    const totalEl = document.getElementById('editTotalQuestions');
    const typeEl = document.getElementById('editChoiceType');

    if (nameEl) nameEl.value = q.name || '';
    if (durEl) durEl.value = q.duration || 0;
    if (totalEl) totalEl.value = q.totalQuestions || 0;
    if (typeEl) typeEl.value = q.choiceType || 'Multiple Choice';

    switchTab('quiz-edit');
}

function saveQuizEdits() {
    const q = quizData[currentQuizId];
    if (!q) return;

    const nameEl = document.getElementById('editQuizName');
    const durEl = document.getElementById('editDuration');
    const totalEl = document.getElementById('editTotalQuestions');
    const typeEl = document.getElementById('editChoiceType');

    q.name = nameEl.value.trim() || q.name;
    q.duration = parseInt(durEl.value, 10) || q.duration;
    q.totalQuestions = parseInt(totalEl.value, 10) || q.totalQuestions;
    q.choiceType = typeEl.value || q.choiceType;

    // Reflect into quizCards list
    const card = quizCards.find(c => c.id === currentQuizId);
    if (card) {
        card.name = q.name;
        card.totalQuestions = q.totalQuestions;
        card.duration = `${q.duration} minutes`;
        card.choiceType = q.choiceType;
    }

    alert('Saved!');
    renderQuizCards();
    switchTab('cards');
}

async function createQuiz(payload) {
    try {
        const res = await fetch("http://localhost:5000/quiz/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log("Quiz created:", data);
        alert("Quiz created successfully!");
    } catch (error) {
        console.error("Error creating quiz:", error);
        alert("Failed to create quiz");
    }
}

// document.getElementById("createQuizBtn")?.addEventListener("click", () => {
//     const topic = document.getElementById("quizName").value.trim();
//     const numQuestions = parseInt(document.getElementById("numQuestions").value, 10);
//     const questionType = document.getElementById("choiceType").value;

//     if (!topic || !numQuestions || !questionType) {
//         alert("กรอกให้ครบ: ชื่อหัวข้อ/จำนวนข้อ/ประเภทคำถาม");
//         return;
//     }


//     // createQuizApi({ topic, numQuestions, questionType });
// });
