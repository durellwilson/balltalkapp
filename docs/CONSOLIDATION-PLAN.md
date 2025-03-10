# BallTalk App Consolidation Plan

Based on the analysis of duplicate files between `/screens` and `/app` directories, here's a detailed plan for consolidation.

## Files to Consolidate

### Studio Features
1. **Audio Mastering**
   - Keep: `/app/studio/mastering.tsx`
   - Remove: `/screens/AudioMasteringScreen.tsx`
   - Update imports and references

2. **Studio Main**
   - Keep: `/app/studio/index.tsx`
   - Remove: `/screens/StudioScreen.tsx`
   - Update imports and references

3. **Batch Processing**
   - Keep: `/app/batch-processing.tsx` (move to `/app/studio/batch.tsx`)
   - Remove: `/screens/BatchProcessingScreen.tsx`
   - Update imports and references

4. **Dolby Demo**
   - Keep: `/app/dolby-demo.tsx` (move to `/app/studio/dolby.tsx`)
   - Remove: `/screens/DolbyDemoScreen.tsx`
   - Update imports and references

### Chat Features
1. **Chat Main**
   - Keep: `/app/(tabs)/chat.tsx`
   - Remove: `/screens/chat/ChatScreen.tsx`
   - Update imports and references

2. **Conversation**
   - Keep: `/app/chat/[id].tsx` (create if not exists)
   - Remove: `/screens/chat/ConversationScreen.tsx`
   - Update imports and references

3. **New Conversation**
   - Keep: `/app/chat/new.tsx`
   - Remove: `/screens/chat/NewConversationScreen.tsx`
   - Update imports and references

4. **New Group Chat**
   - Keep: `/app/chat/new-group.tsx` (create if not exists)
   - Remove: `/screens/chat/NewGroupChatScreen.tsx`
   - Update imports and references

### Auth Features
1. **Login**
   - Keep: `/app/(auth)/login.tsx`
   - Remove: `/screens/auth/LoginScreen.tsx`
   - Update imports and references

### Test Screens
1. **Test Screen**
   - Keep: `/app/test-component.tsx`
   - Remove: `/screens/TestScreen.tsx`
   - Update imports and references

## Component Extraction

For each screen, extract reusable components to the `/components` directory:

1. **Audio Components**
   - Move player, recorder, waveform components to `/components/audio/`

2. **Studio Components**
   - Move processing forms, options to `/components/studio/`

3. **Chat Components**
   - Move message list, chat bubbles to `/components/chat/`

4. **Auth Components**
   - Move login forms, verification to `/components/auth/`

## Implementation Steps

1. **Step 1: Consolidate Tab Navigation**
   - Ensure the 4 main tabs work correctly
   - Remove hidden tabs

2. **Step 2: Consolidate Studio Features**
   - Move all studio features to `/app/studio/`
   - Extract reusable components

3. **Step 3: Consolidate Chat Features**
   - Move all chat features to `/app/chat/`
   - Extract reusable components

4. **Step 4: Consolidate Auth Features**
   - Move all auth features to `/app/(auth)/`
   - Extract reusable components

5. **Step 5: Clean Up**
   - Remove unused files
   - Update imports and references
   - Test all features

## Testing Plan

After each consolidation step:

1. Test navigation between screens
2. Test all features on each screen
3. Verify no console errors
4. Verify UI renders correctly 