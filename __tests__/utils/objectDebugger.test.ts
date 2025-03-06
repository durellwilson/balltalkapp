import { inspectObject, safePrint, safeRender } from '../../utils/objectDebugger';

describe('objectDebugger utilities', () => {
  // Mock console methods
  const originalConsoleGroup = console.group;
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleGroupEnd = console.groupEnd;

  beforeEach(() => {
    // Mock console methods
    console.group = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.groupEnd = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.group = originalConsoleGroup;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.groupEnd = originalConsoleGroupEnd;
  });

  describe('inspectObject', () => {
    it('logs basic info about an object', () => {
      const testObj = { name: 'Test', value: 123 };
      inspectObject(testObj, 'Test Object');

      // Check that console.group was called with the label
      expect(console.group).toHaveBeenCalledWith('Test Object');

      // Check that console.log was called with basic info
      expect(console.log).toHaveBeenCalledWith('Type:', 'object');
      expect(console.log).toHaveBeenCalledWith('Is null?', false);
      expect(console.log).toHaveBeenCalledWith('Is undefined?', false);
      expect(console.log).toHaveBeenCalledWith('Is array?', false);
      expect(console.log).toHaveBeenCalledWith('Constructor name:', 'Object');

      // Check that console.log was called with object keys
      expect(console.log).toHaveBeenCalledWith('Keys:', ['name', 'value']);

      // Check that console.groupEnd was called
      expect(console.groupEnd).toHaveBeenCalled();
    });

    it('logs info about null', () => {
      inspectObject(null, 'Test Null');

      // Check that console.log was called with null info
      expect(console.log).toHaveBeenCalledWith('Is null?', true);
    });

    it('logs info about undefined', () => {
      inspectObject(undefined, 'Test Undefined');

      // Check that console.log was called with undefined info
      expect(console.log).toHaveBeenCalledWith('Is undefined?', true);
    });

    it('logs info about an array', () => {
      const testArray = [1, 2, 3];
      inspectObject(testArray, 'Test Array');

      // Check that console.log was called with array info
      expect(console.log).toHaveBeenCalledWith('Is array?', true);
    });

    it('detects promises', () => {
      const testPromise = Promise.resolve('test');
      inspectObject(testPromise, 'Test Promise');

      // Check that console.warn was called for the promise
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ This appears to be a Promise! You may be trying to render a Promise directly.'
      );
    });
  });

  describe('safePrint', () => {
    it('returns the value if it is a string', () => {
      expect(safePrint('test')).toBe('test');
    });

    it('returns the default value if the value is null', () => {
      expect(safePrint(null, 'default')).toBe('default');
    });

    it('returns the default value if the value is undefined', () => {
      expect(safePrint(undefined, 'default')).toBe('default');
    });

    it('returns a JSON string if the value is an object', () => {
      const testObj = { name: 'Test', value: 123 };
      const result = safePrint(testObj);
      
      // Check that inspectObject was called
      expect(console.group).toHaveBeenCalledWith('safePrint inspection');
      
      // Check that the result is a JSON string
      expect(result).toBe(JSON.stringify(testObj, null, 2));
    });

    it('converts numbers to strings', () => {
      expect(safePrint(123)).toBe('123');
    });

    it('converts booleans to strings', () => {
      expect(safePrint(true)).toBe('true');
      expect(safePrint(false)).toBe('false');
    });
  });

  describe('safeRender', () => {
    it('returns the value if it is a string', () => {
      expect(safeRender('test')).toBe('test');
    });

    it('returns the default value if the value is an object', () => {
      const testObj = { name: 'Test', value: 123 };
      const result = safeRender(testObj, 'default');
      
      // Check that inspectObject was called
      expect(console.group).toHaveBeenCalledWith('safeRender inspection');
      
      // Check that the result is the default value
      expect(result).toBe('default');
    });

    it('returns null if no default value is provided and the value is an object', () => {
      const testObj = { name: 'Test', value: 123 };
      const result = safeRender(testObj);
      
      // Check that the result is null
      expect(result).toBeNull();
    });
  });
});
