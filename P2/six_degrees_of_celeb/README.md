# SixDegreesOfCeleb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.2.

## Project Structure

- `src/` - Frontend Angular application
- `backend/` - Backend Express API server

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```
TMDB_API_KEY=your_tmdb_api_key_here
PORT=3000
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3000` by default.

### Frontend Setup

1. Install dependencies (if not already installed):
```bash
npm install
```

2. Start the development server:
```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

**Note:** Make sure the backend server is running before starting the frontend, as the frontend depends on the backend API.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
