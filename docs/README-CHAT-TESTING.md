# Testing BallTalk Chat with Multiple Users

This guide provides step-by-step instructions on how to test the real-time chat functionality in BallTalk with multiple users.

## New Features

The chat system has been enhanced with the following real-time features:

1. **Typing Indicators** - See when other users are typing messages
2. **Online Status** - View when users are online or their last seen time
3. **Network Connectivity Handling** - Graceful offline mode and reconnection
4. **Improved Real-time Updates** - More reliable message delivery and synchronization

## Prerequisites

1. Make sure you have the latest version of the BallTalk app installed.
2. You'll need access to at least two different devices or emulators/simulators.
3. Each device/simulator needs to have a different user account logged in.

## Testing Steps

### Option 1: Testing on Physical Devices

1. **Install the app on two or more devices**
   - Make sure each device has the latest version of the app.

2. **Log in with different accounts on each device**
   - Device 1: Log in with User A
   - Device 2: Log in with User B
   - (Optional) Device 3: Log in with User C

3. **Start a conversation**
   - On Device 1 (User A):
     - Navigate to the Chat tab
     - Tap the "+" button to start a new conversation
     - Search for and select User B
     - Send an initial message

4. **Verify real-time functionality**
   - On Device 2 (User B):
     - Check that the new conversation appears in the chat list
     - Check that the notification badge shows the correct number
     - Open the conversation and reply to the message
   - On Device 1 (User A):
     - Verify that User B's reply appears in real-time
     - Check read receipts to confirm User B has read the message

5. **Test typing indicators**
   - On Device 1 (User A):
     - Start typing a message but don't send it
   - On Device 2 (User B):
     - Verify that a typing indicator appears showing that User A is typing
   - Repeat the test in the opposite direction

6. **Test online status**
   - Verify that each user shows as "Online" when the app is open
   - Close the app on Device 2
   - On Device 1, verify that User B's status changes to "Offline" or "Last seen X minutes ago"
   - Reopen the app on Device 2 and verify the status changes back to "Online"

7. **Test offline functionality**
   - Put Device 1 in airplane mode
   - Verify the offline indicator appears
   - Try to send a message (the app should queue it for sending later)
   - Turn off airplane mode
   - Verify the message is sent once connection is restored

8. **Test group chat functionality (if available)**
   - On any device:
     - Create a group conversation with 3+ users
     - Verify that messages are received by all participants in real-time
     - Check that typing indicators work for all users
     - Verify online status is shown for all group members

### Option 2: Testing on Simulators/Emulators

1. **Launch multiple simulators/emulators**
   - For iOS: Launch multiple iOS simulators with different device types
   - For Android: Launch multiple AVD instances with different configurations

2. **Install and run the app on each simulator/emulator**
   - Make sure to use the same app build for all instances

3. **Log in with different test accounts on each instance**
   - Simulator 1: Log in with Test Account A
   - Simulator 2: Log in with Test Account B

4. **Follow the same testing steps as with physical devices**
   - Create conversations
   - Send messages
   - Verify real-time updates
   - Test typing indicators
   - Test online status
   - Test read receipts and reactions

### Option 3: Using Firebase Authentication Emulator

For advanced testing scenarios, you can use Firebase Authentication Emulator to simulate multiple users:

1. **Start Firebase Emulator Suite**
   ```bash
   firebase emulators:start
   ```

2. **Configure the app to use the emulator**
   - Set `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true` in your environment variables
   - Or hardcode this setting in your Firebase configuration

3. **Create test users in the emulator**
   - You can create multiple test users through the Emulator UI (usually at http://localhost:4000)

4. **Run multiple app instances pointing to the emulator**
   - Each with a different user logged in

## Troubleshooting

If you encounter issues with real-time updates:

1. **Check network connectivity**
   - Ensure all devices have stable internet connections
   - Look for the offline indicator banner at the top of the screen

2. **Verify Firebase configuration**
   - Make sure your app is correctly configured to use Firebase Firestore
   - Check firebase.ts for proper initialization

3. **Inspect console logs**
   - Look for error messages in the console related to Firebase or subscriptions
   - Pay attention to any connectivity or permission errors

4. **Clear app data**
   - Sometimes clearing the app data or reinstalling can resolve persistent issues

5. **Check Firestore rules**
   - Ensure your Firestore security rules allow reading and writing to the relevant collections, including the new 'typing' collection

## Expected Behavior

When functioning correctly, the chat system should:

- Display new messages within 1-2 seconds of being sent
- Show typing indicators when other users are composing messages
- Display user online status and last seen information
- Update read receipts when messages are viewed
- Display conversation lists with accurate unread counts
- Maintain message order and conversation state across devices
- Handle offline/online transitions gracefully
- Display an offline indicator when network connectivity is lost
- Queue messages when offline and send them when connectivity is restored

## Reporting Issues

If you discover issues during testing, please report them with:

1. Steps to reproduce the issue
2. Screenshots or recordings demonstrating the problem
3. Device/simulator information for all test devices
4. Network conditions during testing
5. Any relevant error messages from the console 