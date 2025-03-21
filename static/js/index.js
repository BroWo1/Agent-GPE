// Add these variables at the top of your index.js file, right after the other variable declarations
let currentSessionId = null;
const MAX_PREVIEW_LENGTH = 60;
const MAX_DISPLAYED_SESSIONS = 5;
let firstMessageSent = false;
let fullUI = false;

function getChatSessions() {
  try {
    const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {};
    return Array.isArray(settings.chatSessions) ? settings.chatSessions : [];
  } catch (error) {
    console.error("Error getting chat sessions:", error);
    return [];
  }
}

function saveChatSessions(sessions) {
  try {
    if (!Array.isArray(sessions)) {
      console.error("Invalid sessions data:", sessions);
      return;
    }

    const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {};
    settings.chatSessions = sessions;
    localStorage.setItem('openManusSettings', JSON.stringify(settings));
    console.log(`Saved ${sessions.length} chat sessions to localStorage`);
  } catch (error) {
    console.error("Error saving chat sessions:", error);
  }
}

// Add this helper function to strip HTML
function stripHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

// Add this helper function to format dates
function formatSessionDate(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();

  if (isToday) {
    return `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  } else if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  } else {
    return date.toLocaleDateString([], {month: 'short', day: 'numeric'}) +
           ` at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  }
}

// Function to position the history container correctly
function positionHistoryContainer() {
  const inputContainer = document.getElementById('input-container');
  const historyContainer = document.getElementById('chat-history-container');


  if (inputContainer && historyContainer && !firstMessageSent) {
    const inputRect = inputContainer.getBoundingClientRect();
    const inputBox = document.getElementById('user-input');


    historyContainer.style.position = 'absolute';
    setTimeout(()=>{
      const inputBoxRect = inputBox.getBoundingClientRect();
    const topPosition = inputBoxRect.bottom + 10; // 20px margin
      historyContainer.style.top = `${topPosition}px`;
    }, 300);

    historyContainer.style.left = '50%';
    historyContainer.style.transform = 'translateX(-50%)';
    historyContainer.style.zIndex = '1';
    historyContainer.style.width = `${Math.min(inputRect.width, 600)}px`;

    // Add the visible class after positioning
    setTimeout(() => {
      historyContainer.classList.add('visible');
    }, 10);
  }
}

// Add this function to migrate old chat history
function migrateHistoryToSessions() {
  const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {};

  // If we already have sessions, don't do anything
  if (settings.chatSessions) {
    return;
  }

  // If we have old chat history, convert it to a session
  if (settings.chatHistory && settings.chatHistory.length > 0) {
    const sessionId = generateSessionId();

    // Create a session from the old chat history
    const session = {
      id: sessionId,
      timestamp: Date.now(),
      messages: settings.chatHistory.map(msg => ({
        text: msg.text,
        sender: msg.sender,
        timestamp: Date.now()
      }))
    };

    // Add the session to settings
    settings.chatSessions = [session];

    // Set as current session
    currentSessionId = sessionId;

    // Save updated settings
    localStorage.setItem('openManusSettings', JSON.stringify(settings));

    console.log('Migrated old chat history to session format');
  } else {
    // Initialize empty sessions array
    settings.chatSessions = [];
    localStorage.setItem('openManusSettings', JSON.stringify(settings));
  }
}

// Function to generate a unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

function addMessageToSession(text, sender) {
  const sessions = getChatSessions();

  // If no current session or it doesn't exist, create a new one
  if (!currentSessionId || !sessions.find(s => s.id === currentSessionId)) {
    console.log("No valid session found, creating new one");
    createChatSession();
  }

  // Find current session
  const session = sessions.find(s => s.id === currentSessionId);

  if (session) {
    // Add message to session
    session.messages.push({
      text,
      sender,
      timestamp: Date.now()
    });

    // Update timestamp
    session.timestamp = Date.now();

    // Save sessions
    saveChatSessions(sessions);
    console.log(`Message added to session ${session.id}, now has ${session.messages.length} messages`);
  } else {
    console.error("Failed to find or create a valid session");
  }
}

// Function to create a new chat session
function createChatSession() {
  const sessionId = generateSessionId();
  const sessions = getChatSessions();

  // Create new session
  const newSession = {
    id: sessionId,
    timestamp: Date.now(),
    messages: []
  };

  // Add to sessions
  sessions.push(newSession);
  saveChatSessions(sessions);

  // Set as current session
  currentSessionId = sessionId;

  return newSession;
}


function toggleSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    // Check for both 'none' and empty string (initial state)
    settingsPanel.style.display = (settingsPanel.style.display === 'none' || settingsPanel.style.display === '') ? 'block' : 'none';
}
// Add this function to dynamically position the input container based on the title's position
function updateInputPosition() {
  const header = document.querySelector('.header');
  const title = document.getElementById('title');
  const inputContainer = document.getElementById('input-container');

  // Only adjust if we're in minimal UI mode (with the centered class)
  if (inputContainer.classList.contains('centered')) {
    // Get the title's actual dimensions and position
    const titleRect = title.getBoundingClientRect();

    // Position the input container below the title with appropriate spacing
    // Use the actual bottom position of the title plus a relative gap
    const gap = Math.min(window.innerHeight * 0.05, 30); // Responsive gap, max 30px

    inputContainer.style.position = 'absolute';
    inputContainer.style.top = `${titleRect.bottom + gap}px`;
    inputContainer.style.left = '50%';
    inputContainer.style.transform = 'translateX(-50%)';
    inputContainer.style.zIndex = '4';
  }
}

window.addEventListener('load', function() {
  // Small delay to ensure elements are fully rendered
  setTimeout(updateInputPosition, 300);
});





  // Add an event listener for window resize
  window.addEventListener('resize', function() {
    if (!window.resizeTimeout) {
      window.resizeTimeout = setTimeout(function() {
        window.resizeTimeout = null;
        updateInputPosition();
        positionHistoryContainer();
      }, 200);
    }
  });

