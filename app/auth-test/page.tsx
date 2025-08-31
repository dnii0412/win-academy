"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AuthDebug from "@/components/auth-debug"
import AuthStatus from "@/components/auth-status"

export default function AuthTestPage() {
    const [activeTab, setActiveTab] = useState("debug")

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Authentication Test Page</h1>
                <p className="text-gray-600">
                    Use this page to test and debug authentication functionality.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="debug">Auth Debug</TabsTrigger>
                    <TabsTrigger value="status">Auth Status</TabsTrigger>
                </TabsList>

                <TabsContent value="debug" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Authentication Debug Information</CardTitle>
                            <CardDescription>
                                Detailed information about the current authentication state
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuthDebug />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="status" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Authentication Status</CardTitle>
                            <CardDescription>
                                Simple authentication status display
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuthStatus />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
                <ol className="list-decimal list-inside text-blue-800 space-y-1">
                    <li>Check the current authentication status</li>
                    <li>Try logging in through the main site</li>
                    <li>Return to this page to see the updated status</li>
                    <li>Check browser console for any error messages</li>
                    <li>Test the refresh session functionality</li>
                </ol>
            </div>
        </div>
    )
}
