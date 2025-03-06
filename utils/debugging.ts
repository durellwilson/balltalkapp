/**
 * Utility functions for debugging and preventing common errors
 */

/**
 * Safely converts any value to a string representation
 * Prevents [object Object] errors by properly stringifying objects
 * 
 * @param value Any value that needs to be displayed or logged
 * @param fallback Optional fallback string if value is undefined or null
 * @returns A string representation of the value
 */
export function safeToString(value: any, fallback: string = ''): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Failed to stringify object:', error);
      return '[Complex Object]';
    }
  }
  
  return String(value);
}

/**
 * Safely renders a value in JSX
 * Prevents [object Object] errors by properly handling objects
 * 
 * @param value Any value that needs to be rendered
 * @param fallback Optional fallback string if value is undefined or null
 * @returns A safely renderable string
 */
export function safeRender(value: any, fallback: string = ''): string {
  return safeToString(value, fallback);
}

/**
 * Safely logs objects to the console with proper formatting
 * 
 * @param label Label for the log
 * @param value Value to log
 */
export function safeLog(label: string, value: any): void {
  if (typeof value === 'object' && value !== null) {
    console.log(`${label}:`, JSON.stringify(value, null, 2));
  } else {
    console.log(`${label}:`, value);
  }
}

/**
 * Validates an object against required fields and provides defaults
 * 
 * @param obj The object to validate
 * @param requiredFields Map of field names to default values
 * @returns A validated object with all required fields
 */
export function validateObject<T>(obj: any, requiredFields: Record<string, any>): T {
  if (!obj || typeof obj !== 'object') {
    obj = {};
  }
  
  const result: Record<string, any> = { ...obj };
  
  for (const [field, defaultValue] of Object.entries(requiredFields)) {
    if (result[field] === undefined || result[field] === null) {
      result[field] = defaultValue;
    }
  }
  
  return result as T;
}
