import { apiUrl } from './config.js';
import { getQuizCards, createQuizApi, getQuizById, deleteQuizById, getTags, createTag, deleteTag, sendAskRequest, updateQuizById } from './api.js';

// Application State
let currentTab = 'home';
let currentQuizId = null;
let currentQuestionIndex = 0;
let timeRemaining = 0;
let timer = null;
let userAnswers = {};
let selectedAnswer = '';
let editMode = false;

// Data Storage
let availableTags = [];
let selectedTags = [];
let quizCards = [];
let quizData = [];
let answerData;
let currentQuiz;

// ===== Application Initialization =====
document.addEventListener('DOMContentLoaded', function () {
    // Call the async function without await since we're in a callback
    initializeApp().catch(error => {
        console.error('Error initializing app:', error);
    });
});



/**
 * Initialize the application
 * Sets up event listeners, loads tags and quiz cards, and restores previous state if available
 */
async function initializeApp() {
    try {
        // Setup event handlers for all interactive elements
        setupEventListeners();
        
        // Initialize tag selection UI
        initializeTags();
        
        // Fetch and render quiz cards
        await renderQuizCards();
        
        // Initialize chat functionality
        initAsksChat();

        // Check if we have a saved quiz state (in-progress quiz) and restore it
        const hasQuizState = await loadQuizState();
        
        // If there's no quiz in progress, restore the last active tab or default to home
        if (!hasQuizState) {
            const savedTab = localStorage.getItem("currentTab");
            if (savedTab) {
                switchTab(savedTab);
            } else {
                showPage('home'); // default
            }
        }
    } catch (error) {
        console.error("Error during app initialization:", error);
        alert("There was a problem initializing the application. Please refresh the page.");
    }
}

async function handleCreateQuizClick() {
    const title = document.getElementById("quizName")?.value?.trim();
    const description = document.getElementById("quizDetails")?.value?.trim();
    const numQuestions = parseInt(document.getElementById("numQuestions")?.value, 10);
    const questionType = document.getElementById("choiceType")?.value; // "multiple" or "true-false"
    let duration = document.getElementById("duration")?.value;

    // Disable Create Quiz button
    const createBtn = document.getElementById("createQuizBtn");
    if (createBtn) {
        createBtn.disabled = true;
        createBtn.textContent = "Creating...";
    }

    try {
        // Handle edit mode
        if (editMode && currentQuizId) {
            return createQuiz();
        }

        // Validate form fields
        if (!title || !description || !numQuestions || !questionType || !duration) {
            alert("Please fill in all fields: Topic name, number of questions, and question type");
            return;
        }

        // Handle unlimited duration
        if (duration === "unlimited") {
            duration = 0;
        }

        // Create the quiz through API
        await createQuizApi({ title, description, numQuestions, questionType, duration });
        
        // Navigate to cards view and refresh
        switchTab('cards');
        await renderQuizCards();
    } catch (error) {
        console.error("Error creating quiz:", error);
        alert("Failed to create quiz: " + error.message);
    } finally {
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = "Create Quiz";
        }
    }
}

// ===== Event Listeners Setup =====
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
    const editAddTagBtn = document.getElementById('editAddTagBtn');
    const editNewTagInput = document.getElementById('editNewTag');
    
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', backToCards);
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveQuizEdits);
    
    // Edit page tag management
    if (editAddTagBtn) editAddTagBtn.addEventListener('click', addEditTag);
    if (editNewTagInput) {
        editNewTagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addEditTag();
            }
        });
    }
    
    // Results page buttons
    const retryQuizBtn = document.getElementById('retryQuizBtn');
    const backToCardsBtn2 = document.getElementById('backToCardsBtn2');
    const backToCardsFromResultsBtn = document.getElementById('backToCardsFromResultsBtn');
    
    if (retryQuizBtn) retryQuizBtn.addEventListener('click', () => {
        if (currentQuizId) startQuiz(currentQuizId);
    });
    if (backToCardsBtn2) backToCardsBtn2.addEventListener('click', backToCards);
    if (backToCardsFromResultsBtn) backToCardsFromResultsBtn.addEventListener('click', backToCards);
}

