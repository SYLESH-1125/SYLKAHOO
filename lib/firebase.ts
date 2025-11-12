// Firebase client configuration and initialization
import { initializeApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getAuth, connectAuthEmulator } from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcjSgqkg4HvU7vyVdIdOBvgYcXLwOfOdQ",
  authDomain: "fir-tutorial-4d757.firebaseapp.com",
  projectId: "fir-tutorial-4d757",
  storageBucket: "fir-tutorial-4d757.firebasestorage.app",
  messagingSenderId: "1043988842906",
  appId: "1:1043988842906:web:2345b752f9be43d5045223"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)

// Connect to emulators in development (optional)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
  
  if (useEmulator) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectAuthEmulator(auth, 'http://localhost:9099')
    } catch (error) {
      // Emulators already connected or not available
      console.log('Firebase emulators not connected:', error)
    }
  }
}

export default app