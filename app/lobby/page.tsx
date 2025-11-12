"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Play, Copy, Check } from "lucide-react"
import { enhancedQuizStore } from "@/lib/game-api"

type Player = {
  id: string
  name: string
  score: number
}

type Quiz = {
  title: string
  questions: any[]
  gamePin: string
  players: Player[]
}

export default function LobbyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pin = searchParams.get("pin")
  const isPlayer = searchParams.get("player") === "true"

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!pin) {
      router.push("/")
      return
    }

    if (isPlayer) {
      // Player joining
      const playerName = sessionStorage.getItem("playerName")
      if (!playerName) {
        router.push("/join")
        return
      }

      // Check if quiz exists
      const storedQuiz = sessionStorage.getItem("currentQuiz")
      if (!storedQuiz) {
        alert("Game not found")
        router.push("/join")
        return
      }

      const quizData = JSON.parse(storedQuiz)
      if (quizData.gamePin !== pin) {
        alert("Invalid game PIN")
        router.push("/join")
        return
      }

      // Add player if not already joined
      if (!joined) {
        const playerId = Date.now().toString()
        const newPlayer: Player = {
          id: playerId,
          name: playerName,
          score: 0,
        }

        const existingPlayers = quizData.players || []
        const updatedPlayers = [...existingPlayers, newPlayer]
        quizData.players = updatedPlayers

        sessionStorage.setItem("currentQuiz", JSON.stringify(quizData))
        sessionStorage.setItem("playerId", playerId)

        setQuiz(quizData)
        setPlayers(updatedPlayers)
        setJoined(true)
      }
    } else {
      // Host view
      const storedQuiz = sessionStorage.getItem("currentQuiz")
      if (!storedQuiz) {
        router.push("/host")
        return
      }

      const quizData = JSON.parse(storedQuiz)
      setQuiz(quizData)
      setPlayers(quizData.players || [])
    }

    // Poll for game updates from backend
    const interval = setInterval(async () => {
      if (!pin) return
      
      try {
        // Get latest game state from backend
        const gameState = await enhancedQuizStore.getGame(pin)
        if (gameState) {
          setPlayers(gameState.players || [])
          
          // Update local storage for compatibility
          sessionStorage.setItem("currentQuiz", JSON.stringify(gameState))

          // Check if game started
          if (gameState.status === "playing") {
            router.push(`/play?pin=${pin}${isPlayer ? "&player=true" : ""}`)
          }
        }
      } catch (error) {
        console.error('Failed to fetch game state:', error)
        // Fallback to sessionStorage
        const storedQuiz = sessionStorage.getItem("currentQuiz")
        if (storedQuiz) {
          const quizData = JSON.parse(storedQuiz)
          setPlayers(quizData.players || [])

          if (quizData.status === "playing") {
            router.push(`/play?pin=${pin}${isPlayer ? "&player=true" : ""}`)
          }
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [pin, isPlayer, router, joined])

  const copyPin = () => {
    if (pin) {
      navigator.clipboard.writeText(pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const startGame = async () => {
    if (!quiz || !pin) return

    if (players.length === 0) {
      alert("Wait for at least one player to join")
      return
    }

    try {
      // Update game state to "playing" using enhanced quiz store
      await enhancedQuizStore.updateGameState(pin, { 
        status: "playing",
        questionStartTime: Date.now()
      })
      
      // Update local storage for compatibility
      const updatedQuiz = { ...quiz, status: "playing" }
      sessionStorage.setItem("currentQuiz", JSON.stringify(updatedQuiz))
      
      router.push(`/play?pin=${pin}`)
    } catch (error) {
      console.error('Failed to start game:', error)
      alert("Failed to start game. Please try again.")
    }
  }

  if (!quiz) {
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
            {quiz.title}
          </h1>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Game PIN</p>
              <div className="flex items-center gap-2">
                <div className="text-4xl font-bold tracking-wider bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {quiz.gamePin}
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
