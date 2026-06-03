import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Always allow sign in with Google
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user && token.role) {
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.id = account.providerAccountId;
      }
      // Check if user is admin based on email
      if (token.email) {
        const adminEmails = (process.env.AUTH_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase());
        token.role = adminEmails.includes(token.email.toLowerCase()) ? 'admin' : 'user';
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
});

// Extend the default session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface JWT {
    role?: string;
  }
}
