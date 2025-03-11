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
// Add this helper function to ensure proper header/title transitions

function prepareHeaderForTransition(isExpanding) {
    const header = document.querySelector('.header');
    const title = document.getElementById('title');

    // First remove any lingering animation classes
    title.classList.remove('animate-header-expand', 'animate-header-collapse');

    if (isExpanding) {
        // Preparing to expand from compact to full
        console.log("Preparing header for expansion");

        // Force correct starting position if needed
        title.style.textAlign = 'center';
        title.style.width = '100%';
        title.style.position = 'relative';
        title.style.left = '50%';
        title.style.transform = 'translateX(-50%)';

        // Set up for expansion animation
        setTimeout(() => {
            // Clear the inline styles once the animation starts
            title.style.textAlign = '';
            title.style.width = '';
            title.style.position = '';
            title.style.left = '';
            title.style.transform = '';

            // Apply the animation
            title.classList.add('animate-header-expand');
        }, 10);
    } else {
        // Preparing to collapse from full to compact
        console.log("Preparing header for collapse");

        // Force correct starting position if needed
        title.style.textAlign = 'left';
        title.style.width = 'auto';
        title.style.position = 'static';
        title.style.left = '0';
        title.style.transform = 'none';

        // Set up for collapse animation
        setTimeout(() => {
            // Apply the animation (inline styles will be overridden by animation)
            title.classList.add('animate-header-collapse');
        }, 10);
    }
}

// Modify the beginning of showFullUI function to include:
// prepareHeaderForTransition(true);