function saveAndApplySettings() {
    settings = saveSettings();
    document.getElementById('settings-panel').style.display = 'none';

    // Reconnect with new settings
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
    }
    connectWebSocket();
}
document.head.insertAdjacentHTML('beforeend', `
  <style>
    #cancel-button {
      padding: 12px 20px;
      background-color: #E57373;
      color: white;
      border: none;
      border-radius: 24px;
      margin-left: 10px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s ease;
      display: none;
      z-index: 1000;
    }
    
    #cancel-button:hover {
      background-color: #D32F2F;
    }
    
    /* Make extra sure the button is visible when needed */
    #cancel-button[style*="display: block"],
    #cancel-button[style*="display:block"] {
      display: block !important;
    }
  </style>
`);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    // Settings and UI elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings');
    const serverHostInput = document.getElementById('server-host');
    const serverPortInput = document.getElementById('server-port');
    const useSecureInput = document.getElementById('use-secure');
    const darkModeToggle = document.getElementById('dark-mode');
    const chatContainer = document.getElementById('chat-container');
    const progressLog = document.getElementById('progress-log');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const statusDisplay = document.getElementById('status');
    const clearChatBtn = document.getElementById('clear-chat');
    const clearProgressBtn = document.getElementById('clear-progress');
    const flexContainer = document.querySelector('.flex-container');
    const statusBar = document.getElementById('status-bar');
    const header = document.querySelector('.header');
    const inputContainer = document.getElementById('input-container');
    // Track if the first message has been sent
    console.log("DOM loaded - checking cancel button setup");
    const checkCancelButton = () => {
      const btn = document.getElementById('cancel-button');
      console.log("Cancel button exists:", !!btn);
      if (btn) {
        console.log("Cancel button display:", btn.style.display);
        console.log("Cancel button parent:", btn.parentElement?.tagName);
        console.log("Cancel button CSS:", btn.className);
      }
    };
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.display = 'none'; // Initially hidden
    cancelButton.classList.add('cancel-btn');
    cancelButton.style.zIndex = '1000'; // Ensure it's above other elementsf

    // Before appending, check if it already exists
    if (!document.getElementById('cancel-button')) {
      console.log("Appending cancel button to input container");
      inputContainer.appendChild(cancelButton);
    } else {
      console.log("Cancel button already exists!");
    }

    // Call our debug function after creating button
    setTimeout(checkCancelButton, 500);
    // Add this code right after creating the cancel button in the DOMContentLoaded event
// (below the line that adds the button to the inputContainer)

// Add event listener to the cancel button
cancelButton.addEventListener('click', function() {
  console.log("Cancel button clicked");

  // Only send cancellation if we're actually connected and processing
  if (isConnected && isProcessing) {
    console.log("Sending cancellation request to server");

    // Send cancellation request to server
    socket.send(JSON.stringify({
      command: "cancel",
      clientId: clientId
    }));

    // Update status to give immediate feedback
    statusDisplay.textContent = 'Cancellation requested...';

    // Also add to progress log
    addProgressEntry('Cancellation requested by user', 'step');
  } else {
    console.log("Cannot cancel - not connected or not processing",
                "isConnected:", isConnected,
                "isProcessing:", isProcessing);
  }
});

function deleteChatSession(sessionId, event) {
  // Stop the click event from bubbling up to the card
  if (event) {
    event.stopPropagation();
  }

  // Get all sessions
  const sessions = getChatSessions();

  // Filter out the session to delete
  const updatedSessions = sessions.filter(session => session.id !== sessionId);

  // Save the updated sessions
  saveChatSessions(updatedSessions);

  // If this was the current session, clear it
  if (currentSessionId === sessionId) {
    currentSessionId = null;
    // Clear the chat if we're in a full UI state
    if (firstMessageSent) {
      resetToInitialState();
    }
  }

  // Update the display
  updateChatHistoryDisplay();
}

// Function to clear all chat history
function clearAllChatHistory() {
  // Confirm with the user
  if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
    // Clear all sessions
    saveChatSessions([]);

    // Reset current session
    currentSessionId = null;

    // Update the display
    updateChatHistoryDisplay();

    // If we're in a full UI state, reset to minimal
    if (firstMessageSent) {
      resetToInitialState();
    }
  }
}

// Enhanced version of createSessionCard with delete button
function createSessionCard(session) {
  const card = document.createElement('div');
  card.className = 'chat-session-card';
  card.dataset.sessionId = session.id;

  // Create a timestamp element
  const timestamp = document.createElement('div');
  timestamp.className = 'chat-session-time';

  // Format the date for display
  const sessionDate = new Date(session.timestamp);
  timestamp.textContent = formatSessionDate(sessionDate);

  // Create a title element
  const title = document.createElement('div');
  title.className = 'chat-session-title';

  // Use the first user message as title
  const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
  if (firstUserMessage) {
    // Strip HTML and truncate if necessary
    let titleText = stripHtml(firstUserMessage.text);
    if (titleText.length > MAX_PREVIEW_LENGTH) {
      titleText = titleText.substring(0, MAX_PREVIEW_LENGTH) + '...';
    }
    title.textContent = titleText;
  } else {
    title.textContent = 'Chat session';
  }

  // Create preview text
  const preview = document.createElement('div');
  preview.className = 'chat-session-preview';

  // Get last agent message for preview
  const lastAgentMessage = [...session.messages].reverse().find(msg => msg.sender === 'agent');
  if (lastAgentMessage) {
    let previewText = stripHtml(lastAgentMessage.text);
    if (previewText.length > MAX_PREVIEW_LENGTH) {
      previewText = previewText.substring(0, MAX_PREVIEW_LENGTH) + '...';
    }
    preview.textContent = previewText;
  } else {
    preview.textContent = 'No responses yet';
  }

  // Add delete button
  const deleteButton = document.createElement('div');
  deleteButton.className = 'chat-session-delete';
  deleteButton.innerHTML = '×'; // × character
  deleteButton.title = 'Delete this chat';
  deleteButton.addEventListener('click', (e) => deleteChatSession(session.id, e));

  // Add elements to card
  card.appendChild(timestamp);
  card.appendChild(title);
  card.appendChild(preview);
  card.appendChild(deleteButton);

  // Add click event to load session
  card.addEventListener('click', () => loadChatSession(session.id));

  return card;
}

function updateChatHistoryDisplay() {
  const container = document.getElementById('chat-history-container') || createChatHistoryContainer();
  const historyList = document.getElementById('chat-history-list');

  // Get all chat sessions
  const sessions = getChatSessions();

  // Show container if we're in minimal UI mode (not firstMessageSent)
  if (!firstMessageSent) {
    console.log("Updating chat history display with", sessions.length, "sessions");

    // Add visible class with animation
    container.style.display = 'block';
    setTimeout(() => {
      container.classList.add('visible');
    }, 10);

    // Clear existing cards
    historyList.innerHTML = '';

    if (sessions.length > 0) {
      // Display sessions, newest first (limiting to MAX_DISPLAYED_SESSIONS)
      sessions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_DISPLAYED_SESSIONS)
        .forEach(session => {
          historyList.appendChild(createSessionCard(session));
        });

      // Add "Clear All" option if we have sessions
      const clearAllButton = container.querySelector('.chat-history-clear');
      if (!clearAllButton) {
        const newClearAllButton = document.createElement('div');
        newClearAllButton.className = 'chat-history-clear';
        newClearAllButton.textContent = 'Clear all chat history';
        newClearAllButton.addEventListener('click', clearAllChatHistory);
        container.appendChild(newClearAllButton);
      }
    } else {
      // Show empty state
      const emptyState = document.createElement('div');
      emptyState.className = 'chat-history-empty';
      emptyState.textContent = 'No previous chats yet. Start a new conversation!';
      historyList.appendChild(emptyState);

      // Remove clear all button if it exists
      const clearAllButton = container.querySelector('.chat-history-clear');
      if (clearAllButton) {
        container.removeChild(clearAllButton);
      }
    }

    // Position the container correctly under the input
    setTimeout(positionHistoryContainer, 10);
  } else {
    // Hide and remove visible class when in full UI mode
    container.classList.remove('visible');
    setTimeout(() => {
      container.style.display = 'none';
    }, 400); // Match transition duration
  }
}

