import { auth } from "@/auth"

export async function isAdmin() {
    const session = await auth()

    if (!session?.user?.email) {
        return false
    }

    // List of admin emails - you can expand this or move to environment variables
    const adminEmails = [
        "admin@winacademy.mn",
        "sanchir@winacademy.mn",
        // Add more admin emails as needed
    ]

    return adminEmails.includes(session.user.email)
}

export async function requireAdmin() {
    const admin = await isAdmin()

    if (!admin) {
        throw new Error("Admin access required")
    }

    return true
}
