# Firebase Configuration and Integration

This directory contains all Firebase-related configuration, tests, and emulator data for the BallTalk application.

## Directory Structure

- **config/**: Contains Firebase configuration files
  - `firebase.json`: Main Firebase configuration file
  - `firestore.rules`: Firestore security rules
  - `storage.rules`: Firebase Storage security rules
  - `firestore.indexes.json`: Firestore indexes configuration
  - `.firebaserc`: Firebase project configuration
  - `GoogleService-Info.plist`: iOS Firebase configuration

- **emulator/**: Contains Firebase emulator data and logs
  - `data/`: Emulator data for local development
  - Firebase export data
  - Debug logs

- **tests/**: Contains Firebase test files
  - Test runners
  - Integration tests
  - Mock data tests

## Symbolic Links

For compatibility with existing code and tools, symbolic links to the configuration files are maintained in the root directory:

- `firebase.json` -> `firebase/config/firebase.json`
- `firestore.rules` -> `firebase/config/firestore.rules`
- `storage.rules` -> `firebase/config/storage.rules`
- `.firebaserc` -> `firebase/config/.firebaserc`

## Using Firebase Emulators

To use Firebase emulators for local development:

```bash
npm run emulators:start
```

This will start the Firebase emulators using the configuration in `firebase/config/firebase.json` and load data from `firebase/emulator/data`.

## Deploying Firebase Configuration

To deploy Firebase configuration:

```bash
npm run deploy:rules
npm run deploy:indexes
``` 