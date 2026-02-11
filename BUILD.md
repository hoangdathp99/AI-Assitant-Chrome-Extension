# AI Chatbot Chrome Extension - Build Instructions

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Installation

1. **Install dependencies:**

   ```bash
   cd d:\projects\AIAgent
   npm install
   ```

   This will install:
   - React & React DOM
   - TypeScript
   - Vite (build tool)
   - Tailwind CSS
   - Gemini AI SDK
   - Lucide React (icons)
   - Chrome Extension types

2. **Build the extension:**

   ```bash
   npm run build
   ```

   This creates a `dist/` folder with the compiled extension.

## Development Workflow

### Development Mode (with auto-rebuild)

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

### Production Build

```bash
npm run build
```

## Loading Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder (NOT the root project folder)
5. The extension should now appear in your extensions list

## Configuration

1. Click the extension icon in Chrome toolbar
2. Enter your Gemini API key
3. Enable the chatbot
4. Click "Lưu cấu hình"

## Testing

1. Navigate to any website
2. The chatbot button (💬) should appear in the bottom right
3. Click to open the chat
4. Try commands like:
   - "Click vào nút X"
   - "Tìm kiếm Y"
   - "Scroll down"

## Project Structure

```
AIAgent/
├── dist/                    # Built extension (load this in Chrome)
│   ├── manifest.json
│   ├── content/
│   │   ├── content.js      # Bundled React app
│   │   └── content.css     # Tailwind CSS output
│   ├── popup/
│   ├── background/
│   └── assets/
│
├── content/                 # Source files
│   ├── content.tsx         # Main React entry
│   ├── ChatWidget.tsx      # Chat UI component
│   ├── AgentOverlay.tsx    # Cursor overlay
│   └── styles.css          # Tailwind input
│
├── services/
│   └── geminiService.ts    # Gemini API integration
│
├── utils/
│   └── domUtils.ts         # DOM manipulation
│
├── types/
│   └── index.ts            # TypeScript types
│
├── constants/
│   └── constants.ts        # System instruction
│
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Build config
└── tailwind.config.js      # Tailwind config
```

## Troubleshooting

### Build Errors

**"Cannot find module '@google/generative-ai'"**

- Run `npm install` to install dependencies

**"\_\_dirname is not defined"**

- This is normal, Vite handles it during build

### Extension Not Loading

**"Manifest file is missing or unreadable"**

- Make sure you're loading the `dist/` folder, not the root folder

**"Failed to load extension"**

- Run `npm run build` first
- Check for errors in the build output

### Chatbot Not Appearing

1. Check extension is enabled in `chrome://extensions/`
2. Verify API key is configured
3. Check browser console (F12) for errors
4. Reload the extension and refresh the page

### TypeScript Errors

**"Cannot find name 'chrome'"**

- This is normal before `npm install`
- The `@types/chrome` package provides these types

**Tailwind "@tailwind" errors**

- These are CSS linter warnings, safe to ignore
- Tailwind processes these during build

## Hot Reload During Development

1. Run `npm run dev` in terminal
2. When you make changes, Vite rebuilds automatically
3. Go to `chrome://extensions/`
4. Click the reload icon (🔄) on your extension
5. Refresh the web page to see changes

## API Key Security

- API keys are stored in Chrome Storage (encrypted by Chrome)
- Never commit API keys to git
- Each user must configure their own API key
