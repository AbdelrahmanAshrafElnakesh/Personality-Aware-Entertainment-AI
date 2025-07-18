// Function to show/hide pages
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active-page');
    });

    // Show the selected page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active-page');
    }

    // Manage visibility of all back buttons
    document.querySelectorAll('.back-button').forEach(button => {
        // By default, hide all back buttons
        button.style.display = 'none';
    });

    // Show specific back buttons based on the current page
    if (pageId === 'signupPage' || pageId === 'loginPage' || pageId === 'timeTrackerPage') {
        // Find the back button specific to the current page and show it
        const currentPageBackButton = document.querySelector(`#${pageId} .back-button`);
        if (currentPageBackButton) {
            currentPageBackButton.style.display = 'block';
        }
    }
    // The welcomePage's back button has data-previous-page="none" and is meant to be hidden.
    // The aiPage's back button has an inline style of display: none; in HTML and is meant to be hidden.
    // The general `display: none` at the start of the loop ensures this.

    // Update the current page in localStorage for back button
    localStorage.setItem('currentPage', pageId);
}

// Custom Message Box function (replaces alert())
function showMessageBox(message) {
    // Create a simple modal or div to display the message
    let messageBox = document.getElementById('customMessageBox');
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'customMessageBox';
        messageBox.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            text-align: center;
            font-family: 'Poppins', Arial, sans-serif;
            color: #2d3748;
            max-width: 300px;
            width: 90%;
        `;
        document.body.appendChild(messageBox);
    }
    messageBox.innerHTML = `
        <p>${message}</p>
        <button id="messageBoxCloseButton" style="width: auto; padding: 8px 15px; margin-top: 15px; background: #cccccc; color: black; border: none; border-radius: 5px; cursor: pointer;">OK</button>
    `;
    messageBox.style.display = 'block';

    document.getElementById('messageBoxCloseButton').addEventListener('click', () => {
        messageBox.style.display = 'none';
    });
}

// Welcome page navigation
document.getElementById('existingAccount').addEventListener('click', () => {
    // Check if any accounts exist
    if (!localStorage.getItem('users')) {
        showMessageBox('No accounts exist yet. Please create an account first.');
        return;
    }
    showPage('loginPage');
});

// Event listener for the "Create New Account" button on the welcome page
document.getElementById('createNewAccount').addEventListener('click', () => {
    showPage('signupPage');
});

// Event listener for the "Create New Account" button on the login page (new ID)
document.getElementById('createNewAccountFromLogin').addEventListener('click', () => {
    showPage('signupPage');
});

// Back button handling for all pages
document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', () => {
        const previousPage = button.dataset.previousPage;
        if (previousPage && previousPage !== 'none') {
            showPage(previousPage);
        } else {
            showPage('welcomePage'); // Default to welcome page if no previous page is set
        }
    });
});

// Login form handling
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    // Simulate checking if account exists
    if (!localStorage.getItem('users')) {
        errorDiv.textContent = 'No accounts exist yet. Please create an account first.';
        return;
    }

    // Simulate login validation
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Store user session
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMessageBox('Successfully logged in!');
        showPage('aiPage'); // Navigate to the AI page after successful login
        loadChatHistory(); // Load chat history for the logged-in user
    } else {
        errorDiv.textContent = 'Invalid username or password';
        setTimeout(() => {
            errorDiv.textContent = '';
        }, 3000);
    }
});

// Signup form handling
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const personalityType = document.getElementById('personalityType').value;

    // Validate input
    if (!username || !email || !password || !personalityType) {
        showMessageBox('Please complete all required fields:\n- Username\n- Email\n- Password\n- Personality Type');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessageBox('Please enter a valid email address');
        return;
    }

    // Simulate checking if email exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.email === email)) {
        showMessageBox('This email is already registered');
        return;
    }

    // Create new user with personality type
    const newUser = {
        username,
        email,
        password,
        personalityType,
        createdAt: new Date().toISOString()
    };

    // Store user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Show success message and redirect to login
    showMessageBox('Account created successfully! Please login.');
    showPage('loginPage');
});

// AI Page Chatbot Logic
const chatMessagesDiv = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const signOutButton = document.getElementById('signOutButton');

// New PDF upload elements
const pdfUploadInput = document.getElementById('pdfUploadInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const clearPdfButton = document.getElementById('clearPdfButton');

// Global variables for PDF attachment
let attachedPdfBase64 = null;
let attachedPdfMimeType = null;

// Handle PDF file selection
pdfUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            showMessageBox('Please upload a PDF file.');
            pdfUploadInput.value = ''; // Clear the input
            fileNameDisplay.textContent = '';
            clearPdfButton.style.display = 'none';
            attachedPdfBase64 = null;
            attachedPdfMimeType = null;
            return;
        }

        fileNameDisplay.textContent = file.name;
        clearPdfButton.style.display = 'inline-block'; // Show clear button

        const reader = new FileReader();
        reader.onload = (e) => {
            // The result is a data URL, extract the Base64 part
            const base64String = e.target.result.split(',')[1];
            attachedPdfBase64 = base64String;
            attachedPdfMimeType = file.type;
            showMessageBox(`PDF "${file.name}" attached.`);
        };
        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            showMessageBox("Failed to read PDF file.");
            fileNameDisplay.textContent = '';
            clearPdfButton.style.display = 'none';
            attachedPdfBase64 = null;
            attachedPdfMimeType = null;
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = '';
        clearPdfButton.style.display = 'none';
        attachedPdfBase64 = null;
        attachedPdfMimeType = null;
    }
});

// Handle clearing the attached PDF
clearPdfButton.addEventListener('click', () => {
    pdfUploadInput.value = ''; // Clear the file input
    fileNameDisplay.textContent = ''; // Clear the displayed file name
    clearPdfButton.style.display = 'none'; // Hide the clear button
    attachedPdfBase64 = null; // Clear the stored PDF data
    attachedPdfMimeType = null;
    showMessageBox('Attached PDF cleared.');
});


// Global variables for conversational state
const personalityQuestions = [
    "What entertainment topics do you enjoy most? (Choose multiple: Action, Drama, Comedy, Fantasy, Documentaries, Romance, Crime, Sci-Fi, etc.)",
    "What entertainment topics do you dislike or avoid? (Optional: Horror, slow-paced dramas, biographies, etc.)",
    "Are you interested in stories about relationships and emotional depth?",
    "Do you enjoy fast-paced adventures and thrill-seeking plots?",
    "Would you like content that challenges your thinking and feels complex or strategic?",
    "Do you enjoy relaxing, light-hearted, and humorous content?",
    "Are you curious about exploring genres outside your usual preferences?",
    "When you watch or read something, what's your goal? (Choose one or more) Escape from reality, Learn something new, Feel inspired, Relax and laugh, Stay on the edge of my seat"
];
let currentQuestionIndex = 0;
let userAnswersToQuestions = [];
let chatMode = 'initial_questions'; // 'initial_questions', 'main_menu_selection', 'awaiting_analysis_topic', 'awaiting_author_work', 'recommendation_chat', 'story_prompt_awaiting', 'general_chat'

// Global variable to store chat history for the current user
let currentUserChatHistory = [];

// Function to display a message in the chat interface
function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    // Sanitize the message to prevent any potential HTML injection
    const sanitizedMessage = message.replace(/</g, "<").replace(/>/g, ">");

    // Process newline characters to create paragraphs for better readability
    const formattedMessage = sanitizedMessage
        .split(/\n+/) // Split by one or more newlines
        .filter(line => line.trim() !== '') // Remove any empty lines
        .map(line => `<p>${line}</p>`) // Wrap each line in a paragraph tag
        .join(''); // Join them back together

    messageElement.innerHTML = formattedMessage;
    
    // Fallback for cases where the message might be just whitespace
    if (!messageElement.innerHTML.trim()) {
        messageElement.innerHTML = `<p>${sanitizedMessage}</p>`;
    }
    
    chatMessagesDiv.appendChild(messageElement);
    // Scroll to the bottom of the chat
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

// Function to load chat history for the current user
function loadChatHistory() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.username) {
        const storedData = localStorage.getItem(`chatHistory_${currentUser.username}`);
        if (storedData) {
            const chatData = JSON.parse(storedData);
            currentUserChatHistory = chatData.history || [];
            chatMode = chatData.mode || 'initial_questions';
            currentQuestionIndex = chatData.questionIndex || 0;
            userAnswersToQuestions = chatData.answers || [];

            chatMessagesDiv.innerHTML = ''; // Clear existing messages
            currentUserChatHistory.forEach(msg => {
                displayMessage(msg.text, msg.role);
            });

            // If in initial questions mode and not all questions asked, prompt the next question
            if (chatMode === 'initial_questions' && currentQuestionIndex < personalityQuestions.length) {
                displayMessage("Hello! Let's get started. " + personalityQuestions[currentQuestionIndex], 'ai');
                currentUserChatHistory.push({ role: 'ai', text: "Hello! Let's get started. " + personalityQuestions[currentQuestionIndex] });
                saveChatHistory(); // Save initial message
            } else if (chatMode === 'main_menu_selection') {
                const mainMenuQuestion = `How would you like me to assist you today?\n\n1) Get Personalized Entertainment Recommendations (novel, series, movie, song)\n\n2) Analyze an Entertainment Topic/Title for Fit\n\n3) Analyze Your Creative Work (for authors)\n\n4) Generate a Personalized Story or Scenario`;
                displayMessage(mainMenuQuestion, 'ai');
                currentUserChatHistory.push({ role: 'ai', text: mainMenuQuestion });
                saveChatHistory();
            }
            else if (currentUserChatHistory.length === 0) {
                // If no history, start with the first question
                displayMessage("Hello! Let's get started. " + personalityQuestions[currentQuestionIndex], 'ai');
                currentUserChatHistory.push({ role: 'ai', text: "Hello! Let's get started. " + personalityQuestions[currentQuestionIndex] });
                saveChatHistory(); // Save initial message
            }

        } else {
            currentUserChatHistory = [];
            userAnswersToQuestions = [];
            currentQuestionIndex = 0;
            chatMode = 'initial_questions';
            chatMessagesDiv.innerHTML = ''; // Clear existing messages if no history
            displayMessage("Hello! Let's get started. " + personalityQuestions[currentQuestionIndex], 'ai');
            currentUserChatHistory.push({ role: 'ai', text: "Hello! Let's get started. " + personalityQuestions[currentQuestionIndex] });
            saveChatHistory();
        }
    }
}

// Function to save chat history
function saveChatHistory() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.username) {
        const chatData = {
            history: currentUserChatHistory,
            mode: chatMode,
            questionIndex: currentQuestionIndex,
            answers: userAnswersToQuestions
        };
        localStorage.setItem(`chatHistory_${currentUser.username}`, JSON.stringify(chatData));
    }
}

// Function to call Gemini API with retry logic
async function callGeminiAPI(chatHistoryForAPI, pdfData = null) {
    // IMPORTANT: Replace "YOUR_GEMINI_API_KEY" with your actual Gemini API Key.
    const apiKey = "AIzaSyD8b3XrbdWsixC8RHz4K6Gw5Fadp-sY24k";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    let contents = chatHistoryForAPI;

    // Add PDF data to the last user message if it exists
    if (pdfData) {
        const lastUserMessageIndex = contents.length - 1;
        if (lastUserMessageIndex >= 0 && contents[lastUserMessageIndex].role === 'user') {
            contents[lastUserMessageIndex].parts.push({
                inlineData: { mimeType: pdfData.mimeType, data: pdfData.data }
            });
        }
    }
    
    const maxRetries = 3;
    let delay = 1000; // Initial delay of 1 second

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            // If the server is overloaded (503), wait and retry.
            if (response.status === 503) {
                if (i < maxRetries - 1) {
                    console.warn(`Gemini API overloaded. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Double the delay for the next attempt
                    continue; // Go to the next iteration of the loop
                } else {
                    // All retries have failed, throw an error to be caught below.
                    throw new Error("The model is overloaded after multiple retries.");
                }
            }

            const result = await response.json();

            // Handle successful responses or other non-retryable API errors
            if (result.error) {
                console.error('Gemini API Error:', result);
                displayMessage(`API Error: ${JSON.stringify(result.error.message || result.error)}`, 'ai');
                currentUserChatHistory.push({ role: 'ai', text: `API Error: ${JSON.stringify(result.error.message || result.error)}` });
            } else if (result.candidates && result.candidates[0]?.content?.parts?.[0]) {
                const aiResponse = result.candidates[0].content.parts[0].text;
                displayMessage(aiResponse, 'ai');
                currentUserChatHistory.push({ role: 'ai', text: aiResponse });
            } else {
                console.error('Unexpected API response structure:', JSON.stringify(result, null, 2));
                displayMessage('Sorry, I received an unexpected response from the AI. Please try again.', 'ai');
                currentUserChatHistory.push({ role: 'ai', text: 'Sorry, I received an unexpected response from the AI. Please try again.' });
            }
            
            // If we've reached this point, the request was processed (successfully or not), so we save and exit the loop.
            saveChatHistory();
            loadingIndicator.classList.remove('visible');
            return;

        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i < maxRetries - 1) {
                // Wait before the next retry for network errors or the thrown 503 error.
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                // All retries have failed. Show a user-friendly message.
                console.error('Error fetching from Gemini API after all retries:', error);
                const userMessage = "Sorry, the AI is currently busy or there's a network issue. Please try again in a few moments.";
                displayMessage(userMessage, 'ai');
                currentUserChatHistory.push({ role: 'ai', text: userMessage });
                saveChatHistory();
                loadingIndicator.classList.remove('visible');
                return; // Exit after the final failure
            }
        }
    }
}

