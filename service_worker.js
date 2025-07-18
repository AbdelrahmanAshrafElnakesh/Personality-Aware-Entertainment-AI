// service_worker.js

// --- IMPORTANT: This log helps diagnose if the service worker file is being loaded at all. ---
console.log("Service Worker: Script started loading.");

// This script runs in the background and handles logic for history processing and recommendations.

// Define a simple list of keywords to categorize interests.
// In a real application, this would be a more sophisticated NLP model.
const INTEREST_KEYWORDS = {
  "movies": ["movie", "film", "cinema", "actor", "actress", "director", "trailer", "netflix", "hbo", "disney+", "prime video", "rotten tomatoes", "imdb", "car movie", "racing movie", "action movie", "sci-fi movie", "comedy movie", "war movie", "documentary film", "thriller", "drama", "romance"], // Added more specific movie keywords
  "books": ["book", "read", "novel", "author", "fiction", "non-fiction", "kindle", "audible", "library", "goodreads", "ebook"],
  "videos": ["video", "youtube", "tutorial", "clip", "vlog", "stream", "documentary", "how to", "review", "music video", "youtube gaming", "gaming channel", "gameplay", "walkthrough", "let's play", "esports highlights", "game review", "PC game reviews", "gaming tech", "software tutorials for games", "gaming setup", "gaming benchmarks", "PC build guides", "gaming news PC", "car review", "auto review", "speed race", "car race", "motorsport", "formula 1", "rally", "drifting", "automotive"], // Added more specific gaming/tech video keywords, and car/racing keywords
  "science": ["science", "physics", "chemistry", "biology", "astronomy", "research", "discovery", "nasa", "space", "genetics", "quantum", "scientific discovery", "space exploration", "medical research"], // Added more science keywords
  "technology": ["tech", "software", "programming", "ai", "artificial intelligence", "gadget", "computer", "web development", "machine learning", "cybersecurity", "startup", "operating system", "hardware", "software engineering"], // Added more general tech keywords
  "history": ["history", "ancient", "world war", "historical", "biography", "era", "archaeology", "civilization", "timeline", "military history", "ancient history", "modern history"], // Added more history/war keywords
  "cooking": ["recipe", "cook", "food", "kitchen", "chef", "baking", "cuisine", "gourmet", "diet", "nutrition"],
  "travel": ["travel", "destination", "vacation", "explore", "journey", "tourism", "hotel", "flight", "adventure", "wanderlust"],
  "gaming": ["game", "playstation", "xbox", "nintendo", "pc game", "esports", "gamer", "rpg", "shooter", "strategy game", "twitch", "steam", "epic games", "indie game", "multiplayer", "single player", "console", "pc gaming", "mobile game", "game development", "gaming news", "game review", "gaming software", "gaming hardware", "esports software", "game engine", "modding", "game development tools", "gaming peripherals"], // Expanded gaming keywords with PC/software focus
  "music": ["music", "song", "artist", "album", "genre", "concert", "band", "spotify", "apple music", "lyrics", "instrumental"],
  "news": ["news", "current events", "politics", "economy", "world affairs", "breaking news", "journalism", "headline"],
  "health": ["health", "fitness", "wellness", "exercise", "nutrition", "medicine", "mental health", "workout", "diet"],
  "finance": ["finance", "investing", "stock market", "cryptocurrency", "economy", "budget", "personal finance", "trading"],
  "sports": ["sports", "football", "basketball", "soccer", "baseball", "olympics", "athlete", "team", "match", "league", "racing", "auto racing", "car racing", "motorsports"]
};

/**
 * Processes a single history item to extract relevant keywords and categorize interests.
 * @param {chrome.history.HistoryItem} historyItem - The history item object.
 * @returns {string[]} An array of detected interests.
 */
function getInterestsFromHistoryItem(historyItem) {
  const interests = new Set();
  // Combine title and URL for comprehensive analysis
  const text = (historyItem.title + " " + historyItem.url).toLowerCase();

  for (const category in INTEREST_KEYWORDS) {
    for (const keyword of INTEREST_KEYWORDS[category]) {
      if (text.includes(keyword)) {
        interests.add(category);
        // For more specific YouTube/Google search detection:
        // If it's a YouTube URL, add 'videos' category if not already added
        if (historyItem.url.includes("youtube.com/watch?v=") && category !== "videos") {
          interests.add("videos");
        }
        // If it's a Google search URL, try to infer interest from query
        if (historyItem.url.startsWith("https://www.google.com/search?q=")) {
          const queryParam = new URLSearchParams(historyItem.url.split('?')[1]).get('q');
          if (queryParam) {
            const queryText = queryParam.toLowerCase();
            for (const subCategory in INTEREST_KEYWORDS) {
              for (const subKeyword of INTEREST_KEYWORDS[subCategory]) {
                if (queryText.includes(subKeyword)) {
                  interests.add(subCategory);
                }
              }
            }
          }
        }
        break; // Found a keyword for this category, move to next category
      }
    }
  }
  return Array.from(interests);
}

