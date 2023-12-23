export interface Song {
  fileUrl: string;
  metadata: {
    id: string | null;
    title: string;
    author: string;
    coverUrl: string;
  };
}

export interface PlaybackSettings {
  playbackRate: number;
  reverbWet: number;
  reverbDecay: number;
  reverbPreDelay: number;
}

export interface Playlist {
  id: string;
  title: string;
  songs: Song[];
}
