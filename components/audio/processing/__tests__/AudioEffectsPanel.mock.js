// Mock file for testing AudioEffectsPanel
// This is a simplified version of the component for testing purposes

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const AudioEffectsPanel = ({ audioUri, onProcessed, onError }) => {
  const handleApplyEffects = () => {
    if (audioUri) {
      onProcessed('processed-uri');
    } else {
      onError('No audio to process');
    }
  };

  return (
    <View>
      <Text>Audio Effects</Text>
      <TouchableOpacity onPress={() => {}}>
        <Text>Play Original</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}}>
        <Text>Preview Effects</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleApplyEffects}>
        <Text>Apply Effects</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {}}>
        <Text>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AudioEffectsPanel; 