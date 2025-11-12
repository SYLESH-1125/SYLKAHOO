// API route to handle game state changes (start, next question, finish)
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isFirebaseAdminAvailable } from '@/lib/firebase-admin'
import { quizStore } from '@/lib/quiz-store'

export async function PATCH(request: NextRequest) {
  try {
    const { gamePin, status, currentQuestionIndex, questionStartTime } = await request.json()

    if (!gamePin) {
      return NextResponse.json({ error: 'Missing gamePin' }, { status: 400 })
    }

    const updates: any = {}
    if (status) updates.status = status
    if (currentQuestionIndex !== undefined) updates.currentQuestionIndex = currentQuestionIndex
    if (questionStartTime) updates.questionStartTime = questionStartTime

    // Try Firebase first, fallback to in-memory store
    if (isFirebaseAdminAvailable()) {
      const gameRef = adminDb.collection('games').doc(gamePin)
      const doc = await gameRef.get()
      
      if (!doc.exists) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }

      await gameRef.update({
        ...updates,
        updatedAt: Date.now(),
      })
    } else {
      const game = quizStore.getGame(gamePin)
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }
      
      quizStore.updateGame(gamePin, updates)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating game state:', error)
    return NextResponse.json({ error: 'Failed to update game state' }, { status: 500 })
  }
}