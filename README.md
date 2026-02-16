
## LIVE WEBSITE: https://kanvaso.vercel.app/
# Similar app to Figma
A real-time collaborative design tool built with Next.js 14, Fabric.js, and Firebase.

## Features

- **Real-time Collaboration**: Multi-user editing with live updates using Firebase.
- **Multi-cursor**: See other users' cursors and names in real-time.
- **Presence**: Track active users in the room.
- **Canvas Engine**: Comprehensive design tools using Fabric.js (Rectangles, Circles, Triangles, Lines, Text, Free Drawing).
- **Image Upload**: Drag & drop or use the image tool to add images.
- **Reactions**: Live emoji reactions.
- **Comments**: Pin comments on the canvas and resolve them.
- **Undo/Redo**: Full history tracking with keyboard shortcuts (Ctrl+Z, Ctrl+Y).
- **Zoom & Pan**: Infinite canvas with zoom controls.
- **Export**: Export your designs to PNG.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Canvas**: Fabric.js v6
- **Real-time**: Firebase (Firestore, Auth)
- **State**: Jotai
- **Animation**: Framer Motion

## Getting Started

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a project in [Firebase Console](https://console.firebase.google.com/)
   - Create a web app and get the configuration
   - Enable **Firestore Database** in test mode or update rules to allow read/write.
   - Go to **Authentication** > **Sign-in method** and enable **Anonymous** provider.
   - Create a `.env.local` file based on `.env.local.example` and add your credentials:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     NEXT_PUBLIC_FIREBASE_APP_ID=...
     ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   - Open [http://localhost:3000](http://localhost:3000)
   - Open the same URL in another tab or browser to test collaboration!

## Key Controls

- **Select Tool**: Click objects to select, drag to move.
- **Hand Tool**: Pan around the canvas.
- **Drawing Tool**: Freehand drawing.
- **Keyboard Shortcuts**:
  - `Delete` / `Backspace`: Delete selected object
  - `Ctrl + Z`: Undo
  - `Ctrl + Y` / `Ctrl + Shift + Z`: Redo
