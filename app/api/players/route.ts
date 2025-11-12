// API route to handle player joining and game state updates
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isFirebaseAdminAvailable } from '@/lib/firebase-admin'
import { quizStore } from '@/lib/quiz-store'

export async function POST(request: NextRequest) {
  try {
    const { gamePin, player } = await request.json()

    if (!gamePin || !player) {
      return NextResponse.json({ error: 'Missing gamePin or player data' }, { status: 400 })
    }

    const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newPlayer = {
      id: playerId,
      name: player.name,
      score: 0,
      answers: [],
      joinedAt: Date.now(),
    }

    // Try Firebase first, fallback to in-memory store
    if (isFirebaseAdminAvailable()) {
      const gameRef = adminDb.collection('games').doc(gamePin)
      const doc = await gameRef.get()
      
      if (!doc.exists) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }

      const gameData = doc.data()
      const updatedPlayers = [...(gameData?.players || []), newPlayer]
      
      await gameRef.update({ players: updatedPlayers })
    } else {
      const game = quizStore.getGame(gamePin)
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }
      
      quizStore.addPlayer(gamePin, newPlayer)
    }

    return NextResponse.json({ success: true, playerId, player: newPlayer })
  } catch (error) {
    console.error('Error joining game:', error)
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { gamePin, playerId, answer, questionId } = await request.json()

    if (!gamePin || !playerId) {
      return NextResponse.json({ error: 'Missing gamePin or playerId' }, { status: 400 })
    }

    // Try Firebase first, fallback to in-memory store
    if (isFirebaseAdminAvailable()) {
      const gameRef = adminDb.collection('games').doc(gamePin)
      const doc = await gameRef.get()
      
      if (!doc.exists) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }

      const gameData = doc.data()
      const updatedPlayers = gameData?.players?.map((p: any) => {
        if (p.id === playerId) {
          const updatedAnswers = [...(p.answers || [])]
          if (answer !== undefined && questionId) {
            updatedAnswers.push({
              questionId,
              answer,
              answeredAt: Date.now(),
            })
          }
          return { ...p, answers: updatedAnswers }
        }
        return p
      }) || []
      
      await gameRef.update({ players: updatedPlayers })
    } else {
      const game = quizStore.getGame(gamePin)
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }
      
      // Update player answer in memory store
      const playerIndex = game.players.findIndex(p => p.id === playerId)
      if (playerIndex >= 0 && answer !== undefined && questionId) {
        game.players[playerIndex].answers.push({
          questionId,
          answeredAt: Date.now(),
          correct: false, // This will be calculated later
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}