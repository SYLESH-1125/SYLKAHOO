"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { enhancedQuizStore } from "@/lib/game-api"

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

export default function HostPage() {
  const router = useRouter()
  const [quizTitle, setQuizTitle] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      question: "",
      answers: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      timeLimit: 20,
    },
  ])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: "",
      answers: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      timeLimit: 20,
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, field: string, value: string | number) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const updateAnswer = (questionId: string, answerIndex: number, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newAnswers = [...q.answers]
          newAnswers[answerIndex] = { ...newAnswers[answerIndex], text }
          return { ...q, answers: newAnswers }
        }
        return q
      }),
    )
  }

  const setCorrectAnswer = (questionId: string, answerIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newAnswers = q.answers.map((a, i) => ({
            ...a,
            isCorrect: i === answerIndex,
          }))
          return { ...q, answers: newAnswers }
        }
        return q
      }),
    )
  }

  const startQuiz = async () => {
    if (!quizTitle.trim()) {
      alert("Please enter a quiz title")
      return
    }

    const hasEmptyQuestions = questions.some((q) => !q.question.trim())
    if (hasEmptyQuestions) {
      alert("Please fill in all questions")
      return
    }

    const hasEmptyAnswers = questions.some((q) => q.answers.some((a) => !a.text.trim()))
    if (hasEmptyAnswers) {
      alert("Please fill in all answer options")
      return
    }

    const hasCorrectAnswers = questions.every((q) => q.answers.some((a) => a.isCorrect))
    if (!hasCorrectAnswers) {
      alert("Please select a correct answer for each question")
      return
    }

    try {
      // Generate game PIN and create quiz in backend
      const gamePin = Math.floor(100000 + Math.random() * 900000).toString()
      console.log(`Creating game with PIN: ${gamePin}`)
      
      const quiz = {
        title: quizTitle,
        questions,
        gamePin,
        players: [],
      }

      // Create game using enhanced quiz store (Firebase + fallback)
      console.log('Creating game in backend...')
      const result = await enhancedQuizStore.createGame(gamePin, quiz)
      console.log('Game creation result:', result)
      
      // Also store in sessionStorage as backup for compatibility
      sessionStorage.setItem("currentQuiz", JSON.stringify(quiz))

      // Add a small delay to ensure Firebase has processed the write
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('Redirecting to lobby...')
      router.push(`/lobby?pin=${gamePin}`)
    } catch (error) {
      console.error('Failed to create game:', error)
      alert("Failed to create game. Please try again.")
    }
  }

  const answerColors = [
    "bg-red-500 hover:bg-red-600",
    "bg-blue-500 hover:bg-blue-600",
    "bg-yellow-500 hover:bg-yellow-600",
    "bg-green-500 hover:bg-green-600",
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6 bg-white/95 backdrop-blur">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Create Your Quiz
          </h1>

          <div className="space-y-4">
            <div>
              <Label htmlFor="quiz-title" className="text-lg font-semibold">
                Quiz Title
              </Label>
              <Input
                id="quiz-title"
                placeholder="Enter quiz title..."
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="mt-2 text-lg"
              />
            </div>
          </div>
        </Card>

        {questions.map((question, qIndex) => (
          <Card key={question.id} className="p-6 bg-white/95 backdrop-blur">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-600">Question {qIndex + 1}</h2>
              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(question.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor={`question-${question.id}`}>Question Text</Label>
                <Textarea
                  id={`question-${question.id}`}
                  placeholder="Enter your question..."
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                  className="mt-2 min-h-[80px]"
                />
              </div>

              <div>
                <Label>Time Limit (seconds)</Label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={question.timeLimit}
                  onChange={(e) => updateQuestion(question.id, "timeLimit", Number.parseInt(e.target.value))}
                  className="mt-2 max-w-[150px]"
                />
              </div>

              <div>
                <Label className="mb-3 block">Answer Options (click to mark as correct)</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {question.answers.map((answer, aIndex) => (
                    <div key={aIndex} className="relative">
                      <Input
                        placeholder={`Answer ${aIndex + 1}`}
                        value={answer.text}
                        onChange={(e) => updateAnswer(question.id, aIndex, e.target.value)}
                        className={`pr-12 ${answer.isCorrect ? "ring-2 ring-green-500 border-green-500" : ""}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setCorrectAnswer(question.id, aIndex)}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${
                          answer.isCorrect ? "bg-green-500 hover:bg-green-600" : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      >
                        ✓
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Click the checkmark to set the correct answer</p>
              </div>
            </div>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button
            onClick={addQuestion}
            variant="outline"
            className="flex-1 h-14 text-lg border-2 border-dashed bg-transparent"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Question
          </Button>

          <Button
            onClick={startQuiz}
            className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Play className="mr-2 h-5 w-5" />
            Start Quiz
          </Button>
        </div>
      </div>
    </main>
  )
}
