import { v4 as uuidv4 } from 'uuid';
import { ProcessingModule } from '../AudioProcessingEngine';
import { EqualizerOptions, EqualizerBand, OzoneModuleType } from '../../../models/audio/OzoneModels';

/**
 * Equalizer Module
 * 
 * Implements a multi-band parametric equalizer inspired by iZotope Ozone's EQ module.
 * Supports different EQ modes, mid/side processing, and automatic gain compensation.
 */
export class EqualizerModule implements ProcessingModule {
  id: string;
  name: string = 'Equalizer';
  type: string = OzoneModuleType.EQUALIZER;
  isInitialized: boolean = false;
  isEnabled: boolean = true;
  
  // Audio nodes
  inputNode: GainNode | null = null;
  outputNode: GainNode | null = null;
  
  // EQ parameters
  private options: EqualizerOptions;
  private filterNodes: Map<string, BiquadFilterNode> = new Map();
  private midSideNodes: {
    splitter: ChannelSplitterNode | null;
    merger: ChannelMergerNode | null;
    midInput: GainNode | null;
    sideInput: GainNode | null;
    midOutput: GainNode | null;
    sideOutput: GainNode | null;
  } = {
    splitter: null,
    merger: null,
    midInput: null,
    sideInput: null,
    midOutput: null,
    sideOutput: null
  };
  
  // Auto gain compensation
  private autoGainNode: GainNode | null = null;
  private calculatedAutoGain: number = 0;
  
  /**
   * Constructor
   * @param options Equalizer options
   */
  constructor(options: EqualizerOptions) {
    this.id = options.id || uuidv4();
    this.options = { ...options };
    this.isEnabled = options.isEnabled;
  }
  
