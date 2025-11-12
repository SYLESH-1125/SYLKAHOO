"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Play, Copy, Check } from "lucide-react"
import { enhancedQuizStore } from "@/lib/game-api"
import { db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"

type Player = {
  id: string
  name: string
  score: number
}

type GameState = {
  currentQuestionIndex: number
  questionStartTime: number
  status: "lobby" | "playing" | "finished"
  players: Player[]
  quiz?: any
  gamePin?: string
}

export default function LobbyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pin = searchParams.get("pin")
  const isPlayer = searchParams.get("player") === "true"

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!pin) {
      router.push("/")
      return
    }

    // Load initial game state from Firestore/API
    const loadGameState = async () => {
      try {
        console.log('Lobby: Loading initial game state for PIN:', pin)
        const gameState = await enhancedQuizStore.getGame(pin)
        if (gameState) {
          console.log('Lobby: Initial game state loaded:', gameState)
          setGameState(gameState)
          setPlayers(gameState.players || [])
          
          // Store in sessionStorage for compatibility
          sessionStorage.setItem("currentQuiz", JSON.stringify(gameState))
        } else {
          console.error('Lobby: Game state not found')
          alert("Game not found")
          router.push(isPlayer ? "/join" : "/host")
          return
        }
      } catch (error) {
        console.error('Lobby: Failed to load game state:', error)
        alert("Failed to load game")
        router.push(isPlayer ? "/join" : "/host")
        return
      }
    }

    // Load initial state
    loadGameState()

    // Set up real-time listener for game updates
    let unsubscribe: (() => void) | null = null
    
    if (pin) {
      try {
        // Try to set up Firestore real-time listener
        const gameRef = doc(db, 'games', pin)
        unsubscribe = onSnapshot(gameRef, (doc) => {
          if (doc.exists()) {
            const gameState = doc.data()
            console.log('Lobby: Real-time update received:', gameState)
            console.log('Game status:', gameState.status)
            console.log('Is player:', isPlayer)
            
            setPlayers(gameState.players || [])
            
            // Update local storage for compatibility
            sessionStorage.setItem("currentQuiz", JSON.stringify(gameState))

            // Check if game started
            if (gameState.status === "playing") {
              console.log('Game status is playing, redirecting to play page...')
              router.push(`/play?pin=${pin}${isPlayer ? "&player=true" : ""}`)
            }
          } else {
            console.log('Lobby: Document does not exist')
          }
        }, (error) => {
          console.warn('Firestore listener failed, falling back to polling:', error)
          
          // Fallback to polling if real-time listener fails
          const interval = setInterval(async () => {
            console.log('Lobby: Polling for game state changes...')
            try {
              const gameState = await enhancedQuizStore.getGame(pin)
              if (gameState) {
                console.log('Lobby: Polling - Game state:', gameState.status)
                setPlayers(gameState.players || [])
                sessionStorage.setItem("currentQuiz", JSON.stringify(gameState))

                if (gameState.status === "playing") {
                  console.log('Lobby: Polling detected game is playing, redirecting...')
                  router.push(`/play?pin=${pin}${isPlayer ? "&player=true" : ""}`)
                }
              }
            } catch (error) {
              console.error('Polling failed:', error)
            }
          }, 1000)
          
          // Store interval for cleanup
          unsubscribe = () => clearInterval(interval)
        })
      } catch (error) {
        console.warn('Failed to set up Firestore listener, using polling:', error)
        
        // Fallback polling method
        const interval = setInterval(async () => {
          try {
            const gameState = await enhancedQuizStore.getGame(pin)
            if (gameState) {
              setPlayers(gameState.players || [])
              sessionStorage.setItem("currentQuiz", JSON.stringify(gameState))

              if (gameState.status === "playing") {
                router.push(`/play?pin=${pin}${isPlayer ? "&player=true" : ""}`)
              }
            }
          } catch (error) {
            console.error('Polling failed:', error)
          }
        }, 1000)
        
        unsubscribe = () => clearInterval(interval)
      }
    }

    // Always add a backup polling mechanism for critical game state changes
    const backupInterval = setInterval(async () => {
      if (!pin) return
      
      try {
        console.log('Lobby: Backup polling check...')
        const gameState = await enhancedQuizStore.getGame(pin)
        if (gameState && gameState.status === "playing") {
          console.log('Lobby: Backup polling detected playing status, redirecting...')
          clearInterval(backupInterval)
          router.push(`/play?pin=${pin}${isPlayer ? "&player=true" : ""}`)
        }
      } catch (error) {
        console.error('Backup polling failed:', error)
      }
    }, 500) // Check every 500ms for game start

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      clearInterval(backupInterval)
    }
  }, [pin, isPlayer, router, joined])

  const copyPin = () => {
    if (pin) {
      navigator.clipboard.writeText(pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const startGame = async () => {
    if (!gameState || !pin) return

    if (players.length === 0) {
      alert("Wait for at least one player to join")
      return
    }

    try {
      console.log('Host: Starting game with PIN:', pin)
      console.log('Host: Current players:', players.length)
      
      // Update game state to "playing" using enhanced quiz store
      console.log('Host: Updating game state to playing...')
      await enhancedQuizStore.updateGameState(pin, { 
        status: "playing",
        questionStartTime: Date.now()
      })
      
      console.log('Host: Game state updated, updating local storage...')
      // Update local storage for compatibility
      const updatedGameState = { ...gameState, status: "playing" }
      sessionStorage.setItem("currentQuiz", JSON.stringify(updatedGameState))
      
      console.log('Host: Redirecting to play page...')
      router.push(`/play?pin=${pin}`)
    } catch (error) {
      console.error('Failed to start game:', error)
      alert("Failed to start game. Please try again.")
    }
  }

  if (!gameState) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </main>
    )
  }

  const playerColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-8 bg-white/95 backdrop-blur text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {gameState.quiz?.title || "Quiz Game"}
          </h1>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Game PIN</p>
              <div className="flex items-center gap-2">
                <div className="text-4xl font-bold tracking-wider bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {pin}
                </div>
                {!isPlayer && (
                  <Button size="sm" variant="outline" onClick={copyPin} className="h-10 w-10 p-0 bg-transparent">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="text-lg font-semibold">
              {players.length} player{players.length !== 1 ? "s" : ""} joined
            </span>
          </div>

          {!isPlayer && (
            <Button
              onClick={startGame}
              disabled={players.length === 0}
              className="mt-6 h-14 px-8 text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Game
            </Button>
          )}

          {isPlayer && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-lg font-semibold text-purple-900">Waiting for host to start the game...</p>
            </div>
          )}
        </Card>

        {players.length > 0 && (
          <Card className="p-6 bg-white/95 backdrop-blur">
            <h2 className="text-2xl font-bold mb-4 text-purple-900">Players in Lobby</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`${playerColors[index % playerColors.length]} p-4 rounded-lg text-white text-center font-semibold shadow-lg transform hover:scale-105 transition-transform`}
                >
                  {player.name}
                </div>
              ))}
            </div>
          </Card>
        )}

        {!isPlayer && players.length === 0 && (
          <Card className="p-8 bg-white/95 backdrop-blur text-center">
            <div className="text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Share the game PIN with players to get started!</p>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
