// Simple in-memory store for quiz state management
type Player = {
  id: string
  name: string
  score: number
  answers: { questionId: string; answeredAt: number; correct: boolean }[]
}

type GameState = {
  currentQuestionIndex: number
  questionStartTime: number
  status: "lobby" | "playing" | "finished"
  players: Player[]
}

class QuizStore {
  private games: Map<string, GameState> = new Map()

  getGame(pin: string): GameState | undefined {
    return this.games.get(pin)
  }

  createGame(pin: string): void {
    this.games.set(pin, {
      currentQuestionIndex: 0,
      questionStartTime: 0,
      status: "lobby",
      players: [],
    })
  }

  addPlayer(pin: string, player: Player): void {
    const game = this.games.get(pin)
    if (game) {
      game.players.push(player)
    }
  }

  updateGame(pin: string, updates: Partial<GameState>): void {
    const game = this.games.get(pin)
    if (game) {
      Object.assign(game, updates)
    }
  }

  deleteGame(pin: string): void {
    this.games.delete(pin)
  }
}

export const quizStore = new QuizStore()
