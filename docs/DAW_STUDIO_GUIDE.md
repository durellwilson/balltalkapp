# DAW Studio Guide

This guide provides comprehensive instructions for using the Digital Audio Workstation (DAW) studio in the BallTalk app. The DAW studio allows you to create, record, and manage music projects.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a New Project](#creating-a-new-project)
3. [Adding Tracks](#adding-tracks)
4. [Recording Audio](#recording-audio)
5. [Uploading Audio Files](#uploading-audio-files)
6. [Playing and Mixing](#playing-and-mixing)
7. [Collaboration](#collaboration)
8. [Exporting and Publishing](#exporting-and-publishing)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari) or the BallTalk mobile app
- Microphone access for recording
- Firebase account configured (for developers)

### Accessing the Studio

1. Open the BallTalk app
2. Navigate to the Studio tab
3. If you're a first-time user, you'll be prompted to create a new project

## Creating a New Project

1. Click on the "New Project" button
2. Enter a name for your project
3. Set the tempo (BPM) if needed
4. Click "Create" to start your new project

## Adding Tracks

Each project can have multiple tracks for different instruments or vocals.

1. In your project, click the "Add Track" button
2. Enter a name for the track (e.g., "Vocals", "Beat", "Guitar")
3. Select the track type (Audio, MIDI, etc.)
4. Click "Add" to create the track

## Recording Audio

### Microphone Setup

1. Ensure your microphone is connected and working
2. Grant microphone permissions when prompted
3. Test your microphone by speaking and checking the input level meter

### Recording Process

1. Select the track you want to record on
2. Click the "Record" button (red circle)
3. After a countdown, recording will begin
4. Perform your audio (sing, rap, play an instrument)
5. Click "Stop" when finished
6. The recording will be saved to your track

### Recording Tips

- Use headphones to prevent feedback
- Record in a quiet environment
- Maintain a consistent distance from the microphone
- Do multiple takes if needed

## Uploading Audio Files

If you have pre-recorded audio files, you can upload them directly:

1. Select the track you want to add audio to
2. Click the "Upload" button
3. Select an audio file from your device
   - Supported formats: MP3, WAV, M4A, OGG, AAC, FLAC
   - Maximum file size: 50MB
4. Preview the audio if needed
5. Click "Upload" to add the file to your track

## Playing and Mixing

### Playback Controls

- Play/Pause: Start or pause playback
- Stop: Stop playback and return to the beginning
- Loop: Toggle looping for the current section
- Metronome: Toggle the metronome on/off

### Mixing Tools

- Volume: Adjust the volume level for each track
- Pan: Position the track in the stereo field (left/right)
- Mute: Temporarily silence a track
- Solo: Listen to only the selected track

## Collaboration

The DAW studio supports real-time collaboration with other users:

1. Click the "Collaborate" button in your project
2. Enter the email address of the collaborator
3. Set their permission level (View, Edit, Admin)
4. Click "Invite" to send the invitation

Collaborators can:
- View and listen to the project
- Record new tracks (if they have Edit permissions)
- Upload audio files (if they have Edit permissions)
- Mix the project (if they have Edit permissions)

## Exporting and Publishing

### Exporting Your Project

1. Click the "Export" button
2. Choose the export format (MP3, WAV, etc.)
3. Select the quality settings
4. Click "Export" to download the file

### Publishing to BallTalk

1. Click the "Publish" button
2. Fill in the track details:
   - Title
   - Description
   - Genre
   - Cover art (optional)
   - Tags (optional)
3. Choose visibility (Public, Private, Unlisted)
4. Click "Publish" to share your track

## Troubleshooting

### Common Issues

#### Microphone Not Working

- Check browser permissions
- Ensure the correct microphone is selected
- Restart the browser or app

#### Audio Playback Issues

- Check your device volume
- Ensure audio output is correctly set
- Try using headphones

#### Upload Failures

- Check your internet connection
- Ensure the file is in a supported format
- Verify the file size is under 50MB

### Getting Help

If you encounter issues not covered in this guide:

1. Check the FAQ section in the app
2. Contact support through the Help menu
3. Visit the BallTalk community forum

---

## For Developers

### Testing the DAW Studio

We provide a test script to verify that the DAW studio is properly configured:

```bash
# Run the test script
./scripts/test-daw.js
```

This script checks:
- Firebase configuration
- Required services implementation
- TypeScript errors

### Key Files

- `services/DawService.ts`: Core functionality for the DAW
- `services/AudioStorageService.ts`: Audio file storage and management
- `components/studio/StudioInterface.tsx`: Main UI component
- `components/studio/AudioFileUploader.tsx`: File upload component

### Extending the DAW

To add new features to the DAW:

1. Implement the feature in the appropriate service
2. Update the UI components to expose the feature
3. Add tests for the new functionality
4. Document the feature in this guide 