// Send message function
if (sendMessageButton) { // Check if sendMessageButton exists
    sendMessageButton.addEventListener('click', async () => {
        try {
            const userMessage = chatInput ? chatInput.value.trim() : ''; // Get value safely
            
            if (userMessage === '' && !attachedPdfBase64) {
                return; // Don't send empty message unless PDF is attached
            }

            // Display user message
            if (userMessage !== '') {
                displayMessage(userMessage, 'user');
                currentUserChatHistory.push({ role: 'user', text: userMessage });
            } else if (attachedPdfBase64) {
                displayMessage('Attached PDF for review.', 'user');
                currentUserChatHistory.push({ role: 'user', text: 'Attached PDF for review.' });
            }

            if (chatInput) chatInput.value = '';
            if (loadingIndicator) loadingIndicator.classList.add('visible');

            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const personalityType = currentUser ? currentUser.personalityType : 'General';
            
            // Universal formatting instructions for the AI
            const FORMATTING_INSTRUCTIONS = `
IMPORTANT: Your entire response must follow these rules strictly:
1.  Structure: Use a main title for the overall topic, subtitles for different sections, and well-structured paragraphs for the content.
2.  No Emojis: Do not include any emojis in your response.
3.  No Markdown: Do not use any special markdown characters for styling (like *, _, #, etc.). Present all text in plain, clean format.
`;

            let chatHistoryForAPI = [];
            const historyLength = currentUserChatHistory.length;
            const startIndex = Math.max(0, historyLength - 10);
            for (let i = startIndex; i < historyLength; i++) {
                const roleForAPI = currentUserChatHistory[i].role === 'ai' ? 'model' : 'user';
                chatHistoryForAPI.push({ role: roleForAPI, parts: [{ text: currentUserChatHistory[i].text }] });
            }

            let pdfDataToSend = null;
            if (attachedPdfBase64 && attachedPdfMimeType) {
                pdfDataToSend = {
                    mimeType: attachedPdfMimeType,
                    data: attachedPdfBase64
                };
            }

            if (chatMode === 'initial_questions') {
                userAnswersToQuestions[currentQuestionIndex] = userMessage;
                currentQuestionIndex++;

                if (currentQuestionIndex < personalityQuestions.length) {
                    displayMessage("Hello! Let's get started. " + personalityQuestions[currentQuestionIndex], 'ai');
                    currentUserChatHistory.push({ role: 'ai', text: "Hello! Let's get started. " + personalityQuestions[currentQuestionIndex] });
                    saveChatHistory();
                    if (loadingIndicator) loadingIndicator.classList.remove('visible');
                } else {
                    chatMode = 'main_menu_selection';
                    const mainMenuQuestion = `How would you like me to assist you today?\n\n1) Get Personalized Entertainment Recommendations (novel, series, movie, song)\n\n2) Analyze an Entertainment Topic/Title for Fit\n\n3) Analyze Your Creative Work (for authors)\n\n4) Generate a Personalized Story or Scenario`;
                    displayMessage(mainMenuQuestion, 'ai');
                    currentUserChatHistory.push({ role: 'ai', text: mainMenuQuestion });
                    saveChatHistory();
                    if (loadingIndicator) loadingIndicator.classList.remove('visible');
                }
            } else if (chatMode === 'main_menu_selection') {
                const userChoice = userMessage.trim();
                if (userChoice === '1') {
                    chatMode = 'recommendation_chat';
                    const detailedPrompt = `You are an AI assistant tailored to a user with the personality type: ${personalityType}.
Here are the user's answers to their preferences:
${personalityQuestions.map((q, i) => `${q} My answer: "${userAnswersToQuestions[i]}"`).join('\n')}
The user has chosen to receive entertainment recommendations. Please provide recommendations for movies, books, and other entertainment. For each item, give a title, a subtitle (e.g., genre or theme), and a paragraph explaining why it's a good fit for the user.
${FORMATTING_INSTRUCTIONS}`;
                    
                    if (chatHistoryForAPI.length > 0) {
                        chatHistoryForAPI[chatHistoryForAPI.length - 1].parts = [{ text: detailedPrompt }];
                    }
                    await callGeminiAPI(chatHistoryForAPI, pdfDataToSend);
                } else if (userChoice === '2') {
                    chatMode = 'awaiting_analysis_topic';
                    const analysisPrompt = "Great! Please tell me the topic or entertainment title you'd like me to analyze.";
                    displayMessage(analysisPrompt, 'ai');
                    currentUserChatHistory.push({ role: 'ai', text: analysisPrompt });
                    saveChatHistory();
                    if (loadingIndicator) loadingIndicator.classList.remove('visible');
                } else if (userChoice === '3') {
                    chatMode = 'awaiting_author_work';
                    const authorPrompt = "Understood! Please provide your work (e.g., a summary, excerpt, or link) for analysis. You can also attach a PDF document.";
                    displayMessage(authorPrompt, 'ai');
                    currentUserChatHistory.push({ role: 'ai', text: authorPrompt });
                    saveChatHistory();
                    if (loadingIndicator) loadingIndicator.classList.remove('visible');
                } else if (userChoice === '4') {
                    chatMode = 'story_prompt_awaiting';
                    const storyPromptQuestion = "Excellent! What kind of story or scenario would you like me to generate? For example: 'a sci-fi adventure on a new planet', 'a cozy mystery in a small town', or 'a fantasy quest to find a lost artifact'.";
                    displayMessage(storyPromptQuestion, 'ai');
                    currentUserChatHistory.push({ role: 'ai', text: storyPromptQuestion });
                    saveChatHistory();
                    if (loadingIndicator) loadingIndicator.classList.remove('visible');
                } else {
                    displayMessage("Please choose a valid option (1, 2, 3, or 4).", 'ai');
                    currentUserChatHistory.push({ role: 'ai', text: "Please choose a valid option (1, 2, 3, or 4)." });
                    saveChatHistory();
                    if (loadingIndicator) loadingIndicator.classList.remove('visible');
                }
            } else if (chatMode === 'awaiting_analysis_topic') {
                const topicToAnalyze = userMessage;
                const prompt = `You are an AI assistant. Based on the user's personality type (${personalityType}) and their previous answers, analyze how the following topic/title "${topicToAnalyze}" would fit their preferences. Provide a detailed analysis.
${FORMATTING_INSTRUCTIONS}`;
                if (chatHistoryForAPI.length > 0) {
                    chatHistoryForAPI[chatHistoryForAPI.length - 1].parts = [{ text: prompt }];
                }
                await callGeminiAPI(chatHistoryForAPI, pdfDataToSend);
                chatMode = 'general_chat';
            } else if (chatMode === 'awaiting_author_work') {
                const userWork = userMessage;
                const prompt = `You are an AI assistant. Based on the user's personality type (${personalityType}), analyze the following work: "${userWork}". Recommend which audience and personality types would engage with it most. If a PDF is attached, analyze its content as the primary work.
${FORMATTING_INSTRUCTIONS}`;
                if (chatHistoryForAPI.length > 0) {
                    chatHistoryForAPI[chatHistoryForAPI.length - 1].parts = [{ text: prompt }];
                }
                await callGeminiAPI(chatHistoryForAPI, pdfDataToSend);
                chatMode = 'general_chat';
            } else if (chatMode === 'story_prompt_awaiting') {
                const storyTheme = userMessage;
                const prompt = `You are an AI assistant. Based on the user's personality type (${personalityType}) and their previous answers, generate a short story based on the theme: "${storyTheme}". The story should be well-paragraphed. Do not use any emojis or special markdown characters.`;

                if (chatHistoryForAPI.length > 0) {
                    chatHistoryForAPI[chatHistoryForAPI.length - 1].parts = [{ text: prompt }];
                }
                await callGeminiAPI(chatHistoryForAPI, pdfDataToSend);
                chatMode = 'general_chat';
            } else if (chatMode === 'recommendation_chat' || chatMode === 'general_chat') {
                const lastUserMessage = chatHistoryForAPI[chatHistoryForAPI.length - 1];
                if (lastUserMessage && lastUserMessage.role === 'user') {
                    const originalText = lastUserMessage.parts[0].text;
                    // For ongoing chat, prepend a lighter version of the instructions to the user's message.
                    const ongoingPrompt = `As an AI assistant for a user with personality type ${personalityType}, respond to the following request: "${originalText}".
                    ${FORMATTING_INSTRUCTIONS}`;
                    lastUserMessage.parts[0].text = ongoingPrompt;
                }
                await callGeminiAPI(chatHistoryForAPI, pdfDataToSend);
            }

            // Clear PDF attachment after sending
            pdfUploadInput.value = '';
            fileNameDisplay.textContent = '';
            clearPdfButton.style.display = 'none';
            attachedPdfBase64 = null;
            attachedPdfMimeType = null;

        } catch (error) {
            console.error('Error in sendMessageButton click handler:', error);
            showMessageBox('An error occurred while sending your message. Please try again.');
            if (loadingIndicator) loadingIndicator.classList.remove('visible');
        }
    });
} else {
    console.error('sendMessageButton not found!');
}


