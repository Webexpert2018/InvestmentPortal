"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="relative inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] transition hover:bg-[#EBEBEB] dark:bg-gray-800 dark:hover:bg-gray-700">
        <span className="sr-only">Toggle theme loading</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] transition hover:bg-[#EBEBEB] dark:bg-gray-800 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      <Sun className="h-[21px] w-[21px] text-[#555555] dark:text-gray-200 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" strokeWidth={1.8} />
      <Moon className="absolute h-[21px] w-[21px] text-[#555555] dark:text-gray-200 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" strokeWidth={1.8} />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
