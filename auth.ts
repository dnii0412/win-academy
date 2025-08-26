import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import { z } from "zod"

const client = new MongoClient(process.env.MONGODB_URI!)

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: MongoDBAdapter(client, {
        databaseName: "newera_auth",
    }),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const { email, password } = loginSchema.parse(credentials)

                    // Connect to MongoDB
                    await client.connect()
                    const db = client.db("newera_auth")
                    const users = db.collection("users")

                    // Find user by email
                    const user = await users.findOne({ email })

                    if (!user || !user.password) {
                        return null
                    }

                    // Verify password
                    const isPasswordValid = await bcrypt.compare(password, user.password)

                    if (!isPasswordValid) {
                        return null
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    }
                } catch (error) {
                    console.error("Authorization error:", error)
                    return null
                }
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            console.log("JWT callback triggered:", {
                hasUser: !!user,
                provider: account?.provider,
                userEmail: user?.email
            })

            if (user) {
                token.id = user.id
            }

            // Handle Google sign-in
            if (account?.provider === "google") {
                try {
                    console.log("Processing Google sign-in for:", user.email)
                    await client.connect()
                    const db = client.db("newera_auth")
                    const users = db.collection("users")

                    // Check if user exists
                    const existingUser = await users.findOne({ email: user.email })

                    if (!existingUser) {
                        console.log("Creating new user for Google sign-in:", user.email)
                        // Create new user for Google sign-in
                        const newUser = {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            provider: "google",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }

                        const result = await users.insertOne(newUser)
                        token.id = result.insertedId.toString()
                        console.log("New user created with ID:", token.id)
                    } else {
                        token.id = existingUser._id.toString()
                        console.log("Existing user found with ID:", token.id)
                    }
                } catch (error) {
                    console.error("JWT callback error:", error)
                }
            }

            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
    },
    events: {
        async signIn({ user, account, profile }) {
            console.log("User signed in:", { user: user.email, provider: account?.provider })
        },
        async signOut() {
            console.log("User signed out")
        },
    },
})
