import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user) throw new Error('Invalid email or password')
        if (!user.isActive) throw new Error('Your account has been suspended. Contact support.')
        if (!user.isEmailVerified) throw new Error('UNVERIFIED:' + user.email)
        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) throw new Error('Invalid email or password')
        return { id: user.id, email: user.email, name: user.fullName, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.loginAt = Date.now()
      }
      // Force expire if session older than 24h
      const loginAt = token.loginAt as number
      if (loginAt && Date.now() - loginAt > 24 * 60 * 60 * 1000) {
        return token
      }
      return token
    },
    async session({ session, token }) {
      if (!token?.id) {
        // Token expired or cleared — invalidate session
        session.user = {} as any
        return session
      }
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,        // session cookie lives 24h max
    updateAge: 60 * 60,           // refresh token every 1h of activity
  },
  secret: process.env.NEXTAUTH_SECRET,
}
