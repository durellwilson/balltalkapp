module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin (if you're using reanimated in your project)
      'react-native-reanimated/plugin',
    ],
  };
}; 