// Enhanced `createChatHistoryContainer` with better structure
function createChatHistoryContainer() {
  // Check if container already exists
  if (document.getElementById('chat-history-container')) {
    return document.getElementById('chat-history-container');
  }

  const container = document.createElement('div');
  container.id = 'chat-history-container';
  container.className = 'chat-history-container';

  // Add a header
  const header = document.createElement('h3');
  header.className = 'chat-history-header';
  header.textContent = 'Recent Conversations';
  container.appendChild(header);

  // Add a list for the chat cards
  const list = document.createElement('div');
  list.id = 'chat-history-list';
  list.className = 'chat-history-list';
  container.appendChild(list);

  // Insert into DOM after input container
  const inputContainer = document.getElementById('input-container');
  if (inputContainer) {
    inputContainer.parentNode.insertBefore(container, inputContainer.nextSibling);
  }

  return container;
}

// Helper function to count total messages and calculate chat duration
function getSessionStats(session) {
  // Count messages
  const userMessages = session.messages.filter(msg => msg.sender === 'user').length;
  const agentMessages = session.messages.filter(msg => msg.sender === 'agent').length;

  // Calculate duration if we have at least 2 messages
  let duration = 'Unknown';
  if (session.messages.length >= 2) {
    const firstMessageTime = session.messages[0].timestamp || session.timestamp;
    const lastMessageTime = session.messages[session.messages.length - 1].timestamp || session.timestamp;

    // Calculate duration in minutes
    const durationMs = lastMessageTime - firstMessageTime;
    const durationMinutes = Math.round(durationMs / 60000);

    if (durationMinutes < 1) {
      duration = 'Less than a minute';
    } else if (durationMinutes === 1) {
      duration = '1 minute';
    } else if (durationMinutes < 60) {
      duration = `${durationMinutes} minutes`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      duration = `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
    }
  }

  return {
    userMessages,
    agentMessages,
    totalMessages: userMessages + agentMessages,
    duration
  };
}

// Add method to load the most recent chat session
function loadMostRecentSession() {
  const sessions = getChatSessions();

  if (sessions.length > 0) {
    // Find most recent session
    const mostRecent = sessions.sort((a, b) => b.timestamp - a.timestamp)[0];
    loadChatSession(mostRecent.id);
    return true;
  }

  return false;
}

// Enhance the title click behavior to show chat history instead of just resetting
function enhancedTitleClickHandler() {
  if (firstMessageSent) {
    // If we're in full UI mode, reset to minimal UI
    resetToInitialState();
  } else {
    // If we're already in minimal UI, toggle chat history visibility
    const historyContainer = document.getElementById('chat-history-container');
    if (historyContainer) {
      if (historyContainer.style.display === 'none' || !historyContainer.classList.contains('visible')) {
        updateChatHistoryDisplay();
      } else {
        historyContainer.classList.remove('visible');
        setTimeout(() => {
          historyContainer.style.display = 'none';
        }, 400);
      }
    }
  }
}
// Function to load a chat session
function loadChatSession(sessionId) {
  const sessions = getChatSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (session) {
    // Set as current session
    currentSessionId = sessionId;

    // Clear current chat
    chatContainer.innerHTML = '';

    // Load messages from session
    session.messages.forEach(msg => {
      addMessage(msg.text, msg.sender, false);
    });

    // Show the full UI
    showFullUI();

    // Update timestamp to now (it becomes the most recent session)
    session.timestamp = Date.now();
    saveChatSessions(sessions);
  }
}

    // Initialize the UI
    setupInitialUI();
    function checkConnectionStatus() {
        console.log("---- WebSocket Diagnostic ----");
        console.log("isConnected:", isConnected);
        console.log("Socket state:", socket ? ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][socket.readyState] : "No socket");
        console.log("clientId:", clientId);
        console.log("firstMessageSent:", firstMessageSent);
        console.log("isProcessing:", isProcessing);

        // Check server settings
        const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {};
        console.log("Server settings:", settings);

        // Try to reconnect if needed
        if (!isConnected && socket && socket.readyState !== WebSocket.CONNECTING) {
            console.log("Attempting reconnection...");
            connectWebSocket();
        }
    }
    // Update this part of the handleWebSocketMessage function
function handleWebSocketMessage(event) {
  try {
    const data = JSON.parse(event.data);
    console.log("WebSocket message received:", data.status);

    // Forward file-related messages to the file handler
    if (window.fileHandler &&
        (data.status === 'file_created' ||
         (data.status === 'complete' && data.files))) {
      window.fileHandler.handleMessage(data);
    }

    // IMPORTANT: Get cancel button directly at the time of handling the event
    const cancelBtn = document.getElementById('cancel-button');
    console.log("Processing WebSocket message. Cancel button found:", !!cancelBtn);

    switch(data.status) {
      case 'processing':
        statusDisplay.textContent = 'Processing request...';
        isProcessing = true;
        showTypingIndicator();
        addProgressEntry(data.message || 'Processing started', 'step');

        // Show cancel button when processing starts
        if (cancelBtn) {
          console.log("Setting cancel button to visible");
          cancelBtn.style.display = 'block';
          // Force a reflow to ensure the browser updates the visibility
          void cancelBtn.offsetHeight;
        } else {
          console.error("Cancel button not found during processing!");
        }
        break;

      case 'complete':
      case 'cancelled':
      case 'error':
        hideTypingIndicator();
        isProcessing = false;

        if (data.status === 'complete') {
          statusDisplay.textContent = 'Connected';
          addProgressEntry('Processing complete', 'step');
          // Handle messages
          if (data.messages && data.messages.length > 0) {
            for (const msg of data.messages) {
              if (msg.role === 'assistant' && msg.content) {
                // Only add messages that actually have content
                addMessage(msg.content, 'agent');
              }
            }
          } else if (data.result) {
            // Only add a result message if there's actually a result
            addMessage(data.result, 'agent');
          }
        } else if (data.status === 'cancelled') {
          statusDisplay.textContent = 'Cancelled';
          addProgressEntry(data.message || 'Processing cancelled', 'step');
          addMessage("Processing was cancelled.", 'agent');
        } else { // error
          statusDisplay.textContent = 'Error: ' + data.error;
          addProgressEntry('Error: ' + data.error, 'error');
          addMessage(`Error: ${data.error}`, 'agent');
        }

        // Hide cancel button
        if (cancelBtn) {
          console.log("Hiding cancel button");
          cancelBtn.style.display = 'none';
        }

        // Save updated chat history
        saveSettings();
        break;

      case 'file_created':
        // Add specific handling for file_created status
        addProgressEntry(`File created: ${data.file.file_name}`, 'step');
        break;

      // Handle other cases
      case 'step':
        addProgressEntry(data.message || 'Executing step', 'step');
        break;
      case 'thinking':
        addProgressEntry(data.message || 'Thinking about next steps', 'thinking');
        break;
      case 'tool':
        addProgressEntry(data.message || 'Using a tool', 'tool');
        break;
      case 'tool_result':
        addProgressEntry(data.message || 'Tool returned a result', 'tool-result');
        break;
      case 'cancelling':
        statusDisplay.textContent = 'Cancelling...';
        addProgressEntry(data.message || 'Cancelling processing', 'step');
        break;
      default:
        console.log('Unknown message type:', data);
    }
  } catch (error) {
    console.error("Error handling WebSocket message:", error);
  }
  setTimeout(updateInputPosition, 500);
}

// Expose the diagnostic function globally
window.checkConnectionStatus = checkConnectionStatus;

// Add this line in the DOMContentLoaded event in index.js
console.log("Running connection diagnostic on page load");
setTimeout(checkConnectionStatus, 1000);

    function setupInitialUI() {
        // Check if there's chat history in local storage
        const storedSettings = JSON.parse(localStorage.getItem('openManusSettings')) || {};
        const hasChatHistory = storedSettings.chatHistory && storedSettings.chatHistory.length > 0;

        // Always start with minimal UI
        showMinimalUI();

        // Only show full UI if there's actual chat history with more than 1 message
        if (hasChatHistory && storedSettings.chatHistory.length > 1) {
            console.log("Chat history found, showing full UI");
            // Small delay to ensure transitions work properly
            setTimeout(() => {
                showFullUI();
            }, 300);
        } else {
            // Reset any existing chat history from storage to ensure clean start
            localStorage.removeItem('openManusClientId');

            // Create new storage with empty chat history
            const settings = {
                serverHost: 'server.gpeclub.com',
                serverPort: 2000,
                useSecure: false,
                darkMode: darkModeToggle.checked,
                chatHistory: []
            };
            localStorage.setItem('openManusSettings', JSON.stringify(settings));
            console.log("No chat history or just welcome message, showing minimal UI");
        }
    }
// Replace the existing showMinimalUI function with this updated version
function showMinimalUI() {
  console.log("Showing minimal UI");
    fullUI = false;

  // Get elements we need to animate
  const flexContainer = document.querySelector('.flex-container');
  const statusBar = document.getElementById('status-bar');
  const settingsBtn = document.getElementById('settings-btn');
  const header = document.querySelector('.header');
  const inputContainer = document.getElementById('input-container');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');

  // First add exit animation classes
  settingsBtn.classList.add('exiting');
  statusBar.classList.add('exiting');
  flexContainer.classList.add('exiting');

  // Then remove visible classes to trigger transitions
  settingsBtn.classList.remove('visible');
  statusBar.classList.remove('visible');
  flexContainer.classList.remove('visible');

  // Transition header with proper top margin
  header.style.marginTop = 'calc(15vh - 115px)';
  transitionHeader(false);

  // Center input container with smooth transition
  inputContainer.classList.add('exiting');
  inputContainer.classList.add('centered');
  inputContainer.classList.remove('force-normal');

  // Make input and button taller
  userInput.classList.add('tall');
  sendButton.classList.add('tall');

  // IMPORTANT: Position input container properly below title
  // The 15vh + 170px ensures it appears below the title with proper spacing
  inputContainer.style.position = 'absolute';
  inputContainer.style.top = 'calc(15vh + 170px)';
  inputContainer.style.left = '50%';
  inputContainer.style.transform = 'translateX(-50%)';
  inputContainer.style.zIndex = '4';

  // Reset first message flag
  firstMessageSent = false;

  // Show chat history cards
  updateChatHistoryDisplay();

  // Remove exit animation classes after transition completes
  setTimeout(() => {
    settingsBtn.classList.remove('exiting');
    statusBar.classList.remove('exiting');
    flexContainer.classList.remove('exiting');
    inputContainer.classList.remove('exiting');

    // Hide container after animation completes
    if (!firstMessageSent) {
      flexContainer.style.display = 'none';
      flexContainer.style.visibility = 'hidden';
    }
  }, 500); // Match animation duration + a little buffer

  // Make sure the input position is updated
  setTimeout(updateInputPosition, 600);
}


// Improved function for header transitions with proper positioning
function transitionHeader(isExpanding) {
  const header = document.querySelector('.header');
  const title = document.getElementById('title');

  // Remove any existing animation classes
  title.classList.remove('animate-header-expand', 'animate-header-collapse', 'exiting');

  if (isExpanding) {
    // Expanding from compact to full
    // First prepare header styles
    if (header.classList.contains('compact')) {
      // Reset the top margin when expanding
      header.style.marginTop = '0';

      // Set starting position explicitly before animation
      title.style.position = 'relative';
      title.style.left = '50%';
      title.style.transform = 'translateX(-50%)';
      title.style.width = '100%';
      title.style.textAlign = 'center';
      title.style.zIndex = '5';

      // Force layout recalculation
      void title.offsetWidth;

      // Now start animation
      header.classList.remove('compact');
      title.classList.add('animate-header-expand');

      // Clean up styles after animation
      setTimeout(() => {
        title.style.position = '';
        title.style.left = '';
        title.style.transform = '';
        title.style.width = '';
        title.style.textAlign = '';
        title.style.zIndex = '';
      }, 400);
    }
  } else {
    // Collapsing from full to compact
    if (!header.classList.contains('compact')) {
      // Add exiting class for smooth transition
      title.classList.add('exiting');

      // Set starting position explicitly before animation
      title.style.position = 'static';
      title.style.left = '0';
      title.style.transform = 'none';
      title.style.width = 'auto';
      title.style.textAlign = 'left';

      // Force layout recalculation
      void title.offsetWidth;

      // Now start animation
      header.classList.add('compact');
      title.classList.add('animate-header-collapse');

      // After animation completes, ensure correct final state
      setTimeout(() => {
        title.classList.remove('exiting');
        title.style.position = 'relative';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';
        title.style.width = '100%';
        title.style.textAlign = 'center';
        title.style.zIndex = '5';
      }, 400);
    }
  }
}

// Also update the showFullUI function to reset the header margin
function showFullUI() {
  console.log("Showing full UI");
  fullUI = true;

  // Get elements we need to animate
  const flexContainer = document.querySelector('.flex-container');
  const statusBar = document.getElementById('status-bar');
  const settingsBtn = document.getElementById('settings-btn');
  const header = document.querySelector('.header');
  const inputContainer = document.getElementById('input-container');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');

  // Reset header margin
  header.style.marginTop = '0';

  // Ensure container is displayed before animating
  flexContainer.style.display = 'flex';
  flexContainer.style.visibility = 'visible';

  // Transition header first
  transitionHeader(true);

  // Show elements with CSS animations
  flexContainer.classList.add('visible');
  statusBar.classList.add('visible');
  settingsBtn.classList.add('visible');

  // Move input to normal position
  inputContainer.classList.remove('centered');
  inputContainer.classList.add('force-normal');
  inputContainer.style.position = '';
  inputContainer.style.top = '';
  inputContainer.style.left = '';
  inputContainer.style.transform = '';

  // Animate input and button to normal size
  userInput.classList.remove('tall');
  sendButton.classList.remove('tall');

  // Set the firstMessageSent flag
  firstMessageSent = true;
  const historyContainer = document.getElementById('chat-history-container');
  historyContainer.classList.remove('visible');
}

// Improved addMessage function with force parameter
// Replace the existing addMessage function with this updated version
function addMessage(text, sender, saveToHistory = true, forceMinimalUI = false) {
  // Force full UI visibility when any message is added, unless forceMinimalUI is true
  if (!firstMessageSent && !forceMinimalUI) {
    firstMessageSent = true;
    showFullUI();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = sender === 'user' ? 'user-message message-new' : 'agent-message message-new';

  // Check if marked is available for markdown parsing
  if (window.marked && sender === 'agent') {
    // Configure marked for safe parsing
    marked.setOptions({
      breaks: true,        // Convert \n to <br>
      gfm: true,           // Use GitHub Flavored Markdown
      headerIds: false,    // Don't add IDs to headers
      sanitize: false,     // Don't sanitize (marked handles this internally)
    });

    // Parse markdown to HTML
    try {
      const parsedHtml = marked.parse(text);
      messageDiv.innerHTML = parsedHtml;
    } catch (e) {
      console.error("Error parsing markdown:", e);
      // Fallback to previous formatting method
      let formattedText = text.replace(/```([\w-]*)\n([\s\S]*?)\n```/g, function(match, language, code) {
        return `<pre><code class="${language}">${code}</code></pre>`;
      });
      formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
      messageDiv.innerHTML = formattedText;
    }
  } else {
    // Fallback to previous formatting method (for user messages or if marked is not available)
    let formattedText = text.replace(/```([\w-]*)\n([\s\S]*?)\n```/g, function(match, language, code) {
      return `<pre><code class="${language}">${code}</code></pre>`;
    });
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    messageDiv.innerHTML = formattedText;
  }

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Remove animation class after it completes
  setTimeout(() => {
    messageDiv.classList.remove('message-new');
  }, 400);

  // Save message to current session if saveToHistory is true
  if (saveToHistory) {
    addMessageToSession(messageDiv.innerHTML, sender);
  }
}

function resetToInitialState() {
  if(firstMessageSent){
    console.log("Resetting to initial state");

    // First, cancel any ongoing processing
    if (isConnected && isProcessing) {
      console.log("Cancelling ongoing request before reset");

      // Send cancellation request to server
      socket.send(JSON.stringify({
        command: "cancel",
        clientId: clientId
      }));

      // Update status to give immediate feedback
      statusDisplay.textContent = 'Cancellation requested...';

      // Also add to progress log
      addProgressEntry('Cancellation requested by reset to initial state', 'step');

      // Update processing state
      isProcessing = false;

      // Hide the cancel button if it's visible
      const cancelButton = document.getElementById('cancel-button');
      if (cancelButton) {
        cancelButton.style.display = 'none';
      }

      // Hide typing indicator if shown
      hideTypingIndicator();
    }

    // Clear chat container
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';

    // Clear generated files
    if (window.fileHandler && typeof window.fileHandler.clearFiles === 'function') {
      window.fileHandler.clearFiles();
    } else {
      clearFiles(); // Direct call if fileHandler isn't initialized
    }

    // Reset firstMessageSent flag
    firstMessageSent = false;

    // Transition to minimal UI
    showMinimalUI();

    // Add welcome message if connected, but force minimal UI to stay
    if (isConnected) {
      setTimeout(() => {
        // Pass true for forceMinimalUI parameter to prevent UI expansion
        addMessage("Welcome to OpenManus! What can I help you with?", 'agent', false, true);
      }, 500);
    }

    // Reset and focus input
    const userInput = document.getElementById('user-input');
    userInput.value = '';
    userInput.focus();

    // IMPORTANT: Make sure chat history is displayed
    setTimeout(() => {
      updateChatHistoryDisplay();
    }, 600);
  }
}

// Simplified typing indicator
function showTypingIndicator() {
  if (typingIndicator) return;

  typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator message-new';
  typingIndicator.innerHTML = '<span></span><span></span><span></span>';
  chatContainer.appendChild(typingIndicator);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

    function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {
        serverHost: 'server.gpeclub.com',
        serverPort: 2000,
        darkMode: false,
        chatHistory: []
    };

    serverHostInput.value = settings.serverHost;
    serverPortInput.value = settings.serverPort;

    // Remove or hide the useSecure checkbox
    if (useSecureInput) {
        useSecureInput.parentNode.style.display = 'none'; // Hide the option
    }

    darkModeToggle.checked = settings.darkMode;

    // Apply dark mode if saved
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    }

    // Load chat history
    if (settings.chatHistory && settings.chatHistory.length > 0) {
        settings.chatHistory.forEach(msg => {
            addMessage(msg.text, msg.sender, false);
        });
    }

    return settings;
}



function saveSettings() {
    const settings = {
        serverHost: serverHostInput.value,
        serverPort: parseInt(serverPortInput.value),
        useSecure: true,  // Always use secure connections
        darkMode: darkModeToggle.checked,
        chatHistory: getChatHistory()
    };

    localStorage.setItem('openManusSettings', JSON.stringify(settings));

    // Dispatch an event to notify components that settings changed
    const event = new CustomEvent('settings-updated', { detail: settings });
    document.dispatchEvent(event);

    return settings;
}

    // Get current chat history
    function getChatHistory() {
        const history = [];
        const messages = chatContainer.querySelectorAll('.user-message, .agent-message');

        messages.forEach(msg => {
            history.push({
                text: msg.innerHTML,
                sender: msg.classList.contains('user-message') ? 'user' : 'agent'
            });
        });

        return history;
    }

    // Initialize from saved settings
    let settings = loadSettings();

    // WebSocket connection
    let socket;
    let isConnected = false;
    let typingIndicator = null;
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 5;
    let reconnectDelay = 3000;
    let isProcessing = false;

    // Generate a unique client ID that persists between page reloads
    let clientId = localStorage.getItem('openManusClientId');
    if (!clientId) {
        clientId = 'client_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('openManusClientId', clientId);
    }

    function connectWebSocket() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        statusDisplay.textContent = `Failed to connect after ${maxReconnectAttempts} attempts`;
        statusDisplay.style.color = 'red';
        return;
    }

    // Always use secure WebSocket connection
    const wsUrl = `wss://${settings.serverHost}:${settings.serverPort}/ws/${clientId}`;

    try {
        socket = new WebSocket(wsUrl);

        socket.onopen = function(e) {
            isConnected = true;
            statusDisplay.textContent = `Connected to ${settings.serverHost}:${settings.serverPort}`;
            statusDisplay.style.color = 'green';
            sendButton.disabled = false;
            reconnectAttempts = 0;

            // Add welcome message only on first connect, not on reconnects
            if (chatContainer.children.length === 0) {
                addMessage("Welcome to OpenManus! What can I help you with?", 'agent');
            }

            // Add a progress entry about connection
            addProgressEntry('Connected to server', 'step');
        };

socket.onmessage = handleWebSocketMessage;

            socket.onclose = function(event) {
                isConnected = false;
                statusDisplay.textContent = 'Disconnected. Trying to reconnect...';
                statusDisplay.style.color = 'red';
                sendButton.disabled = true;
                hideTypingIndicator();

                addProgressEntry('Disconnected from server', 'error');

                // Try to reconnect with exponential backoff
                reconnectAttempts++;
                const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts - 1);
                setTimeout(connectWebSocket, delay);
            };

            socket.onerror = function(error) {
                console.error(`WebSocket Error:`, error);
                statusDisplay.textContent = 'Connection error';
                statusDisplay.style.color = 'red';
                hideTypingIndicator();

                addProgressEntry('Connection error', 'error');
            };
        } catch (err) {
            console.error("Error creating WebSocket:", err);
            statusDisplay.textContent = `Connection error: ${err.message}`;
            statusDisplay.style.color = 'red';

            addProgressEntry(`Connection error: ${err.message}`, 'error');

            // Try to reconnect
            reconnectAttempts++;
            setTimeout(connectWebSocket, reconnectDelay);
        }
    }

    function addProgressEntry(message, type) {
        const entry = document.createElement('div');
        entry.className = `progress-entry progress-${type}`;

        const time = document.createElement('div');
        time.className = 'progress-time';
        time.textContent = new Date().toLocaleTimeString();

        const content = document.createElement('div');
        content.textContent = message;

        entry.appendChild(time);
        entry.appendChild(content);

        progressLog.appendChild(entry);
        progressLog.scrollTop = progressLog.scrollHeight;
    }

    function hideTypingIndicator() {
        if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
            typingIndicator = null;
        }
    }


