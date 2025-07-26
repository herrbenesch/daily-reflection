const CACHE_NAME = 'daily-reflection-v11';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/style.css',
    '/app.js',
    '/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-192x192.png',
    '/icons/icon-maskable-512x512.png'
];

// Store notification scheduling data
let notificationScheduled = false;
let nextNotificationTime = null;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    // Don't skip waiting automatically - let the main app control this
});

self.addEventListener('fetch', (event) => {
    // Use network-first strategy for the main HTML file to ensure updates are detected
    if (event.request.mode === 'navigate' || 
        event.request.destination === 'document' ||
        event.request.url.endsWith('/') ||
        event.request.url.endsWith('/index.html')) {
        
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // If we get a valid response, cache it and return
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                        return response;
                    }
                    // If network fails, fall back to cache
                    return caches.match(event.request);
                })
                .catch(() => {
                    // Network failed, try cache
                    return caches.match(event.request);
                })
        );
    } else {
        // Use cache-first strategy for other resources (CSS, JS, images, etc.)
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((response) => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    });
                })
        );
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete any caches that don't match the current cache name
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data.type === 'SETUP_NOTIFICATIONS') {
        const notificationTime = event.data.time || '19:00';
        scheduleNextNotification(notificationTime);
    } else if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Schedule the next notification
function scheduleNextNotification(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const notificationTime = new Date();
    notificationTime.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (now > notificationTime) {
        notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    nextNotificationTime = notificationTime.getTime();
    
    // Start checking for notification time
    checkNotificationTime();
}

// Check if it's time to send a notification
function checkNotificationTime() {
    const now = Date.now();
    
    if (nextNotificationTime && now >= nextNotificationTime) {
        sendDailyReminder();
        // Schedule next day
        const nextDay = new Date(nextNotificationTime);
        nextDay.setDate(nextDay.getDate() + 1);
        nextNotificationTime = nextDay.getTime();
    }
    
    // Check again in 1 minute
    setTimeout(checkNotificationTime, 60000);
}

// Background sync for notifications
self.addEventListener('sync', (event) => {
    if (event.tag === 'daily-reminder') {
        event.waitUntil(sendDailyReminder());
    }
});

function sendDailyReminder() {
    return self.registration.showNotification('Daily Reflection Time', {
        body: 'Time to reflect on your day! What was great and what was challenging?',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzY2N2VlYSIvPgo8cGF0aCBkPSJNMTYgOEwxNy40NSAxNi4zNUwyNiAxOEwxNy40NSAyNS42NUwxNiAzNEwxNC41NSAyNS42NUw2IDE4TDE0LjU1IDE2LjM1TDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzY2N2VlYSIvPgo8cGF0aCBkPSJNMTYgOEwxNy40NSAxNi4zNUwyNiAxOEwxNy40NSAyNS42NUwxNiAzNEwxNC41NSAyNS42NUw2IDE4TDE0LjU1IDE2LjM1TDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
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
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'daily-reminder-periodic') {
        event.waitUntil(checkAndSendReminder());
    }
});

function checkAndSendReminder() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Check if it's around 7 PM (19:00)
    if (hour === 19 && minute < 5) {
        return sendDailyReminder();
    }
    
    return Promise.resolve();
}