// Modify the beginning of showMinimalUI function to include:
// prepareHeaderForTransition(false);
// Add these improved functions to index.js to replace the current showFullUI and showMinimalUI functions
function showFullUI() {
    console.log("Showing full UI with improved animations");

    // Add transition effects to the background and title
    document.body.classList.add('transitioning');
    document.getElementById('title').classList.add('glowing');

    // Prepare the header for proper transition
    prepareHeaderForTransition(true);

    // Get references to all elements we need to animate
    const flexContainer = document.querySelector('.flex-container');
    const statusBar = document.getElementById('status-bar');
    const settingsBtn = document.getElementById('settings-btn');
    const header = document.querySelector('.header');
    const inputContainer = document.getElementById('input-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // First, ensure we have references to all required elements
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

    // Remove any existing animation classes
    const animationClasses = [
        'animate-fade-in', 'animate-fade-out', 'animate-slide-up', 'animate-slide-down',
        'animate-expand', 'animate-collapse', 'animate-header-expand', 'animate-header-collapse',
        'animate-input-expand', 'animate-input-collapse',
        'delay-50', 'delay-100', 'delay-150', 'delay-200', 'delay-250',
        'duration-300', 'duration-400', 'duration-500', 'duration-600'
    ];

    [flexContainer, statusBar, settingsBtn, header, inputContainer].forEach(el => {
        if (el) animationClasses.forEach(cls => el.classList.remove(cls));
    });

    // Prepare elements for animation - ensure they're displayed but not visible
    flexContainer.style.display = 'flex';
    flexContainer.style.visibility = 'visible';
    flexContainer.style.overflow = 'hidden';

    // Make status bar and settings button ready for animation
    statusBar.style.visibility = 'visible';
    statusBar.style.opacity = '0';
    settingsBtn.style.opacity = '0';

    // Set a small timeout to ensure display changes have applied
    setTimeout(() => {
        // Choreographed animation sequence - REVERSE of the minimizing sequence

        // The sequence should be exact reverse of showMinimalUI:
        // 1. First move the input container (matching step 5 of minimizing)
        inputContainer.classList.remove('centered');
        inputContainer.classList.add('animate-input-expand', 'force-normal');

        // 2. Start expanding the header (matching step 4 of minimizing)
        setTimeout(() => {
            header.classList.remove('compact');
            header.classList.add('animate-header-expand');

            // Animate input and button to normal size
            userInput.classList.remove('tall');
            userInput.classList.add('shrink');
            sendButton.classList.remove('tall');
            sendButton.classList.add('shrink');

            // Remove animation classes after they're done
            setTimeout(() => {
                userInput.classList.remove('shrink');
                sendButton.classList.remove('shrink');
            }, 400);
        }, 50);

        // 3. Begin expanding flex container (matching step 3 of minimizing)
        setTimeout(() => {
            flexContainer.classList.add('visible', 'animate-fade-in', 'animate-expand');
        }, 100);

        // 4. Fade in status bar (matching step 2 of minimizing)
        setTimeout(() => {
            statusBar.classList.add('visible', 'animate-fade-in');
        }, 200);

        // 5. Finally fade in settings button (matching step 1 of minimizing)
        setTimeout(() => {
            settingsBtn.classList.add('visible', 'animate-fade-in');
        }, 250);

        // Set the firstMessageSent flag
        firstMessageSent = true;

        // After animations complete, make sure everything is in the right state
        setTimeout(() => {
            // Log the final state of all elements
            console.log("Full UI animation complete", {
                flexContainerVisible: flexContainer.classList.contains('visible'),
                statusBarVisible: statusBar.classList.contains('visible'),
                headerCompact: header.classList.contains('compact'),
                inputCentered: inputContainer.classList.contains('centered')
            });

            // Clean up animation classes after they're done
            [flexContainer, statusBar, settingsBtn, header, inputContainer].forEach(el => {
                if (el) animationClasses.forEach(cls => el.classList.remove(cls));
            });

            // Remove transition effects
            document.body.classList.remove('transitioning');
            document.getElementById('title').classList.remove('glowing');
        }, 800);
    }, 20);
}

function showMinimalUI() {
    console.log("Showing minimal UI with improved animations");

    // Add transition effects to the background and title
    document.body.classList.add('transitioning');
    document.getElementById('title').classList.add('glowing');

    // Prepare the header for proper transition
    prepareHeaderForTransition(false);

    // Get the elements we need to animate
    const flexContainer = document.querySelector('.flex-container');
    const statusBar = document.getElementById('status-bar');
    const settingsBtn = document.getElementById('settings-btn');
    const header = document.querySelector('.header');
    const inputContainer = document.getElementById('input-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // First, ensure we have references to all required elements
    if (!flexContainer || !statusBar || !settingsBtn || !header || !inputContainer) {
        console.error("Missing UI elements for minimal UI transition");
        return; // Don't proceed if elements are missing
    }

    // Remove any existing animation classes
    const animationClasses = [
        'animate-fade-in', 'animate-fade-out', 'animate-slide-up', 'animate-slide-down',
        'animate-expand', 'animate-collapse', 'animate-header-expand', 'animate-header-collapse',
        'animate-input-expand', 'animate-input-collapse',
        'delay-50', 'delay-100', 'delay-150', 'delay-200', 'delay-250',
        'duration-300', 'duration-400', 'duration-500', 'duration-600'
    ];

    [flexContainer, statusBar, settingsBtn, header, inputContainer].forEach(el => {
        if (el) animationClasses.forEach(cls => el.classList.remove(cls));
    });

    // Start animating elements out in sequence

    // 1. Fade out settings button first
    settingsBtn.classList.add('animate-fade-out');
    settingsBtn.classList.remove('visible');

    // 2. Begin fading out status bar slightly after
    statusBar.classList.add('animate-fade-out', 'delay-50');
    statusBar.classList.remove('visible');

    // 3. Start collapsing flex container
    flexContainer.classList.add('animate-fade-out', 'animate-collapse', 'delay-100');
    flexContainer.classList.remove('visible');

    // 4. Start collapsing the header to compact mode
    header.classList.add('compact');
    // Note: We're not adding 'animate-header-collapse' here anymore
    // as it's handled by prepareHeaderForTransition

    // 5. Start centering the input container
    inputContainer.classList.add('animate-input-collapse', 'delay-200');

    // After a short delay, apply the final CSS classes
    setTimeout(() => {
        // Apply the compact class without the animation class (handled by prepareHeaderForTransition)
        header.classList.add('compact');
        inputContainer.classList.add('centered');
        inputContainer.classList.remove('force-normal');

        // Animate input and button to become taller
        userInput.classList.add('tall', 'grow');
        sendButton.classList.add('tall', 'grow');

        // Remove animation classes after they're done
        setTimeout(() => {
            userInput.classList.remove('grow');
            sendButton.classList.remove('grow');
        }, 400);

        // Position the input container appropriately
        inputContainer.style.position = 'absolute';
        inputContainer.style.top = '25%';
        inputContainer.style.left = '50%';
        inputContainer.style.transform = 'translateX(-50%)';

        firstMessageSent = false;

        // Make the container invisible for performance
        setTimeout(() => {
            if (!firstMessageSent) { // Only if still in minimal mode
                flexContainer.style.display = 'none';
                flexContainer.style.visibility = 'hidden';
            }

            // Clean up animation classes after they're done
            [flexContainer, statusBar, settingsBtn, header, inputContainer].forEach(el => {
                if (el) animationClasses.forEach(cls => el.classList.remove(cls));
            });

            // Remove transition effects
            document.body.classList.remove('transitioning');
            document.getElementById('title').classList.remove('glowing');
        }, 600);
    }, 300);
}

// Improved resetToInitialState function with better animation
function resetToInitialState() {
    console.log("Resetting to initial state with improved animations");

    // Clear chat container with a fade-out effect
    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.add('animate-fade-out', 'duration-300');

    setTimeout(() => {
        // Clear content after fade out
        chatContainer.innerHTML = '';
        chatContainer.classList.remove('animate-fade-out', 'duration-300');
    }, 300);

    // Reset firstMessageSent flag
    firstMessageSent = false;

    // Reset localStorage data
    const serverHostInput = document.getElementById('server-host');
    const serverPortInput = document.getElementById('server-port');
    const useSecureInput = document.getElementById('use-secure');
    const darkModeToggle = document.getElementById('dark-mode');

    const settings = {
        serverHost: serverHostInput.value,
        serverPort: parseInt(serverPortInput.value),
        useSecure: useSecureInput.checked,
        darkMode: darkModeToggle.checked,
        chatHistory: []
    };
    localStorage.setItem('openManusSettings', JSON.stringify(settings));

    // Animate transition to minimal UI
    showMinimalUI();

    // Add a welcome message if connected (but don't count it toward history)
    if (isConnected) {
        // Wait until UI transition completes to add welcome message
        setTimeout(() => {
            addMessage("Welcome to OpenManus! What can I help you with?", 'agent', false);
        }, 700);
    }

    // Reset input if needed
    const userInput = document.getElementById('user-input');
    userInput.value = '';

    // Focus input
    userInput.focus();

    // Reset the send button completely
    const originalButton = document.getElementById('send-button');
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

    // Add the special click handler
    newButton.addEventListener('click', function(event) {
        console.log("Send button clicked after reset");

        // Show the full UI with animations
        showFullUI();

        // Now trigger the message sending
        if (typeof window.sendMessage === 'function') {
            window.sendMessage();
        } else {
            // Fallback if global function isn't accessible
            const message = userInput.value.trim();
            if (message) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'user-message';
                messageDiv.textContent = message;
                chatContainer.appendChild(messageDiv);
                userInput.value = '';
            }
        }
    });

    console.log("Reset complete with animations");
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

// Add this to the initialization part of your file handler code
// This ensures the file handler knows about the server settings



// Modify the saveSettings function to dispatch an event when settings change
function saveSettings() {
    const settings = {
        serverHost: serverHostInput.value,
        serverPort: parseInt(serverPortInput.value),
        useSecure: useSecureInput.checked,
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
                // Forward file-related messages to the file handler
                window.fileHandler.handleMessage(data);
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

    function hideTypingIndicator() {
        if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
            typingIndicator = null;
        }
    }

    // Replace the current addMessage function with this improved version

function addMessage(text, sender, saveToHistory = true) {
    // Force full UI visibility when any message is added
    if (!firstMessageSent) {
        firstMessageSent = true;
        showFullUI();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'user' ? 'user-message message-new' : 'agent-message message-new';

    // Format code blocks
    let formattedText = text.replace(/```([\w-]*)\n([\s\S]*?)\n```/g, function(match, language, code) {
        return `<pre><code class="${language}">${code}</code></pre>`;
    });

    // Format inline code
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');

    messageDiv.innerHTML = formattedText;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Remove the animation class after it completes
    setTimeout(() => {
        messageDiv.classList.remove('message-new');
    }, 500);

    // Save chat history when a new message is added
    if (saveToHistory) {
        saveSettings();
    }
}

// Also update the typing indicator for more consistent animation
function showTypingIndicator() {
    if (typingIndicator) return;

    typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator message-new';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Remove the animation class after it completes
    setTimeout(() => {
        if (typingIndicator) {
            typingIndicator.classList.remove('message-new');
        }
    }, 500);
}

// Replace the current sendMessage function with this improved version

function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    if (isProcessing) {
        alert("Please wait until the current request is processed");
        return;
    }

    console.log("SendMessage called, firstMessageSent =", firstMessageSent);

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

    // Forward file-related messages to the file handler
    window.fileHandler.handleMessage(data);

    switch(data.status) {
        case 'processing':
            // Handle processing status
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
        case 'file_created':
            // Optionally handle file_created specifically here
            console.log("File created message received:", data);
            // The fileHandler.handleMessage call above should already update the UI.
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
// Add this code to the DOMContentLoaded event listener, after the line that loads settings
// Set up title click event
const titleElement = document.getElementById('title');
if (titleElement) {
    titleElement.addEventListener('click', resetToInitialState);
}
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

// Update the handleWebSocketMessage function to process file messages
function handleWebSocketMessage(data) {
    // Handle files in 'complete' status
    if (data.status === 'complete' && data.files && data.files.length > 0) {
        updateFilesList(data.files);
    }

    // Handle file_created status
    if (data.status === 'file_created' && data.file) {
        addFile(data.file);
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

// Then modify the updateFilesDisplay function to use this new approach
// Replace the fileItem.innerHTML section with this:

// Modified updateFilesDisplay function with a simpler, more reliable download approach
// Add this as a replacement for the current updateFilesDisplay function

// Modified updateFilesDisplay function that fixes the URL port issue
// This ensures downloads go to the correct server port

function updateFilesDisplay() {
    // Make sure the file section exists
    initializeFileSection();

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

        // Create a direct download link with corrected URL
        const downloadLink = document.createElement('a');
        downloadLink.className = 'file-download';
        downloadLink.textContent = 'Download';

        // IMPORTANT FIX: Convert relative URL to absolute URL pointing to port 2000
        // Extract the file ID from the download_url
        const fileIdMatch = file.download_url.match(/\/api\/files\/([^\/]+)$/);
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            // Use the correct server address and port
            downloadLink.href = `http://localhost:2000/api/files/${fileId}`;
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
            // Use the same correctly formed URL
            const fileIdMatch = file.download_url.match(/\/api\/files\/([^\/]+)$/);
            if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                const fullUrl = `http://localhost:2000/api/files/${fileId}`;
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

// Use settings to correctly build file URLs
function getCorrectFileUrl(fileId) {
    // Get server settings from localStorage
    const settings = JSON.parse(localStorage.getItem('openManusSettings')) || {
        serverHost: 'localhost',
        serverPort: 2000,
        useSecure: false
    };

    // Build the correct URL using the settings
    const protocol = settings.useSecure ? 'https://' : 'http://';
    return `${protocol}${settings.serverHost}:${settings.serverPort}/api/files/${fileId}`;
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

window.fileHandler = {
    initialize: function() {
        initializeFileSection();
        addClearFilesButton();

        // Update downloadLinks when settings change
        document.addEventListener('settings-updated', function() {
            updateFilesDisplay();
        });
    },
    handleMessage: handleWebSocketMessage,
    clearFiles: clearFiles,
    addFile: addFile,
    getSettings: function() {
        return JSON.parse(localStorage.getItem('openManusSettings')) || {
            serverHost: 'localhost',
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