import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
          .then((res) => res[0]);

        if (!userRecord || !userRecord.passwordHash) {
          // If no user or they signed up with Google and don't have a password
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, userRecord.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          image: userRecord.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt", // Use JWT to keep it compatible with Edge/Credentials
  },
  pages: {
    signIn: "/login",
    newUser: "/profile",
  },
});
