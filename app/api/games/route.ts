// API route to create a new game
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isFirebaseAdminAvailable } from '@/lib/firebase-admin'
import { quizStore } from '@/lib/quiz-store'

export async function POST(request: NextRequest) {
  try {
    const { gamePin, quiz } = await request.json()

    if (!gamePin || !quiz) {
      return NextResponse.json({ error: 'Missing gamePin or quiz data' }, { status: 400 })
    }

    const gameState = {
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      status: 'lobby' as const,
      players: [],
      quiz,
      createdAt: Date.now(),
    }

    // Try Firebase first, fallback to in-memory store
    if (isFirebaseAdminAvailable()) {
      await adminDb.collection('games').doc(gamePin).set(gameState)
    } else {
      quizStore.createGame(gamePin)
      quizStore.updateGame(gamePin, gameState)
    }

    return NextResponse.json({ success: true, gamePin })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gamePin = searchParams.get('pin')

    if (!gamePin) {
      return NextResponse.json({ error: 'Missing game PIN' }, { status: 400 })
    }

    let gameState = null

    // Try Firebase first, fallback to in-memory store
    if (isFirebaseAdminAvailable()) {
      const doc = await adminDb.collection('games').doc(gamePin).get()
      if (doc.exists) {
        gameState = doc.data()
      }
    } else {
      gameState = quizStore.getGame(gamePin)
    }

    if (!gameState) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}