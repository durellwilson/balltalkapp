# Debugging [object Object] Errors

This guide explains how to use the debugging utilities provided in this project to identify and fix [object Object] errors in JavaScript/TypeScript, particularly within React Native environments.

## Understanding [object Object] Errors

The [object Object] error occurs when code attempts to utilize an object where a string is expected, or tries to display an object when it should be rendering a string. This is a frequent source of bugs, and it's often related to incorrect type usage.

### Common Scenarios

1. **JSX Rendering**: Directly embedding an object within JSX elements (e.g., `<Text>{myObject}</Text>`).
2. **String Concatenation**: Using the + operator to combine a string with an object (e.g., `"The object is: " + myObject`).
3. **Function/Component Arguments**: Passing an object as an argument to a function or component that expects a string.
4. **Incorrect Prop Types**: Passing an object as a prop to a component that expects a string prop.
5. **Incorrect useState usage**: Using useState to store an object, and trying to display the object directly.

## Debugging Utilities

### 1. inspectObject

Logs detailed information about an object that might be causing [object Object] errors.

```typescript
import { inspectObject } from '../utils/objectDebugger';

// Example usage
inspectObject(user, "User object inspection");
```

This will log:
- Object type
- Whether it's null or undefined
- Whether it's an array
- Constructor name
- Object keys
- Whether it has a custom toString method
- Warnings for common issues (e.g., if it's a Promise)

### 2. safePrint

Returns a safe string representation of a value, or a default value if needed.

```typescript
import { safePrint } from '../utils/objectDebugger';

// Example usage
<Text>{safePrint(user, 'No user found')}</Text>
```

This function:
- Returns the value directly if it's already a string
- Returns the default value if the value is null or undefined
- Converts numbers and booleans to strings
- For objects, logs detailed information and returns a JSON string representation

### 3. safeRender

Safely renders a value in JSX, preventing [object Object] errors.

```typescript
import { safeRender } from '../utils/objectDebugger';

// Example usage
<Text>Welcome, {safeRender(user.displayName, 'User')}</Text>
```

This function:
- Returns the value directly if it's a string
- Logs detailed information if it's an object
- Returns the default value for non-string values

## Best Practices

1. **Access Specific Properties**: Instead of rendering entire objects, access specific properties:
   ```jsx
   <Text>{user.name}</Text>  // Good
   <Text>{user}</Text>       // Bad - might cause [object Object]
   ```

2. **Use Template Literals**: For string concatenation, use template literals:
   ```typescript
   const message = `User info: name=${user.name}, id=${user.id}`;  // Good
   const message = "User info: " + user;  // Bad - will result in "User info: [object Object]"
   ```

3. **Check Types**: Always verify the type of data before rendering:
   ```typescript
   typeof myValue === 'object' ? myValue.name : myValue
   ```

4. **Use Debugging Utilities**: When you encounter [object Object] errors, use the provided utilities to inspect the problematic objects and safely render values.

5. **Proper useState Usage**: When using React's useState with objects, never render the state object directly:
   ```jsx
   const [user, setUser] = useState({ name: 'John', age: 30 });
   
   // Good
   <Text>{user.name}</Text>
   
   // Bad
   <Text>{user}</Text>  // Will render as [object Object]
   ```

## Additional Utilities

For more advanced debugging needs, check out the `utils/errorDebugger.ts` file, which contains additional utilities for debugging various types of errors, including network errors and rendering issues.
