"use client"

import { useEffect, useState } from "react"

export default function Confetti() {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
    }))
    setParticles(newParticles)
  }, [])

  const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500", "bg-purple-500", "bg-pink-500"]

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-3 h-3 ${colors[particle.id % colors.length]} rounded-full animate-confetti-fall`}
          style={{
            left: `${particle.left}%`,
            top: "-10px",
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
