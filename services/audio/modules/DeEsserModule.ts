import { v4 as uuidv4 } from 'uuid';
import { ProcessingModule } from '../AudioProcessingEngine';
import { DeEsserOptions, NectarModuleType } from '../../../models/audio/NectarModels';

/**
 * De-Esser Module
 * 
 * Implements a de-esser for vocal processing inspired by iZotope Nectar's De-Esser module.
 * Supports broadband and multiband modes for sibilance reduction.
 */
export class DeEsserModule implements ProcessingModule {
  id: string;
  name: string = 'De-Esser';
  type: string = NectarModuleType.DE_ESSER;
  isInitialized: boolean = false;
  isEnabled: boolean = true;
  
  // Audio nodes
  inputNode: GainNode | null = null;
  outputNode: GainNode | null = null;
  
  // De-esser parameters
  private options: DeEsserOptions;
  
  // Processing nodes
  private detectorFilterNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private dryNode: GainNode | null = null;
  private wetNode: GainNode | null = null;
  private listenNode: GainNode | null = null;
  
  // Multiband processing nodes
  private lowpassFilterNode: BiquadFilterNode | null = null;
  private highpassFilterNode: BiquadFilterNode | null = null;
  private bandSplitterNode: BiquadFilterNode | null = null;
  private bandMergerNode: GainNode | null = null;
  
