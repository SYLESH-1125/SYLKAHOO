// Test Firebase connection
import { db } from './lib/firebase.js'
import { doc, setDoc, getDoc } from 'firebase/firestore'

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...')
    
    // Test writing to Firestore
    const testDoc = doc(db, 'test', 'connection')
    await setDoc(testDoc, {
      message: 'Hello from Kahoot app!',
      timestamp: Date.now(),
    })
    console.log('✅ Successfully wrote to Firestore')
    
    // Test reading from Firestore
    const docSnap = await getDoc(testDoc)
    if (docSnap.exists()) {
      console.log('✅ Successfully read from Firestore:', docSnap.data())
    } else {
      console.log('❌ Document not found')
    }
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error)
  }
}

testFirebase()