function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  if (isProcessing) {
    alert("Please wait until the current request is processed");
    return;
  }

  console.log("SendMessage called, firstMessageSent =", firstMessageSent);

  // IMPORTANT: Create a new chat session regardless if it's first message or not
  // This ensures we always have a valid session to add messages to
  if (!currentSessionId) {
    console.log("No current session, creating one");
    createChatSession();
  }

  // Check if this is the first message and we need to transition UI
  const isFirstMessage = !firstMessageSent;

  if (isFirstMessage) {
    // Save the message to send after animation completes
    const pendingMessage = message;

    // First show the full UI with animations
    showFullUI();

    // Wait for animations to complete before sending the message
    setTimeout(() => {
      // Now send the saved message
      if (isConnected) {
        socket.send(JSON.stringify({
          request: pendingMessage,
          clientId: clientId
        }));

        addMessage(pendingMessage, 'user');
        userInput.value = '';
        statusDisplay.textContent = 'Sending request...';

        // Clear progress log for new request
        progressLog.innerHTML = '';
        addProgressEntry('Request sent: ' + pendingMessage, 'step');
      } else {
        addMessage(pendingMessage, 'user');
        userInput.value = '';
        statusDisplay.textContent = 'Not connected. Please check server settings.';

        // Add error message in chat
        addMessage("Connection error: Not connected to server. Your message was not sent.", 'agent');

        // Try to reconnect
        connectWebSocket();
      }
    }, 600); // Match the transition duration
  } else {
    // Normal behavior for subsequent messages
    if (isConnected) {
      socket.send(JSON.stringify({
        request: message,
        clientId: clientId
      }));

      addMessage(message, 'user');
      userInput.value = '';
      statusDisplay.textContent = 'Sending request...';

      // Clear progress log for new request
      progressLog.innerHTML = '';
      addProgressEntry('Request sent: ' + message, 'step');
    } else {
      addMessage(message, 'user');
      userInput.value = '';
      statusDisplay.textContent = 'Not connected. Please check server settings.';

      // Add error message in chat
      addMessage("Connection error: Not connected to server. Your message was not sent.", 'agent');

      // Try to reconnect
      connectWebSocket();
    }
  }
}

    // Event handlers
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        saveSettings();
    });

    clearChatBtn.addEventListener('click', () => {
        chatContainer.innerHTML = '';
        addMessage("Chat cleared. How can I help you?", 'agent');
    });

    clearProgressBtn.addEventListener('click', () => {
        progressLog.innerHTML = '';
        addProgressEntry('Progress log cleared', 'step');
    });

    sendButton.addEventListener('click', ()=>{
        const message = userInput.value.trim();
        if(message.length !== 0){
            sendMessage();
        }

    });

    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Focus on the input field when the page loads
    userInput.focus();

    // Expose functions to global scope
    window.saveSettings = saveSettings;
    window.connectWebSocket = connectWebSocket;
    const originalSendMessage = sendMessage;
    window.sendMessage = function() {
        if (isProcessing) {
            alert("Currently processing a request. Please wait or cancel the current processing.");
            return;
        }

        originalSendMessage();
    };

    // Initialize connection but don't add welcome message
    connectWebSocketSilent();

    // Silent connection without welcome message
    function connectWebSocketSilent() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        statusDisplay.textContent = `Failed to connect after ${maxReconnectAttempts} attempts`;
        statusDisplay.style.color = 'red';
        return;
    }

    // Always use secure WebSocket connection
    const wsUrl = `wss://${settings.serverHost}:${settings.serverPort}/ws/${clientId}`;

    try {
        socket = new WebSocket(wsUrl);

            socket.onopen = function(e) {
                isConnected = true;
                statusDisplay.textContent = `Connected to ${settings.serverHost}:${settings.serverPort}`;
                statusDisplay.style.color = 'green';
                sendButton.disabled = false;
                reconnectAttempts = 0;

                // Don't add a welcome message to keep minimal UI

                // Log connection silently
                console.log('Connected to server');
            };

           socket.onmessage = handleWebSocketMessage;


            socket.onclose = function(event) {
                isConnected = false;
                statusDisplay.textContent = 'Disconnected. Trying to reconnect...';
                statusDisplay.style.color = 'red';
                sendButton.disabled = true;
                hideTypingIndicator();

                console.log('Disconnected from server');

                // Try to reconnect with exponential backoff
                reconnectAttempts++;
                const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts - 1);
                setTimeout(connectWebSocketSilent, delay);
            };

            socket.onerror = function(error) {
                console.error(`WebSocket Error:`, error);
                statusDisplay.textContent = 'Connection error';
                statusDisplay.style.color = 'red';
                hideTypingIndicator();

                console.log('Connection error');
            };
        } catch (err) {
            console.error("Error creating WebSocket:", err);
            statusDisplay.textContent = `Connection error: ${err.message}`;
            statusDisplay.style.color = 'red';

            console.log(`Connection error: ${err.message}`);

            // Try to reconnect
            reconnectAttempts++;
            setTimeout(connectWebSocketSilent, reconnectDelay);
        }
    }
