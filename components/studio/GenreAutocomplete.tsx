import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MAIN_GENRES, ALL_GENRES, filterGenres } from '../../constants/MusicGenres';
import { useTheme } from '../../hooks/useTheme';
import Colors from '@/constants/Colors';

interface GenreAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onDetectGenre?: () => void;
  detectedGenres?: string[];
  isDetecting?: boolean;
  placeholder?: string;
  style?: any;
}

/**
 * GenreAutocomplete Component
 * 
 * A modern, professional genre selection component with autocomplete
 * and genre detection capabilities.
 * 
 * @param {string} value - Current genre value
 * @param {function} onChangeText - Callback when genre changes
 * @param {function} onDetectGenre - Callback to trigger genre detection
 * @param {string[]} detectedGenres - List of detected genres from audio analysis
 * @param {boolean} isDetecting - Whether genre detection is in progress
 * @param {string} placeholder - Placeholder text for input
 * @param {object} style - Additional styles
 * @returns {React.ReactElement} The GenreAutocomplete component
 */
const GenreAutocomplete: React.FC<GenreAutocompleteProps> = ({
  value,
  onChangeText,
  onDetectGenre,
  detectedGenres = [],
  isDetecting = false,
  placeholder = 'Enter or select a genre',
  style
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const suggestionsHeight = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme();
  
  // Update suggestions when query changes
  useEffect(() => {
    if (query.trim() === '') {
      setSuggestions(MAIN_GENRES);
    } else {
      setSuggestions(filterGenres(query));
    }
  }, [query]);
  
  // Update local query when value changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);
  
  // Handle focus/blur animations
  useEffect(() => {
    Animated.timing(suggestionsHeight, {
      toValue: isFocused ? 200 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused, suggestionsHeight]);
  
  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };
  
  // Handle selecting a genre from suggestions
  const handleSelectGenre = (genre: string) => {
    setQuery(genre);
    onChangeText(genre);
    setIsFocused(false);
    inputRef.current?.blur();
  };
  
  // Handle text input changes
  const handleChangeText = (text: string) => {
    setQuery(text);
    onChangeText(text);
  };
  
  // Handle genre detection
  const handleDetectGenre = () => {
    if (onDetectGenre) {
      onDetectGenre();
    }
  };
  
  // Render a suggestion item
  const renderSuggestionItem = ({ item }: { item: string }) => {
    const isSelected = item === value;
    
    return (
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          isDark && styles.suggestionItemDark,
          isSelected && styles.selectedSuggestionItem,
          isSelected && isDark && styles.selectedSuggestionItemDark
        ]}
        onPress={() => handleSelectGenre(item)}
      >
        <Text
          style={[
            styles.suggestionText,
            isDark && styles.suggestionTextDark,
            isSelected && styles.selectedSuggestionText
          ]}
        >
          {item}
        </Text>
        {isSelected && (
          <Ionicons
            name="checkmark"
            size={18}
            color={isDark ? Colors.PRIMARY : Colors.PRIMARY}
          />
        )}
      </TouchableOpacity>
    );
  };
  
  // Render detected genres
  const renderDetectedGenres = () => {
    if (!detectedGenres || detectedGenres.length === 0) return null;
    
    return (
      <View style={styles.detectedGenresContainer}>
        <Text style={[styles.detectedGenresTitle, isDark && styles.textLight]}>
          Detected Genres:
        </Text>
        <View style={styles.detectedGenresList}>
          {detectedGenres.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[styles.detectedGenreChip, isDark && styles.detectedGenreChipDark]}
              onPress={() => handleSelectGenre(genre)}
            >
              <Text style={[styles.detectedGenreText, isDark && styles.textLight]}>
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, isDark && styles.inputDark]}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#999' : '#999'}
        />
        
        {query ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              handleChangeText('');
              inputRef.current?.focus();
            }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? '#999' : '#666'}
            />
          </TouchableOpacity>
        ) : null}
        
        {onDetectGenre && (
          <TouchableOpacity
            style={[styles.detectButton, isDetecting && styles.detectingButton]}
            onPress={handleDetectGenre}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons
                name="music-note"
                size={20}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Detected genres */}
      {renderDetectedGenres()}
      
      {/* Suggestions dropdown */}
      <Animated.View
        style={[
          styles.suggestionsContainer,
          isDark && styles.suggestionsContainerDark,
          { height: suggestionsHeight }
        ]}
      >
        {isFocused && (
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          />
        )}
      </Animated.View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputContainerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#444',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#000',
  },
  inputDark: {
    color: '#fff',
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  detectButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 6,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectingButton: {
    backgroundColor: Colors.SECONDARY,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsContainerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#444',
  },
  suggestionsList: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  suggestionItemDark: {
    borderBottomColor: '#444',
  },
  selectedSuggestionItem: {
    backgroundColor: Colors.PRIMARY + '20',
  },
  selectedSuggestionItemDark: {
    backgroundColor: Colors.PRIMARY + '40',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  suggestionTextDark: {
    color: '#fff',
  },
  selectedSuggestionText: {
    fontWeight: '500',
    color: Colors.PRIMARY,
  },
  detectedGenresContainer: {
    marginTop: 8,
  },
  detectedGenresTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  detectedGenresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detectedGenreChip: {
    backgroundColor: Colors.PRIMARY + '20',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.PRIMARY + '40',
  },
  detectedGenreChipDark: {
    backgroundColor: Colors.PRIMARY + '40',
  },
  detectedGenreText: {
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  textLight: {
    color: '#fff',
  },
});

export default GenreAutocomplete; 