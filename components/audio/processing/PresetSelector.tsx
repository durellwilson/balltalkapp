import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput, 
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useAudioProcessing, PresetCategory } from '../../../contexts/AudioProcessingContext';
import { MaterialIcons } from '@expo/vector-icons';

interface PresetSelectorProps {
  showSaveOption?: boolean;
}

export default function PresetSelector({ showSaveOption = true }: PresetSelectorProps) {
  const { state, loadPreset, savePreset } = useAudioProcessing();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory>('Custom');
  
  const categories: PresetCategory[] = ['Master', 'Vocal', 'Instrument', 'Custom'];
  
  const filterPresetsByCategory = (category: PresetCategory) => {
    return state.presets.filter(preset => preset.category === category);
  };
  
  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      savePreset(newPresetName.trim(), selectedCategory);
      setNewPresetName('');
      setShowSaveModal(false);
    }
  };
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Presets</Text>
        {showSaveOption && (
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={() => setShowSaveModal(true)}
          >
            <MaterialIcons name="save" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.categoriesContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={styles.categoryTab}
            onPress={() => {}}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <FlatList
        data={state.presets}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.presetItem, 
              state.activePresetId === item.id && styles.activePresetItem
            ]}
            onPress={() => loadPreset(item.id)}
          >
            <Text style={[
              styles.presetName,
              state.activePresetId === item.id && styles.activePresetText
            ]}>
              {item.name}
            </Text>
            <Text style={styles.presetCategory}>{item.category}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.presetList}
      />
      
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Save Preset</Text>
              
              <TextInput 
                style={styles.input}
                placeholder="Preset Name"
                value={newPresetName}
                onChangeText={setNewPresetName}
                autoFocus
              />
              
              <Text style={styles.categoryLabel}>Category:</Text>
              <View style={styles.categoryButtons}>
                {categories.map(category => (
                  <TouchableOpacity 
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.selectedCategoryButton
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === category && styles.selectedCategoryButtonText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowSaveModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.savePresetButton,
                    !newPresetName.trim() && styles.disabledButton
                  ]} 
                  onPress={handleSavePreset}
                  disabled={!newPresetName.trim()}
                >
                  <Text style={styles.savePresetButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  categoryText: {
    fontWeight: '500',
  },
  presetList: {
    paddingVertical: 8,
  },
  presetItem: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activePresetItem: {
    backgroundColor: '#2196F3',
  },
  presetName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activePresetText: {
    color: '#ffffff',
  },
  presetCategory: {
    fontSize: 12,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#2196F3',
  },
  categoryButtonText: {
    color: '#333333',
  },
  selectedCategoryButtonText: {
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666666',
  },
  savePresetButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  savePresetButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
}); 