// ===== Asks Chat Frontend =====
function initAsksChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const msgs = document.getElementById('chatMessages');

    if (!input || !sendBtn || !msgs) return;

    // Send when button is clicked
    sendBtn.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) return;
        
        // Display user message
        appendMessage('user', text);
        input.value = '';
        autoResizeTextarea(input);

        // Show typing indicator
        showTyping();
        
        try {
            // Send to backend API and get response
            const response = await sendToBackend(text);
            hideTyping();
            appendMessage('assistant', response);
        } catch (error) {
            hideTyping();
            appendMessage('assistant', 'Sorry, there was an error processing your request. Please try again.');
            console.error('Error in chat:', error);
        }
    });

    // Enter = send, Shift+Enter = new line
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // auto-resize textarea
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

    // If #chatMessages is a scrollable container, scroll it
    const style = window.getComputedStyle(msgs);
    const isScrollable = style.overflowY === 'auto' || style.overflowY === 'scroll' || msgs.scrollHeight > msgs.clientHeight;

    if (isScrollable) {
        // Schedule scrolling after layout is complete (more reliable)
        requestAnimationFrame(() => {
            msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
        });
        return;
    }

    // Fallback: If container isn't scrollable, scroll the last message into view
    const last = msgs.lastElementChild;
    if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
        // Finally, fall back to scrolling the entire page
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

    // Call scroll safely to ensure visibility
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

    // Scroll to make typing indicator visible
    scrollToBottom();
}
function hideTyping() {
    if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
        typingEl = null;
        // After removing, we may need to scroll to make previous messages visible
        requestAnimationFrame(scrollToBottom);
    }
}

// Connects to the backend Ask API
async function sendToBackend(userText) {
    try {
        const data = await sendAskRequest(userText);
        return data.answer || 'Sorry, I couldn\'t generate an answer at this time.';
    } catch (error) {
        console.error('Error in ask API:', error);
        return 'An error occurred while processing your question. Please try again.';
    }
}

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

// ===== Navigation Functions =====
/**
 * Switches between different application views/tabs
 * Updates navigation, page title, and saves state to localStorage
 * @param {string} tab - The tab to switch to ('home', 'cards', 'asks', etc.)
 */
function switchTab(tab) {
    // If leaving the quiz-taking page, clear quiz state
    if (currentTab === 'quiz-taking' && tab !== 'quiz-taking') {
        // Only clear if we're intentionally navigating away (not going to results)
        if (tab !== 'quiz-results') {
            localStorage.removeItem('quizState');
            localStorage.removeItem('currentQuizData');
            
            // Stop timer if it exists
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
    }
    
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
        'quiz-edit': 'Edit Quiz',
        'quiz-results': 'Quiz Results'
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

// ===== Tag Management Functions =====
function initializeTags() {
    const container = document.getElementById('tagsContainer');
    if (!container) return;

    container.innerHTML = '';
    const data = getTags().then(tags => {
        availableTags = tags;
        availableTags.forEach(tag => {
            const tagElement = createTagElement(tag.name, tag._id);
            console.log(tag.name, tag._id);
            container.appendChild(tagElement);
        });
    });
}

async function initializeEditTags() {
    const container = document.getElementById('editTagsContainer');
    if (!container) return;

    container.innerHTML = '';
    
    try {
        const tags = await getTags();
        availableTags = tags;
        
        tags.forEach(tag => {
            // Create tag element - it checks selectedTags in its constructor
            const tagElement = createEditTagElement(tag.name, tag._id);
            container.appendChild(tagElement);
        });
        
        // Add event listener for the add tag button
        const addTagBtn = document.getElementById('editAddTagBtn');
        const newTagInput = document.getElementById('editNewTag');
        
        if (addTagBtn) {
            addTagBtn.addEventListener('click', addEditTag);
        }
        
        if (newTagInput) {
            newTagInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addEditTag();
                }
            });
        }
    } catch (error) {
        console.error('Failed to load tags:', error);
    }
}

function createTagElement(tagText, tagId) {
    const tag = document.createElement('span');
    tag.className = 'tag';

    tag.innerHTML = `
    
        <span class="tag-text" id="${tagId}">${tagText}</span>
        <button class="tag-remove" title="Remove tag">&times;</button>
    `;

    // Toggle tag selection when clicking the tag text
    tag.querySelector('.tag-text').addEventListener('click', function () {
        toggleTag(tagText);
    });

    // Remove button handler
    tag.querySelector('.tag-remove').addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent triggering parent element's click event
        // Call API to delete tag
        deleteTag(tagId).then(res => {
            if (res.success) {
                // Remove from DOM
                tag.remove();
            }
        });
        //remove tag from selectedTags and availableTags
        const idx = selectedTags.indexOf(tagText);
        if (idx > -1) selectedTags.splice(idx, 1);

        const idxAvailable = availableTags.indexOf(tagText);
        if (idxAvailable > -1) availableTags.splice(idxAvailable, 1);

    });

    if (selectedTags.includes(tagText)) {
        tag.classList.add('selected');
    }

    return tag;
}

