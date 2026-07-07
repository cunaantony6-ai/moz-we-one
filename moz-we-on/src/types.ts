export interface Comment {
  id: string;
  trackId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  timestamp: number; // in seconds (where in the song the comment was left)
  createdAt: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: 'Marrabenta' | 'Pandza' | 'Amapiano' | 'Kizomba' | 'Afro House' | 'Outro';
  description: string;
  audioUrl: string; // URL or synthetic audio type
  coverUrl: string;
  duration: number; // in seconds
  likesCount: number;
  playCount: number;
  uploadedBy: string;
  createdAt: string;
  waveform: number[]; // Array of amplitudes (e.g. 0 to 1) for the wave
  commentsCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'dj';
  text: string;
  timestamp: string;
  suggestedTracks?: string[]; // IDs of tracks suggested by the DJ
}

export interface PlayHistoryItem {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  genre: 'Marrabenta' | 'Pandza' | 'Amapiano' | 'Kizomba' | 'Afro House' | 'Outro';
  timestamp: number;
}

