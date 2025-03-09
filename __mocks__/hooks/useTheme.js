export const useTheme = () => ({
  theme: {
    primary: '#007AFF',
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    cardBackground: '#F8F8F8',
    border: '#EEEEEE'
  },
  isDarkMode: false,
  toggleTheme: jest.fn()
});

export default { useTheme }; 