function createEditTagElement(tagText, tagId) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    
    // Check if this tag is in the selectedTags array and mark it as selected
    if (selectedTags.includes(tagText)) {
        tag.classList.add('selected');
    }

    tag.innerHTML = `
        <span class="tag-text" id="${tagId}">${tagText}</span>
    `;

    // Toggle tag selection
    tag.addEventListener('click', function() {
        toggleEditTag(tagText);
    });

    return tag;
}

function toggleEditTag(tagText) {
    const index = selectedTags.indexOf(tagText);
    if (index > -1) {
        // If tag is already selected, remove it
        selectedTags.splice(index, 1);
    } else {
        // If tag is not selected, add it
        selectedTags.push(tagText);
    }

    // Update visual state for all tags with this text
    const tagElements = document.querySelectorAll('#editTagsContainer .tag');
    tagElements.forEach(tag => {
        const textEl = tag.querySelector('.tag-text');
        if (textEl && textEl.textContent === tagText) {
            // Toggle the selected class based on whether the tag is in selectedTags
            if (selectedTags.includes(tagText)) {
                tag.classList.add('selected');
            } else {
                tag.classList.remove('selected');
            }
        }
    });
    
    console.log('Selected tags:', selectedTags);
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
        const textEl = tag.querySelector('.tag-text');
        if (textEl && textEl.textContent === tagText) {
            tag.classList.toggle('selected');
        }
    });
}

async function addTag() {
    const newTagInput = document.getElementById('newTag');
    const newTag = newTagInput.value.trim();

    await createTag(newTag);

    if (newTag && !availableTags.includes(newTag) && !selectedTags.includes(newTag)) {
        availableTags.push(newTag);
        selectedTags.push(newTag);
        newTagInput.value = '';
        initializeTags();
    }
}

async function addEditTag() {
    const newTagInput = document.getElementById('editNewTag');
    const newTag = newTagInput.value.trim();
    
    if (!newTag) return;
    
    try {
        await createTag(newTag);
        
        if (!availableTags.includes(newTag) && !selectedTags.includes(newTag)) {
            availableTags.push(newTag);
            selectedTags.push(newTag);
            newTagInput.value = '';
            await initializeEditTags();
        }
    } catch (error) {
        console.error('Failed to add tag:', error);
        alert('Failed to add tag. It may already exist.');
    }
}

