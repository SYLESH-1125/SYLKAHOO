"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { enhancedQuizStore } from "@/lib/game-api"

export default function JoinPage() {
  const router = useRouter()
  const [gamePin, setGamePin] = useState("")
  const [playerName, setPlayerName] = useState("")

  const joinGame = async () => {
    if (!gamePin.trim() || !playerName.trim()) {
      alert("Please enter both game PIN and your name")
      return
    }

    try {
      // Check if game exists and join using enhanced quiz store
      const gameState = await enhancedQuizStore.getGame(gamePin)
      if (!gameState) {
        alert("Game not found. Please check the PIN.")
        return
      }

      // Join the game
      const result = await enhancedQuizStore.joinGame(gamePin, playerName)
      
      // Store player info for compatibility
      sessionStorage.setItem("playerName", playerName)
      sessionStorage.setItem("playerId", result.playerId)

      router.push(`/lobby?pin=${gamePin}&player=true`)
    } catch (error) {
      console.error('Failed to join game:', error)
      alert("Failed to join game. Please check the PIN and try again.")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-white/20 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <Card className="p-8 bg-white/95 backdrop-blur">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Join a Quiz
          </h1>

          <div className="space-y-6">
            <div>
              <Label htmlFor="game-pin" className="text-lg font-semibold">
                Game PIN
              </Label>
              <Input
                id="game-pin"
                placeholder="Enter 6-digit PIN"
                value={gamePin}
                onChange={(e) => setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 text-2xl text-center font-bold tracking-wider"
                maxLength={6}
              />
            </div>

            <div>
              <Label htmlFor="player-name" className="text-lg font-semibold">
                Your Name
              </Label>
              <Input
                id="player-name"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="mt-2 text-xl"
                maxLength={20}
              />
            </div>

            <Button
              onClick={joinGame}
              className="w-full h-14 text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Join Game
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}
