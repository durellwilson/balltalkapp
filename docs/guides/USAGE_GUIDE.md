# BallTalk App - Usage Guide

BallTalk is a React Native mobile app, built with Expo, that allows athletes to create, record, upload, and share music with fans. It also allows athletes to interact with their fans, and provides a secure space to communicate with other athletes. This guide will help you understand the app's features, navigation, and structure.

## Getting Started

This section will guide you through the authentication process and the different user roles.

### Authentication

The app has a complete authentication system with support for two types of users:

1. **Athletes** - Professional athletes who want to create and share music
2. **Fans** - Users who want to follow athletes and listen to their music

You can log in with the following demo accounts:


- **Athlete Account**: 
  - Email: athlete@example.com
  - Password: password123

- **Fan Account**:
  - Email: fan@example.com
  - Password: password123

Or you can create your own account by signing up, the sign up flow will allow you to choose between an Athlete account or a Fan account.

The authentication flow is handled by the root layout (`app/_layout.tsx`). It uses the `useAuth` hook to determine if a user is authenticated. If not, it redirects to the authentication screens (`app/(auth)/_layout.tsx`).

### Navigation Structure

The app uses Expo Router to handle the navigation, which allow us to have a modern navigation system.

*   **Root Layout (`app/_layout.tsx`):**
    *   Handles overall app layout.
    *   Manages authentication flow using the `useAuth` hook.
    *   Determines whether to show the authentication screens or the main app.
*   **Authentication (`(auth)`)**
    *   `app/(auth)/_layout.tsx`: Layout for authentication-related screens.
    *   Contains login and signup forms.
*   **Tabs (`(tabs)`)**
    *   `app/(tabs)/_layout.tsx`: Main tab navigation layout.
    *   Contains the following tabs:
        *   **Home (`index.tsx`)**:
            *   `app/(tabs)/index.tsx`: Displays the home screen content.
                *   Uses `Container` component.
                *   Uses `Text` component.
                *   Uses `Link` component.
        *   **Studio (`studio.tsx`)**:
            *   `app/(tabs)/studio.tsx`: Music creation and recording screen.
            *   Uses `DawService` for managing music-related actions.
            *   Uses `RecordingsList`, `MusicPlayer`, `Studio`, `NewRecording` components.
        *   **Profile**:
            *   `app/(tabs)/profile/[id].tsx`: Athlete's profile as viewed by other users (fans).
            *   Fetches athlete data based on the `id` parameter.
            *   Uses `ProfileLayout` for consistent profile screen structure.
            *   Uses `ProfileHeader`, `ProfileMusicSection`, and `ProfilePostSection`.
            *   `app/(tabs)/profile/index.tsx`: Athlete's own profile dashboard (for athletes).
            *   Uses `useAuth` and `useProfileData` hooks.
            *   Displays more information and features compared to the user view.
* **Admin (`(admin)`)**
    * `app/(admin)/_layout.tsx`:
    - Admin layout.
    - Uses nested navigation with `Slot`.


### Theming

The app uses a theming system defined in `components/Themed.tsx` and `constants/Colors.ts`. `Colors.ts` defines the color palette, and `Themed.tsx` provides themed versions of common components.

## Key Features

The app uses Expo Router with a tab-based navigation system:

- **Home** - Main dashboard showing trending songs and athletes
- **Studio** - Music creation and recording workspace (key feature)
- **Profile** - Manage your profile.

## Key Features

### Studio (Music Creation)

The Studio tab is the central feature where athletes can manage all their music creation tasks:

1. **Create Projects**: Each project can have multiple tracks (like a Digital Audio Workstation)
2. **Record Audio**: Record vocals or instruments on specific tracks
3. **Upload Audio**: Upload pre-recorded audio files to tracks


The core logic for the Music Studio is managed by the `DawService` (`services/DawService.ts`), it contains the logic to manage:
* Music projects
* Recordings
* Tracks
* etc

#### How to Record Music:

1.  Create a new project (or select an existing one)
2.  Select a track to record on
3.  Hit the "Start Recording" button and allow microphone access
4.  Record your audio
5.  Hit "Stop Recording" when finished
6.  Your recording will be saved and can be played back

### Song Upload and Sharing

Once a song is created in the Music Studio, athletes can upload and share it with their fans. This process involves:

*   **Components:**
    *   `app/(tabs)/studio.tsx`: (Music Studio) will be extended.
    *   `components/SongUploadForm.tsx`: A new form for uploading songs, selecting categories, setting schedules, and creating preview clips.
    *   `components/SongCard.tsx`: To display the song information in the athlete profile.


Here's how it works:

