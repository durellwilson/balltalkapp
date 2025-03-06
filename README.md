# Ball Talk App 🏀🎵

A React Native application for athletes to share and discover music. This MVP allows athletes to record, upload, and share their music with fans and other athletes.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Firebase Account](https://firebase.google.com/)
- [Project IDX](https://developers.google.com/idx/guides/introduction) (optional, for cloud development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/balltalkapp.git
   cd balltalkapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [firebase.google.com](https://firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Create a web app in your Firebase project
   - Copy your Firebase config to `lib/firebase.ts`
   - Make sure your Storage bucket URL is correct (should be `projectid.appspot.com`)

4. Create a `.env` file with your environment variables:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

5. Start the development server:
   ```bash
   npm start
   ```

### Running on Different Platforms

- **Web**: Press `w` in the terminal or run `npm run web`
- **Android**: Press `a` in the terminal or run `npm run android`
- **iOS**: Press `i` in the terminal or run `npm run ios`

## Testing

We use a test-driven development (TDD) approach for this project. This means we write tests before implementing features, ensuring that our code meets the requirements and remains stable as we make changes.

### Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once with coverage report (CI)
npm run test:ci
```

### Writing Tests

1. Create test files with the `.test.ts` or `.test.tsx` extension
2. Use Jest and React Native Testing Library for component tests
3. Follow the existing test patterns in the project

#### Component Test Example

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SongCard from '../components/SongCard';

describe('SongCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <SongCard 
        title="Test Song" 
        artist="Test Artist" 
        onPlay={() => {}} 
      />
    );
    
    expect(getByText('Test Song')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
  });
  
  it('calls onPlay when play button is pressed', () => {
    const onPlay = jest.fn();
    const { getByTestId } = render(
      <SongCard 
        title="Test Song" 
        artist="Test Artist" 
        onPlay={onPlay} 
      />
    );
    
    fireEvent.press(getByTestId('play-button'));
    expect(onPlay).toHaveBeenCalled();
  });
});
```

#### Service Test Example

```typescript
import SongService from '../../services/SongService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('firebase/storage');

describe('SongService', () => {
  it('should upload a song successfully', async () => {
    // Mock Firebase functions
    (ref as jest.Mock).mockReturnValue('storage-ref');
    (uploadBytes as jest.Mock).mockResolvedValue({});
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/song.mp3');
    
    // Call the method
    const result = await SongService.uploadSong('artist1', 'Test Song', 'Pop', new Blob());
    
    // Assertions
    expect(result).toEqual(expect.objectContaining({
      title: 'Test Song',
      genre: 'Pop'
    }));
  });
});
```

### Continuous Integration

We use GitHub Actions for continuous integration. The CI pipeline:

1. Runs on every push to main and pull request
2. Installs dependencies
3. Runs linting checks
4. Runs tests with coverage reporting
5. Builds the web version of the app
6. Uploads build artifacts

You can see the workflow configuration in `.github/workflows/ci.yml`.

## Project Structure

```
balltalkapp/
├── app/                  # Main application code (Expo Router)
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main tab navigation screens
│   │   ├── _layout.tsx   # Tab navigation configuration
│   │   ├── index.tsx     # Home screen
│   │   ├── athletes.tsx  # Athletes screen
│   │   ├── chat.tsx      # Chat screen
│   │   ├── community.tsx # Community screen
│   │   └── fan-hub.tsx   # Fan Hub screen
│   ├── chat/             # Chat detail screens
│   └── _layout.tsx       # Root layout with authentication
├── assets/               # Static assets
├── components/           # Reusable components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components 
│   ├── profile/          # Profile components
│   └── themed/           # Themed UI components
├── contexts/             # React contexts
├── lib/                  # Library configurations
├── models/               # Data models
├── services/             # Service layer for API calls
├── utils/                # Utility functions
└── __tests__/            # Test files
```

### Navigation Structure

The app uses [Expo Router](https://docs.expo.dev/router/introduction/) for navigation, with a tab-based layout:

- The `(tabs)` directory contains the main tab screens and tab navigation configuration
- The `_layout.tsx` files define the navigation structure at different levels
- The app uses a modern file-based routing approach for navigation

This structure provides a clean, maintainable architecture for a React Native mobile app.

## Features

- **Authentication**: Sign up, login, and profile management
- **Studio**: Record and upload songs
- **Songs**: Browse, play, and manage your songs
- **Social**: Follow athletes and discover new music

## Troubleshooting

### Common Issues

#### NetworkError (DOMException code 19)

This error occurs when there are issues connecting to Firebase Storage.

**Fix:**
1. Check your Firebase Storage bucket URL in `lib/firebase.ts`
2. Ensure it follows the format `projectid.appspot.com`
3. Verify your internet connection
4. Check Firebase console for service disruptions

#### Deprecated Shadow Style Props

React Native has deprecated the old shadow properties in favor of the unified `boxShadow` property.

**Fix:**
Replace:
```javascript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
```

With:
```javascript
boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.1)',
```

### Debugging Tools

#### Network Error Debugging

The app includes several debugging utilities in `utils/errorDebugger.ts`:

- `isNetworkError()`: Detects various types of network errors
- `diagnoseNetworkError()`: Provides detailed diagnostics for network issues
- `debugAsync()`: Wraps async functions with debugging
- `createDebugState()`: Tracks state changes
- `withErrorBoundary()`: Catches and logs rendering errors

#### [object Object] Error Debugging

We've added specialized utilities in `utils/objectDebugger.ts` to help prevent and debug [object Object] errors:

- `inspectObject()`: Logs detailed information about objects that might be causing [object Object] errors
- `safePrint()`: Safely converts any value to a string for rendering, preventing [object Object] errors
- `safeRender()`: Safely renders values in JSX, preventing [object Object] errors

See the `utils/OBJECT_DEBUGGING.md` guide for detailed information on using these utilities.

#### Example Component

Check out `components/ObjectDebuggingExample.tsx` for a practical example of how to use these utilities to prevent and debug [object Object] errors in React Native components.

## Recent Fixes

### NetworkError (DOMException code 19) Fix

We've fixed an issue with Firebase Storage connectivity that was causing NetworkError exceptions. The fix involved:

1. Correcting the Firebase Storage bucket URL in `lib/firebase.ts`
2. Adding enhanced error handling for network-related issues
3. Creating new debugging utilities in `utils/errorDebugger.ts` to diagnose network errors

### Deprecated Shadow Style Props Fix

We've updated the styling in the app to address the deprecated "shadow*" style props warning:

1. Replaced deprecated shadow properties with the new `boxShadow` property
2. Maintained the `elevation` property for Android compatibility
3. Updated the styling in all relevant components

### Mobile Support for Audio Features

We've improved the audio recording and playback functionality:

1. Added simulation mode for mobile platforms
2. Enhanced error handling for network issues
3. Improved the user experience with better feedback

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

#### Android

Android previews are defined as a `workspace.onStart` hook and started as a vscode task when the workspace is opened/started.

Note, if you can't find the task, either:
- Rebuild the environment (using command palette: `IDX: Rebuild Environment`), or
- Run `npm run android -- --tunnel` command manually run android and see the output in your terminal. The device should pick up this new command and switch to start displaying the output from it.

In the output of this command/task, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You'll also find options to open the app's developer menu, reload the app, and more.

#### Web

Web previews will be started and managred automatically. Use the toolbar to manually refresh.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
