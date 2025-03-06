/**
 * Object Debugging Utilities
 * 
 * This file contains utilities specifically designed to help track down
 * [object Object] errors in JavaScript/TypeScript, particularly in React Native environments.
 */

/**
 * Logs detailed information about an object that might be causing [object Object] errors
 * @param obj The object to inspect
 * @param label A label for the log
 */
export function inspectObject(obj: any, label: string = 'Object inspection'): void {
  console.group(label);

  // Basic info
  console.log('Type:', typeof obj);
  console.log('Is null?', obj === null);
  console.log('Is undefined?', obj === undefined);
  console.log('Is array?', Array.isArray(obj));
  console.log('Constructor name:', obj?.constructor?.name);

  // For objects
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    console.log('Keys:', Object.keys(obj));
    console.log('Has toString?', typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString);

    // Check for common issues
    if (obj.then && typeof obj.then === 'function') {
      console.warn('⚠️ This appears to be a Promise! You may be trying to render a Promise directly.');
    }
  }
  console.groupEnd();
}

/**
 * Returns a safe string representation of a value, or a default value if needed.
 * Prevents [object Object] from showing in the UI.
 * @param value The value to print
 * @param defaultValue The default string to return if value cannot be printed
 */
export const safePrint = (value: any, defaultValue: string = ''): string => {
  if (typeof value === 'string') {
    return value;
  } else if (value === null || value === undefined) {
    return defaultValue;
  } else if (typeof value === 'object') {
    inspectObject(value, 'safePrint inspection');
    return JSON.stringify(value, null, 2);
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  } else {
    return defaultValue;
  }
};

/**
 * Safely renders a value in JSX, preventing [object Object] errors.
 * @param value The value to render
 * @param defaultValue The default value to render if needed
 */
export const safeRender = (value: any, defaultValue: any = null) => {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'object') {
    inspectObject(value, "safeRender inspection");
  }
  return defaultValue;
};

/**
 * Example usage:
 * 
 * // Incorrect: Trying to render an entire object
 * <Text>{user}</Text> // This will likely cause [object Object]
 * 
 * // Correct: Rendering a specific property
 * <Text>Welcome, {user.name}!</Text>
 * 
 * // Correct: Using template literals
 * const message = `User info: name=${user.name}, id=${user.id}`;
 * console.log(message);
 * 
 * // Correct: displaying an entire object for debugging purposes
 * <Text>{JSON.stringify(user, null, 2)}</Text>
 * 
 * // Correct: using inspect object to check an object:
 * inspectObject(user, "user object");
 * 
 * // Correct: using safePrint
 * <Text>{safePrint(someValue, 'Default Text')}</Text>
 * 
 * // Correct: using safeRender
 * <Text>Welcome, {safeRender(user.displayName, 'User')}!</Text>
 */
