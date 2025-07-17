let deferredPrompt;
let autoSaveTimeout;

// PWA Install functionality
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwaInstall').style.display = 'block';
});

document.getElementById('installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('pwaInstall').style.display = 'none';
        }
        deferredPrompt = null;
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        document.getElementById('updateAvailable').style.display = 'block';
                    }
                });
            });
            
            // Register periodic background sync if supported
            if ('periodicSync' in registration) {
                registration.periodicSync.register('daily-reminder-periodic', {
                    minInterval: 24 * 60 * 60 * 1000, // 24 hours
                }).catch(err => {
                    console.log('Periodic sync not supported:', err);
                });
            }
            
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Update app function
function updateApp() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
        });
        window.location.reload();
    }
}

// Online/Offline detection
window.addEventListener('online', () => {
    document.getElementById('offlineIndicator').style.display = 'none';
});

window.addEventListener('offline', () => {
    document.getElementById('offlineIndicator').style.display = 'block';
});

// Get date key for localStorage (supports custom date)
function getDateKey(date = null) {
    const targetDate = date || new Date();
    return `reflection_${targetDate.getFullYear()}_${targetDate.getMonth()}_${targetDate.getDate()}`;
}

// Get the currently selected date from the date input
function getSelectedDate() {
    const dateInput = document.getElementById('reflectionDate');
    return dateInput.value ? new Date(dateInput.value + 'T00:00:00') : new Date();
}

// Set the date input to today (default behavior)
function setDateToToday() {
    const dateInput = document.getElementById('reflectionDate');
    const today = new Date();
    const dateString = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
    dateInput.value = dateString;
}

// Handle date change event
function onDateChange() {
    // Save current reflection before switching dates
    autoSave();
    
    // Load reflection for the selected date
    loadReflectionForDate();
    
    // Update UI to show which date we're editing
    updateDateDisplay();
}

// Auto-save functionality
function autoSave() {
    const great = document.getElementById('greatText').value;
    const shit = document.getElementById('shitText').value;
    
    if (great || shit) {
        const selectedDate = getSelectedDate();
        const dateKey = getDateKey(selectedDate);
        const reflection = {
            date: selectedDate.toISOString(),
            great: great,
            shit: shit,
            autoSaved: true
        };
        localStorage.setItem(dateKey, JSON.stringify(reflection));
        
        // Show auto-save indicator
        const indicator = document.getElementById('autoSaveIndicator');
        indicator.classList.add('show');
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
}

// Load reflection for the currently selected date
function loadReflectionForDate() {
    const selectedDate = getSelectedDate();
    const dateKey = getDateKey(selectedDate);
    const saved = localStorage.getItem(dateKey);
    
    if (saved) {
        const reflection = JSON.parse(saved);
        document.getElementById('greatText').value = reflection.great || '';
        document.getElementById('shitText').value = reflection.shit || '';
    } else {
        // Clear the form if no reflection exists for this date
        document.getElementById('greatText').value = '';
        document.getElementById('shitText').value = '';
    }
}

// Load today's reflection if it exists (renamed for clarity)
function loadTodaysReflection() {
    loadReflectionForDate();
}

// Update the UI to show which date is being edited
function updateDateDisplay() {
    const selectedDate = getSelectedDate();
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    // You could add additional UI updates here if needed
    // For now, the date input itself shows which date is selected
}

// Save reflection
function saveReflection() {
    const great = document.getElementById('greatText').value.trim();
    const shit = document.getElementById('shitText').value.trim();
    
    if (!great && !shit) {
        alert('Please write something in at least one field!');
        return;
    }

    const selectedDate = getSelectedDate();
    const dateKey = getDateKey(selectedDate);
    const reflection = {
        date: selectedDate.toISOString(),
        great: great,
        shit: shit,
        autoSaved: false
    };

    localStorage.setItem(dateKey, JSON.stringify(reflection));
    
    // Auto-backup after save
    autoBackup();
    
    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);

    // Refresh history
    loadHistory();
}

