import React from 'react'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
  animation?: 'fade-up' | 'slide-left' | 'slide-right' | 'scale' | 'none'
  interactive?: boolean
  onClick?: () => void
}

export default function AnimatedCard({
  children,
  className = '',
  delay = 0,
  animation = 'fade-up',
  interactive = false,
  onClick,
}: AnimatedCardProps) {
  const animationClass = {
    'fade-up': 'animate-fade-up',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
    'scale': 'animate-scale-in',
    'none': '',
  }[animation]

  const interactiveClass = interactive ? 'card-interactive' : 'card-hover'
  const delayStyle = delay > 0 ? { animationDelay: `${delay}ms` } : {}

  return (
    <div
      className={`card ${interactiveClass} ${animationClass} ${className}`}
      style={delayStyle}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
