import { useState, useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { MasteringParams, VocalParams, useAudioProcessor } from './useAudioProcessor';
import { 
  DolbyMasteringProfile, 
  DolbyOutputFormat,
  DolbyStereoEnhancement,
  DolbyLoudnessStandard,
  DolbyMasteringOptions
} from '../services/audio/DolbyMasteringService';
import { 
  DEFAULT_MASTERING_PRESETS, 
  MasteringPreset 
} from '../models/audio/OzoneModels';
import { 
  DEFAULT_VOCAL_PRESETS, 
  VocalPreset 
} from '../models/audio/NectarModels';

// Define the preset type
export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom hook for managing presets
 */
export function usePresetManager(userId: string) {
  const { audioEngine, processingMode } = useAudio();
  const { 
    masteringParams, 
    vocalParams, 
    updateMasteringParam, 
    updateVocalParam 
  } = useAudioProcessor();
  
  // State for presets
  const [masteringPresets, setMasteringPresets] = useState<Preset[]>([]);
  const [vocalPresets, setVocalPresets] = useState<Preset[]>([]);
  const [selectedMasteringPresetId, setSelectedMasteringPresetId] = useState<string | null>(null);
  const [selectedVocalPresetId, setSelectedVocalPresetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load presets
  useEffect(() => {
    loadPresets();
  }, [userId]);
  
  // Load presets from services
  const loadPresets = async () => {
    setIsLoading(true);
    
    try {
      // Load mastering presets
      const masteringService = audioEngine.getDolbyMasteringService();
      const masteringPresetsData = await masteringService.getPresets(userId);
      
      // Convert to common preset format
      const masteringPresetsFormatted = masteringPresetsData.map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        category: preset.category,
        isDefault: preset.isDefault,
        createdBy: preset.createdBy,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt
      }));
      
      setMasteringPresets(masteringPresetsFormatted);
      
      // Load vocal presets
      const vocalService = audioEngine.getVocalProcessingService();
      const vocalPresetsData = await vocalService.getPresets(userId);
      
      // Convert to common preset format
      const vocalPresetsFormatted = vocalPresetsData.map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        category: preset.category,
        isDefault: preset.isDefault,
        createdBy: preset.createdBy,
        createdAt: preset.createdAt,
        updatedAt: preset.updatedAt
      }));
      
      setVocalPresets(vocalPresetsFormatted);
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply a mastering preset
  const applyMasteringPreset = async (presetId: string) => {
    setIsLoading(true);
    
    try {
      // Find the preset in the default presets
      const defaultPreset = DEFAULT_MASTERING_PRESETS.find(p => p.id === presetId);
      
      if (defaultPreset) {
        // Apply the default preset
        applyDefaultMasteringPreset(defaultPreset);
      } else {
        // Load the preset from the service
        const masteringService = audioEngine.getDolbyMasteringService();
        const success = await masteringService.loadPreset(presetId);
        
        if (success) {
          // Update the selected preset ID
          setSelectedMasteringPresetId(presetId);
          
          // Update the mastering parameters based on the preset
          // This is a simplified implementation
          updateMasteringParam('profile', presetId);
        }
      }
    } catch (error) {
      console.error('Failed to apply mastering preset:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply a default mastering preset
  const applyDefaultMasteringPreset = (preset: MasteringPreset) => {
    // Update the selected preset ID
    setSelectedMasteringPresetId(preset.id);
    
    // Update the mastering parameters based on the preset
    updateMasteringParam('profile', preset.id);
    
    // Find the equalizer module in the preset
    const eqModule = preset.modules.find(m => m.moduleType === 'equalizer');
    
    if (eqModule) {
      // Update the EQ parameters
      // This is a simplified implementation
      updateMasteringParam('bassBoost', 2);
      updateMasteringParam('clarity', 50);
      updateMasteringParam('highBoost', 2);
    }
    
    // Find the maximizer module in the preset
    const maxModule = preset.modules.find(m => m.moduleType === 'maximizer');
    
    if (maxModule) {
      // Update the limiter parameters
      // This is a simplified implementation
      updateMasteringParam('limiterThreshold', -0.3);
    }
  };
  
  // Apply a vocal preset
  const applyVocalPreset = async (presetId: string) => {
    setIsLoading(true);
    
    try {
      // Find the preset in the default presets
      const defaultPreset = DEFAULT_VOCAL_PRESETS.find(p => p.id === presetId);
      
      if (defaultPreset) {
        // Apply the default preset
        applyDefaultVocalPreset(defaultPreset);
      } else {
        // Load the preset from the service
        const vocalService = audioEngine.getVocalProcessingService();
        const success = await vocalService.loadPreset(presetId);
        
        if (success) {
          // Update the selected preset ID
          setSelectedVocalPresetId(presetId);
          
          // Update the vocal parameters based on the preset
          // This is a simplified implementation
        }
      }
    } catch (error) {
      console.error('Failed to apply vocal preset:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply a default vocal preset
  const applyDefaultVocalPreset = (preset: VocalPreset) => {
    // Update the selected preset ID
    setSelectedVocalPresetId(preset.id);
    
    // Find the de-esser module in the preset
    const deEsserModule = preset.modules.find(m => m.moduleType === 'de_esser');
    
    if (deEsserModule) {
      // Update the de-esser parameters
      updateVocalParam('deEsser', 'enabled', true);
      updateVocalParam('deEsser', 'frequency', 7500);
      updateVocalParam('deEsser', 'threshold', -12);
      updateVocalParam('deEsser', 'reduction', 6);
    }
    
    // Find the EQ module in the preset
    const eqModule = preset.modules.find(m => m.moduleType === 'eq');
    
    if (eqModule) {
      // Update the EQ parameters
      updateVocalParam('eq', 'enabled', true);
      updateVocalParam('eq', 'lowCut', 100);
      updateVocalParam('eq', 'lowGain', -2);
      updateVocalParam('eq', 'midGain', 1);
      updateVocalParam('eq', 'highGain', 2);
      updateVocalParam('eq', 'presence', 3);
    }
    
    // Find the compressor module in the preset
    const compModule = preset.modules.find(m => m.moduleType === 'compressor');
    
    if (compModule) {
      // Update the compressor parameters
      updateVocalParam('compression', 'enabled', true);
      updateVocalParam('compression', 'threshold', -20);
      updateVocalParam('compression', 'ratio', 3);
      updateVocalParam('compression', 'attack', 10);
      updateVocalParam('compression', 'release', 100);
    }
    
    // Find the reverb module in the preset
    const reverbModule = preset.modules.find(m => m.moduleType === 'reverb');
    
    if (reverbModule) {
      // Update the reverb parameters
      updateVocalParam('reverb', 'enabled', true);
      updateVocalParam('reverb', 'amount', 20);
      updateVocalParam('reverb', 'size', 50);
      updateVocalParam('reverb', 'decay', 1.5);
    } else {
      // Disable reverb if not in the preset
      updateVocalParam('reverb', 'enabled', false);
    }
  };
  
  // Save the current settings as a preset
  const savePreset = async (
    name: string,
    description: string,
    category: string
  ): Promise<string | null> => {
    try {
      if (processingMode === 'local' || processingMode === 'dolby') {
        // Save mastering preset
        const masteringService = audioEngine.getDolbyMasteringService();
        const presetId = await masteringService.savePreset(
          userId,
          name,
          description,
          category as any
        );
        
        // Reload presets
        await loadPresets();
        
        return presetId;
      } else if (processingMode === 'vocal') {
        // Save vocal preset
        const vocalService = audioEngine.getVocalProcessingService();
        const presetId = await vocalService.savePreset(
          userId,
          name,
          description,
          category as any
        );
        
        // Reload presets
        await loadPresets();
        
        return presetId;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to save preset:', error);
      return null;
    }
  };
  
  // Get Dolby mastering options from current parameters
  const getDolbyMasteringOptions = (): DolbyMasteringOptions => {
    return {
      profile: masteringParams.profile as DolbyMasteringProfile,
      outputFormat: DolbyOutputFormat.WAV,
      stereoEnhancement: masteringParams.stereoWidth > 100 
        ? DolbyStereoEnhancement.WIDEN 
        : masteringParams.stereoWidth < 100 
          ? DolbyStereoEnhancement.TIGHTEN 
          : DolbyStereoEnhancement.NONE,
      loudnessStandard: DolbyLoudnessStandard.STREAMING,
      customLoudness: masteringParams.loudness,
      preserveMetadata: true
    };
  };
  
  return {
    masteringPresets,
    vocalPresets,
    selectedMasteringPresetId,
    selectedVocalPresetId,
    isLoading,
    applyMasteringPreset,
    applyVocalPreset,
    savePreset,
    loadPresets,
    getDolbyMasteringOptions
  };
} 