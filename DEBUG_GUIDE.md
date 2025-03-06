# Debugging Guide for [object Object] Errors

This guide provides comprehensive instructions for debugging and fixing the common "[object Object]" error in React Native applications.

> **New!** We've added dedicated utilities in `utils/objectDebugger.ts` specifically for handling [object Object] errors. See the `utils/OBJECT_DEBUGGING.md` guide for detailed information.

## What Causes [object Object] Errors?

The "[object Object]" error occurs when JavaScript attempts to convert an object to a string implicitly. This typically happens in the following scenarios:

1. Directly rendering an object in JSX
2. Concatenating an object with a string
3. Using an object where a string is expected
4. Passing an object to a component that expects a string prop

## Quick Fixes

### 1. Use the Debugging Utilities

We've added specialized debugging utilities in `utils/objectDebugger.ts` to help identify and fix these errors:

```javascript
// Import the utilities
import { inspectObject, safePrint, safeRender } from '../utils/objectDebugger';

// Use inspectObject to log detailed information about objects
inspectObject(user, 'User object');

// Use safePrint when displaying values that might be objects
<Text>{safePrint(someValue, 'Default Text')}</Text>

// Use safeRender for JSX rendering
<Text>Welcome, {safeRender(user.displayName, 'User')}!</Text>
```

For a complete example, check out the `components/ObjectDebuggingExample.tsx` component, which demonstrates how to use these utilities in a real-world scenario.

> **Note:** The older utilities in `utils/errorDebugger.ts` and `utils/debugging.ts` are still available but we recommend using the new specialized utilities in `utils/objectDebugger.ts` for [object Object] errors.

### 2. Check Common Locations for Errors

- **Component Props**: Ensure you're not passing objects to components that expect strings
- **Text Components**: Check all `<Text>` components to ensure they only contain strings
- **String Concatenation**: Look for places where you might be concatenating objects with strings
- **Template Literals**: Check template literals that might include object references

## Systematic Debugging Process

### Step 1: Enable Verbose Logging

Add the following code to your component to log the user object and other potential problem areas:

```javascript
useEffect(() => {
  if (user) {
    console.log('Current user data:');
    inspectObject(user, 'User object');
  }
}, [user]);
```

### Step 2: Identify the Source of the Error

Look for error messages in the console that indicate where the [object Object] error is occurring. Common patterns include:

- `Error: Text strings must be rendered within a <Text> component.`
- `Invariant Violation: Objects are not valid as a React child`

### Step 3: Apply Safe Rendering Patterns

Replace direct object references with safe alternatives:

```javascript
// UNSAFE:
<Text>Welcome, {user.displayName}!</Text>

// SAFE:
<Text>Welcome, {typeof user.displayName === 'string' ? user.displayName : 'User'}!</Text>

// SAFER (using utility):
<Text>Welcome, {safeRender(user.displayName, 'User')}!</Text>
```

### Step 4: Create Helper Functions for Complex Objects

For complex objects or nested properties, create helper functions:

```javascript
// Helper function to safely get user display name
const getUserDisplayName = () => {
  if (!user) return '';
  
  // Check if user has displayName property and it's a string
  if (user.displayName && typeof user.displayName === 'string') {
    return user.displayName;
  }
  
  // Check if user has username property and it's a string
  if (user.username && typeof user.username === 'string') {
    return user.username;
  }
  
  return 'Athlete'; // Default fallback
};
```

## Common Problem Areas in Our App

### 1. User Object in Auth Context

The user object from Firebase can sometimes contain complex nested properties. Always use safe rendering when displaying user properties:

```javascript
// In components using user data:
const { user } = useAuth();

// Log user object to help debug
useEffect(() => {
  if (user) {
    inspectObject(user, 'User object');
  }
}, [user]);
```

### 2. Firestore Data

Data from Firestore might include timestamps, references, or nested objects that can cause [object Object] errors:

```javascript
// When fetching data from Firestore, validate it:
const songComments = querySnapshot.docs.map((doc, index) => {
  const data = doc.data();
  console.log(`Comment ${index + 1} data:`, JSON.stringify(data, null, 2));

  // Ensure all required fields are present and of the correct type
  const validatedComment: SongComment = {
    id: data.id || doc.id,
    songId: data.songId || songId,
    userId: data.userId || 'unknown',
    text: data.text || '',
    timestamp: data.timestamp || new Date().toISOString(),
    likes: data.likes || 0
  };

  return validatedComment;
});
```

### 3. Component Props

When passing props to components, ensure they are of the expected type:

```javascript
// SongCard component expects string props
<SongCard
  title={safePrint(song.title, 'Untitled')}
  artist={safePrint(song.artist, 'Unknown Artist')}
  onPlay={() => playSong(song.id)}
/>
```

## Advanced Debugging Techniques

### 1. Use the Example Component

We've created a comprehensive example component that demonstrates common [object Object] errors and how to fix them:

```javascript
import ObjectDebuggingExample from '../components/ObjectDebuggingExample';

// Use this component in your app during development to see examples
<ObjectDebuggingExample />
```

This component shows:
- Common scenarios that cause [object Object] errors
- How to properly access object properties
- How to use the safePrint and safeRender utilities
- How to inspect objects in the console

### 2. Use the Error Boundary Component

Wrap problematic components with the error boundary to catch and log errors:

```javascript
import { withErrorBoundary } from '../utils/errorDebugger';

// Wrap your component
const SafeComponent = withErrorBoundary(MyComponent, 'MyComponent');
```

### 3. Debug State Changes

Track state changes that might introduce objects:

```javascript
import { createDebugState } from '../utils/errorDebugger';

// Instead of useState directly
const [songs, setSongsOriginal] = useState<Song[]>([]);
const setSongs = createDebugState(setSongsOriginal, 'songs');
```

### 4. Debug Async Functions

Wrap async functions to log their inputs and outputs:

```javascript
import { debugAsync } from '../utils/errorDebugger';

// Wrap your async function
const loadSongs = debugAsync(async () => {
  // Your async code here
}, 'loadSongs');
```

## Testing Your Fixes

After applying fixes, test thoroughly by:

1. Navigating between different screens
2. Testing with different user states (logged in, logged out)
3. Testing with different data scenarios (empty data, full data)
4. Testing edge cases (null values, undefined properties)

## Preventing Future [object Object] Errors

1. Use TypeScript properly to catch type errors at compile time
2. Always validate data from external sources (API, Firebase)
3. Use the safe rendering utilities consistently
4. Add unit tests that verify rendering with different data scenarios
5. Consider adding ESLint rules to catch potential issues
6. Use the example component as a reference for best practices
7. Refer to the `utils/OBJECT_DEBUGGING.md` guide for detailed information

By following this guide, you should be able to identify and fix [object Object] errors in your React Native application.

## Additional Resources

- `utils/OBJECT_DEBUGGING.md`: Detailed guide on using the object debugging utilities
- `components/ObjectDebuggingExample.tsx`: Example component demonstrating best practices
- `utils/objectDebugger.ts`: Source code for the specialized debugging utilities