// ===== Quiz Creation Functions =====
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

    // Handling edit mode (regenerate quiz with updated values from Home tab)
    if (editMode && currentQuizId) {
        const q = quizData[currentQuizId];
        if (q) {
            q.name = quizName || q.name;
            // Duration can be minutes or 'unlimited'
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

        // Reset regenerate mode state
        editMode = false;
        currentQuizId = null;
        const createBtn = document.getElementById('createQuizBtn');
        if (createBtn) createBtn.textContent = 'Create Quiz';

        // Navigate back to Cards
        switchTab('cards');
        return;
    }

    // New quiz creation mode
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

// ===== Quiz Card Management =====
async function renderQuizCards() {
    const container = document.getElementById('quizCardsContainer');
    if (!container) return;

    container.innerHTML = '';

    const data = await getQuizCards();
    console.log('Fetched quiz cards:', data);

    data.forEach(card => {
        const cardElement = createQuizCardElement(card);
        container.appendChild(cardElement);
    });
}

function createQuizCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'quiz-card';
    cardDiv.setAttribute('data-quiz-id', card._id);

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
            <h3 class="quiz-card-name">${card.title}</h3>
            
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
                    <span>Score: ${card.score}/${card.questionCount}</span>
                </div>
                
                <div class="quiz-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                    </svg>
                    <span>${card.questionCount} questions</span>
                </div>
                
                <div class="quiz-detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span>${card.duration === 0 ? "Unlimited" : card.duration + ' minutes'}</span>
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
            startQuiz(card._id);
        });
    }

    if (cardContent) {
        cardContent.addEventListener('click', function () {
            startQuiz(card._id);
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
            openEditQuiz(card._id); // Use openEditQuiz with the correct _id
            if (dropdown) dropdown.style.display = 'none';
        });
    }

    // Delete button
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function (e) {
            e.stopPropagation();

            // Confirm before deletion
            const ok = confirm(`Delete "${card.title}"?\nThis action cannot be undone.`);
            if (!ok) {
                if (dropdown) dropdown.style.display = 'none';
                return;
            }

            // If we're currently viewing this quiz, go back to cards first
            if (typeof currentQuizId !== 'undefined' && currentQuizId === card._id) {
                if (typeof backToCards === 'function') backToCards();
            }

            // Delete from the data source
            try {
                await deleteQuizById(card._id);
                // Refresh the page to show updated cards
                window.location.reload();
                // Alternative approach without reload:
                // if (typeof quizData !== 'undefined') {
                //     delete quizData[card._id];
                // }
                // if (Array.isArray(quizCards)) {
                //     const idx = quizCards.findIndex(c => c._id === card._id);
                //     if (idx > -1) quizCards.splice(idx, 1);
                // }
            } catch (err) {
                console.error('Delete error:', err);
                alert('Failed to delete this card.');
                if (dropdown) dropdown.style.display = 'none';
                return;
            }

            // รีเฟรชการ์ดบนหน้าจอ
            // if (typeof renderQuizCards === 'function') {
            //     renderQuizCards();
            // }

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

// ===== Quiz Taking Functions =====
/**
 * Starts a quiz with the given ID
 * Loads quiz data, initializes state, and switches to quiz-taking view
 * @param {string} quizId - The ID of the quiz to start
 */
async function startQuiz(quizId) {
    currentQuizId = quizId;
    currentQuestionIndex = 0;
    userAnswers = {};
    selectedAnswer = '';

    try {
        // Get quiz data by ID from API
        const data = await getQuizById(quizId);
        
        // Store the quiz data
        quizData[quizId] = data;
        currentQuiz = data;
        
        console.log('Quiz loaded:', currentQuiz);
        
        if (!currentQuiz) {
            alert('Failed to load quiz data');
            return;
        }
        
        // Initialize timer
        timeRemaining = currentQuiz.duration * 60; // Convert minutes to seconds
        
        // Update UI
        document.getElementById('quizTitle').textContent = currentQuiz.title;
        document.getElementById('quizChoiceType').textContent = currentQuiz.choiceType;
        
        // Set total questions
        document.getElementById('totalQuestions').textContent = currentQuiz.questions.length;
        
        // Save quiz state to localStorage
        saveQuizState();
        
        switchTab('quiz-taking');
        displayQuestion();
        
        // Only start timer if duration is not unlimited (0)
        if (currentQuiz.duration > 0) {
            startTimer();
        }
    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

function displayQuestion() {
    const quiz = quizData[currentQuizId];
    if (!quiz) {
        console.error('No quiz data found for ID:', currentQuizId);
        return;
    }

    const question = quiz.questions[currentQuestionIndex];
    if (!question) {
        console.error('No question found at index:', currentQuestionIndex);
        return;
    }

    // Update progress
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quiz.questions.length;

    // Update question
    document.getElementById('questionText').textContent = question.question;

    // Update answers container
    const container = document.getElementById('answersContainer');
    container.innerHTML = '';

    // Get current answer for this question
    selectedAnswer = userAnswers[question._id] || '';

    console.log('Displaying question:', question);
    console.log('Current selected answer:', selectedAnswer);

    // Render answer options
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-option';
        button.innerHTML = `
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            ${option}
        `;
        button.dataset.value = option;

        if (selectedAnswer === option) button.classList.add('selected');
        
        button.addEventListener('click', function() { 
            selectAnswer(quiz._id, question._id, option); 
        });
        
        container.appendChild(button);
    });
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

function selectAnswer(quizId, questionId, answer) {
    // Store answer in the userAnswers object
    // Key is questionId, value is the answer text
    userAnswers[questionId] = answer;
    selectedAnswer = answer;
    
    console.log('Answer selected:', questionId, answer);
    console.log('User answers:', userAnswers);

    // Update visual selection for multiple choice
    const container = document.getElementById('answersContainer');
    const opts = container.querySelectorAll('.answer-option');
    opts.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === answer) {
            opt.classList.add('selected');
        }
    });
    
    // Save quiz state to localStorage
    saveQuizState();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        saveQuizState();
    }
}

function nextQuestion() {
    const quiz = quizData[currentQuizId];
    if (currentQuestionIndex < quiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        saveQuizState();
    }
}

