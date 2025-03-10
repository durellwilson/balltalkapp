# Codebase Consolidation Report

## Potential Duplicates

- `.env` and `config/env/.env` (1.00 similarity)
- `.env` and `config/env/.env.emulator` (0.88 similarity)
- `.env` and `config/env/.env.example` (0.91 similarity)
- `config/env/.env` and `config/env/.env.emulator` (0.88 similarity)
- `config/env/.env` and `config/env/.env.example` (0.91 similarity)
- `config/env/.env.emulator` and `config/env/.env.example` (0.80 similarity)
- `.firebaserc` and `firebase/config/.firebaserc` (1.00 similarity)
- `config/README.md` and `docs/README.md` (0.76 similarity)
- `config/README.md` and `firebase/README.md` (0.92 similarity)
- `config/README.md` and `hosting/README.md` (0.95 similarity)
- `docs/README.md` and `firebase/README.md` (0.83 similarity)
- `docs/README.md` and `hosting/README.md` (0.80 similarity)
- `firebase/README.md` and `hosting/README.md` (0.97 similarity)
- `config/firebase.ts` and `src/lib/firebase.ts` (0.71 similarity)
- `firebase/config/firebase.json` and `firebase.json` (1.00 similarity)
- `__tests__/components/AudioEffectsPanel.test.tsx` and `components/audio/processing/__tests__/AudioEffectsPanel.test.tsx` (0.86 similarity)
- `__tests__/snapshots/UIComponents.test.js` and `__tests__/snapshots/UIComponents.test.tsx` (0.85 similarity)
- `app/(tabs)/_layout.tsx` and `app/_layout.tsx` (0.95 similarity)
- `app/(auth)/index.tsx` and `index.js` (0.82 similarity)
- `app/(tabs)/index.tsx` and `app/chat/index.tsx` (0.78 similarity)
- `app/chat/index.tsx` and `app/songs/index.tsx` (0.76 similarity)
- `app/index.tsx` and `components/index.ts` (0.82 similarity)
- `app/index.tsx` and `index.html` (0.78 similarity)
- `components/index.ts` and `index.html` (0.96 similarity)
- `components/layout/index.ts` and `components/profile/index.ts` (0.92 similarity)
- `components/layout/index.ts` and `hosting/index.html` (0.90 similarity)
- `components/profile/index.ts` and `hosting/index.html` (0.98 similarity)
- `components/themed/index.ts` and `hosting/src/index.css` (0.96 similarity)
- `hosting/src/index.css` and `index.html` (0.70 similarity)
- `assets/favicon.png` and `assets/images/favicon.png` (1.00 similarity)
- `components/ErrorBoundary.tsx` and `components/common/ErrorBoundary.tsx` (0.98 similarity)
- `components/audio/BasicRecorder.tsx` and `components/audio/recorder/BasicRecorder.tsx` (0.97 similarity)
- `docs/DAW_STUDIO_GUIDE.md` and `docs/guides/DAW_STUDIO_GUIDE.md` (0.81 similarity)
- `firebase/config/firestore.rules` and `firestore.rules` (1.00 similarity)
- `firebase/config/storage.rules` and `services/firebase/storage.ts` (0.86 similarity)
- `firebase/config/storage.rules` and `storage.rules` (1.00 similarity)
- `services/firebase/storage.ts` and `storage.rules` (0.86 similarity)
- `services/AudioProcessingService.ts` and `services/audio/AudioProcessingService.ts` (0.73 similarity)

## Components to Move

