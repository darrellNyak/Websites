export interface Celebrity {
  id: string;
  name: string;
  profession: string[];
  imageUrl: string;
  description?: string;
  connections?: string[];
  popularity?: number;
  source: 'wikipedia' | 'tmdb' | 'manual';
}

export interface ConnectionPath {
  path: Celebrity[];
  degrees: number;
  totalConnections: number;
  movies?: MovieConnection[];
}


export interface MovieConnection {
  movie: {
    id: number;
    title: string;
    year?: number;
    poster?: string;
  };
  connectingCelebrities: string[]; 
}

export interface ApiResponse {
  celebrities: Celebrity[];
  total: number;
  page: number;
}