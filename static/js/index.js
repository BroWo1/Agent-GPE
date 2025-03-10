function toggleSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    // Check for both 'none' and empty string (initial state)
    settingsPanel.style.display = (settingsPanel.style.display === 'none' || settingsPanel.style.display === '') ? 'block' : 'none';
}

function saveAndApplySettings() {
    settings = saveSettings();
    document.getElementById('settings-panel').style.display = 'none';

    // Reconnect with new settings
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
    }
    connectWebSocket();
}

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
    let firstMessageSent = false;


    // Initialize the UI
    setupInitialUI();

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
                serverHost: 'localhost',
                serverPort: 2000,
                useSecure: false,
                darkMode: darkModeToggle.checked,
                chatHistory: []
            };
            localStorage.setItem('openManusSettings', JSON.stringify(settings));
            console.log("No chat history or just welcome message, showing minimal UI");
        }
    }

    function showMinimalUI() {
        console.log("Showing minimal UI");
    flexContainer.classList.remove('visible');
    statusBar.classList.remove('visible');
    settingsBtn.classList.remove('visible');
    header.classList.add('compact');
    inputContainer.classList.add('centered');

    // Make input and button taller
    userInput.classList.add('tall');
    sendButton.classList.add('tall');

    // Position the input container at 25% from the top instead of fixed pixels
    inputContainer.style.top = '25%';

    firstMessageSent = false;
    }

