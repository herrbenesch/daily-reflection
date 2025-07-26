# Daily Reflection 🌟

A beautiful, intuitive Progressive Web App for daily journaling and self-reflection. Take a moment each day to reflect on what went well and what was challenging - building mindfulness and self-awareness one day at a time.

![Daily Reflection App](screenshot.png)

## ✨ Features

### 🎯 **Simple Daily Reflection**
- Two thoughtful prompts: "What has been great today?" and "What has been challenging today?"
- Clean, distraction-free interface focused on your thoughts
- Date picker to reflect on any day, not just today

### 📱 **Progressive Web App**
- **Install as an app** on your phone, tablet, or desktop
- **Works offline** - your reflections are always accessible
- **Auto-sync** when you're back online
- Fast, native-like experience

### 💾 **Smart Data Management**
- **Auto-save** as you type - never lose your thoughts
- **Complete backup system** - export, import, and share your reflections
- **Edit and delete** past reflections with easy swipe gestures (mobile)
- **Local storage** keeps your data private and secure

### 🔔 **Gentle Reminders**
- Optional evening notifications to remind you to reflect
- Customizable notification timing
- Never pushy - just a gentle nudge when you want it

### 🎨 **Beautiful Design**
- **Mobile-first** responsive design
- **Dark theme** with soothing gradients
- **Markdown support** for formatting your thoughts
- **Intuitive gestures** for mobile users

## 🚀 Getting Started

### For Users

#### Option 1: Use Online (Recommended)
1. Visit the app in your web browser
2. Click "Install App" when prompted for the best experience
3. Start reflecting on your day!

#### Option 2: Install as PWA
1. Open the app in Chrome, Safari, or Edge
2. Look for the "Install" or "Add to Home Screen" option
3. Follow your browser's installation prompts
4. Launch from your home screen or app drawer

### For Developers

#### Quick Start
```bash
# Clone the repository
git clone https://github.com/herrbenesch/daily-reflection.git
cd daily-reflection

# Serve locally (any static server works)
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080

# Open http://localhost:8080 in your browser
```

#### Requirements
- Any modern web browser
- Local web server (for development)
- No build process required - pure vanilla web technologies!

## 📖 How to Use

### Daily Reflection
1. **Open the app** - The date defaults to today
2. **Choose your date** - Use the date picker to reflect on any day
3. **Write your thoughts** in the two text areas:
   - 🌟 **Great**: What made today wonderful?
   - 💭 **Challenging**: What was difficult or frustrating?
4. **Save** your reflection or let auto-save handle it
5. **Share** your thoughts if you'd like

### Managing Your Reflections
- **View history** - Scroll down to see all your past reflections
- **Edit reflections** - Click the edit button (✏️) or swipe right on mobile
- **Delete reflections** - Click the delete button (🗑️) or swipe left on mobile
- **Backup your data** - Use the backup menu for export/import

### Backup & Sync
1. **Access backup** - Click the menu (☰) and select "Backup & Sync"
2. **Export data** - Download a JSON file with all your reflections
3. **Import data** - Upload a backup file to restore reflections
4. **Share backup** - Send your backup to other devices or cloud storage

## 🛠️ Technical Details

### Architecture
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser LocalStorage API
- **PWA**: Service Worker, Web App Manifest
- **APIs Used**: Notification API, Web Share API, Clipboard API

### File Structure
```
daily-reflection/
├── index.html          # Main application page
├── backup.html         # Backup management page
├── app.js             # Core application logic (~1100 lines)
├── style.css          # Complete styling and responsive design
├── sw.js              # Service Worker for PWA functionality
├── manifest.json      # PWA manifest configuration
├── favicon.ico        # Browser favicon
├── icons/             # PWA icons (192x192, 512x512, maskable)
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   ├── icon-maskable-192x192.png
│   ├── icon-maskable-512x512.png
│   └── icon.svg
├── LICENSE           # Apache 2.0 License
└── README.md         # This file
```

### Key Components

#### Core Features (`app.js`)
- **Reflection Management**: Save, load, edit, delete reflections
- **Date Handling**: Navigate between different dates
- **Auto-save**: Real-time saving as you type
- **History Display**: Show past reflections with actions
- **PWA Integration**: Install prompts, update notifications

#### Data Structure
```javascript
// Each reflection is stored as:
{
  date: "2025-07-26T00:00:00.000Z",    // ISO date string
  great: "Had a wonderful walk...",     // Positive reflection
  shit: "Struggled with work stress...", // Challenging reflection
  autoSaved: false                      // Whether it was auto-saved
}
```

#### Backup Format
```javascript
{
  version: "1.0",
  created: "2025-07-26T12:00:00.000Z",
  reflections: [...],                   // Array of all reflections
  settings: {...},                      // App settings
  totalCount: 42                        // Number of reflections
}
```

### Browser Support
- **Chrome/Chromium** 60+ (full PWA support)
- **Safari** 11.1+ (iOS 11.3+)
- **Firefox** 44+
- **Edge** 17+

### PWA Features
- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Service Worker caches the app
- **Background Sync**: Auto-backup when connection returns
- **Push Notifications**: Optional evening reminders
- **App Shortcuts**: Quick actions from the home screen

## 🎨 Customization

### Themes
The app uses CSS custom properties for easy theming:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #4CAF50;
  --warning-color: #FF6B6B;
}
```

### Notification Timing
Modify the notification time in `app.js`:
```javascript
// Default is 7 PM (19:00)
localStorage.setItem('notification_time', '20:00'); // 8 PM
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your feature: `git checkout -b feature-name`
4. **Make changes** and test locally
5. **Commit** with clear messages
6. **Push** and create a Pull Request

### Contribution Guidelines
- **Keep it simple**: This app thrives on simplicity
- **Test thoroughly**: Check on mobile and desktop
- **Follow the style**: Match existing code patterns
- **Update docs**: Include README updates for new features

### Areas for Contribution
- 🌍 **Internationalization**: Add language support
- 🎨 **Themes**: Additional color schemes
- 📊 **Analytics**: Reflection insights and trends
- 🔒 **Security**: Enhanced data encryption
- ♿ **Accessibility**: Screen reader improvements
- 🧪 **Testing**: Automated test coverage

## 📄 License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built with ❤️ for mindfulness and self-reflection
- Inspired by the power of daily journaling
- Uses modern web standards for a native-like experience

---

**Made with intention for your daily reflection journey** 🌱