/**
 * Fetches recent browsing history and determines user interests.
 * Stores interests in chrome.storage.local.
 * @returns {Promise<string[]>} An array of detected interests.
 */
async function analyzeBrowsingHistory() {
  try {
    // Search for history items from the last 30 days and increase max results
    const historyItems = await chrome.history.search({
      text: "", // Empty string to get all history items
      startTime: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
      maxResults: 500 // Increased limit for more data
    });

    const userInterests = {};
    for (const item of historyItems) {
      const interests = getInterestsFromHistoryItem(item);
      for (const interest of interests) {
        userInterests[interest] = (userInterests[interest] || 0) + 1;
      }
    }

    // Sort interests by frequency and take the top N
    const sortedInterests = Object.entries(userInterests)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([interest]) => interest)
      .slice(0, 7); // Get top 7 interests for more variety

    await chrome.storage.local.set({ userInterests: sortedInterests });
    console.log("Service Worker: User interests analyzed and stored:", sortedInterests);
    return sortedInterests;

  } catch (error) {
    console.error("Service Worker: Error analyzing browsing history:", error);
    // Re-throw or return empty to indicate failure
    throw new Error("Failed to analyze browsing history: " + error.message);
  }
}

/**
 * Simulates content recommendations based on detected interests.
 * In a real application, this would involve calling external APIs (e.g., TMDB, Google Books)
 * or a custom backend with a more sophisticated recommendation engine.
 *
 * For demonstration, this uses a placeholder LLM call.
 * @param {string[]} interests - An array of user interests.
 * @returns {Promise<Object>} An object containing simulated recommendations for videos, movies, and books.
 */
async function getRecommendations(interests) {
  console.log("Service Worker: Generating recommendations for interests:", interests);

  let videoPromptAddition = "";
  const relevantVideoInterests = [];

  if (interests.includes("gaming")) {
    relevantVideoInterests.push("gaming");
  }
  if (interests.includes("technology")) {
    relevantVideoInterests.push("technology");
  }
  // Use 'sports' as a proxy for car/racing interests
  if (interests.includes("sports")) {
    relevantVideoInterests.push("cars/racing");
  }

  const totalVideosToRecommend = 5; // We always want 5 videos

  if (relevantVideoInterests.length > 0) {
    // Distribute the 5 videos as evenly as possible among relevant interests
    const videosPerTopic = Math.floor(totalVideosToRecommend / relevantVideoInterests.length);
    let remainingVideos = totalVideosToRecommend % relevantVideoInterests.length;

    let videoRequests = [];
    for (const topic of relevantVideoInterests) {
      let count = videosPerTopic;
      if (remainingVideos > 0) {
        count++;
        remainingVideos--;
      }
      if (topic === "gaming") {
        videoRequests.push(`${count} YouTube gaming videos, especially those related to PC gaming, gaming software, and gaming hardware`);
      } else if (topic === "technology") {
        videoRequests.push(`${count} YouTube technology videos, focusing on software, hardware, and AI`);
      } else if (topic === "cars/racing") {
        videoRequests.push(`${count} YouTube car reviews, speed races, and automotive content`);
      }
    }
    videoPromptAddition = ` For videos, suggest: ${videoRequests.join('; ')}.`;
  } else {
    videoPromptAddition = " For videos, prioritize general YouTube suggestions.";
  }


  // New logic for movie prompt addition
  let moviePromptAddition = "";
  if (interests.includes("movies")) {
    if (interests.includes("sports") && (interests.includes("travel") || interests.includes("technology"))) {
      moviePromptAddition += " Prioritize movies about cars and races.";
    }
    if (interests.includes("science")) {
      moviePromptAddition += " Include science fiction movies.";
    }
    if (interests.includes("history")) {
      moviePromptAddition += " Include war movies.";
    }
    if (interests.includes("comedy")) { // Assuming 'comedy' interest exists or can be inferred
      moviePromptAddition += " Include comedy movies.";
    }
  }


  // Updated prompt to request 5 videos, 5 movies, and 5 books
  const prompt = `Based on these interests: ${interests.join(', ')}, suggest 5 videos, 5 movies, and 5 books.${videoPromptAddition}${moviePromptAddition} Format as JSON with keys 'videos', 'movies', 'books', each containing an array of strings.`;

  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });
  const payload = {
    contents: chatHistory,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          "videos": { "type": "ARRAY", "items": { "type": "STRING" } },
          "movies": { "type": "ARRAY", "items": { "type": "STRING" } },
          "books": { "type": "ARRAY", "items": { "type": "STRING" } }
        },
        "propertyOrdering": ["videos", "movies", "books"]
      }
    }
  };

  // IMPORTANT: Replace "YOUR_GEMINI_API_KEY_HERE" with your actual Gemini API key.
  // You can obtain an API key from Google AI Studio (aistudio.google.com/app/apikey)
  // or Google Cloud Console.
  const apiKey = "AIzaSyAm641uP5HqrElQiMSujmEA9nVe385DE0w"; // Updated with the provided API key
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text(); // Get raw error response
      console.error(`Service Worker: Gemini API request failed with status ${response.status}: ${response.statusText}`, errorData);
      throw new Error(`Gemini API error: ${response.statusText || 'Unknown error'}. Details: ${errorData.substring(0, 200)}...`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      const jsonText = result.candidates[0].content.parts[0].text;
      const parsedJson = JSON.parse(jsonText);
      console.log("Service Worker: LLM generated recommendations:", parsedJson);
      return parsedJson;
    } else {
      console.error("Service Worker: LLM response structure unexpected:", result);
      throw new Error("Unexpected response structure from Gemini API.");
    }
  } catch (error) {
    console.error("Service Worker: Error calling Gemini API for recommendations:", error);
    throw new Error("Failed to get recommendations: " + error.message);
  }
}