// Add this code to the DOMContentLoaded event listener, after the line that loads settings
// Set up title click event
const titleElement = document.getElementById('title');
if (titleElement) {
    titleElement.removeEventListener('click', resetToInitialState);
    titleElement.addEventListener('click', enhancedTitleClickHandler);
}

migrateHistoryToSessions();

  // Initialize chat history display
  createChatHistoryContainer();

  // Update the display after a short delay to ensure DOM is ready
  setTimeout(updateChatHistoryDisplay, 300);
});

// client/js/file-handler.js

// File handling section
let generatedFiles = []; // Store file information

// Initialize file display container by loading the HTML template
function initializeFileSection() {
    // Create the files container if it doesn't exist
    if (!document.getElementById('files-container')) {
        const flexContainer = document.querySelector('.flex-container');

        // Load and inject the files section HTML
        fetch('client/files-section.html')
            .then(response => response.text())
            .then(html => {
                // Insert the HTML after the flex container
                flexContainer.insertAdjacentHTML('afterend', html);

                // Make sure the CSS is loaded
                if (!document.querySelector('link[href="client/css/files.css"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'client/css/files.css';
                    document.head.appendChild(link);
                }

                // If there are any files, update the display
                if (generatedFiles.length > 0) {
                    updateFilesDisplay();
                }
            })
            .catch(error => {
                console.error('Error loading files section template:', error);
                // Fallback: Create a basic container if template loading fails
                const filesContainer = document.createElement('div');
                filesContainer.id = 'files-container';
                filesContainer.className = 'files-section';
                filesContainer.innerHTML = `
                    <h3>Generated Files</h3>
                    <div id="files-list" class="files-list">
                        <div class="no-files">No files generated yet</div>
                    </div>
                `;
                flexContainer.parentNode.insertBefore(filesContainer, flexContainer.nextSibling);
            });
    }
}


// Add a single file to the list
function addFile(fileInfo) {
    // Check if we already have this file
    if (!generatedFiles.some(f => f.file_id === fileInfo.file_id)) {
        generatedFiles.push(fileInfo);
        updateFilesDisplay();
    }
}

// Update with multiple files
function updateFilesList(files) {
    // Add new files that aren't already in the list
    for (const file of files) {
        if (!generatedFiles.some(f => f.file_id === file.file_id)) {
            generatedFiles.push(file);
        }
    }
    updateFilesDisplay();
}

// Add this function to index.js, right after the updateFilesDisplay function
// This will handle downloads with better browser compatibility

function downloadFile(fileId, fileName) {
    // Get the base URL from the current location
    const baseURL = window.location.origin;
    const url = `${baseURL}/api/files/${fileId}`;

    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName; // This sets the downloaded file name
    a.target = '_blank'; // Open in new tab as fallback

    // Append to document, click, then remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function updateFilesDisplay() {
    // Make sure the file section exists
    initializeFileSection();

    const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {
        serverHost: 'server.gpeclub.com',
        serverPort: 2000
    };

    const filesContainer = document.getElementById('files-container');
    const filesList = document.getElementById('files-list');
    if (!filesList) {
        console.warn('Files list element not found, waiting for initialization...');
        // The container might still be loading, retry in a moment
        setTimeout(updateFilesDisplay, 100);
        return;
    }

    if (generatedFiles.length === 0) {
        filesList.innerHTML = '<div class="no-files">No files generated yet</div>';
        filesContainer.style.display = 'none';
        return;
    }

    // Show the container when we have files
    filesContainer.style.display = 'block';
    filesList.innerHTML = '';

    for (const file of generatedFiles) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        // Get file icon based on content type
        let iconClass = '📄'; // Default document icon
        if (file.content_type) {
            if (file.content_type.startsWith('image/')) iconClass = '🖼️';
            else if (file.content_type.startsWith('text/')) iconClass = '📝';
            else if (file.content_type.startsWith('audio/')) iconClass = '🔊';
            else if (file.content_type.startsWith('video/')) iconClass = '🎬';
            else if (file.content_type.includes('pdf')) iconClass = '📑';
            else if (file.content_type.includes('zip') || file.content_type.includes('compressed')) iconClass = '📦';
            else if (file.content_type.includes('excel') || file.content_type.includes('spreadsheet')) iconClass = '📊';
        }

        // Format the file size
        let sizeText = '';
        if (file.size) {
            if (file.size < 1024) sizeText = `${file.size} bytes`;
            else if (file.size < 1024 * 1024) sizeText = `${(file.size / 1024).toFixed(1)} KB`;
            else sizeText = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        }

        // Create the file info HTML
        const fileIconDiv = document.createElement('div');
        fileIconDiv.className = 'file-icon';
        fileIconDiv.textContent = iconClass;

        const fileNameDiv = document.createElement('div');
        fileNameDiv.className = 'file-name';
        fileNameDiv.textContent = file.file_name;

        const fileMetaDiv = document.createElement('div');
        fileMetaDiv.className = 'file-meta';
        fileMetaDiv.textContent = sizeText;

        const fileInfoDiv = document.createElement('div');
        fileInfoDiv.className = 'file-info';
        fileInfoDiv.appendChild(fileNameDiv);
        fileInfoDiv.appendChild(fileMetaDiv);

        const downloadLink = document.createElement('a');
        downloadLink.className = 'file-download';
        downloadLink.textContent = 'Download';

        // Extract the file ID from the download_url
        const fileIdMatch = file.download_url.match(/\/api\/files\/([^\/]+)$/);
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            // Always use HTTPS
            downloadLink.href = `https://${settings.serverHost}:${settings.serverPort}/api/files/${fileId}`;
        } else {
            // Fallback to the original URL if parsing fails
            downloadLink.href = file.download_url;
        }

        downloadLink.target = '_blank'; // Open in new tab
        downloadLink.setAttribute('download', file.file_name);

        // Show full URL in tooltip to help users
        downloadLink.title = `Download ${file.file_name}`;

        // Add all elements to the file item
        fileItem.appendChild(fileIconDiv);
        fileItem.appendChild(fileInfoDiv);
        fileItem.appendChild(downloadLink);

        // Add a direct copy link button
        const copyLinkBtn = document.createElement('button');
        copyLinkBtn.className = 'file-copy-link';
        copyLinkBtn.textContent = 'Copy URL';
        copyLinkBtn.onclick = function() {
            // Use the same correctly formed URL with HTTPS
            const fileIdMatch = file.download_url.match(/\/api\/files\/([^\/]+)$/);
            if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                const fullUrl = `https://${settings.serverHost}:${settings.serverPort}/api/files/${fileId}`;
                navigator.clipboard.writeText(fullUrl).then(
                    function() {
                        copyLinkBtn.textContent = 'Copied!';
                        setTimeout(() => { copyLinkBtn.textContent = 'Copy URL'; }, 2000);
                    },
                    function() {
                        // Fallback for clipboard API not available
                        prompt('Copy this download link:', fullUrl);
                    }
                );
            }
        };

        fileItem.appendChild(copyLinkBtn);
        filesList.appendChild(fileItem);
    }
}

