"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function AuthDebug() {
  const { data: session, status, update } = useSession()

  const handleRefresh = async () => {
    await update()
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'unauthenticated':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'authenticated':
        return 'bg-green-100 text-green-800'
      case 'unauthenticated':
        return 'bg-red-100 text-red-800'
      case 'loading':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Authentication Debug
        </CardTitle>
        <CardDescription>
          Debug information about the current authentication state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge className={getStatusColor()}>
            {status}
          </Badge>
        </div>
        
        {session && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-sm text-muted-foreground font-mono">
                {session.user?.id || 'Not available'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">
                {session.user?.email || 'Not available'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Name:</span>
              <span className="text-sm text-muted-foreground">
                {session.user?.name || 'Not available'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Expires:</span>
              <span className="text-sm text-muted-foreground">
                {session.expires ? new Date(session.expires).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </>
        )}
        
        {status === 'unauthenticated' && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              No active session. Please log in to continue.
            </p>
            <Button asChild size="sm">
              <a href="/login">Go to Login</a>
            </Button>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          <p>This component helps debug authentication issues.</p>
          <p>Check the browser console for any error messages.</p>
        </div>
      </CardContent>
    </Card>
  )
}
