/**
 * Advanced Error Debugging Utilities
 * This file contains utilities to help track down errors in React/React Native apps.
 */

/**
 * Wraps a component's render method to catch and log errors
 * @param Component The component to wrap
 * @param componentName Name of the component for logging
 */
export function withErrorBoundary(Component: any, componentName: string = 'Component') {
  return (props: any) => {
    try {
      return Component(props);
    } catch (error) {
      console.error(`Error rendering ${componentName}:`, error);
      return null; // Or a fallback UI
    }
  };
}

/**
 * Logs detailed information about an object that might be causing [object Object] errors
 * @param obj The object to inspect
 * @param label A label for the log
 */
export function inspectObject(obj: any, label: string = 'Object inspection'): void {
  console.group(label);
  console.log('Type:', typeof obj);
  console.log('Is null?', obj === null);
  console.log('Is undefined?', obj === undefined);
  console.log('Is array?', Array.isArray(obj));
  console.log('Constructor name:', obj?.constructor?.name);
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    console.log('Keys:', Object.keys(obj));
    console.log('Has toString?', typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString);
    if (obj.then && typeof obj.then === 'function') {
      console.warn('⚠️ This appears to be a Promise! You may be trying to render a Promise directly.');
    }

    // Detailed content
    try {
      console.log('Stringified:', JSON.stringify(obj, null, 2));
    } catch (e) {
      console.warn('Could not stringify (circular reference?):', e);
      for (const key in obj) {
        try {
          const value = obj[key];
          console.log(`  ${key}:`, typeof value === 'object' ? `[${value?.constructor?.name || 'object'}]` : value);
        } catch (propError) {
          console.log(`  ${key}: <Error accessing property>`);
        }
      }
    }
  }

  // For arrays
  else if (Array.isArray(obj)) {
    console.log('Array length:', obj.length);
    console.log('First few items:');
    obj.slice(0, 3).forEach((item, index) => {
      console.log(`  [${index}]:`, typeof item === 'object' ? `[${item?.constructor?.name || 'object'}]` : item);
    });
    const objectItems = obj.filter(item => typeof item === 'object' && item !== null);
    if (objectItems.length > 0) {
      console.warn(`⚠️ Array contains ${objectItems.length} object items that could cause [object Object] if rendered directly`);
    }
  }

  console.groupEnd();
}

/**
 * Wraps a value to make it safe for rendering in JSX
 * @param value The value to render
 * @param fallback Fallback value if the original is null/undefined
 * @param logWarning Whether to log a warning if the value is an object
 */
export function safePrint(value: any, fallback: string = '', logWarning: boolean = true): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'object') {
    if (logWarning) {
      console.warn('⚠️ Attempted to render an object directly:', value);
    }

    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Complex Object]';
    }
  }

  return String(value);
}

/**
 * Adds debug logging to a component's props
 * @param props The component props
 * @param componentName Name of the component for logging
 */
export function debugProps(props: any, componentName: string = 'Component'): any {
  console.group(`${componentName} props`);
  for (const key in props) {
    const value = props[key];
    if (typeof value === 'object' && value !== null) {
      console.log(`${key}:`, `[${value?.constructor?.name || 'object'}]`);
      try {
        console.log(`  Stringified:`, JSON.stringify(value, null, 2));
      } catch (e) {
        console.log(`  Could not stringify`);
      }
    } else {
      console.log(`${key}:`, value);
    }
  }
  console.groupEnd();
  return props;
}

/**
 * Tracks state changes that might cause [object Object] errors
 * @param setState The setState function
 * @param stateName Name of the state for logging
 */
export function createDebugState<T>(setState: (value: T) => void, stateName: string = 'state'): (value: T) => void {
  return (value: T) => {
    console.log(`Setting ${stateName}:`, value);
    if (value && typeof value === 'object') {
      console.log(`${stateName} stringified:`, JSON.stringify(value, null, 2));
    }
    setState(value);
  };
}

/**
 * Wraps an async function to debug Promise-related issues
 * @param asyncFn The async function to wrap
 * @param fnName Name of the function for logging
 */
export function debugAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  fnName: string = 'asyncFunction'
): T {
  return (async (...args: any[]) => {
    console.log(`Calling ${fnName} with args:`, args);
    try {
      const result = await asyncFn(...args);
      console.log(`${fnName} resolved with:`, result);
      if (result && typeof result === 'object') {
        console.log(`${fnName} result stringified:`, JSON.stringify(result, null, 2));
      }
      return result;
    } catch (error) {
      console.error(`${fnName} rejected with:`, error);
      throw error;
    }
  }) as T;
}

export function withRenderDebugging(Component: any, componentName: string = 'Component') {
  return (props: any) => {
    console.log(`${componentName} rendering with props:`, props);
    const result = Component(props);
    console.log(`${componentName} rendered:`, typeof result === 'object' ? `[${result?.constructor?.name || 'object'}]` : result);
    return result;
  };
}

export function isNetworkError(error: any): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (
    ('name' in error && error.name === 'NetworkError') ||
    ('code' in error && error.code === 19) ||
    (error instanceof DOMException && error.name === 'NetworkError') ||
    (error.message && typeof error.message === 'string' && error.message.toLowerCase().includes('network'))
  );
}

export function diagnoseNetworkError(error: any): string {
  console.group('Network Error Diagnosis');
  console.error('Original error:', error);
  let diagnosis = 'Network Error Diagnosis:\n';
  if (isNetworkError(error)) {
    diagnosis += '- DOMException NetworkError detected (code 19)\n';
    diagnosis += '- This typically indicates a failed network request\n\n';
    diagnosis += 'Possible causes:\n';
    diagnosis += '1. Incorrect Firebase configuration (e.g. wrong storage bucket URL)\n';
    diagnosis += '2. No internet connection\n';
    diagnosis += '3. CORS issues (for web applications)\n';
    diagnosis += '4. API endpoint is down or unreachable\n';
    diagnosis += '5. Request timeout\n\n';
    diagnosis += 'Suggested actions:\n';
    diagnosis += '1. Check your internet connection\n';
    diagnosis += '2. Verify Firebase configuration in lib/firebase.ts\n';
    diagnosis += '3. Check if the Firebase project is active and accessible\n';
    diagnosis += '4. Look for CORS configuration issues\n';
    diagnosis += '5. Check Firebase console for any service disruptions\n';
  } else if (error?.message?.includes('network')) {
    diagnosis += '- General network-related error detected\n\n';
    diagnosis += 'Possible causes:\n';
    diagnosis += '1. Intermittent connectivity issues\n';
    diagnosis += '2. API rate limiting\n';
    diagnosis += '3. Invalid authentication credentials\n\n';
    diagnosis += 'Suggested actions:\n';
    diagnosis += '1. Retry the request\n';
    diagnosis += '2. Check authentication status\n';
    diagnosis += '3. Verify API keys and credentials\n';
  } else {
    diagnosis += '- Not a standard network error but may be network-related\n\n';
    diagnosis += `Error type: ${typeof error}\n`;
    diagnosis += `Error name: ${error?.name}\n`;
    diagnosis += `Error message: ${error?.message}\n`;
    diagnosis += `Error code: ${error?.code}\n\n`;
    diagnosis += 'Suggested actions:\n';
    diagnosis += '1. Check the specific error details above\n';
    diagnosis += '2. Look for related error patterns in your code\n';
    diagnosis += '3. Consider adding more specific error handling\n';
  }
  console.warn(diagnosis);
  console.groupEnd();
  return diagnosis;
}
