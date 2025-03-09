# Dolby.io Media API Integration Guide

This guide provides information on how to use the Dolby.io Media API integration in the BallTalk app for audio enhancement, mastering, and analysis.

## Overview

The BallTalk app uses Dolby.io Media APIs to provide professional-grade audio processing capabilities:

1. **Audio Enhancement**: Reduce noise and improve audio clarity
2. **Audio Mastering**: Apply professional mastering profiles to audio
3. **Audio Analysis**: Analyze audio metrics like loudness, dynamics, and spectral balance

## Setup

### Prerequisites

- Dolby.io account with Media API access
- API key and secret from Dolby.io dashboard

### Environment Variables

Add the following environment variables to your `.env` file:

```
EXPO_PUBLIC_DOLBY_API_KEY=your_dolby_api_key
EXPO_PUBLIC_DOLBY_API_SECRET=your_dolby_api_secret
```

For CI/CD, add these secrets to your GitHub repository:

- `DOLBY_API_KEY`
- `DOLBY_API_SECRET`

## Components

### AudioEnhancer

The `AudioEnhancer` component provides a complete UI for enhancing and mastering audio:

```jsx
import AudioEnhancer from '../components/audio/AudioEnhancer';

// In your component
<AudioEnhancer
  audioUri="path/to/audio.mp3"
  userId="user123"
  onEnhancementComplete={(enhancedAudioUri) => {
    console.log('Enhanced audio available at:', enhancedAudioUri);
  }}
  projectId="project123" // Optional
  trackId="track123" // Optional
/>
```

### AudioEnhancementOptions

The `AudioEnhancementOptions` component provides UI for configuring enhancement and mastering options:

```jsx
import AudioEnhancementOptions from '../components/audio/AudioEnhancementOptions';
import { DolbyMasteringOptions, DolbyEnhancementOptions } from '../services/audio/DolbyMasteringService';

// In your component
<AudioEnhancementOptions
  onMasteringOptionsChange={(options: DolbyMasteringOptions) => {
    console.log('Mastering options updated:', options);
  }}
  onEnhancementOptionsChange={(options: DolbyEnhancementOptions) => {
    console.log('Enhancement options updated:', options);
  }}
  initialMasteringOptions={{
    profile: 'balanced',
    outputFormat: 'mp3',
    stereoEnhancement: 'none',
    loudnessStandard: 'streaming',
    preserveMetadata: true
  }}
  initialEnhancementOptions={{
    noiseReduction: 'medium',
    outputFormat: 'mp3',
    preserveMetadata: true
  }}
/>
```

### AudioAnalysisVisualization

The `AudioAnalysisVisualization` component visualizes audio analysis metrics:

```jsx
import AudioAnalysisVisualization from '../components/audio/AudioAnalysisVisualization';

// In your component
<AudioAnalysisVisualization
  metrics={{
    loudness: -14,
    dynamics: 8,
    stereoWidth: 0.7,
    spectralBalance: {
      low: 0.3,
      mid: 0.4,
      high: 0.3
    },
    signalToNoiseRatio: 60, // Optional
    peakLevel: -1.2, // Optional
    truepeakLevel: -0.8, // Optional
    clippingPercentage: 0.01 // Optional
  }}
  title="Audio Analysis" // Optional
  showAdvancedMetrics={true} // Optional
/>
```

## Services

### DolbyMasteringService

The `DolbyMasteringService` provides methods for interacting with Dolby.io Media APIs:

```typescript
import DolbyMasteringService, {
  DolbyMasteringProfile,
  DolbyOutputFormat,
  DolbyStereoEnhancement,
  DolbyLoudnessStandard,
  DolbyNoiseReductionLevel
} from '../services/audio/DolbyMasteringService';

// Analyze audio
const analysisResult = await DolbyMasteringService.analyzeAudio(
  userId,
  audioFileUrl,
  projectId, // Optional
  trackId // Optional
);

// Master audio
const masteringOptions = {
  profile: DolbyMasteringProfile.BALANCED,
  outputFormat: DolbyOutputFormat.MP3,
  stereoEnhancement: DolbyStereoEnhancement.WIDEN,
  loudnessStandard: DolbyLoudnessStandard.STREAMING,
  preserveMetadata: true
};

const masteringResult = await DolbyMasteringService.masterAudio(
  userId,
  audioFileUrl,
  masteringOptions,
  projectId, // Optional
  trackId // Optional
);

// Enhance audio
const enhancementOptions = {
  noiseReduction: DolbyNoiseReductionLevel.MEDIUM,
  outputFormat: DolbyOutputFormat.MP3,
  preserveMetadata: true
};

const enhancementResult = await DolbyMasteringService.enhanceAudio(
  userId,
  audioFileUrl,
  enhancementOptions,
  projectId, // Optional
  trackId // Optional
);

// Get mastering results for a user
const results = await DolbyMasteringService.getMasteringResults(userId, 10);

// Get enhancement results for a user
const results = await DolbyMasteringService.getEnhancementResults(userId, 10);

// Upload audio for processing
const fileUrl = await DolbyMasteringService.uploadAudioForMastering(userId, localFilePath);
```

## Testing

### Unit Tests

Run unit tests for the Dolby.io integration:

```bash
npm run test:audio
```

### API Tests

Test the Dolby.io API integration:

```bash
npm run test:dolby
```

## CI/CD Integration

The CI/CD pipeline includes tests for the Dolby.io API integration. The workflow is defined in `.github/workflows/audio-processing-ci.yml`.

The workflow:

1. Runs linting on audio processing code
2. Runs unit tests for audio processing
3. Tests the Dolby.io API integration
4. Builds the audio processing module
5. Deploys the audio processing module to Firebase

## Troubleshooting

### API Errors

If you encounter errors with the Dolby.io API:

1. Check that your API key and secret are correct
2. Verify that your Dolby.io account has access to the Media API
3. Check the API usage limits in your Dolby.io dashboard
4. Look for error details in the console logs

### Audio Processing Issues

If audio processing is not working as expected:

1. Check that the audio file format is supported (MP3, WAV, AAC)
2. Verify that the audio file is not corrupted
3. Check that the audio file is not too large (max 100MB)
4. Try with different enhancement or mastering options

## Resources

- [Dolby.io Media API Documentation](https://docs.dolby.io/media-apis/docs)
- [Dolby.io Dashboard](https://dashboard.dolby.io)
- [BallTalk App Documentation](./README.md) 