# Kahoot-like Quiz App with Firebase Backend

A real-time quiz application similar to Kahoot, built with Next.js and Firebase.

## Features

- **Host Quiz Creation**: Create interactive quizzes with multiple choice questions
- **Real-time Gameplay**: Players join using game PINs and participate in real-time
- **Live Leaderboards**: Track scores and display rankings during gameplay
- **Firebase Integration**: Persistent game state with Firebase Firestore
- **Graceful Fallbacks**: Works with local storage when Firebase is unavailable

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Firebase project (optional but recommended)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd kahoot
pnpm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

3. **Configure Firebase (Optional but Recommended):**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Firestore Database
   - Go to Project Settings > Service Accounts
   - Generate new private key (downloads JSON file)
   - Copy the entire JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`

4. **Start the development server:**
```bash
pnpm dev
```

5. **Open your browser:** http://localhost:3000

## How It Works

### For Hosts:
1. Go to the homepage and click "Host a Quiz"
2. Create questions with multiple choice answers
3. Set time limits for each question
4. Click "Start Quiz" to generate a game PIN
5. Share the PIN with players
6. Control game flow from the host interface

### For Players:
1. Go to the homepage and click "Join a Quiz"
2. Enter the 6-digit game PIN
3. Enter your name
4. Wait in the lobby until the host starts
5. Answer questions as quickly as possible for bonus points

## Architecture

### Backend Options

The app supports multiple backend configurations:

1. **Full Firebase (Recommended)**: Real-time sync, persistent storage
2. **Local Fallback**: Uses sessionStorage when Firebase is unavailable

### API Routes

- `POST /api/games` - Create new game
- `GET /api/games?pin={pin}` - Get game state
- `POST /api/players` - Join game
- `PATCH /api/players` - Submit answers
- `PATCH /api/game-state` - Update game status

### Key Files

- `lib/firebase.ts` - Client-side Firebase configuration
- `lib/firebase-admin.ts` - Server-side Firebase Admin SDK
- `lib/game-api.ts` - API client with local fallbacks
- `lib/quiz-store.ts` - Original in-memory store (fallback)

## Environment Variables

```bash
# Required for Firebase Admin (server-side operations)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Optional configuration
FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app works on any Node.js hosting platform. Just ensure environment variables are properly configured.

## Troubleshooting

### Firebase Not Working?
- Check that `FIREBASE_SERVICE_ACCOUNT_KEY` is properly formatted JSON
- Verify Firestore is enabled in Firebase console
- The app falls back to local storage automatically

### Local Development Issues?
```bash
# Clear local storage and restart
pnpm dev
```

### Build Errors?
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

## License

MIT