  /**
   * Constructor
   * @param options De-esser options
   */
  constructor(options: DeEsserOptions) {
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
    
    // Create dry/wet nodes
    this.dryNode = audioContext.createGain();
    this.wetNode = audioContext.createGain();
    this.listenNode = audioContext.createGain();
    
    // Set up the processing chain based on the mode
    if (this.options.mode === 'broadband') {
      this.setupBroadbandProcessing(audioContext);
    } else {
      this.setupMultibandProcessing(audioContext);
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Set up broadband processing
   * @param audioContext The audio context to use
   */
  private setupBroadbandProcessing(audioContext: AudioContext): void {
    if (!this.inputNode || !this.outputNode || !this.dryNode || !this.wetNode || !this.listenNode) {
      return;
    }
    
    // Create detector filter (to focus on sibilance frequencies)
    this.detectorFilterNode = audioContext.createBiquadFilter();
    this.detectorFilterNode.type = 'peaking';
    this.detectorFilterNode.frequency.value = this.options.frequency;
    this.detectorFilterNode.Q.value = 1.0;
    this.detectorFilterNode.gain.value = 12; // Boost sibilance for detection
    
    // Create compressor (to reduce sibilance)
    this.compressorNode = audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = this.options.threshold;
    this.compressorNode.ratio.value = 10; // High ratio for de-essing
    this.compressorNode.attack.value = this.options.attack / 1000; // Convert ms to seconds
    this.compressorNode.release.value = this.options.release / 1000; // Convert ms to seconds
    this.compressorNode.knee.value = 1;
    
    // Connect input to dry node (unprocessed signal)
    this.inputNode.connect(this.dryNode);
    
    // Connect input to detector filter
    this.inputNode.connect(this.detectorFilterNode);
    
    // Connect detector filter to compressor
    this.detectorFilterNode.connect(this.compressorNode);
    
    // Connect input to compressor's input (for processing the full signal)
    this.inputNode.connect(this.compressorNode);
    
    // Connect compressor to wet node (processed signal)
    this.compressorNode.connect(this.wetNode);
    
    // Connect detector filter to listen node (for monitoring sibilance)
    this.detectorFilterNode.connect(this.listenNode);
    
    // Set up dry/wet mix
    this.dryNode.gain.value = 1.0;
    this.wetNode.gain.value = 0.0; // Will be inverted from dry
    
    // Set up listen mode
    if (this.options.listenMode) {
      this.listenNode.gain.value = 1.0;
      this.dryNode.gain.value = 0.0;
      this.wetNode.gain.value = 0.0;
    } else {
      this.listenNode.gain.value = 0.0;
    }
    
    // Connect dry, wet, and listen nodes to output
    this.dryNode.connect(this.outputNode);
    this.wetNode.connect(this.outputNode);
    this.listenNode.connect(this.outputNode);
  }
  
  /**
   * Set up multiband processing
   * @param audioContext The audio context to use
   */
  private setupMultibandProcessing(audioContext: AudioContext): void {
    if (!this.inputNode || !this.outputNode || !this.dryNode || !this.wetNode || !this.listenNode) {
      return;
    }
    
    // Create band splitter (to separate high frequencies for processing)
    this.bandSplitterNode = audioContext.createBiquadFilter();
    this.bandSplitterNode.type = 'highpass';
    this.bandSplitterNode.frequency.value = this.options.frequency;
    this.bandSplitterNode.Q.value = 0.7;
    
    // Create lowpass filter (for low frequencies that bypass processing)
    this.lowpassFilterNode = audioContext.createBiquadFilter();
    this.lowpassFilterNode.type = 'lowpass';
    this.lowpassFilterNode.frequency.value = this.options.frequency;
    this.lowpassFilterNode.Q.value = 0.7;
    
    // Create detector filter (to focus on sibilance frequencies)
    this.detectorFilterNode = audioContext.createBiquadFilter();
    this.detectorFilterNode.type = 'peaking';
    this.detectorFilterNode.frequency.value = this.options.frequency + 1000; // Focus higher in the band
    this.detectorFilterNode.Q.value = 1.0;
    this.detectorFilterNode.gain.value = 12; // Boost sibilance for detection
    
    // Create compressor (to reduce sibilance)
    this.compressorNode = audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.value = this.options.threshold;
    this.compressorNode.ratio.value = 10; // High ratio for de-essing
    this.compressorNode.attack.value = this.options.attack / 1000; // Convert ms to seconds
    this.compressorNode.release.value = this.options.release / 1000; // Convert ms to seconds
    this.compressorNode.knee.value = 1;
    
    // Create band merger (to combine processed high frequencies with unprocessed low frequencies)
    this.bandMergerNode = audioContext.createGain();
    
    // Connect input to dry node (unprocessed signal)
    this.inputNode.connect(this.dryNode);
    
    // Connect input to band splitter
    this.inputNode.connect(this.bandSplitterNode);
    
    // Connect input to lowpass filter (for low frequencies)
    this.inputNode.connect(this.lowpassFilterNode);
    
    // Connect lowpass filter to band merger
    this.lowpassFilterNode.connect(this.bandMergerNode);
    
    // Connect band splitter to detector filter
    this.bandSplitterNode.connect(this.detectorFilterNode);
    
    // Connect detector filter to compressor
    this.detectorFilterNode.connect(this.compressorNode);
    
    // Connect band splitter to compressor's input (for processing high frequencies)
    this.bandSplitterNode.connect(this.compressorNode);
    
    // Connect compressor to band merger
    this.compressorNode.connect(this.bandMergerNode);
    
    // Connect band merger to wet node
    this.bandMergerNode.connect(this.wetNode);
    
    // Connect detector filter to listen node (for monitoring sibilance)
    this.detectorFilterNode.connect(this.listenNode);
    
    // Set up dry/wet mix
    this.dryNode.gain.value = 1.0;
    this.wetNode.gain.value = 0.0; // Will be inverted from dry
    
    // Set up listen mode
    if (this.options.listenMode) {
      this.listenNode.gain.value = 1.0;
      this.dryNode.gain.value = 0.0;
      this.wetNode.gain.value = 0.0;
    } else {
      this.listenNode.gain.value = 0.0;
    }
    
    // Connect dry, wet, and listen nodes to output
    this.dryNode.connect(this.outputNode);
    this.wetNode.connect(this.outputNode);
    this.listenNode.connect(this.outputNode);
  }
  
  /**
   * Update the range (amount of reduction)
   * @param range The range in dB
   */
  private updateRange(range: number): void {
    if (!this.dryNode || !this.wetNode) {
      return;
    }
    
    // Calculate dry/wet mix based on range
    // Range is in dB, so convert to linear gain
    const wetGain = Math.min(1.0, range / 24); // Normalize to 0-1 range (24dB max)
    const dryGain = 1.0 - wetGain;
    
    // Apply the gains
    this.dryNode.gain.value = dryGain;
    this.wetNode.gain.value = wetGain;
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
      if (this.options.mode === 'broadband') {
        this.setupBroadbandProcessing(this.inputNode.context as AudioContext);
      } else {
        this.setupMultibandProcessing(this.inputNode.context as AudioContext);
      }
    }
  }
  
  /**
   * Get the module parameters
   * @returns The module parameters
   */
  getParameters(): Record<string, any> {
    return {
      ...this.options
    };
  }
  
  /**
   * Set the module parameters
   * @param parameters The parameters to set
   */
  setParameters(parameters: Partial<DeEsserOptions>): void {
    // Check if mode is changing
    const modeChanged = parameters.mode !== undefined && parameters.mode !== this.options.mode;
    
    // Update the options
    this.options = {
      ...this.options,
      ...parameters
    };
    
    // If the module is initialized, update the processing chain
    if (this.isInitialized && this.inputNode) {
      const audioContext = this.inputNode.context as AudioContext;
      
      if (modeChanged) {
        // If the mode changed, rebuild the entire processing chain
        this.inputNode.disconnect();
        
        if (this.options.mode === 'broadband') {
          this.setupBroadbandProcessing(audioContext);
        } else {
          this.setupMultibandProcessing(audioContext);
        }
      } else {
        // Otherwise, just update the parameters
        if (this.detectorFilterNode) {
          this.detectorFilterNode.frequency.value = this.options.frequency;
        }
        
        if (this.compressorNode) {
          this.compressorNode.threshold.value = this.options.threshold;
          this.compressorNode.attack.value = this.options.attack / 1000;
          this.compressorNode.release.value = this.options.release / 1000;
        }
        
        if (this.bandSplitterNode) {
          this.bandSplitterNode.frequency.value = this.options.frequency;
        }
        
        if (this.lowpassFilterNode) {
          this.lowpassFilterNode.frequency.value = this.options.frequency;
        }
        
        // Update range
        this.updateRange(this.options.range);
        
        // Update listen mode
        if (this.listenNode && this.dryNode && this.wetNode) {
          if (this.options.listenMode) {
            this.listenNode.gain.value = 1.0;
            this.dryNode.gain.value = 0.0;
            this.wetNode.gain.value = 0.0;
          } else {
            this.listenNode.gain.value = 0.0;
            this.updateRange(this.options.range);
          }
        }
      }
    }
  }
  
  /**
   * Clone the module for offline processing
   * @param offlineContext The offline audio context to use
   * @returns A clone of the module
   */
  cloneForOfflineProcessing(offlineContext: OfflineAudioContext): ProcessingModule {
    const clone = new DeEsserModule(this.options);
    clone.initialize(offlineContext as unknown as AudioContext);
    return clone;
  }
} 