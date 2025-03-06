import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface Beat {
  id: string;
  name: string;
  genre: string;
  url: string; // For now, we'll just use a string URL. Later, this could be a Firebase Storage URL.
}

const mockBeats: Beat[] = [
  {
    id: 'beat-1',
    name: 'Hip Hop Beat 1',
    genre: 'Hip Hop',
    url: 'mock-beat-1.mp3',
  },
  {
    id: 'beat-2',
    name: 'Trap Beat 1',
    genre: 'Trap',
    url: 'mock-beat-2.mp3',
  },
  {
    id: 'beat-3',
    name: 'R&B Beat 1',
    genre: 'R&B',
    url: 'mock-beat-3.mp3',
  },
  {
    id: 'beat-4',
    name: 'Pop Beat 1',
    genre: 'Pop',
    url: 'mock-beat-4.mp3',
  }
];

interface BeatLibraryProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectBeat: (beat: Beat) => void;
}

const BeatLibrary: React.FC<BeatLibraryProps> = ({
  isVisible,
  onClose,
  onSelectBeat,
}) => {
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);

  const renderItem = ({ item }: { item: Beat }) => (
    <TouchableOpacity
      style={[
        styles.beatItem,
        selectedBeat?.id === item.id && styles.selectedBeatItem,
      ]}
      onPress={() => {
        setSelectedBeat(item);
      }}
    >
      <View style={styles.beatInfo}>
        <Text style={styles.beatName}>{item.name}</Text>
        <Text style={styles.beatGenre}>{item.genre}</Text>
      </View>
      {selectedBeat?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Beat Library</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={mockBeats}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.beatList}
          />

          <TouchableOpacity
            style={[
              styles.selectButton,
              !selectedBeat && styles.disabledButton,
            ]}
            onPress={() => {
              if (selectedBeat) {
                onSelectBeat(selectedBeat);
              }
            }}
            disabled={!selectedBeat}
          >
            <Text style={styles.selectButtonText}>
              Select Beat
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  beatList: {
    marginBottom: 20,
  },
  beatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedBeatItem: {
    backgroundColor: '#f0f0f0',
  },
  beatInfo: {
    flex: 1,
  },
  beatName: {
    fontSize: 16,
    color: '#333',
  },
  beatGenre: {
    fontSize: 14,
    color: '#666',
  },
  selectButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  selectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BeatLibrary;
