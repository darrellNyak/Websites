# Backend API for Six Degrees of Celebrity

This is the backend server for the Six Degrees of Celebrity application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `backend` directory with the following content:
```
TMDB_API_KEY=your_tmdb_api_key_here
PORT=3000
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### TMDB Routes (`/api/tmdb`)

- `GET /api/tmdb/search?query={query}&page={page}` - Search celebrities
- `GET /api/tmdb/popular` - Get popular celebrities
- `GET /api/tmdb/person/:id` - Get celebrity details
- `GET /api/tmdb/person/:id/credits` - Get celebrity movie credits
- `GET /api/tmdb/person/:id/tv-credits` - Get celebrity TV credits
- `GET /api/tmdb/movie/:id/credits` - Get movie credits
- `GET /api/tmdb/tv/:id/credits` - Get TV show credits
- `GET /api/tmdb/movie/:id` - Get movie details
- `GET /api/tmdb/tv/:id` - Get TV show details

### Wikipedia Routes (`/api/wikipedia`)

- `GET /api/wikipedia/search?query={query}` - Search celebrities
- `GET /api/wikipedia/person/:title` - Get celebrity details
- `GET /api/wikipedia/connection?startName={name}&endName={name}` - Find connection between celebrities

### Health Check

- `GET /api/health` - Check if the server is running