async function saveQuizState() {
    if (currentQuizId) {
        const quizState = {
            quizId: currentQuizId,
            questionIndex: currentQuestionIndex,
            userAnswers: userAnswers,
            timeRemaining: timeRemaining
        };
        localStorage.setItem('quizState', JSON.stringify(quizState));
        
        // Also save the quiz data itself for restoration
        if (quizData[currentQuizId]) {
            localStorage.setItem('currentQuizData', JSON.stringify(quizData[currentQuizId]));
        }
    }
}

// Load quiz state from localStorage
async function loadQuizState() {
    const quizStateStr = localStorage.getItem('quizState');
    if (!quizStateStr) return false;
    
    try {
        const quizState = JSON.parse(quizStateStr);
        
        // Set the state variables
        currentQuizId = quizState.quizId;
        currentQuestionIndex = quizState.questionIndex;
        userAnswers = quizState.userAnswers || {};
        timeRemaining = quizState.timeRemaining;
        
        // Load quiz data if available in localStorage
        const quizDataStr = localStorage.getItem('currentQuizData');
        if (quizDataStr) {
            const loadedQuizData = JSON.parse(quizDataStr);
            quizData[currentQuizId] = loadedQuizData;
            currentQuiz = loadedQuizData;
            
            // Switch to quiz taking tab and display question
            switchTab('quiz-taking');
            
            // Update UI
            document.getElementById('quizTitle').textContent = currentQuiz.title;
            document.getElementById('quizChoiceType').textContent = currentQuiz.choiceType;
            document.getElementById('totalQuestions').textContent = currentQuiz.questions.length;
            
            displayQuestion();
            
            // Start timer if needed
            if (currentQuiz.duration > 0 && timeRemaining > 0) {
                startTimer();
            }
            
            return true;
        } else {
            // If we have quizId but not the data, fetch it again
            return await startQuiz(currentQuizId);
        }
    } catch (error) {
        console.error('Error loading quiz state:', error);
        return false;
    }
}