// Share reflection
function shareReflection() {
    const great = document.getElementById('greatText').value.trim();
    const shit = document.getElementById('shitText').value.trim();
    
    if (!great && !shit) {
        alert('Please write something to share!');
        return;
    }

    const today = new Date().toLocaleDateString();
    let shareText = `My Daily Reflection - ${today}\n\n`;
    
    if (great) {
        shareText += `🌟 What was great:\n${great}\n\n`;
    }
    
    if (shit) {
        shareText += `💭 What was challenging:\n${shit}\n\n`;
    }
    
    shareText += `#DailyReflection #Mindfulness`;

    // Use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'My Daily Reflection',
            text: shareText
        }).catch(err => {
            console.log('Error sharing:', err);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback share method
function fallbackShare(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Reflection copied to clipboard!');
        }).catch(() => {
            promptShare(text);
        });
    } else {
        promptShare(text);
    }
}

function promptShare(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Reflection copied to clipboard!');
}

// Delete reflection
function deleteReflection(reflectionDate) {
    if (confirm('Are you sure you want to delete this reflection? This action cannot be undone.')) {
        // Find the localStorage key for this reflection
        const date = new Date(reflectionDate);
        const key = `reflection_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}`;
        
        // Remove from localStorage
        localStorage.removeItem(key);
        
        // Refresh the history display
        loadHistory();
        
        // Show success message
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.textContent = 'Reflection deleted successfully! 🗑️';
            successMsg.style.display = 'block';
            setTimeout(() => {
                successMsg.style.display = 'none';
                successMsg.textContent = 'Reflection saved! 🌟'; // Reset to original message
            }, 3000);
        }
    }
}

// Handle swipe gestures for mobile deletion
function handleSwipeGesture(element, reflectionDate) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let threshold = 100; // Minimum distance for swipe detection
    
    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        element.style.transition = 'none';
    });
    
    element.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Only allow left swipe (negative deltaX)
        if (deltaX < 0) {
            element.style.transform = `translateX(${Math.max(deltaX, -threshold * 2)}px)`;
            element.style.background = deltaX < -threshold ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 255, 255, 0.9)';
        }
    });
    
    element.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const deltaX = currentX - startX;
        element.style.transition = 'transform 0.3s ease, background 0.3s ease';
        
        if (deltaX < -threshold) {
            // Swipe left detected - show delete confirmation
            deleteReflection(reflectionDate);
        }
        
        // Reset position
        element.style.transform = 'translateX(0)';
        element.style.background = 'rgba(255, 255, 255, 0.9)';
        isDragging = false;
    });
}

