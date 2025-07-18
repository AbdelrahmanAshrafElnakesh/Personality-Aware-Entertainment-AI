// background.js

let floatingIconTabId = null; // For the "AI" icon
let floatingMeIconTabId = null; // For the "ME" icon

let storedPersonalityType = 'General';
let storedUserAnswers = [];
let areRecommendationsCurrentlyDisplayed = false; // For "AI" recommendations
let areMeRecommendationsCurrentlyDisplayed = false; // For "ME" recommendations

// Personality questions array (duplicated from popup.js for prompt construction)
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

// Array of 16 MBTI personality types
const mbtiPersonalities = [
    "INFP", "INTJ", "ENFP", "ENTP",
    "INFJ", "INTP", "ENFJ", "ENTJ",
    "ISFP", "ISTP", "ESFP", "ESTP",
    "ISFJ", "ISTJ", "ESFJ", "ESTJ"
];

// Website Time Tracker
const entertainmentSites = [
    "facebook.com", "youtube.com", "netflix.com", "instagram.com", "tiktok.com",
    "twitter.com", "reddit.com", "twitch.tv", "disneyplus.com", "hulu.com",
    "amazon.com/primevideo", "hbomax.com", "spotify.com", "pandora.com",
    "pinterest.com", "snapchat.com", "linkedin.com/feed", "tumblr.com",
    "vimeo.com", "dailymotion.com", "bilibili.com", "weibo.com", "vk.com",
    "ok.ru", "line.me", "discord.com", "roblox.com", "minecraft.net",
    "fortnite.com", "leagueoflegends.com", "twitch.tv", "steamcommunity.com",
    "epicgames.com", "playstation.com", "xbox.com", "nintendo.com",
    "chess.com", "lichess.org", "poki.com", "miniclip.com", "friv.com",
    "coolmathgames.com", "newgrounds.com", "deviantart.com", "artstation.com",
    "pixiv.net", "wattpad.com", "archiveofourown.org", "fanfiction.net",
    "goodreads.com", "myanimelist.net", "anilist.co", "crunchyroll.com",
    "funimation.com", "webtoons.com", "mangadex.org", "readmanga.cc",
    "comicbookplus.com", "marvel.com", "dccomics.com", "ign.com",
    "gamespot.com", "metacritic.com", "rottentomatoes.com", "imdb.com",
    "allmusic.com", "last.fm", "bandcamp.com", "soundcloud.com",
    "mixcloud.com", "tidal.com", "deezer.com", "quora.com", "medium.com",
    "substack.com", "patreon.com", "ko-fi.com", "buymeacoffee.com",
    "etsy.com", "ebay.com", "amazon.com", "aliexpress.com", "shein.com",
    "temu.com", "wish.com", "target.com", "walmart.com", "bestbuy.com"
];

let activeTabId = null;
let activeTabUrl = null;
let timerStartTime = null;
let dailyUsage = {}; // { "domain.com": secondsSpent }

// Function to get the domain from a URL
function getDomainFromUrl(url) {
    try {
        const urlObj = new URL(url);
        let hostname = urlObj.hostname;
        // Remove 'www.' if present
        if (hostname.startsWith('www.')) {
            hostname = hostname.substring(4);
        }
        return hostname;
    } catch (e) {
        return null;
    }
}

// Function to check if a site is an entertainment site
function isEntertainmentSite(url) {
    const domain = getDomainFromUrl(url);
    if (!domain) return false;
    // Check if the domain or a subdomain is in our list
    return entertainmentSites.some(site => domain === site || domain.endsWith('.' + site));
}

// Function to update the timer for the active tab
function updateTimer() {
    if (activeTabUrl && timerStartTime) {
        const timeSpent = Math.floor((Date.now() - timerStartTime) / 1000); // Time in seconds
        const domain = getDomainFromUrl(activeTabUrl);

        if (domain && isEntertainmentSite(activeTabUrl)) {
            dailyUsage[domain] = (dailyUsage[domain] || 0) + timeSpent;
            saveDailyUsage();
            console.log(`Background: Updated usage for ${domain}: ${dailyUsage[domain]} seconds`);
        }
    }
    timerStartTime = Date.now(); // Reset timer start for the new active period
}

