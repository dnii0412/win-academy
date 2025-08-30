"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function CreateAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    credentials?: any
  } | null>(null)

  const createAdmin = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          credentials: data.credentials
        })
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to create admin user'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Admin User</CardTitle>
          <CardDescription>
            Create a new admin user for WIN Academy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={createAdmin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Admin...
              </>
            ) : (
              'Create Admin User'
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            }`}>
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.message}
                </span>
              </div>
              
              {result.success && result.credentials && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                  <h4 className="font-semibold text-sm mb-2">Admin Credentials:</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Email:</strong> {result.credentials.email}</div>
                    <div><strong>Password:</strong> {result.credentials.password}</div>
                    <div><strong>Role:</strong> {result.credentials.role}</div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    Use these credentials to log in at /login
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>This will create an admin user with:</p>
            <p><strong>Email:</strong> admin@winacademy.mn</p>
            <p><strong>Password:</strong> password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
