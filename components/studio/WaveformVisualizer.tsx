import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '../../constants/Colors';

interface WaveformVisualizerProps {
  audioLevel: number;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioLevel }) => {
  // Create 30 bars for the visualizer
  const bars = Array.from({ length: 30 }, (_, i) => i);
  
  // Create animated values for each bar
  const animatedValues = useRef(
    bars.map(() => new Animated.Value(0))
  ).current;
  
  // Update the visualizer when audio level changes
  useEffect(() => {
    // Normalize audio level (usually in dB) to a 0-1 scale
    const normalizedLevel = Math.max(0, Math.min(1, (audioLevel + 160) / 160));
    
    // Animate each bar with a slight delay based on its position
    bars.forEach((_, index) => {
      // Calculate a random height based on the audio level
      const randomFactor = 0.7 + Math.random() * 0.6;
      const targetValue = normalizedLevel * randomFactor;
      
      Animated.timing(animatedValues[index], {
        toValue: targetValue,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });
  }, [audioLevel]);
  
  return (
    <View style={styles.container}>
      {bars.map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  bar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

export default WaveformVisualizer;
