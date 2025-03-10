# BallTalk App

BallTalk is a social media platform designed specifically for athletes and sports fans. It provides a space for athletes to share content, connect with fans, and monetize their personal brand through various content types including podcasts, music, videos, and live streams.

## Features

### Core Features
- **Podcast functionality**: Create, publish, and listen to podcasts
- **Live streaming**: Real-time video broadcasts for athletes
- **Music integration**: Share and discover music from athletes
- **Video and music posting**: Upload and share videos and music tracks
- **Reels-style short-form content**: Create and view short vertical videos
- **Multi-platform authentication**: Sign in with various methods

### Authentication
- Google sign-up/sign-in
- Apple sign-up/sign-in
- Email sign-up/sign-in

### Athlete Authentication
- Dedicated area for athlete verification
- Secure process for confirming athlete identities

### Content Types
- **Podcasts**: Audio content creation and playback
- **Live Streaming**: Real-time video broadcasts
- **Music**: Integration with music streaming services
- **Video Posts**: Upload and share videos
- **Music Posts**: Share music clips or full tracks
- **Reels**: Short-form vertical video content

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **UI Components**: Custom themed components
- **Media Playback**: Expo AV
- **Icons**: Expo Vector Icons (Ionicons)

## Project Structure

```
balltalkapp/
├── app/                    # Main application screens using Expo Router
│   ├── (tabs)/             # Tab-based navigation screens (Home, Studio, Profile, Chat)
│   ├── (auth)/             # Authentication screens
│   ├── studio/             # Studio-related screens
│   ├── chat/               # Chat-related screens
│   ├── admin/              # Admin-related screens
│   ├── payment/            # Payment-related screens
│   └── _layout.tsx         # Root layout component
├── assets/                 # Static assets like images and fonts
├── components/             # Reusable UI components
│   ├── content/            # Content-related components (podcasts, videos, etc.)
│   ├── music/              # Music player and related components
│   ├── profile/            # Profile-related components
│   ├── themed/             # Themed UI components (buttons, inputs, etc.)
│   └── verification/       # Athlete verification components
├── constants/              # App constants (colors, layout, etc.)
├── contexts/               # React contexts (auth, theme, etc.)
├── hooks/                  # Custom React hooks
├── models/                 # Data models and types
├── services/               # API and service integrations
├── scripts/                # Utility scripts for development and maintenance
└── utils/                  # Utility functions
```

## Navigation Structure

The app uses Expo Router for navigation with the following structure:

### Tab Navigation
- **Home**: Main feed and discovery
- **Studio**: Audio recording, mastering, and library features
- **Profile**: User profile and settings
- **Chat**: Messaging and community features

### Studio Features
- Recording Studio
- Audio Mastering
- Audio Library
- Batch Processing
- Vocal Isolation
- Dolby Audio Demo
- Save and Export

### Chat Features
- Fan Hub
- Community
- Direct Messaging
- Group Chats
- Premium Groups

### Admin Features
- Athlete Verification
- Content Moderation
- User Management

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/balltalkapp.git
   cd balltalkapp
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Run on a specific platform:
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web
   npm run web
   ```

## User Roles

### Athletes
Athletes have access to:
- Profile management
- Content creation (podcasts, music, videos)
- Live streaming
- Fan engagement tools
- Analytics dashboard

### Fans
Fans have access to:
- Discover feed
- Fan Hub
- Following athletes
- Consuming content
- Interacting with athletes

### Admins
Admins have access to:
- Athlete verification management
- Content moderation
- User management
- Analytics and reporting

## Development Guidelines

### Code Style
- Follow the ESLint configuration
- Use TypeScript for type safety
- Use functional components with hooks

### Component Structure
- Create reusable components in the `components/` directory
- Use themed components for consistent UI
- Follow the component naming convention: `[Name][Type].tsx`

### State Management
- Use React Context for global state
- Use React hooks for component state
- Use Firebase for persistent data

## Deployment

### Expo Build
```bash
# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Build for web
npm run build:web
```

### Firebase Deployment
```bash
# Deploy to Firebase Hosting
npm run deploy

# Deploy Firestore rules
npm run deploy:rules

# Deploy Firestore indexes
npm run deploy:indexes
```

## Maintenance Scripts

The project includes several maintenance scripts to help with development and codebase management:

### Navigation Scripts
- `update-navigation-paths.js`: Updates navigation paths throughout the codebase
- `test-navigation.js`: Tests navigation paths to ensure they work correctly

### Codebase Management Scripts
- `update-imports.js`: Updates import statements to reflect new file locations
- `final-cleanup.js`: Performs final cleanup tasks on the codebase
- `check-screen-integration.js`: Checks for screen integration issues
- `cleanup-docs.js`: Updates documentation to reflect changes

### Testing Scripts
- `test-app.js`: Runs comprehensive tests on the app
- `integration-test.js`: Runs integration tests
- `test-firebase.js`: Tests Firebase integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/)
- [Ionicons](https://ionic.io/ionicons)
