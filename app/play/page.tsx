"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"
import Confetti from "@/components/confetti"

type Answer = {
  text: string
  isCorrect: boolean
}

type Question = {
  id: string
  question: string
  answers: Answer[]
  timeLimit: number
}

type Player = {
  id: string
  name: string
  score: number
  currentAnswer?: number
}

export default function PlayPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pin = searchParams.get("pin")
  const isPlayer = searchParams.get("player") === "true"

  const [quiz, setQuiz] = useState<any>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Helper function to safely get questions array
  const getQuestions = () => {
    if (!quiz) return []
    return quiz.questions || quiz.quiz?.questions || []
  }
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboardCountdown, setLeaderboardCountdown] = useState(5)
  const [players, setPlayers] = useState<Player[]>([])

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
    setPlayers(quizData.players || [])
    // Handle both old format (questions) and new format (quiz.questions)
    const questions = quizData.questions || quizData.quiz?.questions || []
    setTimeLeft(questions[0]?.timeLimit || 20)
  }, [pin, router])

  // Timer countdown
  useEffect(() => {
    if (!quiz || showResults || showLeaderboard) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowResults(true)
          // Automatically show leaderboard after 2 seconds of results
          setTimeout(() => {
            setShowLeaderboard(true)
          }, 2000)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quiz, showResults, showLeaderboard, currentQuestionIndex])

  // Poll for answer submissions (for host view)
  useEffect(() => {
    if (isPlayer || !quiz) return

    const interval = setInterval(() => {
      const storedQuiz = sessionStorage.getItem("currentQuiz")
      if (storedQuiz) {
        const quizData = JSON.parse(storedQuiz)
        setPlayers(quizData.players || [])
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isPlayer, quiz])

  // Leaderboard countdown timer
  useEffect(() => {
    if (!showLeaderboard) return

    setLeaderboardCountdown(5) // Reset countdown
    const timer = setInterval(() => {
      setLeaderboardCountdown((prev) => {
        if (prev <= 1) {
          nextQuestion()
          return 5
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showLeaderboard])

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered || !isPlayer) return

    setSelectedAnswer(answerIndex)
    setAnswered(true)

    // Calculate points based on time left (faster = more points)
    const question = getQuestions()[currentQuestionIndex]
    const maxPoints = 1000
    const timeBonus = Math.floor((timeLeft / question.timeLimit) * 500)
    const isCorrect = question.answers[answerIndex].isCorrect
    const points = isCorrect ? maxPoints + timeBonus : 0

    // Update player score
    const playerId = sessionStorage.getItem("playerId")
    const storedQuiz = sessionStorage.getItem("currentQuiz")
    if (storedQuiz && playerId) {
      const quizData = JSON.parse(storedQuiz)
      quizData.players = quizData.players.map((p: Player) => {
        if (p.id === playerId) {
          return {
            ...p,
            score: p.score + points,
            currentAnswer: answerIndex,
          }
        }
        return p
      })
      sessionStorage.setItem("currentQuiz", JSON.stringify(quizData))
      setPlayers(quizData.players)
    }
  }



  const nextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1

    if (nextIndex >= getQuestions().length) {
      // Game finished
      const storedQuiz = sessionStorage.getItem("currentQuiz")
      if (storedQuiz) {
        const quizData = JSON.parse(storedQuiz)
        quizData.status = "finished"
        sessionStorage.setItem("currentQuiz", JSON.stringify(quizData))
      }
      router.push(`/results?pin=${pin}${isPlayer ? "&player=true" : ""}`)
      return
    }

    setCurrentQuestionIndex(nextIndex)
    setTimeLeft(getQuestions()[nextIndex]?.timeLimit || 20)
    setSelectedAnswer(null)
    setAnswered(false)
    setShowResults(false)
    setShowLeaderboard(false)
    setLeaderboardCountdown(5)

    // Clear current answers
    const storedQuiz = sessionStorage.getItem("currentQuiz")
    if (storedQuiz) {
      const quizData = JSON.parse(storedQuiz)
      quizData.players = quizData.players.map((p: Player) => ({
        ...p,
        currentAnswer: undefined,
      }))
      sessionStorage.setItem("currentQuiz", JSON.stringify(quizData))
    }
  }

  if (!quiz) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </main>
    )
  }

  const questions = getQuestions()
  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const timeProgress = (timeLeft / currentQuestion.timeLimit) * 100

  const answerColors = [
    {
      bg: "bg-red-500",
      hover: "hover:bg-red-600",
      ring: "ring-red-500",
      correct: "bg-green-500",
      wrong: "bg-gray-400",
      shadow: "shadow-red-500/50",
    },
    {
      bg: "bg-blue-500",
      hover: "hover:bg-blue-600",
      ring: "ring-blue-500",
      correct: "bg-green-500",
      wrong: "bg-gray-400",
      shadow: "shadow-blue-500/50",
    },
    {
      bg: "bg-yellow-500",
      hover: "hover:bg-yellow-600",
      ring: "ring-yellow-500",
      correct: "bg-green-500",
      wrong: "bg-gray-400",
      shadow: "shadow-yellow-500/50",
    },
    {
      bg: "bg-green-500",
      hover: "hover:bg-green-600",
      ring: "ring-green-500",
      correct: "bg-green-500",
      wrong: "bg-gray-400",
      shadow: "shadow-green-500/50",
    },
  ]

  const getAnswerClass = (index: number) => {
    if (!showResults) {
      if (isPlayer && selectedAnswer === index) {
        return `${answerColors[index].bg} ring-4 ${answerColors[index].ring} shadow-xl ${answerColors[index].shadow}`
      }
      return `${answerColors[index].bg} ${answerColors[index].hover} shadow-lg ${answerColors[index].shadow}`
    } else {
      if (currentQuestion.answers[index].isCorrect) {
        return `${answerColors[index].correct} shadow-xl shadow-green-500/50 ring-4 ring-green-400`
      }
      if (isPlayer && selectedAnswer === index && !currentQuestion.answers[index].isCorrect) {
        return `${answerColors[index].wrong} shadow-lg`
      }
      return `${answerColors[index].bg} opacity-50`
    }
  }

  const answeredCount = players.filter((p) => p.currentAnswer !== undefined).length

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const playerId = sessionStorage.getItem("playerId")
  const currentPlayerScore = players.find((p) => p.id === playerId)?.score || 0

  if (showLeaderboard) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 md:p-8">
        <Confetti />
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
          <Card className="p-8 bg-white/95 backdrop-blur text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Current Leaderboard
              </h2>
              <p className="text-muted-foreground">After Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
          </Card>

          <Card className="p-6 bg-white/95 backdrop-blur">
            <div className="space-y-3">
              {sortedPlayers.slice(0, 5).map((player, index) => {
                const isCurrentPlayer = isPlayer && player.id === playerId
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg transform transition-all animate-in slide-in-from-left duration-500 ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 shadow-xl shadow-yellow-400/30"
                        : index === 1
                          ? "bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400 shadow-lg shadow-gray-400/30"
                          : index === 2
                            ? "bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-400 shadow-lg shadow-orange-400/30"
                            : isCurrentPlayer
                              ? "bg-blue-50 border-2 border-blue-300"
                              : "bg-gray-50"
                    } ${index < 3 ? "animate-bounce" : ""}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      {index < 3 ? (
                        <Trophy
                          className={`h-8 w-8 ${
                            index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-orange-500"
                          }`}
                        />
                      ) : (
                        <div className="text-2xl font-bold text-gray-600 min-w-[40px]">#{index + 1}</div>
                      )}
                      <div>
                        <div className="font-semibold text-xl">
                          {player.name}
                          {isCurrentPlayer && <span className="ml-2 text-sm text-blue-600">(You)</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">{player.score}</div>
                  </div>
                )
              })}
            </div>

            {sortedPlayers.length > 5 && (
              <p className="text-center text-muted-foreground mt-4">And {sortedPlayers.length - 5} more players...</p>
            )}
          </Card>

          {!isPlayer && (
            <Card className="p-6 bg-white/95 backdrop-blur text-center">
              <Button
                onClick={nextQuestion}
                className="h-14 px-8 text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {currentQuestionIndex < getQuestions().length - 1 ? "Skip to Next Question" : "Show Final Results"}
              </Button>
            </Card>
          )}

          <Card className="p-6 bg-white/95 backdrop-blur text-center">
            <p className="text-lg text-muted-foreground">
              {currentQuestionIndex < getQuestions().length - 1 ? "Next question starting in..." : "Final results coming up in..."}
            </p>
            <div className="text-6xl font-bold text-purple-600 mt-2 animate-pulse">{leaderboardCountdown}</div>
            <div className="text-sm text-muted-foreground mt-2">seconds</div>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-white">
          <div className="text-lg font-semibold">
            Question {currentQuestionIndex + 1} of {getQuestions().length}
          </div>
          <div className="flex items-center gap-4">
            {isPlayer && (
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <span className="text-sm">Your Score: </span>
                <span className="text-xl font-bold">{currentPlayerScore}</span>
              </div>
            )}
            <div className="text-lg font-semibold">{!isPlayer && `${answeredCount}/${players.length} answered`}</div>
          </div>
        </div>

        <Progress value={progress} className="h-2 bg-white/30" />

        {/* Timer */}
        <Card className="p-6 bg-white/95 backdrop-blur animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-4xl font-bold text-balance">{currentQuestion.question}</h2>
            <div className="flex flex-col items-center min-w-[100px]">
              <div
                className={`text-5xl md:text-6xl font-bold transition-colors duration-300 ${
                  timeLeft <= 5 ? "text-red-600 animate-pulse" : "text-purple-600"
                }`}
              >
                {timeLeft}
              </div>
              <div className="text-sm text-muted-foreground">seconds</div>
            </div>
          </div>
          <Progress value={timeProgress} className={`h-3 ${timeLeft <= 5 ? "bg-red-200" : "bg-purple-200"}`} />
        </Card>

        {/* Answers */}
        <div className="grid md:grid-cols-2 gap-4">
          {currentQuestion.answers.map((answer: Answer, index: number) => (
            <Button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={!isPlayer || answered}
              className={`h-28 md:h-36 text-xl md:text-2xl font-bold text-white transform transition-all duration-300 ${getAnswerClass(index)} ${
                !isPlayer || answered ? "cursor-default" : "hover:scale-105 active:scale-95"
              }`}
            >
              {answer.text}
            </Button>
          ))}
        </div>

        {/* Player feedback */}
        {isPlayer && answered && (
          <Card className="p-6 bg-white/95 backdrop-blur text-center animate-in zoom-in duration-500">
            {showResults && !showLeaderboard ? (
              currentQuestion.answers[selectedAnswer!].isCorrect ? (
                <div>
                  <div className="text-6xl mb-2">🎉</div>
                  <p className="text-3xl font-bold text-green-600 mb-2">Correct!</p>
                  <p className="text-xl font-semibold text-purple-600">
                    +{Math.floor(1000 + (timeLeft / currentQuestion.timeLimit) * 500)} points
                  </p>
                  <p className="text-muted-foreground mt-2">Get ready for the leaderboard...</p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-2">😔</div>
                  <p className="text-3xl font-bold text-red-600 mb-2">Wrong!</p>
                  <p className="text-lg text-muted-foreground">
                    The correct answer was:{" "}
                    <span className="font-semibold text-green-600">
                      {currentQuestion.answers.find((a: Answer) => a.isCorrect)?.text}
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-2">Get ready for the leaderboard...</p>
                </div>
              )
            ) : !showResults ? (
              <div>
                <div className="text-6xl mb-2">✅</div>
                <p className="text-3xl font-bold text-purple-600">Answer submitted!</p>
                <p className="text-muted-foreground mt-2">Waiting for time to run out...</p>
              </div>
            ) : null}
          </Card>
        )}

        {/* Results phase - leaderboard will show automatically */}
        {!isPlayer && showResults && !showLeaderboard && (
          <Card className="p-6 bg-white/95 backdrop-blur text-center animate-in zoom-in duration-300">
            <p className="text-lg font-bold text-purple-600">Showing leaderboard in 2 seconds...</p>
            <div className="mt-2">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