// Load daily usage from storage
async function loadDailyUsage() {
    const storedData = await chrome.storage.local.get(['dailyUsage', 'lastResetDate']);
    const today = new Date().toDateString();

    if (storedData.lastResetDate !== today) {
        // It's a new day, reset usage
        dailyUsage = {};
        await chrome.storage.local.set({ dailyUsage: {}, lastResetDate: today });
        console.log('Background: Daily usage reset for a new day.');
    } else {
        dailyUsage = storedData.dailyUsage || {};
        console.log('Background: Loaded daily usage:', dailyUsage);
    }
}

// Save daily usage to storage
function saveDailyUsage() {
    chrome.storage.local.set({ dailyUsage: dailyUsage });
}

// Calculate timestamp for the next midnight
function getMidnightTimestamp() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Set to next midnight
    return midnight.getTime(); // Return timestamp in milliseconds
}

// Schedule daily reset alarm
function scheduleDailyResetAlarm() {
    chrome.alarms.clear('dailyReset', () => {
        const midnightTimestamp = getMidnightTimestamp();
        chrome.alarms.create('dailyReset', {
            when: midnightTimestamp, // Fire at the exact timestamp of next midnight
            periodInMinutes: 24 * 60 // Repeat every 24 hours (1440 minutes)
        });
        console.log('Background: Daily reset alarm scheduled for:', new Date(midnightTimestamp));
    });
}


// Event listeners for tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    updateTimer(); // Update timer for the tab that was just active
    activeTabId = activeInfo.tabId;
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url;
    timerStartTime = Date.now(); // Start timer for the new active tab
    console.log('Background: Tab activated:', activeTabUrl);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        updateTimer(); // Update timer for the previous URL in this tab
        activeTabUrl = tab.url;
        timerStartTime = Date.now(); // Start timer for the new URL in this tab
        console.log('Background: Tab updated:', activeTabUrl);
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === activeTabId) {
        updateTimer(); // Update timer for the tab that was just closed
        activeTabId = null;
        activeTabUrl = null;
        timerStartTime = null;
        console.log('Background: Active tab removed.');
    }
});

// Initial load and setup
chrome.runtime.onInstalled.addListener(() => {
    console.log('Background: Extension installed.');
    loadDailyUsage();
    scheduleDailyResetAlarm();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('Background: Extension started up.');
    loadDailyUsage();
    scheduleDailyResetAlarm(); // Re-schedule alarm on startup
});

// Alarm listener for daily reset
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReset') {
        console.log('Background: Daily reset alarm triggered.');
        initializeDailyUsage(); // This function should handle the reset and saving
        scheduleDailyResetAlarm(); // Re-schedule for the next day
    }
});

// Ensure initializeDailyUsage is called on alarm to handle the reset and saving
async function initializeDailyUsage() {
    const storedData = await chrome.storage.local.get(['dailyUsage', 'lastResetDate']);
    const today = new Date().toDateString();

    if (storedData.lastResetDate !== today) {
        dailyUsage = {};
        await chrome.storage.local.set({ dailyUsage: {}, lastResetDate: today });
        console.log('Background: Daily usage reset for a new day.');
    } else {
        dailyUsage = storedData.dailyUsage || {};
        console.log('Background: Loaded daily usage (initialization):', dailyUsage);
    }
}

// Functions to be injected into the content script
// These functions need to be self-contained as they run in a different context.
function injectAnalyzingScreen() {
    if (document.getElementById('personality-ai-analyzing-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'personality-ai-analyzing-overlay';
    overlay.style.cssText = `...`; // Using existing styles from content.js
    overlay.innerHTML = `...`;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.style.opacity = '1'; }, 10);
}

