/**
 * MusicGenres.ts
 * 
 * A comprehensive list of music genres for use in autocomplete and genre selection.
 * Organized by popularity and with subgenres grouped under main genres.
 */

// Main genre categories
export const MAIN_GENRES = [
  'Hip Hop',
  'Pop',
  'R&B',
  'Rock',
  'Electronic',
  'Jazz',
  'Country',
  'Latin',
  'Classical',
  'Reggae',
  'Blues',
  'Folk',
  'Metal',
  'Indie',
  'Soul',
  'Funk',
  'Gospel',
  'World',
  'Alternative',
  'Other'
];

// Complete list of genres and subgenres
export const ALL_GENRES = [
  // Hip Hop
  'Hip Hop',
  'Trap',
  'Drill',
  'Boom Bap',
  'Conscious Hip Hop',
  'Mumble Rap',
  'Gangsta Rap',
  'Lo-fi Hip Hop',
  'Alternative Hip Hop',
  'Southern Hip Hop',
  'East Coast Hip Hop',
  'West Coast Hip Hop',
  'UK Hip Hop',
  'Instrumental Hip Hop',
  
  // Pop
  'Pop',
  'Synth Pop',
  'Dance Pop',
  'Electro Pop',
  'K-Pop',
  'J-Pop',
  'Teen Pop',
  'Indie Pop',
  'Art Pop',
  'Hyperpop',
  'Pop Rock',
  'Power Pop',
  'Bedroom Pop',
  
  // R&B
  'R&B',
  'Contemporary R&B',
  'Neo Soul',
  'Alternative R&B',
  'New Jack Swing',
  'Quiet Storm',
  'Soul',
  'Funk',
  
  // Rock
  'Rock',
  'Alternative Rock',
  'Indie Rock',
  'Classic Rock',
  'Hard Rock',
  'Punk Rock',
  'Psychedelic Rock',
  'Progressive Rock',
  'Garage Rock',
  'Grunge',
  'Post-Rock',
  'Shoegaze',
  'Soft Rock',
  
  // Electronic
  'Electronic',
  'House',
  'Techno',
  'Dubstep',
  'Drum & Bass',
  'Trance',
  'EDM',
  'Ambient',
  'IDM',
  'Electronica',
  'Downtempo',
  'Breakbeat',
  'UK Garage',
  'Future Bass',
  'Synthwave',
  'Hardstyle',
  
  // Jazz
  'Jazz',
  'Smooth Jazz',
  'Bebop',
  'Fusion',
  'Modal Jazz',
  'Free Jazz',
  'Big Band',
  'Cool Jazz',
  'Hard Bop',
  'Swing',
  
  // Country
  'Country',
  'Country Pop',
  'Country Rock',
  'Outlaw Country',
  'Bluegrass',
  'Alternative Country',
  'Contemporary Country',
  'Traditional Country',
  
  // Latin
  'Latin',
  'Reggaeton',
  'Latin Pop',
  'Salsa',
  'Bachata',
  'Merengue',
  'Latin Jazz',
  'Latin Rock',
  'Cumbia',
  'Bossa Nova',
  'Tango',
  
  // Classical
  'Classical',
  'Baroque',
  'Romantic',
  'Contemporary Classical',
  'Opera',
  'Chamber Music',
  'Orchestral',
  'Minimalist',
  'Neo-Classical',
  
  // Reggae
  'Reggae',
  'Dancehall',
  'Dub',
  'Roots Reggae',
  'Ska',
  'Rocksteady',
  
  // Blues
  'Blues',
  'Delta Blues',
  'Chicago Blues',
  'Electric Blues',
  'Jump Blues',
  'Blues Rock',
  
  // Folk
  'Folk',
  'Contemporary Folk',
  'Traditional Folk',
  'Folk Rock',
  'Americana',
  'Singer-Songwriter',
  
  // Metal
  'Metal',
  'Heavy Metal',
  'Thrash Metal',
  'Death Metal',
  'Black Metal',
  'Doom Metal',
  'Progressive Metal',
  'Nu Metal',
  'Metalcore',
  'Industrial Metal',
  
  // Indie
  'Indie',
  'Indie Rock',
  'Indie Pop',
  'Indie Folk',
  'Indie Electronic',
  
  // Soul
  'Soul',
  'Neo Soul',
  'Northern Soul',
  'Southern Soul',
  'Psychedelic Soul',
  
  // Funk
  'Funk',
  'P-Funk',
  'Funk Rock',
  'Electro-Funk',
  
  // Gospel
  'Gospel',
  'Contemporary Gospel',
  'Traditional Gospel',
  'Christian',
  'Worship',
  
  // World
  'World',
  'Afrobeat',
  'Afropop',
  'Amapiano',
  'K-Pop',
  'J-Pop',
  'Celtic',
  'Flamenco',
  'Bollywood',
  'Highlife',
  'Soca',
  'Calypso',
  
  // Alternative
  'Alternative',
  'Alternative Rock',
  'Alternative Hip Hop',
  'Alternative R&B',
  'Alternative Country',
  'Alternative Metal',
  
  // Other
  'Experimental',
  'Spoken Word',
  'Comedy',
  'Soundtrack',
  'New Age',
  'Meditation',
  'Children\'s Music'
];

// Function to detect genre from audio analysis or metadata
export const detectGenreFromAudio = (
  bpm: number,
  key: string,
  energy: number,
  instruments: string[]
): string[] => {
  // This is a placeholder implementation
  // In a real app, this would use machine learning or more sophisticated analysis
  const possibleGenres: string[] = [];
  
  // BPM-based detection
  if (bpm >= 85 && bpm <= 105) {
    possibleGenres.push('Hip Hop');
  }
  if (bpm >= 120 && bpm <= 130) {
    possibleGenres.push('Pop');
  }
  if (bpm >= 125 && bpm <= 140) {
    possibleGenres.push('House');
  }
  if (bpm >= 70 && bpm <= 90) {
    possibleGenres.push('R&B');
  }
  
  // Instrument-based detection
  if (instruments.includes('guitar') && instruments.includes('drums')) {
    possibleGenres.push('Rock');
  }
  if (instruments.includes('saxophone') || instruments.includes('trumpet')) {
    possibleGenres.push('Jazz');
  }
  if (instruments.includes('synth') && energy > 0.8) {
    possibleGenres.push('Electronic');
  }
  
  return possibleGenres.length > 0 ? possibleGenres : ['Other'];
};

// Function to filter genres based on search query
export const filterGenres = (query: string): string[] => {
  if (!query || query.trim() === '') {
    return MAIN_GENRES;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  return ALL_GENRES.filter(genre => 
    genre.toLowerCase().includes(normalizedQuery)
  );
};

export default {
  MAIN_GENRES,
  ALL_GENRES,
  detectGenreFromAudio,
  filterGenres
}; 