function showFullUI() {
    console.log("Showing full UI");

    // First, ensure we have references to all required elements
    const flexContainer = document.querySelector('.flex-container');
    const statusBar = document.getElementById('status-bar');
    const settingsBtn = document.getElementById('settings-btn');
    const header = document.querySelector('.header');
    const inputContainer = document.getElementById('input-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    if (!flexContainer || !statusBar || !settingsBtn || !header || !inputContainer) {
        console.error("Missing UI elements:", {
            flexContainer: !!flexContainer,
            statusBar: !!statusBar,
            settingsBtn: !!settingsBtn,
            header: !!header,
            inputContainer: !!inputContainer
        });
        return; // Don't proceed if elements are missing
    }

    // Force a reflow before adding the visible class
    void flexContainer.offsetWidth;

    // Add a force-normal class to override any conflicting styles
    inputContainer.classList.add('force-normal');

    // Make UI elements visible with explicit !important styles
    flexContainer.classList.add('visible');
    flexContainer.style.display = 'flex';
    flexContainer.style.opacity = '1';
    flexContainer.style.maxHeight = '1000px';
    flexContainer.style.visibility = 'visible';

    statusBar.classList.add('visible');
    statusBar.style.opacity = '1';
    statusBar.style.visibility = 'visible';

    settingsBtn.classList.add('visible');
    settingsBtn.style.opacity = '1';

    header.classList.remove('compact');
    inputContainer.classList.remove('centered');

    // Return input and button to normal size
    userInput.classList.remove('tall');
    sendButton.classList.remove('tall');
    userInput.rows = 1;

    // Reset input container positioning
    inputContainer.style.position = 'static';
    inputContainer.style.top = 'auto';
    inputContainer.style.left = 'auto';
    inputContainer.style.transform = 'none';

    firstMessageSent = true;

    // Force layout recalculation
    document.body.style.minHeight = "101vh";
    setTimeout(() => {
        document.body.style.minHeight = "100vh";

        // After small delay, verify elements are visible
        console.log("Full UI verification:", {
            flexContainerVisible: flexContainer.classList.contains('visible'),
            flexContainerOpacity: flexContainer.style.opacity,
            statusBarVisible: statusBar.classList.contains('visible'),
            headerCompact: header.classList.contains('compact'),
            inputCentered: inputContainer.classList.contains('centered')
        });
    }, 50);
}

    // Load settings from localStorage
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {
            serverHost: 'localhost',
            serverPort: 2000,
            useSecure: false,
            darkMode: false,
            chatHistory: []
        };

        serverHostInput.value = settings.serverHost;
        serverPortInput.value = settings.serverPort;
        useSecureInput.checked = settings.useSecure;
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

    // Save settings to localStorage
    function saveSettings() {
        const settings = {
            serverHost: serverHostInput.value,
            serverPort: parseInt(serverPortInput.value),
            useSecure: useSecureInput.checked,
            darkMode: darkModeToggle.checked,
            chatHistory: getChatHistory()
        };

        localStorage.setItem('openManusSettings', JSON.stringify(settings));
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

        // Create WebSocket URL based on settings
        const protocol = settings.useSecure ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${settings.serverHost}:${settings.serverPort}/ws/${clientId}`;

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

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);

                switch(data.status) {
                    case 'processing':
                        statusDisplay.textContent = 'Processing request...';
                        isProcessing = true;
                        showTypingIndicator();
                        addProgressEntry(data.message || 'Processing started', 'step');
                        break;

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

                    case 'complete':
                        hideTypingIndicator();
                        isProcessing = false;
                        statusDisplay.textContent = 'Connected';
                        addProgressEntry('Processing complete', 'step');

                        if (data.messages && data.messages.length > 0) {
                            for (const msg of data.messages) {
                                if (msg.role === 'assistant') {
                                    addMessage(msg.content || "No content", 'agent');
                                }
                            }
                        } else {
                            // Fallback to result if no messages
                            addMessage(data.result, 'agent');
                        }
                        // Save updated chat history
                        saveSettings();
                        break;

                    case 'error':
                        hideTypingIndicator();
                        isProcessing = false;
                        statusDisplay.textContent = 'Error: ' + data.error;
                        addProgressEntry('Error: ' + data.error, 'error');
                        addMessage(`Error: ${data.error}`, 'agent');
                        saveSettings();
                        break;

                    default:
                        console.log('Unknown message type:', data);
                }
            };

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

    function showTypingIndicator() {
        if (typingIndicator) return;

        typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatContainer.appendChild(typingIndicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
            typingIndicator = null;
        }
    }

    function addMessage(text, sender, saveToHistory = true) {
        // Force full UI visibility when any message is added
        if (!firstMessageSent) {
            firstMessageSent = true;
            showFullUI();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'user-message' : 'agent-message';

        // Format code blocks
        let formattedText = text.replace(/```([\w-]*)\n([\s\S]*?)\n```/g, function(match, language, code) {
            return `<pre><code class="${language}">${code}</code></pre>`;
        });

        // Format inline code
        formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');

        messageDiv.innerHTML = formattedText;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Save chat history when a new message is added
        if (saveToHistory) {
            saveSettings();
        }
    }

// Add this debugging to identify when the UI state changes
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    if (isProcessing) {
        alert("Please wait until the current request is processed");
        return;
    }

    console.log("SendMessage called, firstMessageSent =", firstMessageSent);

    // Force the UI to expand regardless of firstMessageSent state
    showFullUI();

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

    sendButton.addEventListener('click', sendMessage);

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
    window.sendMessage = sendMessage;

    // Initialize connection but don't add welcome message
    connectWebSocketSilent();

    // Silent connection without welcome message
    function connectWebSocketSilent() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            statusDisplay.textContent = `Failed to connect after ${maxReconnectAttempts} attempts`;
            statusDisplay.style.color = 'red';
            return;
        }

        // Create WebSocket URL based on settings
        const protocol = settings.useSecure ? 'wss://' : 'ws://';
        const wsUrl = `${protocol}${settings.serverHost}:${settings.serverPort}/ws/${clientId}`;

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

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);

                switch(data.status) {
                    case 'processing':
                        statusDisplay.textContent = 'Processing request...';
                        isProcessing = true;
                        showTypingIndicator();
                        addProgressEntry(data.message || 'Processing started', 'step');
                        break;

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

                    case 'complete':
                        hideTypingIndicator();
                        isProcessing = false;
                        statusDisplay.textContent = 'Connected';
                        addProgressEntry('Processing complete', 'step');

                        if (data.messages && data.messages.length > 0) {
                            for (const msg of data.messages) {
                                if (msg.role === 'assistant') {
                                    addMessage(msg.content || "No content", 'agent');
                                }
                            }
                        } else {
                            // Fallback to result if no messages
                            addMessage(data.result, 'agent');
                        }
                        // Save updated chat history
                        saveSettings();
                        break;

                    case 'error':
                        hideTypingIndicator();
                        isProcessing = false;
                        statusDisplay.textContent = 'Error: ' + data.error;
                        addProgressEntry('Error: ' + data.error, 'error');
                        addMessage(`Error: ${data.error}`, 'agent');
                        saveSettings();
                        break;

                    default:
                        console.log('Unknown message type:', data);
                }
            };

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
// Add this function to index.js after the setupInitialUI function
function resetToInitialState() {
    console.log("Resetting to initial state");

    // Clear chat container
    chatContainer.innerHTML = '';

    // Reset firstMessageSent flag
    firstMessageSent = false;

    // Reset localStorage data
    const settings = {
        serverHost: serverHostInput.value,
        serverPort: parseInt(serverPortInput.value),
        useSecure: useSecureInput.checked,
        darkMode: darkModeToggle.checked,
        chatHistory: []
    };
    localStorage.setItem('openManusSettings', JSON.stringify(settings));

    // Force hide the flex container (chat and progress windows)
    const flexContainer = document.querySelector('.flex-container');
    flexContainer.classList.remove('visible');
    flexContainer.style.display = 'none';
    flexContainer.style.opacity = '0';
    flexContainer.style.maxHeight = '0';
    flexContainer.style.visibility = 'hidden';

    // Force hide status bar
    const statusBar = document.getElementById('status-bar');
    statusBar.classList.remove('visible');
    statusBar.style.opacity = '0';
    statusBar.style.visibility = 'hidden';

    // Force hide settings button
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.classList.remove('visible');
    settingsBtn.style.opacity = '0';

    // Force hide settings panel if open
    const settingsPanel = document.getElementById('settings-panel');
    settingsPanel.style.display = 'none';

    // Make header compact
    const header = document.querySelector('.header');
    header.classList.add('compact');

    // Center input
    const inputContainer = document.getElementById('input-container');
    inputContainer.classList.add('centered');
    inputContainer.classList.remove('force-normal');

    // Make input and button taller
    userInput.classList.add('tall');
    sendButton.classList.add('tall');

    // Position the input container appropriately
    inputContainer.style.position = 'absolute';
    inputContainer.style.top = '25%';
    inputContainer.style.left = '50%';
    inputContainer.style.transform = 'translateX(-50%)';

    // Add a welcome message if connected (but don't count it toward history)
    if (isConnected) {
        // Wait a tiny bit for UI reset to complete
        setTimeout(() => {
            addMessage("Welcome to OpenManus! What can I help you with?", 'agent', false);
        }, 100);
    }

    // Reset input if needed
    userInput.value = '';

    // Focus input
    userInput.focus();

    // Reset the send button completely - this is critical for it to work after reset
    console.log("Completely rebuilding send button after reset");

    // Get the original button
    const originalButton = document.getElementById('send-button');

    // Clone the button's parent (the input container)
    const originalParent = originalButton.parentNode;

    // Create a completely new button
    const newButton = document.createElement('button');
    newButton.id = 'send-button';
    newButton.textContent = 'Send';
    newButton.className = originalButton.className;
    if (!newButton.classList.contains('tall')) {
        newButton.classList.add('tall');
    }

    // Replace the old button with the new one
    originalParent.replaceChild(newButton, originalButton);

    // Add the special click handler that matches the one in the HTML script
    newButton.addEventListener('click', function(event) {
        console.log("Send button clicked after reset");

        // Show the full UI - force transitions
        const flexContainer = document.querySelector('.flex-container');
        const statusBar = document.getElementById('status-bar');
        const settingsBtn = document.getElementById('settings-btn');
        const header = document.querySelector('.header');
        const inputContainer = document.getElementById('input-container');

        // Force display transitions
        flexContainer.classList.add('visible');
        flexContainer.style.opacity = '1';
        flexContainer.style.maxHeight = '1000px';
        flexContainer.style.visibility = 'visible';

        statusBar.classList.add('visible');
        settingsBtn.classList.add('visible');
        header.classList.remove('compact');
        inputContainer.classList.remove('centered');

        // Now trigger the message sending
        if (typeof window.sendMessage === 'function') {
            window.sendMessage();
        } else {
            // Fallback if global function isn't accessible
            const message = userInput.value.trim();
            if (message) {
                const chatContainer = document.getElementById('chat-container');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'user-message';
                messageDiv.textContent = message;
                chatContainer.appendChild(messageDiv);
                userInput.value = '';
            }
        }
    });

    console.log("Reset complete, send button completely rebuilt");
}

// Add this code to the DOMContentLoaded event listener, after the line that loads settings
// Set up title click event
const titleElement = document.getElementById('title');
if (titleElement) {
    titleElement.addEventListener('click', resetToInitialState);
}
});