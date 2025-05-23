import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/schema";
// import { db, accounts, sessions, users, verificationTokens } from "./db/schema"

export const { handlers, auth } = NextAuth({
  // adapter: DrizzleAdapter(db, {
  //   usersTable: users,
  //   accountsTable: accounts,
  //   sessionsTable: sessions,
  //   verificationTokensTable: verificationTokens,
  // }),
  adapter: DrizzleAdapter(db),
  providers: [Google],
});
