// content.js
console.log('Content: content.js loaded and running.'); // Log when the script starts

let analyzingOverlay = null; // To hold the analyzing screen element

// Function to create and inject a floating icon
function createFloatingIcon(iconId, iconText, clickAction) {
    // Prevent duplicate icons
    if (document.getElementById(iconId)) {
        return;
    }

    const floatingIcon = document.createElement('div');
    floatingIcon.id = iconId;
    floatingIcon.textContent = iconText;
    floatingIcon.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(to right, #4299e1, #3182ce);
        color: white;
        border-radius: 50%;
        width: 65px;
        height: 65px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        z-index: 99999;
        transition: all 0.2s ease;
        font-family: 'Poppins', sans-serif;
    `;

    // Hover effects
    floatingIcon.onmouseover = () => {
        floatingIcon.style.background = 'linear-gradient(to right, #3182ce, #2c5282)';
        floatingIcon.style.transform = 'translateY(-3px)';
    };
    floatingIcon.onmouseout = () => {
        floatingIcon.style.background = 'linear-gradient(to right, #4299e1, #3182ce)';
        floatingIcon.style.transform = 'translateY(0)';
    };

    // On click, send the specified action to the background script and remove the icon
    floatingIcon.onclick = () => {
        chrome.runtime.sendMessage({ action: clickAction });
        floatingIcon.remove();
    };

    document.body.appendChild(floatingIcon);
    console.log(`Content: Injected ${iconId}`);
}

// Function to inject the analyzing screen overlay
function injectAnalyzingScreen() {
    if (document.getElementById('personality-ai-analyzing-overlay')) return;

    analyzingOverlay = document.createElement('div');
    analyzingOverlay.id = 'personality-ai-analyzing-overlay';
    analyzingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 2.2em;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        pointer-events: none;
        transition: opacity 0.5s ease-in-out;
        opacity: 0;
    `;
    analyzingOverlay.innerHTML = `
        <div style="text-align: center;">
            <div class="spinner" style="
                border: 8px solid rgba(255,255,255,0.3);
                border-top: 8px solid #63b3ed;
                border-radius: 50%;
                width: 70px;
                height: 70px;
                animation: spin 1.5s linear infinite;
                margin-bottom: 20px;
            "></div>
            <p style="margin-bottom: 10px; font-weight: 500;">Analyzing page for you...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(analyzingOverlay);
    // Trigger fade-in
    setTimeout(() => {
        if (analyzingOverlay) analyzingOverlay.style.opacity = '1';
    }, 10);
}

// Function to remove the analyzing screen overlay
function removeAnalyzingScreen() {
    if (analyzingOverlay) {
        analyzingOverlay.style.opacity = '0';
        setTimeout(() => {
            if (analyzingOverlay) { 
                analyzingOverlay.remove();
                analyzingOverlay = null;
            }
        }, 500); 
    }
}

// Function to display recommendations next to each link
function displayRecommendationsNextToLinks(personalityType) {
    console.log('Content: Displaying recommendations for personality:', personalityType);
    removeRecommendationsFromLinks(); 

    const links = document.querySelectorAll('a[href]'); 
    console.log('Content: Found', links.length, 'links on the page.');

    links.forEach(link => {
        // Prevent adding tags inside other tags or to non-visible elements
        if (link.closest('.personality-recommendation-tag') || !link.offsetParent) {
            return;
        }

        const span = document.createElement('span');
        span.className = 'personality-recommendation-tag'; 
        span.textContent = `(${personalityType})`; 
        span.style.cssText = `
            margin-right: 8px; 
            font-size: 0.85em;
            color: #3182ce;
            font-weight: bold;
            white-space: nowrap; 
            display: inline-block; 
            background: linear-gradient(to right, #e0f2fe, #bfdefa);
            padding: 2px 6px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            font-family: sans-serif;
        `;
        // Use insertAdjacentElement for better compatibility
        link.insertAdjacentElement('beforebegin', span);
    });
}

// Function to remove all recommendation spans
function removeRecommendationsFromLinks() {
    const recommendationTags = document.querySelectorAll('.personality-recommendation-tag');
    recommendationTags.forEach(tag => {
        tag.remove();
    });
    console.log('Content: Removed all recommendation tags.');
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content: Received message:', request.action);
    if (request.action === "injectAiIcon") {
        createFloatingIcon('chrome-extension-floating-icon', 'AI', 'startAnalysis');
    } else if (request.action === "injectMeIcon") {
        createFloatingIcon('chrome-extension-floating-me-icon', 'ME', 'startMeAnalysis');
    }
});