function removeAnalyzingScreen() {
    const overlay = document.getElementById('personality-ai-analyzing-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => { if (overlay) { overlay.remove(); } }, 500);
    }
}

function displayRecommendationsNextToLinks(personalityType) {
    removeRecommendationsFromLinks();
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        // Avoid adding tags to links that are inside other recommendation tags
        if (link.closest('.personality-recommendation-tag')) return;
        
        const span = document.createElement('span');
        span.className = 'personality-recommendation-tag';
        span.textContent = `(${personalityType})`;
        span.style.cssText = `...`; // Using existing styles from content.js
        link.parentNode.insertBefore(span, link);
    });
}

function removeRecommendationsFromLinks() {
    document.querySelectorAll('.personality-recommendation-tag').forEach(tag => tag.remove());
}


// Message listener from popup.js or content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showFloatingIcon") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                floatingIconTabId = tabs[0].id;
                // Send a message to the content script to perform the injection
                chrome.tabs.sendMessage(tabs[0].id, { action: "injectAiIcon" });
                console.log('Background: Requested content script to inject AI icon.');
            }
        });
    } else if (request.action === "showFloatingMeIcon") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                floatingMeIconTabId = tabs[0].id;
                storedPersonalityType = request.personalityType || 'General';
                storedUserAnswers = request.userAnswers || [];
                // Send a message to the content script to perform the injection
                chrome.tabs.sendMessage(tabs[0].id, { action: "injectMeIcon" });
                console.log('Background: Requested content script to inject ME icon.');
            }
        });
    } else if (request.action === "openPopup") {
        console.log('Background: Received openPopup message. Opening popup.');
        chrome.action.setPopup({ popup: "popup.html" });
        chrome.action.openPopup();
        floatingIconTabId = null;
        floatingMeIconTabId = null;
    } else if (request.action === "startAnalysis") {
        console.log('Background: Received startAnalysis message.');
        const tabId = floatingIconTabId;
        if (tabId) {
            if (areRecommendationsCurrentlyDisplayed) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: removeRecommendationsFromLinks
                });
                areRecommendationsCurrentlyDisplayed = false;
                console.log('Background: Removed recommendations.');
            } else {
                chrome.scripting.executeScript({ target: { tabId }, function: injectAnalyzingScreen });
                console.log('Background: Injected analyzing screen.');

                setTimeout(() => {
                    chrome.scripting.executeScript({
                        target: { tabId },
                        function: displayRecommendationsNextToLinks,
                        args: [storedPersonalityType]
                    });
                    areRecommendationsCurrentlyDisplayed = true;
                    console.log('Background: Displayed recommendations after 3s.');
                }, 3000); // 3-second delay
            }
        }
    } else if (request.action === "startMeAnalysis") {
        console.log('Background: Received startMeAnalysis message.');
        const tabId = floatingMeIconTabId;
        if (tabId) {
            if (areMeRecommendationsCurrentlyDisplayed) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    function: removeRecommendationsFromLinks
                });
                areMeRecommendationsCurrentlyDisplayed = false;
                console.log('Background: Removed ME recommendations.');
            } else {
                chrome.scripting.executeScript({ target: { tabId }, function: injectAnalyzingScreen });
                console.log('Background: Injected analyzing screen for ME.');

                setTimeout(() => {
                    chrome.scripting.executeScript({
                        target: { tabId },
                        function: displayRecommendationsNextToLinks,
                        args: [storedPersonalityType]
                    });
                    areMeRecommendationsCurrentlyDisplayed = true;
                    console.log('Background: Displayed ME recommendations after 3s.');
                }, 3000); // 3-second delay
            }
        }
    } else if (request.action === "getDailyUsage") {
        console.log('Background: Received getDailyUsage message. Sending dailyUsage data.');
        sendResponse({ dailyUsage: dailyUsage });
        return true; // Indicate that sendResponse will be called asynchronously
    }
});