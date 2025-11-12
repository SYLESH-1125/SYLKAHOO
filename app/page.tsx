"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 bg-white/95 backdrop-blur">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-balance bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            QuizMaster
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Create engaging quizzes and play with friends in real-time
          </p>

          <div className="grid md:grid-cols-2 gap-4 pt-8">
            <Link href="/host" className="block">
              <Button
                size="lg"
                className="w-full h-20 text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Host a Quiz
              </Button>
            </Link>

            <Link href="/join" className="block">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-20 text-xl font-semibold border-2 hover:bg-purple-50 bg-transparent"
              >
                Join a Quiz
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </main>
  )
}
