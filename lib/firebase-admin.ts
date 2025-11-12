// Firebase Admin SDK configuration for server-side operations
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let adminApp: any = null
let adminDb: any = null

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (adminApp) return { adminApp, adminDb }
  
  try {
    // Check if Firebase Admin is already initialized
    const existingApps = getApps()
    if (existingApps.length > 0) {
      adminApp = existingApps[0]
      adminDb = getFirestore(adminApp)
      return { adminApp, adminDb }
    }

    // Try to initialize with service account
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    
    if (serviceAccountKey) {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey)
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'fir-tutorial-4d757',
      })
    } else {
      // Fallback: use project ID only (for local development or if using default credentials)
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'fir-tutorial-4d757',
      })
    }

    adminDb = getFirestore(adminApp)
    
    console.log('Firebase Admin initialized successfully')
    return { adminApp, adminDb }
    
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error)
    return { adminApp: null, adminDb: null }
  }
}

// Get Firebase Admin instances (lazy initialization)
export function getFirebaseAdmin() {
  if (!adminApp || !adminDb) {
    return initializeFirebaseAdmin()
  }
  return { adminApp, adminDb }
}

// Helper function to check if Firebase Admin is available
export function isFirebaseAdminAvailable(): boolean {
  const { adminDb } = getFirebaseAdmin()
  // Also check if we have proper credentials
  const hasCredentials = !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
                           process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                           process.env.GCLOUD_PROJECT)
  return adminDb !== null && hasCredentials
}

// Export initialized instances
const { adminApp: app, adminDb: db } = getFirebaseAdmin()
export { app as adminApp, db as adminDb }