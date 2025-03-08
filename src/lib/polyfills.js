// Polyfill for setImmediate in browsers
if (typeof global !== 'undefined') {
  // Node.js environment
  if (typeof global.setImmediate === 'undefined') {
    global.setImmediate = function(callback) {
      return setTimeout(callback, 0);
    };
  }
  
  if (typeof global.clearImmediate === 'undefined') {
    global.clearImmediate = function(id) {
      clearTimeout(id);
    };
  }
} else if (typeof window !== 'undefined') {
  // Browser environment
  if (typeof window.setImmediate === 'undefined') {
    window.setImmediate = function(callback) {
      return setTimeout(callback, 0);
    };
  }
  
  if (typeof window.clearImmediate === 'undefined') {
    window.clearImmediate = function(id) {
      clearTimeout(id);
    };
  }
}

// Export dummy for module systems
export default {
  setImmediate: typeof global !== 'undefined' ? global.setImmediate : 
                (typeof window !== 'undefined' ? window.setImmediate : setTimeout),
  clearImmediate: typeof global !== 'undefined' ? global.clearImmediate : 
                 (typeof window !== 'undefined' ? window.clearImmediate : clearTimeout)
}; 