// Handle Enter key for sending messages
if (chatInput) { // Check if chatInput exists
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            if (sendMessageButton) { // Check if sendMessageButton exists before clicking
                sendMessageButton.click();
            }
        }
    });
} else {
    console.error('chatInput not found!');
}


// Sign Out functionality
if (signOutButton) { // Check if signOutButton exists
    signOutButton.addEventListener('click', () => {
        localStorage.removeItem('currentUser'); // Clear current user session
        showMessageBox('You have been signed out.');
        showPage('welcomePage'); // Go back to welcome page
        currentUserChatHistory = []; // Clear chat history in memory
        if (chatMessagesDiv) chatMessagesDiv.innerHTML = ''; // Clear chat display
        // Reset state variables for initial questions
        currentQuestionIndex = 0;
        userAnswersToQuestions = [];
        chatMode = 'initial_questions';
        saveChatHistory(); // Save the reset state
    });
} else {
    console.error('signOutButton not found!');
}


// Minimize button functionality
const minimizeButton = document.getElementById('minimizeButton');
// The floatingIcon element is now handled by content.js and background.js
// We do not need to reference it directly or add listeners here in popup.js

if (minimizeButton) { // Check if minimizeButton exists
    minimizeButton.addEventListener('click', () => {
        // Hide the popup
        window.close();
        // Show the floating icon (this will be handled by a background script)
        chrome.runtime.sendMessage({ action: "showFloatingIcon" });
        console.log('Popup: Minimize button clicked, sent showFloatingIcon message.');
    });
} else {
    console.error('minimizeButton not found!');
}

