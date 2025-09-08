import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          // Ensure MongoDB is connected
          await dbConnect()

          // Check if User model is available
          if (!User) {
            throw new Error("User model not available. Database connection issue.")
          }

          // Find user by email
          const user = await User.findOne({ email: credentials.email }).exec()

          if (!user) {
            throw new Error("Invalid email or password")
          }

          // Verify password - ensure password is a string
          const userPassword = user.password as string
          if (!userPassword) {
            throw new Error("Invalid email or password")
          }

          const isPasswordValid = await bcryptjs.compare(credentials.password, userPassword)

          if (!isPasswordValid) {
            throw new Error("Invalid email or password")
          }

          // Return user object (without password)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.displayName || user.fullName || user.email,
            image: user.avatar || user.image || null,
            role: user.role || "user",
          }
        } catch (error: any) {
          console.error("Authentication error:", error)

          if (error.name === 'MongooseServerSelectionError') {
            throw new Error("Database connection failed. Please try again in a moment.")
          }

          if (error.name === 'MongoServerError' && error.code === 8000) {
            throw new Error("Database authentication failed. Please contact support.")
          }

          // Check for User model issues
          if (error.message?.includes('User') || error.message?.includes('model')) {
            throw new Error("Database model error. Please check your database connection.")
          }

          throw new Error(error.message || "Authentication failed")
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          await dbConnect()

          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email })

          if (!existingUser) {
            // Create new user from Google OAuth
            const googleProfile = profile as any
            const nameParts = (googleProfile.name || user.name || "").split(" ")
            const firstName = nameParts[0] || ""
            const lastName = nameParts.slice(1).join(" ") || ""

            const newUser = new User({
              email: user.email,
              firstName,
              lastName,
              fullName: googleProfile.name || user.name,
              avatar: googleProfile.picture || user.image,
              image: googleProfile.picture || user.image,
              provider: "google",
              providerId: googleProfile.sub,
              emailVerified: googleProfile.email_verified || false,
            })

            await newUser.save()
            console.log("New Google OAuth user created")
          }
        } catch (error) {
          console.error("Error creating Google OAuth user:", error)
          // Don't block sign in if user creation fails
        }
      }

      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.image = user.image
        token.role = (user as any).role
      }
      
      // If this is a session update trigger, fetch fresh user data
      if (trigger === "update" && token.email) {
        try {
          await dbConnect()
          const freshUser = await User.findOne({ email: token.email })
          if (freshUser) {
            token.name = freshUser.fullName || `${freshUser.firstName} ${freshUser.lastName}`.trim()
            token.image = freshUser.avatar || freshUser.image
          }
        } catch (error) {
          console.error("Error fetching fresh user data for JWT update:", error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string | null
        (session.user as any).role = (token as any).role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
})
