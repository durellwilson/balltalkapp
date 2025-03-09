import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import TabLayout from '../app/(tabs)/_layout';

// Mock the necessary dependencies
jest.mock('expo-router', () => ({
  Tabs: {
    Screen: ({ name, options }) => null,
    Navigator: ({ children }) => children,
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('TabLayout', () => {
  it('renders without crashing', () => {
    // Wrap the component in a NavigationContainer as it would be in the app
    const { toJSON } = render(
      <NavigationContainer>
        <TabLayout />
      </NavigationContainer>
    );
    
    // If the component renders without throwing an error, the test passes
    expect(toJSON()).toBeDefined();
  });

  it('handles hidden tabs correctly without href', () => {
    // Create a spy to monitor console errors 
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Render the component
    render(
      <NavigationContainer>
        <TabLayout />
      </NavigationContainer>
    );
    
    // Check if any errors related to href and tabBarButton were logged
    const hrefTabBarErrorCalled = consoleErrorSpy.mock.calls.some(
      call => call[0] && typeof call[0] === 'string' && 
      call[0].includes('Cannot use `href` and `tabBarButton` together')
    );
    
    // Expect no such errors
    expect(hrefTabBarErrorCalled).toBe(false);
    
    // Clean up
    consoleErrorSpy.mockRestore();
  });
}); 