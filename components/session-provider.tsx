"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface AuthSessionProviderProps {
    children: ReactNode
}

export default function AuthSessionProvider({ children }: AuthSessionProviderProps) {
    return (
        <SessionProvider 
            refetchInterval={5 * 60} // Refetch session every 5 minutes
            refetchOnWindowFocus={true} // Refetch when window gains focus
            refetchWhenOffline={false} // Don't refetch when offline
        >
            {children}
        </SessionProvider>
    )
}
