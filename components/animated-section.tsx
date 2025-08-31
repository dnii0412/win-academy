"use client"

import { useInView } from "react-intersection-observer"
import type { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  animation?: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight"
}

export default function AnimatedSection({ children, className = "", animation = "fadeUp" }: AnimatedSectionProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  const getAnimationClass = () => {
    const baseClass = "transition-all duration-1000 ease-out"

    if (!inView) {
      switch (animation) {
        case "fadeUp":
          return `${baseClass} opacity-0 translate-y-8`
        case "fadeIn":
          return `${baseClass} opacity-0`
        case "slideLeft":
          return `${baseClass} opacity-0 -translate-x-8`
        case "slideRight":
          return `${baseClass} opacity-0 translate-x-8`
        default:
          return `${baseClass} opacity-0 translate-y-8`
      }
    }

    return `${baseClass} opacity-100 translate-y-0 translate-x-0`
  }

  return (
    <div ref={ref} className={`${getAnimationClass()} ${className}`}>
      {children}
    </div>
  )
}
