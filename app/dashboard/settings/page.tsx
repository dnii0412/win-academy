"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/language-context"
import { signOut } from "next-auth/react"
import { Moon, Sun, Globe, LogOut } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { currentLanguage, setLanguage } = useLanguage()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-8">
          {currentLanguage === "mn" ? "Тохиргоо" : "Settings"}
        </h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentLanguage === "mn" ? "Тохиргоонууд" : "Preferences"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {currentLanguage === "mn" ? "Хэл" : "Language"}
                </label>
                <div className="relative">
                  <select
                    id="language"
                    value={currentLanguage}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#E10600] focus:border-[#E10600] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="en">English</option>
                    <option value="mn">Монгол</option>
                  </select>
                  <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {currentLanguage === "mn" ? "Гадаад байдал" : "Appearance"}
                </label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="flex items-center space-x-2"
                  >
                    <Sun className="h-4 w-4" />
                    <span>{currentLanguage === "mn" ? "Цагаан" : "Light"}</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="flex items-center space-x-2"
                  >
                    <Moon className="h-4 w-4" />
                    <span>{currentLanguage === "mn" ? "Хар" : "Dark"}</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="flex items-center space-x-2"
                  >
                    <span>{currentLanguage === "mn" ? "Систем" : "System"}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {currentLanguage === "mn" ? "Бүртгэл" : "Account"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 bg-transparent flex items-center space-x-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>
                  {currentLanguage === "mn" ? "Бүртгэлээс гарах" : "Logout from Account"}
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
