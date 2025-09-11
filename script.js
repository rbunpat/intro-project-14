// Application State
let currentTab = 'home';
let currentQuizId = null;
let currentQuestionIndex = 0;
let timeRemaining = 0;
let timer = null;
let userAnswers = {};
let selectedAnswer = '';

// Sample data
const availableTags = ["Science", "Math", "History", "Language", "Technology", "Business", "Art", "Music", "Sports", "Health"];
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
                type: "multiple",
                options: ["number", "string", "undefined", "object"],
                correctAnswer: "string"
            },
            {
                id: "q2",
                question: "Which method is used to add an element to the end of an array in JavaScript?",
                type: "multiple",
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
                type: "multiple",
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
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    initializeTags();
    renderQuizCards();
    showPage('home');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }

    // Quiz Creator
    const addTagBtn = document.getElementById('addTagBtn');
    const newTagInput = document.getElementById('newTag');
    const createQuizBtn = document.getElementById('createQuizBtn');

    if (addTagBtn) addTagBtn.addEventListener('click', addTag);
    if (newTagInput) {
        newTagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
    }
    if (createQuizBtn) createQuizBtn.addEventListener('click', createQuiz);

    // Search and filter
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterQuizCards();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
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
}

function switchTab(tab) {
    currentTab = tab;
    
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
        'new-card': 'New Card',
        'asks': 'Asks',
        'quiz-taking': 'Quiz'
    };
    document.getElementById('pageTitle').textContent = titles[tab] || 'Home';

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
    tag.textContent = tagText;
    tag.addEventListener('click', function() {
        toggleTag(tagText);
    });
    
    if (selectedTags.includes(tagText)) {
        tag.classList.add('selected');
    }
    
    return tag;
}

function toggleTag(tagText) {
    const index = selectedTags.indexOf(tagText);
    if (index > -1) {
        selectedTags.splice(index, 1);
    } else {
        selectedTags.push(tagText);
    }
    
    // Update visual state
    const tagElements = document.querySelectorAll('.tag');
    tagElements.forEach(tag => {
        if (tag.textContent === tagText) {
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

    // In a real app, this would save to a database
    console.log('Creating quiz:', {
        name: quizName,
        details: quizDetails,
        duration: duration,
        numQuestions: numQuestions,
        choiceType: choiceType,
        tags: selectedTags
    });

    alert('Quiz created successfully!');
    
    // Reset form
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
        <button class="quiz-card-menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
            </svg>
        </button>
        
        <button class="quiz-card-play">
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

    if (playBtn) {
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            startQuiz(card.id);
        });
    }

    if (cardContent) {
        cardContent.addEventListener('click', function() {
            startQuiz(card.id);
        });
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // Menu functionality would go here
            console.log('Menu clicked for quiz:', card.id);
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
    document.getElementById('quizDifficulty').textContent = quiz.difficulty;
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

    if (question.type === 'multiple') {
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-option';
            button.innerHTML = `
                <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
                ${option}
            `;
            
            if (selectedAnswer === option) {
                button.classList.add('selected');
            }
            
            button.addEventListener('click', function() {
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
            
            if (selectedAnswer === option) {
                button.classList.add('selected');
            }
            
            button.addEventListener('click', function() {
                selectAnswer(option);
            });
            
            container.appendChild(button);
        });
    } else if (question.type === 'short-answer') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'answer-input';
        input.placeholder = 'Enter your answer...';
        input.value = selectedAnswer;
        
        input.addEventListener('input', function() {
            selectAnswer(this.value);
        });
        
        container.appendChild(input);
    } else if (question.type === 'essay') {
        const textarea = document.createElement('textarea');
        textarea.className = 'answer-textarea';
        textarea.placeholder = 'Write your essay answer here...';
        textarea.rows = 8;
        textarea.value = selectedAnswer;
        
        textarea.addEventListener('input', function() {
            selectAnswer(this.value);
        });
        
        container.appendChild(textarea);
    }

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
    if (question.type === 'multiple' || question.type === 'true-false') {
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.remove('selected');
            if (option.textContent.includes(answer)) {
                option.classList.add('selected');
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
    
    // In a real app, this would submit answers to a server
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
    
    timer = setInterval(function() {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('timeRemaining');
        timerElement.textContent = timeString;
        
        // Add warning class when time is running low
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