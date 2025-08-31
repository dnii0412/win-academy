"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthDebug() {
  const { data: session, status } = useSession()

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Authentication Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div><strong>Status:</strong> {status}</div>
          <div><strong>Session exists:</strong> {session ? "Yes" : "No"}</div>
          <div><strong>User ID:</strong> {session?.user?.id || "None"}</div>
          <div><strong>User Email:</strong> {session?.user?.email || "None"}</div>
          <div><strong>User Name:</strong> {session?.user?.name || "None"}</div>
          <div><strong>NEXTAUTH_SECRET exists:</strong> {process.env.NEXTAUTH_SECRET ? "Yes" : "No"}</div>
          <div><strong>Current URL:</strong> {typeof window !== "undefined" ? window.location.href : "Server-side"}</div>
        </div>
      </CardContent>
    </Card>
  )
}
