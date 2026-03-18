# Dev Tools

<div align="center">
  <img src="demo-images/home.png" width="240" />
  <img src="demo-images/curl-helper.png" width="240" />
  <img src="demo-images/json-helper.png" width="240" />
  <img src="demo-images/jp-learn.png" width="240" />
  <p><em>Home, CURL Helper, JSON Helper, JP Learn</em></p>
</div>

A collection of developer utility tools built with [Expo](https://expo.dev) and React Native. Works on Web, iOS, and Android.

## 🎯 Online Demo

Try the live demo: [wenzhi-tools.expo.app](https://wenzhi-tools--m8wfyq4hz7.expo.app/)

## ✨ Features

### CURL Helper
Parse, modify, and simplify curl commands for local development:
- URL replacement for redirecting requests to localhost
- Token replacement for authentication testing
- Header filtering (remove unnecessary headers)
- One-click minimize mode for cleaner commands

### JSON Helper
Format, validate, and transform JSON data:
- Pretty print with syntax highlighting
- Interactive tree view with expand/collapse
- Extract and filter specific keys from arrays
- Reorder object keys

### Japanese Learning (50音)
Practice Hiragana and Katakana:
- Grid view with progress tracking
- Flashcard mode with flip animation
- Quiz mode with spaced repetition
- Audio pronunciation support

## Getting Started

### Prerequisites
- Node.js 18+
- npm (or yarn)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo` is bundled with the project)

### Installation

```bash
npm install
```

### Development

Start the Expo development server:

```bash
npx expo start
```

Once the server is running, press the corresponding key in the terminal:

| Key | Action |
|-----|--------|
| `w` | Open in **Web Browser** |
| `i` | Open in **iOS Simulator** (macOS + Xcode required) |
| `a` | Open in **Android Emulator** (Android Studio required) |

> 📱 You can also scan the QR code with [Expo Go](https://expo.dev/go) on your phone to preview on a real device.

Or launch a specific platform directly:

```bash
npx expo start --web
npx expo start --ios
npx expo start --android
```

### Build & Deploy

```bash
# Export static web build
npx expo export --platform web

# Deploy via EAS (Expo Application Services)
npx eas deploy
```

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── curl_helper.tsx
│   │   ├── json_helper.tsx
│   │   └── japanese_learning.tsx
│   └── _layout.tsx        # Root layout
├── components/
│   ├── custom/            # Tool-specific components
│   ├── json_helper/       # JSON helper components
│   └── ui/                # Shared UI components
├── src/
│   └── styles/            # Global styles
├── assets/                # Images and fonts
├── constants/             # Theme colors
└── hooks/                 # Custom React hooks
```

## Tech Stack

- **Framework**: [Expo](https://expo.dev) (SDK 53)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **UI**: React Native with platform-specific optimizations
- **State**: React hooks + AsyncStorage for persistence

## License

MIT