  /**
   * Initialize the module with an audio context
   * @param audioContext The audio context to use
   */
  initialize(audioContext: AudioContext): void {
    if (this.isInitialized) {
      return;
    }
    
    // Create input and output nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    
    // Create auto gain node
    this.autoGainNode = audioContext.createGain();
    this.autoGainNode.gain.value = 1.0;
    
    // Set up the processing chain based on the mode
    if (this.options.enableMidSide) {
      this.setupMidSideProcessing(audioContext);
    } else {
      this.setupStereoProcessing(audioContext);
    }
    
    // Calculate auto gain if enabled
    if (this.options.autoGainEnabled) {
      this.calculateAutoGain();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Set up stereo processing
   * @param audioContext The audio context to use
   */
  private setupStereoProcessing(audioContext: AudioContext): void {
    if (!this.inputNode || !this.outputNode || !this.autoGainNode) {
      return;
    }
    
    // Clear any existing filter nodes
    this.filterNodes.clear();
    
    // Create filter nodes for each band
    let previousNode: AudioNode = this.inputNode;
    
    for (const band of this.options.bands) {
      if (!band.isEnabled) {
        continue;
      }
      
      const filterNode = this.createFilterNode(audioContext, band);
      this.filterNodes.set(band.id, filterNode);
      
      // Connect the previous node to this filter
      previousNode.connect(filterNode);
      previousNode = filterNode;
    }
    
    // Connect the last node to the auto gain node
    previousNode.connect(this.autoGainNode);
    
    // Connect the auto gain node to the output
    this.autoGainNode.connect(this.outputNode);
  }
  
  /**
   * Set up mid/side processing
   * @param audioContext The audio context to use
   */
  private setupMidSideProcessing(audioContext: AudioContext): void {
    if (!this.inputNode || !this.outputNode || !this.autoGainNode) {
      return;
    }
    
    // Clear any existing filter nodes
    this.filterNodes.clear();
    
    // Create mid/side processing nodes
    this.midSideNodes.splitter = audioContext.createChannelSplitter(2);
    this.midSideNodes.merger = audioContext.createChannelMerger(2);
    this.midSideNodes.midInput = audioContext.createGain();
    this.midSideNodes.sideInput = audioContext.createGain();
    this.midSideNodes.midOutput = audioContext.createGain();
    this.midSideNodes.sideOutput = audioContext.createGain();
    
    // Connect input to splitter
    this.inputNode.connect(this.midSideNodes.splitter);
    
    // Connect splitter to mid/side inputs (matrix encoding)
    // Mid = (Left + Right) / 2
    // Side = (Left - Right) / 2
    this.midSideNodes.splitter.connect(this.midSideNodes.midInput, 0);
    this.midSideNodes.splitter.connect(this.midSideNodes.midInput, 1);
    this.midSideNodes.midInput.gain.value = 0.5;
    
    this.midSideNodes.splitter.connect(this.midSideNodes.sideInput, 0);
    this.midSideNodes.splitter.connect(this.midSideNodes.sideInput, 1);
    this.midSideNodes.sideInput.gain.value = 0.5;
    
    // Create filter chains for mid and side
    let previousMidNode: AudioNode = this.midSideNodes.midInput;
    let previousSideNode: AudioNode = this.midSideNodes.sideInput;
    
    for (const band of this.options.bands) {
      if (!band.isEnabled) {
        continue;
      }
      
      if (band.processingMode === 'mid' || band.processingMode === 'stereo') {
        const midFilterNode = this.createFilterNode(audioContext, band);
        this.filterNodes.set(`mid_${band.id}`, midFilterNode);
        
        previousMidNode.connect(midFilterNode);
        previousMidNode = midFilterNode;
      }
      
      if (band.processingMode === 'side' || band.processingMode === 'stereo') {
        const sideFilterNode = this.createFilterNode(audioContext, band);
        this.filterNodes.set(`side_${band.id}`, sideFilterNode);
        
        previousSideNode.connect(sideFilterNode);
        previousSideNode = sideFilterNode;
      }
    }
    
    // Connect mid/side chains to outputs
    previousMidNode.connect(this.midSideNodes.midOutput);
    previousSideNode.connect(this.midSideNodes.sideOutput);
    
    // Connect mid/side outputs to merger (matrix decoding)
    // Left = Mid + Side
    // Right = Mid - Side
    this.midSideNodes.midOutput.connect(this.midSideNodes.merger, 0, 0);
    this.midSideNodes.midOutput.connect(this.midSideNodes.merger, 0, 1);
    this.midSideNodes.sideOutput.connect(this.midSideNodes.merger, 0, 0);
    this.midSideNodes.sideOutput.connect(this.midSideNodes.merger, 0, 1);
    this.midSideNodes.sideOutput.gain.value = -1;
    
    // Connect merger to auto gain node
    this.midSideNodes.merger.connect(this.autoGainNode);
    
    // Connect auto gain node to output
    this.autoGainNode.connect(this.outputNode);
  }
  
  /**
   * Create a filter node for a band
   * @param audioContext The audio context to use
   * @param band The band to create a filter for
   * @returns The created filter node
   */
  private createFilterNode(audioContext: AudioContext, band: EqualizerBand): BiquadFilterNode {
    const filterNode = audioContext.createBiquadFilter();
    
    // Set filter parameters
    filterNode.frequency.value = band.frequency;
    filterNode.gain.value = band.gain;
    filterNode.Q.value = band.q;
    
    // Set filter type
    switch (band.type) {
      case 'bell':
        filterNode.type = 'peaking';
        break;
      case 'lowshelf':
        filterNode.type = 'lowshelf';
        break;
      case 'highshelf':
        filterNode.type = 'highshelf';
        break;
      case 'lowpass':
        filterNode.type = 'lowpass';
        break;
      case 'highpass':
        filterNode.type = 'highpass';
        break;
      case 'notch':
        filterNode.type = 'notch';
        break;
      default:
        filterNode.type = 'peaking';
    }
    
    // Apply EQ mode characteristics
    this.applyEQModeCharacteristics(filterNode);
    
    return filterNode;
  }
  
  /**
   * Apply EQ mode characteristics to a filter node
   * @param filterNode The filter node to modify
   */
  private applyEQModeCharacteristics(filterNode: BiquadFilterNode): void {
    // Different EQ modes would have different characteristics
    // This is a simplified implementation
    switch (this.options.eqMode) {
      case 'analog':
        // Analog EQ typically has a wider Q and more phase shift
        filterNode.Q.value = filterNode.Q.value * 0.8;
        break;
      case 'vintage':
        // Vintage EQ might have more harmonic coloration
        // In a real implementation, this would involve more complex processing
        filterNode.Q.value = filterNode.Q.value * 0.7;
        break;
      case 'baxandall':
        // Baxandall EQ has a specific shape for shelving filters
        if (filterNode.type === 'lowshelf' || filterNode.type === 'highshelf') {
          filterNode.Q.value = 0.5;
        }
        break;
      case 'digital':
      default:
        // Digital EQ is the default, no modifications needed
        break;
    }
  }
  
  /**
   * Calculate auto gain compensation
   */
  private calculateAutoGain(): void {
    if (!this.autoGainNode) {
      return;
    }
    
    // This is a simplified auto gain calculation
    // In a real implementation, this would involve analyzing the frequency response
    
    // Sum the absolute gain values of all enabled bands
    let totalGain = 0;
    for (const band of this.options.bands) {
      if (band.isEnabled) {
        totalGain += Math.abs(band.gain);
      }
    }
    
    // Calculate a compensation factor
    // This is a very simplified approach - a real implementation would be more sophisticated
    const compensationFactor = -totalGain * 0.1;
    
    // Apply the compensation
    this.calculatedAutoGain = compensationFactor;
    this.autoGainNode.gain.value = Math.pow(10, compensationFactor / 20); // Convert dB to linear gain
  }
  
  /**
   * Bypass the module
   * @param bypass Whether to bypass the module
   */
  bypass(bypass: boolean): void {
    this.isEnabled = !bypass;
    
    if (!this.inputNode || !this.outputNode) {
      return;
    }
    
    // Disconnect all nodes
    this.inputNode.disconnect();
    
    if (bypass) {
      // Connect input directly to output
      this.inputNode.connect(this.outputNode);
    } else {
      // Reconnect the processing chain
      if (this.options.enableMidSide) {
        this.setupMidSideProcessing(this.inputNode.context as AudioContext);
      } else {
        this.setupStereoProcessing(this.inputNode.context as AudioContext);
      }
    }
  }
  
  /**
   * Get the module parameters
   * @returns The module parameters
   */
  getParameters(): Record<string, any> {
    return {
      ...this.options,
      calculatedAutoGain: this.calculatedAutoGain
    };
  }
  
  /**
   * Set the module parameters
   * @param parameters The parameters to set
   */
  setParameters(parameters: Partial<EqualizerOptions>): void {
    // Update the options
    this.options = {
      ...this.options,
      ...parameters
    };
    
    // If the module is initialized, update the processing chain
    if (this.isInitialized && this.inputNode) {
      const audioContext = this.inputNode.context as AudioContext;
      
      // Disconnect all nodes
      this.inputNode.disconnect();
      
      // Reconnect with new parameters
      if (this.options.enableMidSide) {
        this.setupMidSideProcessing(audioContext);
      } else {
        this.setupStereoProcessing(audioContext);
      }
      
      // Recalculate auto gain if enabled
      if (this.options.autoGainEnabled) {
        this.calculateAutoGain();
      } else if (this.autoGainNode) {
        this.autoGainNode.gain.value = 1.0;
      }
    }
  }
  
  /**
   * Update a specific band
   * @param bandId The ID of the band to update
   * @param parameters The parameters to update
   */
  updateBand(bandId: string, parameters: Partial<EqualizerBand>): void {
    // Find the band
    const bandIndex = this.options.bands.findIndex(band => band.id === bandId);
    
    if (bandIndex === -1) {
      return;
    }
    
    // Update the band
    this.options.bands[bandIndex] = {
      ...this.options.bands[bandIndex],
      ...parameters
    };
    
    // If the module is initialized, update the filter node
    if (this.isInitialized && this.inputNode) {
      const audioContext = this.inputNode.context as AudioContext;
      const band = this.options.bands[bandIndex];
      
      // Get the filter node
      let filterNode: BiquadFilterNode | undefined;
      
      if (this.options.enableMidSide) {
        if (band.processingMode === 'mid' || band.processingMode === 'stereo') {
          filterNode = this.filterNodes.get(`mid_${bandId}`);
        }
        
        if (band.processingMode === 'side' || band.processingMode === 'stereo') {
          filterNode = this.filterNodes.get(`side_${bandId}`);
        }
      } else {
        filterNode = this.filterNodes.get(bandId);
      }
      
      if (filterNode) {
        // Update filter parameters
        filterNode.frequency.value = band.frequency;
        filterNode.gain.value = band.gain;
        filterNode.Q.value = band.q;
        
        // Update filter type
        switch (band.type) {
          case 'bell':
            filterNode.type = 'peaking';
            break;
          case 'lowshelf':
            filterNode.type = 'lowshelf';
            break;
          case 'highshelf':
            filterNode.type = 'highshelf';
            break;
          case 'lowpass':
            filterNode.type = 'lowpass';
            break;
          case 'highpass':
            filterNode.type = 'highpass';
            break;
          case 'notch':
            filterNode.type = 'notch';
            break;
          default:
            filterNode.type = 'peaking';
        }
        
        // Apply EQ mode characteristics
        this.applyEQModeCharacteristics(filterNode);
      }
      
      // Recalculate auto gain if enabled
      if (this.options.autoGainEnabled) {
        this.calculateAutoGain();
      }
    }
  }
  
  /**
   * Add a new band
   * @param band The band to add
   */
  addBand(band: Omit<EqualizerBand, 'id'>): string {
    const id = uuidv4();
    const newBand: EqualizerBand = {
      ...band,
      id
    };
    
    // Add the band to the options
    this.options.bands.push(newBand);
    
    // If the module is initialized, update the processing chain
    if (this.isInitialized && this.inputNode) {
      const audioContext = this.inputNode.context as AudioContext;
      
      // Disconnect all nodes
      this.inputNode.disconnect();
      
      // Reconnect with new parameters
      if (this.options.enableMidSide) {
        this.setupMidSideProcessing(audioContext);
      } else {
        this.setupStereoProcessing(audioContext);
      }
      
      // Recalculate auto gain if enabled
      if (this.options.autoGainEnabled) {
        this.calculateAutoGain();
      }
    }
    
    return id;
  }
  
  /**
   * Remove a band
   * @param bandId The ID of the band to remove
   */
  removeBand(bandId: string): void {
    // Find the band
    const bandIndex = this.options.bands.findIndex(band => band.id === bandId);
    
    if (bandIndex === -1) {
      return;
    }
    
    // Remove the band from the options
    this.options.bands.splice(bandIndex, 1);
    
    // If the module is initialized, update the processing chain
    if (this.isInitialized && this.inputNode) {
      const audioContext = this.inputNode.context as AudioContext;
      
      // Disconnect all nodes
      this.inputNode.disconnect();
      
      // Reconnect with new parameters
      if (this.options.enableMidSide) {
        this.setupMidSideProcessing(audioContext);
      } else {
        this.setupStereoProcessing(audioContext);
      }
      
      // Recalculate auto gain if enabled
      if (this.options.autoGainEnabled) {
        this.calculateAutoGain();
      }
    }
  }
  
  /**
   * Clone the module for offline processing
   * @param offlineContext The offline audio context to use
   * @returns A clone of the module
   */
  cloneForOfflineProcessing(offlineContext: OfflineAudioContext): ProcessingModule {
    const clone = new EqualizerModule(this.options);
    clone.initialize(offlineContext as unknown as AudioContext);
    return clone;
  }
} 