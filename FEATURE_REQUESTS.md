## Feature: Audio Recording

**Description:** This feature enables users to create, manage, and collaborate on audio recordings. Users can create new recordings, listen to their recordings, record new tracks over existing songs, and collaborate with other users to build multi-track recordings. All recorded and uploaded songs will be stored in Firebase, ensuring persistence and accessibility. The `SongService` will facilitate the storage, retrieval, and management of the songs in firebase.

**User Stories:**

-   As a user, I want to create new audio recordings.
-   As a user, I want to play back my recorded songs.
-   As a user, I want to record new audio tracks over existing songs.
-   As a user, I want to collaborate with another user in recording tracks.
-   As a user, I want to see my recorded and uploaded songs in Firebase.

**Technical Details:**

-   The `SongService` class will be responsible for interacting with Firebase to store, retrieve, and manage songs.