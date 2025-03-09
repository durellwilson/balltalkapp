# BallTalk Premium Chat Features Deployment Guide

This document provides instructions for deploying and testing the premium chat features in BallTalk, including athlete-only secure groups and monetized fan groups.

## Overview

The premium chat features include:

1. **Athlete-Only Secure Groups**: Private, encrypted groups exclusively for verified athletes
2. **Monetized Fan Groups**: Subscription-based groups that athletes can create for their fans
3. **Enhanced Real-Time Chat**: Improved real-time messaging with typing indicators and online status
4. **Network Status Handling**: Graceful handling of offline mode with message queueing

## Deployment & Testing Workflow

We've implemented a comprehensive end-to-end workflow for deploying and testing the premium chat features. This workflow:

1. Deploys Firestore and Storage security rules
2. Builds and deploys the application to a temporary test channel
3. Creates test users (athletes and fans)
4. Sets up test conversations for real-time testing
5. Runs automated tests against the deployed application
6. Generates detailed test reports

### Running the Complete Workflow

To run the entire workflow (deploy + test):

```bash
npm run test:premium-chat
```

This command will:
- Deploy to a temporary preview URL
- Set up test accounts and conversations
- Run automated tests
- Open an HTML test report in your browser
- Provide login credentials for manual testing

The test workflow creates 4 test users:
- 2 athletes (`test-athlete1@balltalk.app` and `test-athlete2@balltalk.app`)
- 2 fans (`test-fan1@balltalk.app` and `test-fan2@balltalk.app`)

All test users have the password `Test123!`

### Component Testing Only

If you want to run Jest tests for specific chat components:

```bash
npm run test:chat
```

## Manual Deployment Options

If you prefer to deploy without running the complete test workflow:

### Option 1: Deploy to a Preview Channel (Recommended for Testing)

To deploy the chat features to a Firebase Hosting preview channel (which doesn't affect production):

```bash
npm run deploy:chat
```

This will:
1. Update Firestore and Storage security rules
2. Build the web app with premium chat features enabled
3. Deploy to a preview channel that expires in 7 days
4. Provide a unique URL for testing

### Option 2: Deploy to Production

To deploy directly to production (use with caution):

```bash
# Deploy just the Firestore & Storage rules first
npm run deploy:rules

# Then deploy the web application
npm run deploy
```

## Manual Testing Guide

If you've used the full testing workflow, you'll get login credentials for test users. Otherwise, create test users with athlete and fan roles.

### 1. Athlete-Only Groups

1. Log in as an athlete user
2. Navigate to Chat > Premium Groups > Athletes Only
3. Create a new athlete-only group
4. Test the group by inviting other athletes
5. Verify that non-athletes cannot join

#### Testing Security

- Try to access an athlete-only group with a non-athlete account
- Verify that only athletes can create and join these groups

### 2. Monetized Fan Groups

1. Log in as an athlete user
2. Navigate to Chat > Premium Groups > Fan Groups
3. Create a new fan group with pricing options
4. Test the group as the creator

#### Testing Subscriptions

1. Log in with a fan account
2. Browse available fan groups
3. Subscribe to a group by completing the payment flow
4. Verify access to the premium content

### 3. Real-Time Features

Test the following real-time features with multiple users:

- Typing indicators
- Online/offline status
- Message delivery
- Message reactions
- Offline message queueing

## Firestore Collections

The following Firestore collections are used:

- `conversations`: Main chat conversations, including premium groups
- `messages`: Individual chat messages
- `typing`: Typing indicator status
- `fanGroupSubscriptions`: User subscriptions to premium groups
- `fanGroupPayments`: Payment records for fan groups

## Troubleshooting

### Common Issues

1. **Rules Deployment Failure**:
   - Check for syntax errors in `firestore.rules` or `storage.rules`
   - Verify you have the right permissions in Firebase

2. **Real-Time Features Not Working**:
   - Check network connectivity
   - Verify Firestore indices are deployed correctly
   - Inspect browser console for error messages

3. **Subscription Process Issues**:
   - In this test version, payments are simulated
   - Check Firestore rules to ensure proper access to subscription collections
   - Verify user roles are set correctly

4. **Test User Creation Failures**:
   - If test users can't be created, check Firebase Authentication rules
   - Verify Firebase Admin SDK is properly set up
   - Look at error messages in the test output

### Firebase Emulator Testing

For local testing with Firebase emulators:

```bash
npm run emulators:start
```

Then run the app with emulator configuration:

```bash
npm run start:emulators
```

## Test Reports

After running `npm run test:premium-chat`, you can find the test reports in:

```
/test-reports/premium-chat/
```

This includes:
- HTML test report
- JSON test results
- Test user credentials
- Test conversation IDs
- Preview URL

## Next Steps

After successful testing, consider implementing:

1. Real payment processing with Stripe
2. Enhanced analytics for group engagement
3. Content moderation tools for group admins
4. Notification system for premium content

## Support

For any issues or questions, contact the BallTalk development team. 