// Import necessary testing utilities
const { test, expect, describe, it } = require('@jest/globals');

// Basic test
test('basic test', () => {
  expect(1 + 1).toBe(2);
});

// Another test
describe('Simple math', () => {
  it('should add numbers correctly', () => {
    expect(2 + 2).toBe(4);
  });
}); 