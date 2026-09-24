# CoachingOS Local Setup & Deployment Guide

## Prerequisites
- Node.js v20+ or v22+
- npm v10+

## Quick Start (Under 2 Minutes)
1. Navigate to the project directory:
   ```bash
   cd C:\Users\rishabh\.gemini\antigravity\scratch\coachingos
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env.local
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
5. Open your browser:
   ```
   http://localhost:3000
   ```

## Production Build
To create a production-optimized build:
```bash
npm run build
npm start
```
The application will launch on port 3000.
