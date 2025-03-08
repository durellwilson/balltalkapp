# BallTalk Offline Mode and Background Sync

This document provides an overview of the offline mode and background sync functionality in the BallTalk app.

## Overview

BallTalk now supports offline-first architecture that allows athletes to record, edit, and queue uploads even without an internet connection. When connectivity is restored, the app automatically syncs pending changes with Firebase.

## Features

- **Offline Recording**: Record audio even when offline
- **Offline Uploads**: Queue uploads when offline, which will be processed when connectivity is restored
- **Background Sync**: Automatically sync pending uploads in the background
- **Pending Uploads Management**: View and manage pending uploads
- **Network Status Indicator**: Visual indicator of network status and pending uploads

## Architecture

The offline mode and background sync functionality is built on the following components:

### 1. OfflineStorageService

This service manages the local storage of audio files and pending uploads. It provides the following functionality:

- Save audio files to local storage
- Queue uploads for processing
- Retrieve pending uploads
- Remove completed uploads
- Track upload attempts

### 2. SyncService

This service manages the synchronization of pending uploads with Firebase. It provides the following functionality:

- Initialize background sync
- Monitor network connectivity
- Process pending uploads when connectivity is restored
- Queue new uploads

### 3. useOfflineUpload Hook

This custom hook provides a simple interface for components to interact with the offline upload functionality. It provides the following:

- Queue uploads
- Get pending uploads count
- Check if online
- Check if syncing
- Manually trigger sync

### 4. NetworkStatusIndicator Component

This component provides a visual indicator of network status and pending uploads. It shows:

- Current network status (online/offline)
- Number of pending uploads
- Option to manually trigger sync

## Usage

### Recording and Uploading Audio Offline

1. Navigate to the Audio Upload screen
2. Record or select an audio file
3. Click "Upload"
4. The app will queue the upload and save it locally
5. When connectivity is restored, the app will automatically upload the file

### Viewing Pending Uploads

1. Navigate to the Pending Uploads screen
2. View a list of pending uploads
3. See details such as file name, size, creation time, and upload attempts
4. Manually trigger sync if needed

### Manually Triggering Sync

1. Navigate to the Pending Uploads screen
2. Click "Sync All" to manually trigger sync
3. The app will attempt to upload all pending files

## Technical Details

### Local Storage

Audio files are stored in the app's document directory in an `offline_audio` folder. Metadata about pending uploads is stored in AsyncStorage under the key `BALLTALK_PENDING_UPLOADS`.

### Background Sync

Background sync is implemented using the `react-native-background-fetch` library, which allows the app to periodically sync pending uploads even when the app is in the background.

### Network Monitoring

Network connectivity is monitored using the `@react-native-community/netinfo` library. When connectivity is restored, the app automatically attempts to sync pending uploads.

### Retry Logic

Failed uploads are retried with an exponential backoff strategy. After 5 failed attempts, the upload is marked as failed and will not be automatically retried.

## Troubleshooting

### Pending Uploads Not Syncing

1. Check if you have an internet connection
2. Navigate to the Pending Uploads screen
3. Pull down to refresh the list
4. Click "Sync All" to manually trigger sync

### Failed Uploads

1. Navigate to the Pending Uploads screen
2. Look for uploads marked as "Failed"
3. These uploads have failed 5 times and will not be automatically retried
4. You can try to upload the file again manually

## Future Improvements

- Add ability to edit metadata of pending uploads
- Add ability to cancel pending uploads
- Add ability to retry failed uploads
- Add ability to prioritize certain uploads
- Add ability to schedule uploads for specific times
- Add ability to limit uploads to Wi-Fi only 