import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import dbConnect from "@/lib/mongoose"
import User from "@/lib/models/User"

// Helper function to merge OAuth data with existing user
async function mergeOAuthWithExistingUser(existingUser: any, user: any, account: any, profile: any) {
  try {
    const oauthProfile = profile as any
    let needsUpdate = false
    const updateData: any = {}

    // Get provider-specific data
    let providerId = ""
    let avatarUrl = ""
    let emailVerified = false

    if (account.provider === "google") {
      providerId = oauthProfile.sub
      avatarUrl = oauthProfile.picture || user.image
      emailVerified = oauthProfile.email_verified || false
    } else if (account.provider === "facebook") {
      providerId = oauthProfile.id
      avatarUrl = oauthProfile.picture?.data?.url || user.image
      emailVerified = oauthProfile.email_verified || false
    }

    // If existing user is form-based (credentials), merge OAuth data
    if (existingUser.provider === "credentials") {
      console.log(`Merging ${account.provider} OAuth data with existing form-based user: ${existingUser.email}`)
      
      // Add OAuth provider info
      updateData.provider = account.provider
      updateData.providerId = providerId
      needsUpdate = true

      // Update avatar if user doesn't have one
      if (!existingUser.avatar && !existingUser.image) {
        updateData.avatar = avatarUrl
        updateData.image = avatarUrl
      }

      // Update name if form user has incomplete name
      if (!existingUser.firstName || !existingUser.lastName) {
        const nameParts = (oauthProfile.name || user.name || "").split(" ")
        if (nameParts.length >= 2) {
          updateData.firstName = existingUser.firstName || nameParts[0]
          updateData.lastName = existingUser.lastName || nameParts.slice(1).join(" ")
          updateData.fullName = `${updateData.firstName} ${updateData.lastName}`.trim()
        }
      }

      // Update email verification status
      if (emailVerified && !existingUser.emailVerified) {
        updateData.emailVerified = true
      }
    }
    // If existing user is already OAuth, update provider info
    else if (existingUser.provider === account.provider) {
      console.log(`Updating existing ${account.provider} OAuth user: ${existingUser.email}`)
      
      // Update provider ID if different
      if (existingUser.providerId !== providerId) {
        updateData.providerId = providerId
        needsUpdate = true
      }

      // Update avatar if newer
      if (avatarUrl && avatarUrl !== existingUser.avatar) {
        updateData.avatar = avatarUrl
        updateData.image = avatarUrl
        needsUpdate = true
      }
    }
    // If existing user is different OAuth provider, add new provider info
    else if (existingUser.provider !== account.provider) {
      console.log(`Adding ${account.provider} OAuth to existing ${existingUser.provider} user: ${existingUser.email}`)
      
      // Keep existing provider but add new provider info
      // This allows users to login with multiple OAuth providers
      updateData.provider = account.provider // Update to latest provider
      updateData.providerId = providerId
      needsUpdate = true

      // Update avatar if newer
      if (avatarUrl && (!existingUser.avatar || avatarUrl !== existingUser.avatar)) {
        updateData.avatar = avatarUrl
        updateData.image = avatarUrl
      }
    }

    // Apply updates if needed
    if (needsUpdate) {
      await User.findByIdAndUpdate(existingUser._id, updateData)
      console.log(`Successfully merged ${account.provider} OAuth data for user: ${existingUser.email}`)
    } else {
      console.log(`No merge needed for user: ${existingUser.email}`)
    }
  } catch (error) {
    console.error("Error merging OAuth data with existing user:", error)
    // Don't throw error - just log it
  }
}

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
      // Handle OAuth providers (Google, Facebook, etc.)
      if (account?.provider && account.provider !== "credentials" && profile) {
        try {
          await dbConnect()

          // Check if user already exists
          const existingUser = await User.findOne({ email: user.email })

          if (!existingUser) {
            // Create new user from OAuth
            const oauthProfile = profile as any
            const nameParts = (oauthProfile.name || user.name || "").split(" ")
            const firstName = nameParts[0] || ""
            const lastName = nameParts.slice(1).join(" ") || ""

            // Get provider-specific data
            let providerId = ""
            let avatarUrl = ""
            let emailVerified = false

            if (account.provider === "google") {
              providerId = oauthProfile.sub
              avatarUrl = oauthProfile.picture || user.image
              emailVerified = oauthProfile.email_verified || false
            } else if (account.provider === "facebook") {
              providerId = oauthProfile.id
              avatarUrl = oauthProfile.picture?.data?.url || user.image
              emailVerified = oauthProfile.email_verified || false
            }

            const newUser = new User({
              email: user.email,
              firstName,
              lastName,
              fullName: oauthProfile.name || user.name,
              avatar: avatarUrl,
              image: avatarUrl,
              provider: account.provider,
              providerId: providerId,
              emailVerified: emailVerified,
            })

            await newUser.save()
            console.log(`New ${account.provider} OAuth user created: ${user.email}`)
          } else {
            // User exists - check if we need to merge OAuth data
            await mergeOAuthWithExistingUser(existingUser, user, account, profile)
          }
        } catch (error) {
          console.error(`Error handling ${account.provider} OAuth user:`, error)
          // Don't block sign in if user creation/merge fails
        }
      }

      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        // For OAuth users, we need to get the MongoDB ObjectId from the database
        if (account?.provider !== "credentials" && user.email) {
          try {
            await dbConnect()
            const dbUser = await User.findOne({ email: user.email })
            if (dbUser) {
              token.id = dbUser._id.toString()
              token.email = dbUser.email
              token.name = dbUser.fullName || `${dbUser.firstName} ${dbUser.lastName}`.trim()
              token.image = dbUser.avatar || dbUser.image
              token.role = dbUser.role
            } else {
              // Fallback to user.id if database user not found
              token.id = user.id
              token.email = user.email
              token.name = user.name
              token.image = user.image
              token.role = (user as any).role
            }
          } catch (error) {
            console.error("Error fetching OAuth user from database:", error)
            // Fallback to user.id if database query fails
            token.id = user.id
            token.email = user.email
            token.name = user.name
            token.image = user.image
            token.role = (user as any).role
          }
        } else {
          // For credentials users, use the user.id directly
          token.id = user.id
          token.email = user.email
          token.name = user.name
          token.image = user.image
          token.role = (user as any).role
        }
      }
      
      // If this is a session update trigger, fetch fresh user data
      if (trigger === "update" && token.email) {
        try {
          await dbConnect()
          const freshUser = await User.findOne({ email: token.email })
          if (freshUser) {
            token.id = freshUser._id.toString()
            token.name = freshUser.fullName || `${freshUser.firstName} ${freshUser.lastName}`.trim()
            token.image = freshUser.avatar || freshUser.image
            token.role = freshUser.role
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