/**
 * Fetches specific video recommendations based on a user-provided topic.
 * @param {string} topic - The specific topic for video recommendations.
 * @returns {Promise<string[]>} An array of video titles.
 */
async function getSpecificTopicVideos(topic) {
  console.log(`Service Worker: Generating specific video recommendations for topic: "${topic}"`);

  const prompt = `Suggest 5 YouTube videos about "${topic}". Format as JSON with a single key 'videos' containing an array of strings.`;

  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });
  const payload = {
    contents: chatHistory,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          "videos": { "type": "ARRAY", "items": { "type": "STRING" } }
        },
        "propertyOrdering": ["videos"]
      }
    }
  };

  const apiKey = "AIzaSyAm641uP5HqrElQiMSujmEA9nVe385DE0w"; // Your API key
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Service Worker: Gemini API request failed for specific topic with status ${response.status}: ${response.statusText}`, errorData);
      throw new Error(`Gemini API error for specific topic: ${response.statusText || 'Unknown error'}. Details: ${errorData.substring(0, 200)}...`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      const jsonText = result.candidates[0].content.parts[0].text;
      const parsedJson = JSON.parse(jsonText);
      console.log("Service Worker: LLM generated specific video recommendations:", parsedJson);
      return parsedJson.videos || [];
    } else {
      console.error("Service Worker: LLM response structure unexpected for specific topic:", result);
      throw new Error("Unexpected response structure from Gemini API for specific topic.");
    }
  } catch (error) {
    console.error("Service Worker: Error calling Gemini API for specific topic recommendations:", error);
    throw new Error("Failed to get specific video recommendations: " + error.message);
  }
}


// Listen for messages from the popup script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getInterestsAndRecommendations") {
    (async () => {
      let interests = [];
      let recommendations = { videos: [], movies: [], books: [] };
      let error = null;

      try {
        // First, analyze history to get interests
        interests = await analyzeBrowsingHistory();
        // Then, get recommendations based on those interests
        recommendations = await getRecommendations(interests);
      } catch (e) {
        console.error("Service Worker: Error in getInterestsAndRecommendations flow:", e);
        error = e.message;
      } finally {
        // Always send a response, even if there was an error
        sendResponse({ interests, recommendations, error });
      }
    })();
    return true; // Indicates that sendResponse will be called asynchronously.
  } else if (request.action === "getSpecificTopicRecommendations") {
    (async () => {
      let videos = [];
      let error = null;
      try {
        videos = await getSpecificTopicVideos(request.topic);
      } catch (e) {
        console.error("Service Worker: Error in getSpecificTopicRecommendations flow:", e);
        error = e.message;
      } finally {
        sendResponse({ videos, error });
      }
    })();
    return true; // Indicates that sendResponse will be called asynchronously.
  }
});

// Optional: Re-analyze history periodically or on browser startup
// chrome.runtime.onInstalled.addListener(analyzeBrowsingHistory);
// chrome.runtime.onStartup.addListener(analyzeBrowsingHistory);

// Listen for history changes to update interests in the background
chrome.history.onVisited.addListener(async (historyItem) => {
  console.log("Service Worker: History item visited:", historyItem.url);
  // Re-analyze history on a new visit to keep interests up-to-date
  try {
    await analyzeBrowsingHistory();
  } catch (error) {
    console.error("Service Worker: Error updating interests on history visit:", error);
  }
});