// Handle context menu for desktop
function handleContextMenu(element, reflectionDate) {
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        // Remove any existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        // Create context menu
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" onclick="deleteReflection('${reflectionDate}'); this.parentElement.remove();">
                🗑️ Delete Reflection
            </div>
            <div class="context-menu-item" onclick="this.parentElement.remove();">
                ✕ Cancel
            </div>
        `;
        
        // Position the menu
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        
        document.body.appendChild(contextMenu);
        
        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', function removeMenu(e) {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            });
        }, 100);
    });
}

// Simple markdown parser for basic formatting
function parseMarkdown(text) {
    if (!text) return '';
    
    // Process line by line to handle lists and blockquotes properly
    const lines = text.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Handle lists
        if (line.trim().startsWith('- ')) {
            if (!inList) {
                processedLines.push('<ul>');
                inList = true;
            }
            const listItem = line.trim().substring(2);
            processedLines.push(`<li>${processInlineMarkdown(listItem)}</li>`);
        } else if (line.trim().startsWith('1. ') || /^\d+\. /.test(line.trim())) {
            if (!inList) {
                processedLines.push('<ol>');
                inList = true;
            }
            const listItem = line.trim().replace(/^\d+\. /, '');
            processedLines.push(`<li>${processInlineMarkdown(listItem)}</li>`);
        } else {
            // Close list if we were in one
            if (inList) {
                const lastProcessed = processedLines[processedLines.length - 1];
                if (lastProcessed && lastProcessed.includes('<li>')) {
                    // Determine if it was ul or ol
                    const listType = processedLines.find(l => l === '<ul>' || l === '<ol>');
                    processedLines.push(listType === '<ul>' ? '</ul>' : '</ol>');
                }
                inList = false;
            }
            
            // Handle blockquotes
            if (line.trim().startsWith('> ')) {
                const quotedText = line.trim().substring(2);
                processedLines.push(`<blockquote>${processInlineMarkdown(quotedText)}</blockquote>`);
            } else if (line.trim() === '') {
                // Empty line
                processedLines.push('<br>');
            } else {
                // Regular text - escape HTML first, then process inline markdown
                const escapedLine = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                processedLines.push(processInlineMarkdown(escapedLine));
            }
        }
    }
    
    // Close any remaining list
    if (inList) {
        const lastProcessed = processedLines[processedLines.length - 1];
        if (lastProcessed && lastProcessed.includes('<li>')) {
            const listType = processedLines.find(l => l === '<ul>' || l === '<ol>');
            processedLines.push(listType === '<ul>' ? '</ul>' : '</ol>');
        }
    }
    
    return processedLines.join('\n');
}

// Process inline markdown (bold, italic)
function processInlineMarkdown(text) {
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_ (but avoid conflicts with bold)
    text = text.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    text = text.replace(/_([^_]+?)_/g, '<em>$1</em>');
    
    return text;
}

// Load reflection history
function loadHistory() {
    const historyContainer = document.getElementById('historyContainer');
    const reflections = [];

    // Get all reflections from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('reflection_')) {
            const reflection = JSON.parse(localStorage.getItem(key));
            reflections.push(reflection);
        }
    }

    // Sort by date (newest first)
    reflections.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display reflections
    if (reflections.length === 0) {
        historyContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">No reflections yet. Start your first one above!</p>';
        return;
    }

    historyContainer.innerHTML = reflections.map(reflection => {
        const date = new Date(reflection.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const autoSavedLabel = reflection.autoSaved ? ' (auto-saved)' : '';

        return `
            <div class="history-item" data-date="${reflection.date}">
                <div class="history-header">
                    <div class="history-date">${date}${autoSavedLabel}</div>
                    <button class="delete-btn" onclick="deleteReflection('${reflection.date}')" title="Delete this reflection">🗑️</button>
                </div>
                ${reflection.great ? `<div class="history-content"><span class="history-great">Great:</span> <div class="markdown-content">${parseMarkdown(reflection.great)}</div></div>` : ''}
                ${reflection.shit ? `<div class="history-content"><span class="history-shit">Challenging:</span> <div class="markdown-content">${parseMarkdown(reflection.shit)}</div></div>` : ''}
                <div class="swipe-hint">💡 Swipe left to delete on mobile, right-click on desktop</div>
            </div>
        `;
    }).join('');
    
    // Add swipe and context menu handlers to each history item
    document.querySelectorAll('.history-item').forEach(item => {
        const reflectionDate = item.getAttribute('data-date');
        handleSwipeGesture(item, reflectionDate);
        handleContextMenu(item, reflectionDate);
    });
}

// Enable notifications
function enableNotifications() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                document.getElementById('notificationSetup').style.display = 'none';
                
                // Store notification preference
                localStorage.setItem('notifications_enabled', 'true');
                localStorage.setItem('notification_time', '19:00'); // 7 PM
                
                // Initialize notification scheduling through service worker
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        // Send message to service worker to set up notifications
                        registration.active.postMessage({
                            type: 'SETUP_NOTIFICATIONS',
                            time: '19:00'
                        });
                        
                        // Register for background sync if supported
                        if ('sync' in window.ServiceWorkerRegistration.prototype) {
                            return registration.sync.register('daily-reminder');
                        }
                    });
                }
                
                // Fallback scheduling for immediate testing
                scheduleNotification();
            } else if (permission === 'denied') {
                alert('Notifications have been blocked. Please enable them in your browser settings to receive daily reminders.');
            }
        });
    } else {
        alert('Notifications are not supported in this browser');
    }
}

// Schedule daily notification
function scheduleNotification() {
    // This is now primarily a fallback method
    // The main scheduling should be handled by the service worker
    const now = new Date();
    const evening = new Date();
    evening.setHours(19, 0, 0, 0); // 7 PM

    if (now > evening) {
        evening.setDate(evening.getDate() + 1);
    }

    const timeUntilEvening = evening - now;
    
    // Store next notification time for service worker
    localStorage.setItem('next_notification_time', evening.getTime().toString());
    
    // Only use setTimeout as a fallback for immediate testing
    // Real persistent notifications should come from service worker
    setTimeout(() => {
        if (Notification.permission === 'granted') {
            // Try to use service worker notification first
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('Daily Reflection Time', {
                        body: 'Time to reflect on your day! What was great and what was challenging?',
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/icon-192x192.png',
                        tag: 'daily-reminder',
                        vibrate: [200, 100, 200],
                        requireInteraction: true,
                        actions: [
                            {
                                action: 'open',
                                title: 'Open App'
                            },
                            {
                                action: 'close',
                                title: 'Later'
                            }
                        ]
                    });
                }).catch(() => {
                    // Fallback to regular notification
                    new Notification('Daily Reflection Time', {
                        body: 'Time to reflect on your day! What was great and what was challenging?',
                        icon: '/icons/icon-192x192.png',
                        tag: 'daily-reminder',
                        vibrate: [200, 100, 200]
                    });
                });
            } else {
                // Fallback to regular notification
                new Notification('Daily Reflection Time', {
                    body: 'Time to reflect on your day! What was great and what was challenging?',
                    icon: '/icons/icon-192x192.png',
                    tag: 'daily-reminder',
                    vibrate: [200, 100, 200]
                });
            }
        }
        // Schedule next day
        scheduleNotification();
    }, timeUntilEvening);
}

// Initialize app
function initApp() {
    // Set up date input to default to today
    setDateToToday();
    
    // Check if notifications are enabled and schedule if needed
    const notificationsEnabled = localStorage.getItem('notifications_enabled') === 'true';
    if (notificationsEnabled && Notification.permission === 'granted') {
        document.getElementById('notificationSetup').style.display = 'none';
        
        // Re-initialize notification scheduling on app load
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    type: 'SETUP_NOTIFICATIONS',
                    time: localStorage.getItem('notification_time') || '19:00'
                });
            });
        }
    }

    // Auto-save functionality
    document.getElementById('greatText').addEventListener('input', autoSave);
    document.getElementById('shitText').addEventListener('input', autoSave);

    // Load today's reflection and history
    loadTodaysReflection();
    loadHistory();
}

// Initialize when page loads
window.addEventListener('load', initApp);

// Hide install prompt if already installed
window.addEventListener('appinstalled', () => {
    document.getElementById('pwaInstall').style.display = 'none';
});

// Test notification function
function testNotification() {
    if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Daily Reflection Test', {
                    body: 'This is a test notification. If you can see this, notifications are working!',
                    icon: '/icons/icon-192x192.png',
                    tag: 'test-notification',
                    vibrate: [200, 100, 200],
                    requireInteraction: true
                });
            }).catch(() => {
                // Fallback to regular notification
                new Notification('Daily Reflection Test', {
                    body: 'This is a test notification. If you can see this, notifications are working!',
                    icon: '/icons/icon-192x192.png',
                    tag: 'test-notification',
                    vibrate: [200, 100, 200]
                });
            });
        } else {
            // Fallback to regular notification
            new Notification('Daily Reflection Test', {
                body: 'This is a test notification. If you can see this, notifications are working!',
                icon: '/icons/icon-192x192.png',
                tag: 'test-notification',
                vibrate: [200, 100, 200]
            });
        }
    } else {
        alert('Please enable notifications first by clicking the "Enable Notifications" button.');
    }
}

// Backup functionality
function createBackup() {
    const reflections = [];
    const settings = {};
    
    // Get all reflections from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('reflection_')) {
            const reflection = JSON.parse(localStorage.getItem(key));
            reflections.push(reflection);
        }
    }
    
    // Get app settings
    settings.notifications_enabled = localStorage.getItem('notifications_enabled');
    settings.notification_time = localStorage.getItem('notification_time');
    settings.next_notification_time = localStorage.getItem('next_notification_time');
    
    const backupData = {
        version: '1.0',
        created: new Date().toISOString(),
        reflections: reflections,
        settings: settings,
        totalCount: reflections.length
    };
    
    return backupData;
}

function exportBackup() {
    try {
        const backupData = createBackup();
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-reflection-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('Backup created successfully! 📁', 'success');
    } catch (error) {
        console.error('Error creating backup:', error);
        showMessage('Error creating backup. Please try again.', 'error');
    }
}

function shareBackup() {
    try {
        const backupData = createBackup();
        const backupText = JSON.stringify(backupData, null, 2);
        
        if (navigator.share) {
            navigator.share({
                title: 'Daily Reflection Backup',
                text: 'My daily reflection backup data',
                files: [new File([backupText], `daily-reflection-backup-${new Date().toISOString().split('T')[0]}.json`, {
                    type: 'application/json'
                })]
            }).catch(err => {
                console.log('Error sharing backup:', err);
                // Fallback to clipboard
                fallbackShareBackup(backupText);
            });
        } else {
            fallbackShareBackup(backupText);
        }
    } catch (error) {
        console.error('Error sharing backup:', error);
        showMessage('Error sharing backup. Please try again.', 'error');
    }
}

function fallbackShareBackup(backupText) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(backupText).then(() => {
            showMessage('Backup copied to clipboard! You can paste it into a text file.', 'success');
        }).catch(() => {
            showMessage('Please manually copy your backup data from the download.', 'info');
            exportBackup();
        });
    } else {
        showMessage('Please use the download backup option.', 'info');
        exportBackup();
    }
}

function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // Validate backup data
                if (!backupData.version || !backupData.reflections || !Array.isArray(backupData.reflections)) {
                    throw new Error('Invalid backup file format');
                }
                
                // Confirm import
                const confirmMsg = `This will import ${backupData.reflections.length} reflections from ${new Date(backupData.created).toLocaleDateString()}. This may overwrite existing data. Continue?`;
                
                if (confirm(confirmMsg)) {
                    restoreFromBackup(backupData);
                }
            } catch (error) {
                console.error('Error importing backup:', error);
                showMessage('Error importing backup. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function restoreFromBackup(backupData) {
    try {
        let importedCount = 0;
        
        // Import reflections
        backupData.reflections.forEach(reflection => {
            const date = new Date(reflection.date);
            const key = `reflection_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}`;
            
            // Check if reflection already exists
            const existing = localStorage.getItem(key);
            if (!existing || confirm(`A reflection for ${date.toLocaleDateString()} already exists. Overwrite it?`)) {
                localStorage.setItem(key, JSON.stringify(reflection));
                importedCount++;
            }
        });
        
        // Import settings if they exist
        if (backupData.settings) {
            Object.entries(backupData.settings).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    localStorage.setItem(key, value);
                }
            });
        }
        
        // Refresh the display
        loadTodaysReflection();
        loadHistory();
        
        showMessage(`Successfully imported ${importedCount} reflections! 🎉`, 'success');
    } catch (error) {
        console.error('Error restoring backup:', error);
        showMessage('Error restoring backup. Please try again.', 'error');
    }
}

function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.backup-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `backup-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#4CAF50' : '#667eea'};
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        z-index: 10000;
        max-width: 80%;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Auto-backup functionality
function autoBackup() {
    try {
        const backupData = createBackup();
        const backupKey = `auto_backup_${new Date().toISOString().split('T')[0]}`;
        
        // Store in localStorage as a backup (limited but immediate)
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        // Clean up old auto-backups (keep last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('auto_backup_')) {
                const backupDate = key.replace('auto_backup_', '');
                if (new Date(backupDate) < sevenDaysAgo) {
                    localStorage.removeItem(key);
                }
            }
        }
        
        // Show subtle indication that backup was created
        const indicator = document.querySelector('.backup-auto-indicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }
        
    } catch (error) {
        console.error('Auto-backup failed:', error);
    }
}

// Navigation and Menu Functions
function toggleMenu() {
    const burgerMenu = document.getElementById('burgerMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    burgerMenu.classList.toggle('active');
    dropdownMenu.classList.toggle('show');
}

function navigateToBackup() {
    window.location.href = '/backup.html';
}

function navigateToHome() {
    window.location.href = '/index.html';
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const burgerMenu = document.getElementById('burgerMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (burgerMenu && dropdownMenu && !burgerMenu.contains(event.target) && !dropdownMenu.contains(event.target)) {
        burgerMenu.classList.remove('active');
        dropdownMenu.classList.remove('show');
    }
});