- `__tests__/hooks/useNetworkStatus.test.tsx` to `components/useNetworkStatus.test.tsx`
- `__tests__/integration/AudioRecordingFlow.test.tsx` to `components/AudioRecordingFlow.test.tsx`
- `__tests__/integration/AuthenticationFlow.test.js` to `components/AuthenticationFlow.test.js`
- `__tests__/recording/RecordingContext.test.tsx` to `components/RecordingContext.test.tsx`
- `__tests__/snapshots/UIComponents.test.js` to `components/UIComponents.test.js`
- `__tests__/snapshots/UIComponents.test.tsx` to `components/UIComponents.test.tsx`
- `app/(auth)/fan-hub.tsx` to `components/fan-hub.tsx`
- `app/(auth)/signup.tsx` to `components/signup.tsx`
- `app/(tabs)/admin-verification.tsx` to `components/admin-verification.tsx`
- `app/(tabs)/athletes.tsx` to `components/athletes.tsx`
- `app/(tabs)/community.tsx` to `components/community.tsx`
- `app/(tabs)/discover.tsx` to `components/discover.tsx`
- `app/(tabs)/index.tsx` to `components/index.tsx`
- `app/(tabs)/podcasts.tsx` to `components/podcasts.tsx`
- `app/(tabs)/profile/[id].tsx` to `components/[id].tsx`
- `app/(tabs)/profile.tsx` to `components/profile.tsx`
- `app/(tabs)/recordings.tsx` to `components/recordings.tsx`
- `app/(tabs)/shared-tracks.tsx` to `components/shared-tracks.tsx`
- `app/(tabs)/songs.tsx` to `components/songs.tsx`
- `app/(tabs)/testing.tsx` to `components/testing.tsx`
- `app/(tabs)/verification-test.tsx` to `components/verification-test.tsx`
- `app/_layout.tsx` to `components/_layout.tsx`
- `app/chat/[id].tsx` to `components/[id].tsx`
- `app/chat/index.tsx` to `components/index.tsx`
- `app/chat/new.tsx` to `components/new.tsx`
- `app/debug.tsx` to `components/debug.tsx`
- `app/index.tsx` to `components/index.tsx`
- `app/profile-default.tsx` to `components/profile-default.tsx`
- `contexts/AudioContext.tsx` to `components/AudioContext.tsx`
- `contexts/AudioProcessingContext.tsx` to `components/AudioProcessingContext.tsx`
- `contexts/NetworkContext.tsx` to `components/NetworkContext.tsx`
- `contexts/OfflineContext.tsx` to `components/OfflineContext.tsx`
- `contexts/RecordingContext.tsx` to `components/RecordingContext.tsx`
- `contexts/auth.tsx` to `components/auth.tsx`
- `services/AuthService.ts` to `components/AuthService.ts`

## Screens to Migrate

- `screens/AudioMasteringScreen.tsx` to `app/audio-mastering.tsx`
- `screens/AudioUploadScreen.tsx` to `app/audio-upload.tsx`
- `screens/BatchProcessingScreen.tsx` to `app/batch-processing.tsx`
- `screens/DolbyDemoScreen.tsx` to `app/dolby-demo.tsx`
- `screens/PendingUploadsScreen.tsx` to `app/pending-uploads.tsx`
- `screens/SaveProcessedAudioScreen.tsx` to `app/save-processed-audio.tsx`
- `screens/SharedTracksScreen.tsx` to `app/shared-tracks.tsx`
- `screens/SongDetailScreen.tsx` to `app/song-detail.tsx`
- `screens/StudioScreen.tsx` to `app/studio.tsx`
- `screens/TestScreen.tsx` to `app/test.tsx`
- `screens/VocalIsolationScreen.tsx` to `app/vocal-isolation.tsx`
- `screens/auth/LoginScreen.tsx` to `app/login.tsx`
- `screens/chat/AddGroupMembersScreen.tsx` to `app/add-group-members.tsx`
- `screens/chat/ChatScreen.tsx` to `app/chat.tsx`
- `screens/chat/ConversationScreen.tsx` to `app/conversation.tsx`
- `screens/chat/CreatePremiumGroupScreen.tsx` to `app/create-premium-group.tsx`
- `screens/chat/NewConversationScreen.tsx` to `app/new-conversation.tsx`
- `screens/chat/NewGroupChatScreen.tsx` to `app/new-group-chat.tsx`
- `screens/chat/PremiumGroupsScreen.tsx` to `app/premium-groups.tsx`
- `screens/payment/SubscriptionScreen.tsx` to `app/subscription.tsx`

## Legacy Directories

- `src/components/CollaboratorList.tsx`
- `src/interfaces/User.ts`
- `src/lib/firebase.ts`
- `src/lib/polyfills.js`
- `src/lib/supabase.ts`
- `pages/api/create.ts`

## Next Steps

1. Review potential duplicates and decide which ones to keep.
2. Move reusable components to the components directory.
3. Migrate screens to the app directory using the migrate-screen script.
4. Update imports in all files to point to the new locations.
5. Test the application to ensure everything works correctly.
6. Remove legacy directories once all files have been migrated.

## How to Use

### To migrate a screen:

```
npm run migrate-screen screens/ScreenName.tsx app/screen-name.tsx
```

### To extract a component:

```
npm run extract-component path/to/source.tsx ComponentName components/category
```

### To update this report:

```
npm run consolidate -- --update-report
```