async function submitQuiz() {
    // Clear saved quiz state when submitting
    localStorage.removeItem('quizState');
    localStorage.removeItem('currentQuizData');
    
    if (timer) {
        clearInterval(timer);
    }
    
    try {
        if (!currentQuizId) {
            console.error('No quiz ID found for submission');
            alert('Error submitting quiz: Quiz ID not found');
            return;
        }
        
        // Format answers for submission
        const quiz = quizData[currentQuizId];
        if (!quiz) {
            console.error('No quiz data found for submission');
            alert('Error submitting quiz: Quiz data not found');
            return;
        }
        
        // Create submission format as per API schema
        const answers = Object.keys(userAnswers).map(questionId => {
            return {
                questionId: questionId,
                userAnswer: userAnswers[questionId]
            };
        });
        
        // Check if all questions are answered
        if (answers.length < quiz.questions.length) {
            const confirmSubmit = confirm(`You've only answered ${answers.length} out of ${quiz.questions.length} questions. Submit anyway?`);
            if (!confirmSubmit) {
                if (timer) startTimer(); // Resume timer if user cancels
                return;
            }
        }
        
        console.log('Submitting quiz:', { quizId: currentQuizId, answers });
        
        // Submit to API
        try {
            const response = await fetch(`${apiUrl}/quiz/submit/${currentQuizId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('Quiz submission result:', result);
                
                // Store the quiz results
                answerData = result;
                
                // Process the result to include isAnswerCorrect for each question
                const processedResult = processQuizResult(quiz, userAnswers, result);
                
                // Show the results page
                displayQuizResults(quiz, processedResult);
                
                // Update the quiz card with new score if available
                renderQuizCards(); // Refresh quiz cards in the background
            } else {
                console.error('Failed to submit quiz:', result);
                alert(`Failed to submit quiz: ${result.error || 'Unknown error'}`);
                backToCards(); // Return to cards view on failure
            }
        } catch (apiError) {
            console.error('API error during submission:', apiError);
            alert('Network error during submission. Please try again.');
            backToCards(); // Return to cards view on error
        }
    } catch (error) {
        console.error('Error in submit logic:', error);
        alert('An error occurred during quiz submission');
        backToCards(); // Return to cards view on error
    }
}

// Helper function to process the quiz result and ensure we have correctness data
function processQuizResult(quiz, userAnswers, apiResult) {
    // If the API already provides full result data, use it directly
    if (apiResult.questions && apiResult.questions.length > 0 && apiResult.questions[0].hasOwnProperty('isAnswerCorrect')) {
        return apiResult;
    }
    
    // Otherwise, build our own result object with correctness data
    const processedResult = {
        score: apiResult.score || 0,
        questions: []
    };
    
    // Process each question to determine correctness
    quiz.questions.forEach(question => {
        const userAnswer = userAnswers[question._id] || '';
        const correctAnswer = question.options[question.answer] || '';
        const isCorrect = userAnswer === correctAnswer;
        
        processedResult.questions.push({
            _id: question._id,
            question: question.question,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isAnswerCorrect: isCorrect
        });
    });
    
    // If API didn't provide a score, calculate it
    if (!apiResult.score) {
        processedResult.score = processedResult.questions.filter(q => q.isAnswerCorrect).length;
    }
    
    return processedResult;
}

// ===== Quiz Navigation and Results =====
/**
 * Returns to the quiz cards view, clearing current quiz state
 * Called when exiting a quiz or after submission
 */
function backToCards() {
    if (timer) {
        clearInterval(timer);
    }

    // Clear quiz state from localStorage
    localStorage.removeItem('quizState');
    localStorage.removeItem('currentQuizData');

    currentQuizId = null;
    currentQuestionIndex = 0;
    userAnswers = {};
    selectedAnswer = '';

    switchTab('cards');
}

/**
 * Displays quiz results after submission
 * Shows score, correct/incorrect answers, and navigation buttons
 * @param {Object} quiz - The quiz object containing questions and metadata
 * @param {Object} result - The quiz result containing score and question results
 */
function displayQuizResults(quiz, result) {
    // Set the quiz title in the results page
    document.getElementById('resultsQuizTitle').textContent = quiz.title;
    
    // Calculate and display the score
    const correctCount = result.score || 0;
    const totalQuestions = quiz.questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    
    document.getElementById('resultsQuizScore').textContent = `Score: ${correctCount}/${totalQuestions}`;
    document.getElementById('scorePercentage').textContent = `${scorePercentage}%`;
    
    // Get the container for displaying questions
    const questionsContainer = document.getElementById('resultsQuestionsContainer');
    questionsContainer.innerHTML = ''; // Clear previous results
    
    // Display each question with correctness
    quiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[question._id] || '';
        const isCorrect = result.questions.find(q => q._id === question._id)?.isAnswerCorrect || false;
        const correctAnswer = question.options[question.answer] || '';
        
        // Create question card
        const questionCard = document.createElement('div');
        questionCard.className = 'result-question-card';
        
        // Question header with number and status
        const questionHeader = document.createElement('div');
        questionHeader.className = 'result-question-header';
        questionHeader.innerHTML = `
            <div class="result-question-number">Question ${index + 1}</div>
            <div class="result-status ${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? 'Correct' : 'Incorrect'}</div>
        `;
        
        // Question content with text and answers
        const questionContent = document.createElement('div');
        questionContent.className = 'result-question-content';
        
        // Question text
        const questionText = document.createElement('div');
        questionText.className = 'result-question-text';
        questionText.textContent = question.question;
        
        // Answers container
        const answersContainer = document.createElement('div');
        answersContainer.className = 'result-answers';
        
        // Add each answer option
        question.options.forEach((option, optIndex) => {
            const isUserSelected = option === userAnswer;
            const isCorrectOption = option === correctAnswer;
            
            const answerDiv = document.createElement('div');
            answerDiv.className = 'result-answer';
            if (isUserSelected) answerDiv.classList.add('user-selected');
            if (isCorrectOption) answerDiv.classList.add('correct-answer');
            
            // Letter (A, B, C, etc.)
            const letterSpan = document.createElement('span');
            letterSpan.className = 'result-answer-letter';
            letterSpan.textContent = String.fromCharCode(65 + optIndex);
            
            // Answer text
            const textSpan = document.createElement('span');
            textSpan.textContent = option;
            
            // Icon for correct/incorrect
            const iconSpan = document.createElement('span');
            iconSpan.className = 'result-answer-icon';
            
            if (isUserSelected) {
                if (isCorrect) {
                    iconSpan.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="correct-icon">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>`;
                } else {
                    iconSpan.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="incorrect-icon">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>`;
                }
            } else if (isCorrectOption && !isCorrect) {
                // Highlight the correct answer when user selected wrong
                iconSpan.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="correct-icon">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`;
            }
            
            answerDiv.appendChild(letterSpan);
            answerDiv.appendChild(textSpan);
            answerDiv.appendChild(iconSpan);
            answersContainer.appendChild(answerDiv);
        });
        
        // Assemble the question card
        questionContent.appendChild(questionText);
        questionContent.appendChild(answersContainer);
        
        questionCard.appendChild(questionHeader);
        questionCard.appendChild(questionContent);
        
        // Add to the results container
        questionsContainer.appendChild(questionCard);
    });
    
    // Setup event listeners for the buttons in the results page
    const retryBtn = document.getElementById('retryQuizBtn');
    const backToCardsBtn = document.getElementById('backToCardsBtn2');
    const backFromResultsBtn = document.getElementById('backToCardsFromResultsBtn');
    
    if (retryBtn) {
        retryBtn.onclick = () => {
            startQuiz(currentQuizId);
        };
    }
    
    if (backToCardsBtn) {
        backToCardsBtn.onclick = backToCards;
    }
    
    if (backFromResultsBtn) {
        backFromResultsBtn.onclick = backToCards;
    }
    
    // Switch to the results page
    switchTab('quiz-results');
}

