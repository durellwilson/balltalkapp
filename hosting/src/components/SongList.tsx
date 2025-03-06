import React, { useState, useEffect } from 'react';
import { db } from '../../../src/lib/firebase'; // Import the Firestore instance
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Song {
  id: string;
  title: string;
  artistId: string; // Assuming you have artistId in your Song data
  fileUrl: string;
  coverArtUrl?: string;
  // Add other fields as needed
}

const SongList: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songsRef = collection(db, 'songs');
        // Modify the query as needed (e.g., add filtering, limiting)
        const q = query(songsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const songsData: Song[] = [];
        querySnapshot.forEach((doc) => {
          // Validate document data
          const data = doc.data();
          if (data.title && data.artistId && data.fileUrl) {
            songsData.push({
              id: doc.id,
              title: data.title,
              artistId: data.artistId,
              fileUrl: data.fileUrl,
              coverArtUrl: data.coverArtUrl,
              // Add other fields as needed
            });
          } else {
            console.warn('Skipping invalid song document:', doc.id, data);
          }
        });
        setSongs(songsData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch songs');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  if (loading) {
    return <div>Loading songs...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Songs</h2>
      {songs.length === 0 ? (
        <p>No songs found.</p>
      ) : (
        <ul>
          {songs.map((song) => (
            <li key={song.id}>
              <h3>{song.title}</h3>
              <p>Artist ID: {song.artistId}</p> {/* Display artistId for now */}
              {song.coverArtUrl && (
                <img src={song.coverArtUrl} alt={`Cover art for ${song.title}`} width="100" />
              )}
              {/* Add more song details here as needed */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SongList;