// Show Me Icon functionality - NEW
const showMeIcon = document.getElementById('showMeIcon');
if (showMeIcon) {
    showMeIcon.addEventListener('click', () => {
        window.close();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const personalityType = currentUser ? currentUser.personalityType : ''; // Get the actual personality type

        chrome.runtime.sendMessage({
            action: "showFloatingMeIcon",
            personalityType: personalityType, // Pass the personality type
            userAnswers: userAnswersToQuestions // Pass the user answers if needed for future AI calls
        });
        console.log('Popup: "Me" button clicked, sent showFloatingMeIcon message.');
    });
} else {
    console.error('showMeIcon not found!');
}

// Time Tracker Button functionality - NEW
const timeTrackerButton = document.getElementById('timeTrackerButton');
if (timeTrackerButton) {
    timeTrackerButton.addEventListener('click', () => {
        showPage('timeTrackerPage');
        displayDailyUsage(); // Call function to display usage when page is shown
    });
} else {
    console.error('timeTrackerButton not found!');
}

// Global variable to hold the chart instance
let usageChartInstance = null;

// Function to display daily usage data and chart - NEW
function displayDailyUsage() {
    const usageListDiv = document.getElementById('usageList');
    const noUsageMessage = document.getElementById('noUsageMessage');
    const usageChartCanvas = document.getElementById('usageChart');
    const ctx = usageChartCanvas ? usageChartCanvas.getContext('2d') : null;

    console.log('displayDailyUsage called.');
    console.log('usageChartCanvas element:', usageChartCanvas);
    if (usageChartCanvas) {
        console.log('Canvas context:', ctx);
    }

    usageListDiv.innerHTML = ''; // Clear previous list entries

    // Destroy existing chart instance if it exists
    if (usageChartInstance) {
        console.log('Destroying existing chart instance.');
        usageChartInstance.destroy();
        usageChartInstance = null;
    }

    chrome.runtime.sendMessage({ action: "getDailyUsage" }, (response) => {
        if (response && response.dailyUsage) {
            const dailyUsage = response.dailyUsage;
            const sortedSites = Object.keys(dailyUsage).sort((a, b) => dailyUsage[b] - dailyUsage[a]);

            if (sortedSites.length === 0) {
                noUsageMessage.style.display = 'block';
                if (usageChartCanvas) usageChartCanvas.style.display = 'none'; // Hide chart if no data
                console.log('No usage data. Hiding chart and showing no usage message.');
            } else {
                noUsageMessage.style.display = 'none';
                if (usageChartCanvas) usageChartCanvas.style.display = 'block'; // Show chart if data exists
                console.log('Usage data found. Displaying chart.');

                const labels = [];
                const data = [];
                // Removed backgroundColors and borderColors arrays

                sortedSites.forEach((url, index) => { // Changed 'site' to 'url' for clarity
                    const timeInSeconds = dailyUsage[url]; // Use 'url' here

                    // Extract the domain name and format it
                    let siteName = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                    // Capitalize the first letter and remove the extension for common domains
                    siteName = siteName.split('.').slice(0, -1).join('.'); // Remove .com, .org etc.
                    siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1); // Capitalize first letter


                    const hours = Math.floor(timeInSeconds / 3600);
                    const minutes = Math.floor((timeInSeconds % 3600) / 60);
                    const seconds = Math.floor(timeInSeconds % 60);

                    let timeString = '';
                    if (hours > 0) timeString += `${hours}h `;
                    if (minutes > 0) timeString += `${minutes}m `;
                    timeString += `${seconds}s`;

                    // For the list display
                    const usageItem = document.createElement('div');
                    usageItem.classList.add('usage-item');
                    usageItem.innerHTML = `
                        <span class="site-name">${siteName}</span>
                        <span class="time-spent">${timeString.trim()}</span>
                    `;
                    usageListDiv.appendChild(usageItem);

                    // For the chart data
                    labels.push(siteName); // Use formatted siteName for labels
                    data.push(timeInSeconds / 60); // Convert to minutes for better scale on chart
                    // Removed pushing to backgroundColors and borderColors
                });

                console.log('Chart Labels:', labels);
                console.log('Chart Data (minutes):', data);

                // Create the chart
                if (ctx) { // Ensure context is not null before creating chart
                    usageChartInstance = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Time Spent (minutes)',
                                data: data,
                                backgroundColor: 'rgba(128, 128, 128, 0.8)', // Neutral grey
                                borderColor: 'rgba(100, 100, 100, 1)', // Darker grey border
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false, // Allow canvas to resize freely
                            plugins: {
                                legend: {
                                    display: false // Hide legend as bars are self-explanatory
                                },
                                title: {
                                    display: true,
                                    text: 'Website Usage Today',
                                    font: {
                                        size: 18,
                                        family: 'Poppins'
                                    },
                                    color: '#2d3748'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const valueInSeconds = context.raw * 60; // Convert back to seconds
                                            const hours = Math.floor(valueInSeconds / 3600);
                                            const minutes = Math.floor((valueInSeconds % 3600) / 60);
                                            const seconds = Math.floor(valueInSeconds % 60);
                                            let timeString = '';
                                            if (hours > 0) timeString += `${hours}h `;
                                            if (minutes > 0) timeString += `${minutes}m `;
                                            timeString += `${seconds}s`;
                                            return `${context.label}: ${timeString.trim()}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Time Spent (minutes)',
                                        font: {
                                            family: 'Poppins'
                                        },
                                        color: '#4a5568'
                                    },
                                    ticks: {
                                        callback: function(value) {
                                            return value + 'm'; // Add 'm' for minutes
                                        },
                                        font: {
                                            family: 'Poppins'
                                        },
                                        color: '#4a5568',
                                        stepSize: 1 // Ensure ticks are in increments of 1
                                    },
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.05)' // Lighter grid lines
                                    }
                                },
                                x: {
                                    min: 0, // Set minimum value to 0 minutes
                                    ticks: {
                                        font: {
                                            family: 'Poppins'
                                        },
                                        color: '#4a5568'
                                    },
                                    grid: {
                                        display: false // Hide vertical grid lines
                                    }
                                }
                            }
                        }
                    });
                    console.log('Chart instance created successfully.');
                } else {
                    console.error('Canvas context is null. Cannot create chart.');
                }
            }
        } else {
            noUsageMessage.style.display = 'block';
            if (usageChartCanvas) usageChartCanvas.style.display = 'none'; // Hide chart if no data
            console.log('No response or dailyUsage data. Hiding chart and showing no usage message.');
        }
    });
}


// Initial page load logic
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup: DOMContentLoaded event fired.');
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showPage('aiPage'); // If logged in, go directly to AI page
        loadChatHistory(); // Load chat history for the logged-in user
    } else {
        showPage('welcomePage'); // Otherwise, show welcome page
    }
});