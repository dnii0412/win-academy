"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CourseModalityToggleProps {
  onModalityChange: (modality: "online" | "onsite" | "all") => void
  defaultModality?: "online" | "onsite" | "all"
}

export function CourseModalityToggle({ onModalityChange, defaultModality = "all" }: CourseModalityToggleProps) {
  const [activeModality, setActiveModality] = useState(defaultModality)

  const handleModalityChange = (modality: "online" | "onsite" | "all") => {
    setActiveModality(modality)
    onModalityChange(modality)
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-8">
      <Button
        variant={activeModality === "all" ? "default" : "outline"}
        onClick={() => handleModalityChange("all")}
        className={activeModality === "all" ? "bg-[#E10600] hover:bg-[#C70500]" : ""}
      >
        Бүгд
      </Button>
      <Button
        variant={activeModality === "online" ? "default" : "outline"}
        onClick={() => handleModalityChange("online")}
        className={activeModality === "online" ? "bg-[#E10600] hover:bg-[#C70500]" : ""}
      >
        Онлайн
      </Button>
      <Button
        variant={activeModality === "onsite" ? "default" : "outline"}
        onClick={() => handleModalityChange("onsite")}
        className={activeModality === "onsite" ? "bg-[#E10600] hover:bg-[#C70500]" : ""}
      >
        Танхим
      </Button>
    </div>
  )
}
