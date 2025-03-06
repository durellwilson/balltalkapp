import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ObjectDebuggingExample from '../../components/ObjectDebuggingExample';
import * as objectDebugger from '../../utils/objectDebugger';

// Mock the objectDebugger utilities
jest.mock('../../utils/objectDebugger', () => ({
  inspectObject: jest.fn(),
  safePrint: jest.fn((value, fallback) => 
    typeof value === 'string' ? value : (value ? 'Object JSON' : fallback)),
  safeRender: jest.fn((value, fallback) => 
    typeof value === 'string' ? value : fallback),
}));

describe('ObjectDebuggingExample', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<ObjectDebuggingExample />);
    
    // Check that the component renders its title
    expect(getByText('Object Debugging Examples')).toBeTruthy();
    
    // Check that the sections are rendered
    expect(getByText('Incorrect Rendering (would show [object Object])')).toBeTruthy();
    expect(getByText('Correct Property Access')).toBeTruthy();
    expect(getByText('Using safePrint Utility')).toBeTruthy();
    expect(getByText('Using safeRender Utility')).toBeTruthy();
  });

  it('shows error examples', () => {
    const { getAllByText } = render(<ObjectDebuggingExample />);
    
    // Check that the error examples are shown
    const errorTexts = getAllByText(/❌/);
    expect(errorTexts.length).toBeGreaterThan(0);
  });

  it('shows correct property access examples', () => {
    const { getByText } = render(<ObjectDebuggingExample />);
    
    // Check that the correct property access examples are shown
    expect(getByText('✅ User name: John Doe')).toBeTruthy();
    expect(getByText('✅ User bio: Music producer and songwriter')).toBeTruthy();
    expect(getByText('✅ Settings theme: Loading...')).toBeTruthy();
  });

  it('uses safePrint utility', () => {
    render(<ObjectDebuggingExample />);
    
    // Check that safePrint was called
    expect(objectDebugger.safePrint).toHaveBeenCalled();
  });

  it('uses safeRender utility', () => {
    render(<ObjectDebuggingExample />);
    
    // Check that safeRender was called
    expect(objectDebugger.safeRender).toHaveBeenCalled();
  });

  it('calls inspectObject when button is pressed', () => {
    const { getByText } = render(<ObjectDebuggingExample />);
    
    // Find and press the button
    const button = getByText('Inspect Objects in Console');
    fireEvent.press(button);
    
    // Check that inspectObject was called
    expect(objectDebugger.inspectObject).toHaveBeenCalledTimes(3);
  });

  it('handles undefined settings correctly', () => {
    // Mock implementation for this specific test
    (objectDebugger.safePrint as jest.Mock).mockImplementation((value, fallback) => {
      if (value === undefined) return fallback;
      return typeof value === 'string' ? value : 'Object JSON';
    });
    
    const { getByText } = render(<ObjectDebuggingExample />);
    
    // Check that undefined settings are handled correctly
    expect(getByText('Settings: No settings available')).toBeTruthy();
  });
});