// ===== Timer Functions =====
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
        
        // Update localStorage every 15 seconds to save timer state
        if (timeRemaining % 15 === 0) {
            saveQuizState();
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

// ===== Quiz Editing Functions =====
function editViaHome(quizId) {
    currentQuizId = quizId;
    editMode = true;

    // Get quiz data - first try to get it from quizData
    let q = quizData[quizId];
    
    // If not available, find it from quizCards
    if (!q) {
        const card = quizCards.find(c => c._id === quizId);
        if (!card) {
            console.error('Quiz data not found for ID:', quizId);
            return;
        }
        q = card;
    }

    const quizNameEl = document.getElementById('quizName');
    const quizDetailsEl = document.getElementById('quizDetails');
    const durationEl = document.getElementById('duration');
    const numQuestionsEl = document.getElementById('numQuestions');
    const choiceTypeEl = document.getElementById('choiceType');
    const createBtn = document.getElementById('createQuizBtn');

    if (quizNameEl) quizNameEl.value = q.title || '';
    if (quizDetailsEl) quizDetailsEl.value = q.description || ''; 
    if (durationEl) durationEl.value = String(q.duration);
    if (numQuestionsEl) numQuestionsEl.value = String(q.questionCount);
    if (choiceTypeEl) choiceTypeEl.value = q.choiceType === 'Multiple Choice' ? 'multiple' : 'true-false';

    // Set tags based on the card
    const card = quizCards.find(c => c._id === quizId);
    selectedTags = card ? [...card.tags] : [];
    availableTags = Array.from(new Set([...(availableTags || []), ...selectedTags]));
    initializeTags();

    if (createBtn) createBtn.textContent = 'Regenerate';

    // Switch to Home tab for editing
    switchTab('home');
}


async function openEditQuiz(quizId) {
    currentQuizId = quizId;
    
    // Try to get quiz data, if not already loaded, fetch it
    let q = quizData[quizId];
    if (!q) {
        try {
            q = await getQuizById(quizId);
            quizData[quizId] = q;
        } catch (error) {
            console.error('Failed to load quiz data:', error);
            alert('Could not load quiz data for editing');
            return;
        }
    }
    
    if (!q) {
        alert('Quiz data not found');
        return;
    }

    // Prefill form with quiz data
    const nameEl = document.getElementById('editQuizName');
    const descriptionEl = document.getElementById('editQuizDescription');
    const durEl = document.getElementById('editDuration');
    const totalEl = document.getElementById('editTotalQuestions');
    const typeEl = document.getElementById('editChoiceType');
    const regenerateCheckbox = document.getElementById('regenerateQuiz');

    if (nameEl) nameEl.value = q.title || '';
    if (descriptionEl) descriptionEl.value = q.description || '';
    
    // Set the dropdown values
    if (durEl) {
        if (q.duration === 0) {
            durEl.value = 'unlimited';
        } else {
            // Find closest duration option
            const durations = [5, 10, 15, 30, 60];
            let closestDuration = durations.reduce((prev, curr) => 
                Math.abs(curr - q.duration) < Math.abs(prev - q.duration) ? curr : prev
            );
            durEl.value = closestDuration;
        }
    }
    
    if (totalEl) {
        // Find closest question count option
        const questionCounts = [5, 10, 15, 20, 25, 50];
        let closestCount = questionCounts.reduce((prev, curr) => 
            Math.abs(curr - q.questionCount) < Math.abs(prev - q.questionCount) ? curr : prev
        );
        totalEl.value = closestCount;
    }

    
    if (typeEl) {
        if (q.choiceType === 'Multiple Choice') {
            typeEl.value = 'multiple-choice';
        } else {
            typeEl.value = 'true-false';
        }
    }
    
    if (regenerateCheckbox) regenerateCheckbox.checked = false; // Default to not regenerate

    // Handle tags - get tags from the card first
    const card = quizCards.find(c => c._id === quizId);
    selectedTags = card && card.tags ? [...card.tags] : [];
    
    // Initialize tags, this will create all tag elements
    await initializeEditTags();
    
    // After initializing tags, update the UI to show selected tags
    const tagElements = document.querySelectorAll('#editTagsContainer .tag');
    tagElements.forEach(tag => {
        const textEl = tag.querySelector('.tag-text');
        if (textEl && selectedTags.includes(textEl.textContent)) {
            tag.classList.add('selected');
        }
    });
    
    switchTab('quiz-edit');
}

async function saveQuizEdits() {
    const q = quizData[currentQuizId];
    if (!q) return;

    const nameEl = document.getElementById('editQuizName');
    const descriptionEl = document.getElementById('editQuizDescription');
    const durEl = document.getElementById('editDuration');
    const totalEl = document.getElementById('editTotalQuestions');
    const typeEl = document.getElementById('editChoiceType');
    const regenerateCheckbox = document.getElementById('regenerateQuiz');

    // Get the updated values
    const updatedTitle = nameEl.value.trim() || q.title;
    const updatedDescription = descriptionEl ? descriptionEl.value.trim() : (q.description || '');
    
    // Handle duration (could be "unlimited")
    let updatedDuration;
    if (durEl.value === 'unlimited') {
        updatedDuration = 0; // 0 means unlimited
    } else {
        updatedDuration = parseInt(durEl.value, 10) || q.duration;
    }
    
    const updatedNumQuestions = parseInt(totalEl.value, 10) || q.questionCount;
    
    // Convert the choice type from dropdown value to API expected value
    let updatedChoiceType;
    if (typeEl.value === 'multiple-choice') {
        updatedChoiceType = 'multiple';
    } else if (typeEl.value === 'true-false') {
        updatedChoiceType = 'true-false';
    } else {
        updatedChoiceType = q.choiceType === 'Multiple Choice' ? 'multiple' : 'true-false';
    }
    
    const shouldRegenerate = regenerateCheckbox && regenerateCheckbox.checked;
    
    // Show loading state
    const saveBtn = document.getElementById('saveEditBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = shouldRegenerate ? "Regenerating..." : "Saving...";
    }

    try {
        // Prepare payload for the update API
        const payload = {
            title: updatedTitle,
            description: updatedDescription,
            duration: updatedDuration,
            numQuestions: updatedNumQuestions,
            questionType: updatedChoiceType,
            tags: selectedTags,
            regenerateQuiz: shouldRegenerate
        };

        console.log('Updating quiz with payload:', payload);

        // Call the API to update the quiz
        const updatedQuiz = await updateQuizById(currentQuizId, payload);

        // Update local data with response from API
        if (updatedQuiz) {
            quizData[currentQuizId] = updatedQuiz;
        } else {
            // Fallback to manually updating if API doesn't return the updated quiz
            if (q) {
                q.title = updatedTitle;
                q.description = updatedDescription;
                q.duration = updatedDuration;
                q.questionCount = updatedNumQuestions;
                q.choiceType = updatedChoiceType === 'multiple' ? 'Multiple Choice' : 'True/False';
                q.tags = selectedTags;
            }
        }

        alert(shouldRegenerate ? 'Quiz regenerated successfully!' : 'Quiz updated successfully!');
        await renderQuizCards(); // Refresh quiz cards with new data
        switchTab('cards');
    } catch (error) {
        const action = shouldRegenerate ? 'regenerating' : 'updating';
        alert(`Failed ${action} quiz: ${error.message}`);
        console.error(`Error ${action} quiz:`, error);
    } finally {
        // Restore button state
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
        }
    }
}

// Export functions that need to be used externally
export {
    initializeApp,
    switchTab,
    startQuiz,
    backToCards
};
