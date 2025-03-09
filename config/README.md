# Configuration Files

This directory contains all configuration files for the BallTalk application.

## Directory Structure

- **env/**: Contains environment configuration files
  - `.env`: Main environment variables file
  - `.env.example`: Example environment variables file
  - `.env.emulator`: Environment variables for Firebase emulator
  - `.env.test`: Environment variables for testing

- **Root Configuration Files**:
  - `app.config.js`: Expo application configuration
  - `babel.config.js`: Babel configuration for JavaScript/TypeScript transpilation
  - `eslint.config.js`: ESLint configuration for code linting
  - `jest.config.js`: Jest configuration for testing
  - `jest.setup.js`: Jest setup file for testing
  - `metro.config.js`: Metro bundler configuration for React Native
  - `tsconfig.json`: TypeScript configuration
  - `tsconfig.jest.json`: TypeScript configuration for Jest
  - `eas.json`: Expo Application Services configuration

## Symbolic Links

For compatibility with existing code and tools, symbolic links to these configuration files are maintained in the root directory:

- `app.config.js` -> `config/app.config.js`
- `babel.config.js` -> `config/babel.config.js`
- `metro.config.js` -> `config/metro.config.js`
- `tsconfig.json` -> `config/tsconfig.json`
- `.env` -> `config/env/.env`

## Environment Variables

The application uses environment variables for configuration. The main environment variables file is `.env`, which is symlinked from `config/env/.env`.

To set up environment variables:

1. Copy `.env.example` to `.env`
2. Fill in the required values

For development with Firebase emulators, use `.env.emulator`.

For testing, use `.env.test`. 