module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Module resolver for path aliases
      [
        'module-resolver',
        {
          root: ['..'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          alias: {
            '../../components': '../components',
            '@constants': '../constants',
            '../../hooks': '../hooks',
            '../../contexts': '../contexts',
            '../../services': '../services',
            '../../utils': '../utils',
            '@assets': '../assets',
            '../../models': '../models',
          },
        },
      ],
      // Reanimated plugin (if you're using reanimated in your project)
      'react-native-reanimated/plugin',
    ],
  };
}; 