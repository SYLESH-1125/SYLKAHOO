"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, Home, RotateCcw } from "lucide-react"
import Link from "next/link"
import Confetti from "@/components/confetti"

type Player = {
  id: string
  name: string
  score: number
}

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pin = searchParams.get("pin")
  const isPlayer = searchParams.get("player") === "true"

  const [quiz, setQuiz] = useState<any>(null)
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (!pin) {
      router.push("/")
      return
    }

    const storedQuiz = sessionStorage.getItem("currentQuiz")
    if (!storedQuiz) {
      router.push("/")
      return
    }

    const quizData = JSON.parse(storedQuiz)
    setQuiz(quizData)

    // Sort players by score
    const sorted = [...(quizData.players || [])].sort((a, b) => b.score - a.score)
    setSortedPlayers(sorted)

    // Show confetti for winners
    if (sorted.length > 0) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }, [pin, router])

  const playAgain = () => {
    sessionStorage.removeItem("currentQuiz")
    sessionStorage.removeItem("playerId")
    sessionStorage.removeItem("playerName")
    router.push("/")
  }

  if (!quiz) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </main>
    )
  }

  const podiumColors = [
    "bg-gradient-to-br from-yellow-400 to-yellow-600", // 1st
    "bg-gradient-to-br from-gray-300 to-gray-500", // 2nd
    "bg-gradient-to-br from-orange-400 to-orange-600", // 3rd
  ]

  const podiumIcons = [
    <Trophy key="1st" className="h-12 w-12 text-white" />,
    <Medal key="2nd" className="h-10 w-10 text-white" />,
    <Award key="3rd" className="h-8 w-8 text-white" />,
  ]

  const podiumHeights = ["h-48", "h-40", "h-32"]

  const top3 = sortedPlayers.slice(0, 3)
  const rest = sortedPlayers.slice(3)

  const playerId = sessionStorage.getItem("playerId")
  const playerRank = sortedPlayers.findIndex((p) => p.id === playerId) + 1

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 md:p-8 overflow-hidden">
      {showConfetti && <Confetti />}

      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-8 bg-white/95 backdrop-blur text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Quiz Complete!
          </h1>
          <p className="text-xl text-muted-foreground">{quiz.title}</p>
        </Card>

        {isPlayer && playerRank > 0 && (
          <Card className="p-6 bg-white/95 backdrop-blur text-center">
            <p className="text-lg text-muted-foreground mb-2">Your Rank</p>
            <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              #{playerRank}
            </div>
            <p className="text-2xl font-semibold text-muted-foreground mt-2">
              {sortedPlayers[playerRank - 1].score} points
            </p>
          </Card>
        )}

        {/* Podium */}
        {top3.length > 0 && (
          <Card className="p-8 bg-white/95 backdrop-blur">
            <h2 className="text-3xl font-bold mb-8 text-center text-purple-900">Top Players</h2>

            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2nd place */}
              {top3[1] && (
                <div className="flex flex-col items-center flex-1 max-w-[200px]">
                  <div
                    className={`${podiumColors[1]} rounded-t-lg p-4 flex flex-col items-center justify-center w-full ${podiumHeights[1]} shadow-lg`}
                  >
                    <div className="mb-2">{podiumIcons[1]}</div>
                    <div className="text-white font-bold text-lg text-center text-balance">{top3[1].name}</div>
                    <div className="text-white/90 text-2xl font-bold mt-2">{top3[1].score}</div>
                  </div>
                  <div className="bg-gray-200 w-full p-2 text-center font-bold text-gray-600">2nd</div>
                </div>
              )}

              {/* 1st place */}
              <div className="flex flex-col items-center flex-1 max-w-[200px]">
                <div
                  className={`${podiumColors[0]} rounded-t-lg p-4 flex flex-col items-center justify-center w-full ${podiumHeights[0]} shadow-lg animate-pulse`}
                >
                  <div className="mb-2">{podiumIcons[0]}</div>
                  <div className="text-white font-bold text-xl text-center text-balance">{top3[0].name}</div>
                  <div className="text-white text-3xl font-bold mt-2">{top3[0].score}</div>
                </div>
                <div className="bg-yellow-200 w-full p-2 text-center font-bold text-yellow-900">1st</div>
              </div>

              {/* 3rd place */}
              {top3[2] && (
                <div className="flex flex-col items-center flex-1 max-w-[200px]">
                  <div
                    className={`${podiumColors[2]} rounded-t-lg p-4 flex flex-col items-center justify-center w-full ${podiumHeights[2]} shadow-lg`}
                  >
                    <div className="mb-2">{podiumIcons[2]}</div>
                    <div className="text-white font-bold text-base text-center text-balance">{top3[2].name}</div>
                    <div className="text-white/90 text-xl font-bold mt-2">{top3[2].score}</div>
                  </div>
                  <div className="bg-orange-200 w-full p-2 text-center font-bold text-orange-900">3rd</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Full leaderboard */}
        {sortedPlayers.length > 0 && (
          <Card className="p-6 bg-white/95 backdrop-blur">
            <h2 className="text-2xl font-bold mb-4 text-purple-900">Full Leaderboard</h2>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => {
                const isCurrentPlayer = isPlayer && player.id === playerId
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index < 3
                        ? "bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300"
                        : isCurrentPlayer
                          ? "bg-blue-50 border-2 border-blue-300"
                          : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-2xl font-bold ${index < 3 ? "text-purple-600" : "text-gray-600"} min-w-[40px]`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {player.name}
                          {isCurrentPlayer && <span className="ml-2 text-sm text-blue-600">(You)</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{player.score}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/" className="flex-1">
            <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Home className="mr-2 h-5 w-5" />
              Home
            </Button>
          </Link>
          {!isPlayer && (
            <Button
              onClick={playAgain}
              variant="outline"
              className="flex-1 h-14 text-lg font-semibold border-2 bg-transparent"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              New Quiz
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
