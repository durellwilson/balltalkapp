# BallTalk Testing Guide

This directory contains tests for the BallTalk application components. The tests are organized into different categories:

## Testing Structure

- `/components` - Unit tests for individual components
- `/screens` - Tests for screen components
- `/integration` - Integration tests that verify interactions between components
- `/snapshots` - Snapshot tests to ensure UI doesn't change unexpectedly

## Running Tests

To run all tests:

```bash
npm run test:unit
```

To run tests for a specific component:

```bash
npm run test:unit -- -t "FirebaseVerification"
```

To update snapshots:

```bash
npm run test:unit -- -u
```

## Testing Practices

### Component Tests

For testing React components, we test:
1. **Rendering**: Ensure components render correctly with different props
2. **Interaction**: Verify user interactions (button presses, form inputs) work properly
3. **Conditional Logic**: Test different branches of conditional rendering

### Integration Tests

Integration tests verify that multiple components work together correctly. These tests:
1. Test complete user flows (e.g., login → dashboard → specific feature)
2. Verify Firebase integration with the UI
3. Test audio recording and processing workflows

### Snapshot Tests

Snapshot tests help detect unexpected UI changes. When UI updates are intentional, snapshots should be updated.

## Mocking

We use several mocking strategies:
- **Firebase Services**: Mock auth, firestore, and storage services
- **Native Modules**: Mock platform-specific components like Slider and DateTimePicker
- **Expo Modules**: Mock expo-av for audio recording/playback

## Firebase Testing

To test Firebase functionality:
1. Use mocked Firebase services to avoid making real network calls
2. Test both success and error cases
3. Verify auth state is correctly reflected in components

## Audio Testing

For audio components:
1. Mock expo-av Audio module
2. Test recording lifecycle (start → stop → playback)
3. Test that audio processing controls respond correctly

## Best Practices

- Keep tests focused and small
- Use descriptive test names that explain what's being tested
- Test both success and failure scenarios
- Avoid testing implementation details
- Use act() for asynchronous operations
- Mock external dependencies

## Troubleshooting

- If tests fail with "Element not found", check if component rendering is conditional
- For async test failures, ensure you're using await with waitFor, act, or findBy queries
- For Firebase mocking issues, check mock implementations in __tests__/setup.js 