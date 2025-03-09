import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AudioProcessingService from '../../../services/AudioProcessingService';
import { AudioEffectsSettings } from './AudioEffectsPanel';

interface PresetSelectorProps {
  onPresetSelected: (preset: AudioEffectsSettings) => void;
}

/**
 * Component for selecting audio effect presets
 */
const PresetSelector: React.FC<PresetSelectorProps> = ({ onPresetSelected }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const presets = AudioProcessingService.getPresets();
  
  const handlePresetSelect = (presetName: string) => {
    const preset = AudioProcessingService.loadPreset(presetName);
    onPresetSelected(preset);
    setModalVisible(false);
  };
  
  return (
    <View>
      <TouchableOpacity
        style={styles.presetButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="list" size={18} color="#007AFF" />
        <Text style={styles.presetButtonText}>Presets</Text>
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Preset</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={presets}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.presetItem}
                  onPress={() => handlePresetSelect(item)}
                >
                  <Text style={styles.presetName}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999999" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  presetButtonText: {
    marginLeft: 6,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.8,
    maxHeight: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  presetName: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
});

export default PresetSelector; 