function getCorrectFileUrl(fileId) {
    // Get server settings from localStorage
    const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {
        serverHost: 'server.gpeclub.com',
        serverPort: 2000
    };

        return `https://${settings.serverHost}:${settings.serverPort}/api/files/${fileId}`;

}

// Add a context menu for files to give more options
function addFileContextMenu() {
    document.addEventListener('contextmenu', function(e) {
        // Check if clicked element is a file item or its child
        let target = e.target;
        let fileItem = null;

        // Find the file-item parent if any
        while (target && target !== document) {
            if (target.classList.contains('file-item')) {
                fileItem = target;
                break;
            }
            target = target.parentNode;
        }

        // If we found a file item, handle the context menu
        if (fileItem) {
            e.preventDefault();

            // Find the file ID from data attributes or by searching the generatedFiles array
            const fileName = fileItem.querySelector('.file-name').textContent;
            const file = generatedFiles.find(f => f.file_name === fileName);

            if (file) {
                // Create a simple context menu
                const menu = document.createElement('div');
                menu.className = 'file-context-menu';
                menu.style.position = 'absolute';
                menu.style.left = e.pageX + 'px';
                menu.style.top = e.pageY + 'px';
                menu.style.background = 'white';
                menu.style.border = '1px solid #ccc';
                menu.style.padding = '5px';
                menu.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
                menu.style.zIndex = '1000';

                // Add menu items
                const openItem = document.createElement('div');
                openItem.textContent = 'Open in new tab';
                openItem.style.padding = '5px 10px';
                openItem.style.cursor = 'pointer';
                openItem.onclick = function() {
                    window.open(file.download_url, '_blank');
                    document.body.removeChild(menu);
                };

                const copyItem = document.createElement('div');
                copyItem.textContent = 'Copy download link';
                copyItem.style.padding = '5px 10px';
                copyItem.style.cursor = 'pointer';
                copyItem.onclick = function() {
                    copyDownloadLink(file.file_id);
                    document.body.removeChild(menu);
                };

                menu.appendChild(openItem);
                menu.appendChild(copyItem);
                document.body.appendChild(menu);

                // Remove menu when clicking elsewhere
                document.addEventListener('click', function removeMenu() {
                    if (menu.parentNode) {
                        document.body.removeChild(menu);
                    }
                    document.removeEventListener('click', removeMenu);
                });
            }
        }
    });
}
// Clear files when clearing chat
function clearFiles() {
    generatedFiles = [];
    const filesContainer = document.getElementById('files-container');
    const filesList = document.getElementById('files-list');

    if (filesList) {
        filesList.innerHTML = '<div class="no-files">No files generated yet</div>';
    }

    if (filesContainer) {
        filesContainer.style.display = 'none';
    }
}

