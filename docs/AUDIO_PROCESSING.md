# Audio Processing Features

This document provides an overview of the audio processing features in the BallTalk app, including vocal isolation and batch processing.

## Table of Contents

- [Overview](#overview)
- [Vocal Isolation](#vocal-isolation)
  - [VocalIsolationService](#vocalisolationservice)
  - [VocalIsolator Component](#vocalisolator-component)
  - [Usage](#usage)
- [Batch Processing](#batch-processing)
  - [BatchProcessingService](#batchprocessingservice)
  - [BatchProcessor Component](#batchprocessor-component)
  - [Usage](#usage-1)
- [Testing](#testing)
- [Mock Implementations](#mock-implementations)

## Overview

The BallTalk app includes advanced audio processing features powered by the Dolby.io Media API. These features allow users to enhance their audio recordings, isolate vocals from instrumentals, and process multiple audio files at once.

## Vocal Isolation

Vocal isolation is a feature that allows users to separate vocals from instrumentals in their audio files. This is useful for creating karaoke tracks, isolating vocals for remixing, or removing vocals to create instrumental versions of songs.

### VocalIsolationService

The `VocalIsolationService` is responsible for handling the vocal isolation process. It provides the following functionality:

- Isolating vocals from audio files using the Dolby.io Media API
- Saving isolation results to Firestore
- Retrieving isolation results from Firestore

The service supports three isolation modes:

1. **Vocals Only**: Extracts only the vocals from the audio file
2. **Instrumental Only**: Extracts only the instrumental parts from the audio file
3. **Separate Tracks**: Extracts both vocals and instrumentals as separate tracks

### VocalIsolator Component

The `VocalIsolator` component provides a user interface for the vocal isolation feature. It allows users to:

- Select an isolation mode
- Choose an output format
- Isolate vocals from an audio file
- Play and compare the original, vocals, and instrumental tracks
- View quality metrics for the isolation result

### Usage

To use the vocal isolation feature in your code:

```typescript
import VocalIsolationService, { VocalIsolationMode } from '../services/audio/VocalIsolationService';
import { DolbyOutputFormat } from '../services/audio/DolbyMasteringService';

// Isolate vocals from an audio file
const result = await VocalIsolationService.isolateVocals(
  userId,
  audioFileUrl,
  {
    mode: VocalIsolationMode.SEPARATE_TRACKS,
    outputFormat: DolbyOutputFormat.MP3,
    preserveMetadata: true
  }
);

// Get isolation results for a user
const results = await VocalIsolationService.getVocalIsolationResults(userId);

// Get a specific isolation result
const result = await VocalIsolationService.getVocalIsolationResult(resultId);
```

To use the `VocalIsolator` component in your UI:

```tsx
import VocalIsolator from '../components/audio/VocalIsolator';

// In your component
return (
  <VocalIsolator
    audioUri={audioUri}
    userId={userId}
    onIsolationComplete={(result) => {
      console.log('Isolation completed:', result);
    }}
  />
);
```

## Batch Processing

Batch processing allows users to process multiple audio files at once. This is useful for enhancing, mastering, analyzing, or isolating vocals from multiple files in a single operation.

### BatchProcessingService

The `BatchProcessingService` is responsible for handling batch processing jobs. It provides the following functionality:

- Creating batch jobs for different types of audio processing
- Starting, cancelling, and retrying batch jobs
- Tracking job progress and status
- Saving job results to Firestore
- Retrieving job results from Firestore

The service supports four job types:

1. **Enhancement**: Enhances audio files using the Dolby.io Media API
2. **Mastering**: Masters audio files using the Dolby.io Media API
3. **Vocal Isolation**: Isolates vocals from audio files using the Dolby.io Media API
4. **Analysis**: Analyzes audio files using the Dolby.io Media API

### BatchProcessor Component

The `BatchProcessor` component provides a user interface for the batch processing feature. It allows users to:

- Select a job type
- Configure job options
- Select multiple audio files
- Start, cancel, and retry batch jobs
- View job progress and status
- View job results

### Usage

To use the batch processing feature in your code:

```typescript
import BatchProcessingService, { BatchJobType } from '../services/audio/BatchProcessingService';
import { DolbyOutputFormat } from '../services/audio/DolbyMasteringService';

// Create a batch job for enhancement
const job = await BatchProcessingService.createBatchJob(
  userId,
  BatchJobType.ENHANCEMENT,
  audioUris,
  audioNames,
  {
    noiseReduction: 0.5,
    outputFormat: DolbyOutputFormat.MP3,
    preserveMetadata: true
  }
);

// Start a batch job
const startedJob = await BatchProcessingService.startBatchJob(job.id);

// Cancel a batch job
const cancelledJob = await BatchProcessingService.cancelBatchJob(job.id);

// Get batch jobs for a user
const jobs = await BatchProcessingService.getBatchJobs(userId);

// Get a specific batch job
const job = await BatchProcessingService.getBatchJob(jobId);

// Get batch job items
const items = await BatchProcessingService.getBatchJobItems(jobId);

// Retry a failed batch job item
const retriedJob = await BatchProcessingService.retryBatchJobItem(jobId, itemId);
```

To use the `BatchProcessor` component in your UI:

```tsx
import BatchProcessor from '../components/audio/BatchProcessor';

// In your component
return (
  <BatchProcessor
    userId={userId}
    onJobComplete={(job) => {
      console.log('Job completed:', job);
    }}
  />
);
```

## Testing

The app includes test scripts for both vocal isolation and batch processing features. These scripts can be run using the following commands:

```bash
# Test vocal isolation
npm run test:vocal-isolation

# Test batch processing
npm run test:batch-processing
```

The test scripts create mock implementations of the services and test their functionality without relying on the actual Dolby.io Media API.

## Mock Implementations

Both the `VocalIsolationService` and `BatchProcessingService` include mock implementations for testing purposes. These mock implementations simulate the behavior of the actual services without making API calls to the Dolby.io Media API.

To use the mock implementations, set the `USE_MOCK_IMPLEMENTATION` constant to `true` in the respective service files:

```typescript
// In VocalIsolationService.ts
const USE_MOCK_IMPLEMENTATION = true;

// In BatchProcessingService.ts
const USE_MOCK_IMPLEMENTATION = true;
```

The mock implementations are useful for:

- Testing the app without API credentials
- Developing and testing UI components without making actual API calls
- Running automated tests in CI/CD pipelines
- Demonstrating the app's functionality in presentations or demos 