1. **Simple Upload Process:** Release music directly within the platform using a simple, high-quality upload process.
2. **Track Categorization:** Categorize tracks by genre, mood, and exclusivity levels to provide fans with a tailored listening experience.
3. **Scheduling Feature:** Plan and promote music releases in advance to build anticipation.
4. **Preview Clip Creation:** Create preview clips for social media sharing to attract new listeners.

### Athlete-Fan Interaction

This app provides the following features to allow athletes to interact with their fans:

Athletes can use the following options to interact with their fans:

1.  **Direct Messaging:** Communicate safely with followers and fans.
2.  **Message Request Approval**: Direct message requests to connect with athletes, subject to athlete approval for a secure interaction.
3. **Message Inbox:** A message inbox to manage all the interactions with the fans, including replies, thank you notes, etc.
4. **Chat Filters:** To help organize the conversations with the fans, by athlete, date, or topic.
2.  **Message Request Approvals:** Control who can reach out to you by approving message requests.
3.  **Group Messaging and Forums:** Participate in group messaging and forums within league categories to connect with other athletes and fans.
4.  **Athlete-Only Space:** Share music insights, career stories, and personal updates in a safe, athlete-only environment.

### Exclusive Platform and Safe Space for Athletes

This app provides an exclusive community where only verified athletes and select public figures can join, ensuring privacy and secure interactions.

1. **Dedicated Settings for Privacy Controls**: This lets athletes decide who can view their content and engage with their profiles.
2. **Community Guidelines and Moderation**: The community is moderated to maintain a respectful and supportive atmosphere.
3. **Athlete-to-Athlete Communication Options**: These options allow athletes to connect, collaborate, and interact with each other without outside interference.

#### How to Publish a Song:
1.  Complete the steps to record your music
2.  Add a title and genre
3.  Hit the "Start Recording" button and allow microphone access
4.  Record your audio
5.  Hit "Stop Recording" when finished
6.  Your recording will be saved and can be played back
7.  Add a title and genre, then click "Upload Song" to publish it

### User Profiles

Each user has a profile showing:

## Core Components

*   **Athlete Profile Card (User View) (`app/(tabs)/profile/[id].tsx`)**: Displays an athlete's profile to fans.
*   **Athlete Profile Card (Athlete Dashboard) (`app/(tabs)/profile/index.tsx`)**: Displays the athlete's own profile with more detailed information.
*   **Music Studio (`app/(tabs)/studio.tsx`)**: The music creation and recording workspace.
* **Home Screen (`app/(tabs)/index.tsx`)**: The home screen to navigate and discover new contents.


## Missing Features
* Podcast functionality
* Live streaming
* Video and music posting
* Reels-style short-form content
- For Athletes:
  - Profile information (name, sport, team)
  - Published songs and tracks
  - Follower metrics
  
- For Fans:
  - Profile information
  - Followed athletes
  - Favorite songs

### Authentication & User Types

The refactored system properly distinguishes between:

- **Athletes** who have additional capabilities like:
  - Creating and publishing music
  - Athlete verification
  - Special profile metrics
  
- **Fans** who can:
  - Follow athletes
  - Listen to music
  - Comment and interact

## Project Structure

The app now uses a cohesive structure following Expo Router conventions:

```
balltalkapp/
├── app/                  # Main application code (Expo Router)
│   ├── (auth)/           # Authentication screens
│   │   ├── login.tsx     # Login screen with demo accounts
│   │   ├── signup.tsx    # Signup with role selection (athlete/fan)
│   ├── (tabs)/           # Main tab navigation screens
│   │   ├── _layout.tsx   # Tab navigation configuration
│   │   ├── index.tsx     # Home screen
│   │   ├── studio.tsx    # Music creation studio
│   │   ├── community.tsx # Community screen
│   │   ├── chat.tsx      # Messaging screen
│   └── _layout.tsx       # Root layout with authentication
├── components/           # Reusable components
├── services/             # API services including DawService (music)
└── contexts/             # React contexts including AuthContext
```

## Testing the App

To fully test the app:

1. **Log in as a fan**:
   - Browse athletes
   - Follow some athletes
   - Listen to songs

2. **Log in as an athlete**:
   - Create a project in the Studio
   - Record some audio
   - Publish a song
   - Check that it appears on your profile

3. **Switch between accounts** to see how the experience differs

## Troubleshooting

- **Microphone Access**: When recording, you may need to grant microphone access in your browser or device settings
- **Authentication Issues**: If you encounter login problems, try a demo account first
- **Recording Not Working**: Check that your device has a working microphone and that you've granted the necessary permissions
