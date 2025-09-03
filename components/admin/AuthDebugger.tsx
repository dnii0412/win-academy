"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface AuthStatus {
  hasToken: boolean
  tokenLength: number
  tokenStart: string
  tokenEnd: string
  isValid: boolean
  verificationError?: string
  lastChecked: Date
}

export default function AuthDebugger() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkAuthStatus = async () => {
    setIsChecking(true)
    
    const adminToken = localStorage.getItem("adminToken")
    const tokenInfo: AuthStatus = {
      hasToken: !!adminToken,
      tokenLength: adminToken?.length || 0,
      tokenStart: adminToken ? adminToken.substring(0, 20) + "..." : "",
      tokenEnd: adminToken ? "..." + adminToken.substring(adminToken.length - 10) : "",
      isValid: false,
      lastChecked: new Date()
    }

    if (adminToken) {
      try {
        console.log("🔍 Checking token validity...")
        const response = await fetch("/api/admin/verify", {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })
        
        console.log("🔍 Verification response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        })
        
        if (response.ok) {
          tokenInfo.isValid = true
        } else {
          const errorData = await response.json().catch(() => ({}))
          tokenInfo.verificationError = errorData.message || `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (error) {
        console.error("❌ Token verification error:", error)
        tokenInfo.verificationError = error instanceof Error ? error.message : "Network error"
      }
    }

    setAuthStatus(tokenInfo)
    setIsChecking(false)
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const handleRefresh = () => {
    checkAuthStatus()
  }

  const handleClearToken = () => {
    localStorage.removeItem("adminToken")
    checkAuthStatus()
  }

  if (!authStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Admin Authentication Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading authentication status...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Admin Authentication Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Token Present</label>
            <div className="mt-1">
              {authStatus.hasToken ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  No
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Token Valid</label>
            <div className="mt-1">
              {authStatus.isValid ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Invalid
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Token Details */}
        {authStatus.hasToken && (
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-600">Token Length</label>
              <p className="text-sm text-gray-900">{authStatus.tokenLength} characters</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Token Start</label>
              <p className="text-sm font-mono text-gray-900">{authStatus.tokenStart}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Token End</label>
              <p className="text-sm font-mono text-gray-900">{authStatus.tokenEnd}</p>
            </div>
          </div>
        )}

        {/* Verification Error */}
        {authStatus.verificationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification Error:</strong> {authStatus.verificationError}
            </AlertDescription>
          </Alert>
        )}

        {/* Last Checked */}
        <div>
          <label className="text-sm font-medium text-gray-600">Last Checked</label>
          <p className="text-sm text-gray-900">
            {authStatus.lastChecked.toLocaleTimeString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {authStatus.hasToken && (
            <Button 
              onClick={handleClearToken}
              variant="destructive"
              size="sm"
            >
              Clear Token
            </Button>
          )}
        </div>

        {/* Recommendations */}
        {!authStatus.hasToken && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>No admin token found.</strong> Please log in to the admin panel first.
            </AlertDescription>
          </Alert>
        )}

        {authStatus.hasToken && !authStatus.isValid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Token is invalid or expired.</strong> Please log in again to get a fresh token.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