// Add a button to clear files
function addClearFilesButton() {
    const statusBar = document.getElementById('status-bar');
    if (!statusBar) return;

    const buttonsContainer = statusBar.querySelector('.buttons-container');
    if (!buttonsContainer) return;

    // Add the clear files button if it doesn't exist
    if (!document.getElementById('clear-files')) {
        const clearFilesBtn = document.createElement('button');
        clearFilesBtn.id = 'clear-files';
        clearFilesBtn.textContent = 'Clear Files';
        clearFilesBtn.addEventListener('click', clearFiles);
        buttonsContainer.appendChild(clearFilesBtn);
    }
}

// Replace the fileHandler object definition with this fixed version
window.fileHandler = {
    initialize: function() {
        initializeFileSection();
        addClearFilesButton();

        // Update downloadLinks when settings change
        document.addEventListener('settings-updated', function() {
            updateFilesDisplay();
        });
    },
    // Create a proper message handler instead of the circular reference
    handleMessage: function(data) {
        // Handle file-specific messages
        if (data.status === 'file_created' && data.file) {
            console.log("File created:", data.file);
            addFile(data.file);
        } else if (data.status === 'complete' && data.files && data.files.length > 0) {
            console.log("Files in complete message:", data.files);
            updateFilesList(data.files);
        }
    },
    clearFiles: clearFiles,
    addFile: addFile,
    getSettings: function() {
        return JSON.parse(localStorage.getItem('openManusSettings')) || {
            serverHost: 'server.gpeclub.com',
            serverPort: 2000,
            useSecure: false
        };
    }
};


// Add to the document ready event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize file handling
    window.fileHandler.initialize();

    // Add file handling to clear chat button
    const clearChatBtn = document.getElementById('clear-chat');
    if (clearChatBtn) {
        // Save the original click handler
        const originalClickHandler = clearChatBtn.onclick;
        clearChatBtn.onclick = function(e) {
            // Call original handler if it exists
            if (originalClickHandler) originalClickHandler.call(this, e);
            // Then clear files
            clearFiles();
        };
    }

    // To integrate with your WebSocket handling, add this to your WebSocket message handler:
    /*
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);

        // Handle file messages
        window.fileHandler.handleMessage(data);

        // Your existing WebSocket message handling...
    };
    */
});

