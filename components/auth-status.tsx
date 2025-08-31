"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AuthStatus() {
  const { data: session, status } = useSession()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
        <CardDescription>Current session information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={status === "authenticated" ? "default" : status === "loading" ? "secondary" : "destructive"}>
            {status}
          </Badge>
        </div>
        
        {session && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-sm text-muted-foreground">{session.user?.id}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">{session.user?.email}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Name:</span>
              <span className="text-sm text-muted-foreground">{session.user?.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Expires:</span>
              <span className="text-sm text-muted-foreground">
                {session.expires ? new Date(session.expires).toLocaleString() : "Unknown"}
              </span>
            </div>
          </>
        )}
        
        {status === "unauthenticated" && (
          <p className="text-sm text-muted-foreground text-center">
            No active session. Please log in to continue.
          </p>
        )}
        
        {status === "loading" && (
          <p className="text-sm text-muted-foreground text-center">
            Loading session...
          </p>
        )}
      </CardContent>
    </Card>
  )
}
