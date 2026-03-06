# Backend Setup Instructions

## Important: Create .env File

You need to create a `.env` file in the `backend` directory with your API keys.

1. Create a file named `.env` in the `backend` directory
2. Add the following content:

```
TMDB_API_KEY=4753b9b7963ea7a28318fa95acc8f1e2
PORT=3000
```

**Note:** The `.env` file is already added to `.gitignore` so it won't be committed to GitHub.

## Quick Start

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create the `.env` file (see above)

3. Start the server:
```bash
npm start
```

The server will be available at `http://localhost:3000`
