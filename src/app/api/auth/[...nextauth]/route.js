import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import bcrypt from "bcryptjs";

export const authOptions = {
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
                await dbConnect();

                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    throw new Error("No user found with this email");
                }

                if (user.account_status === 'banned') {
                    throw new Error('Your account has been banned.');
                }

                // For credentials login, we check email verification
                if (user.email_verified === false) {
                    throw new Error('Please verify your email address.');
                }

                // Check if password matches
                const isValid = await bcrypt.compare(credentials.password, user.password_hash);

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.avatar,
                    account_status: user.account_status,
                    warning_count: user.warning_count,
                    phone_verified: user.phone_verified,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account.provider === "google") {
                await dbConnect();
                try {
                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        // Create new user
                        await User.create({
                            name: user.name,
                            email: user.email,
                            avatar: user.image,
                            email_verified: true, // Google emails are verified
                            role: 'User',
                            account_status: 'active',
                        });
                    } else {
                        // Update existing user avatar if not set or changed
                        if (!existingUser.avatar || existingUser.avatar !== user.image) {
                            existingUser.avatar = user.image;
                            await existingUser.save();
                        }

                        // Check if banned
                        if (existingUser.account_status === 'banned') {
                            return false; // Deny sign in
                        }
                    }
                    return true;
                } catch (error) {
                    console.error("Error creating/updating user from Google login:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // If it's a new sign in, we might need to fetch the user from DB to get role/status
                // because the 'user' object from Google provider might not have our DB fields yet
                await dbConnect();
                const dbUser = await User.findOne({ email: user.email });

                if (dbUser) {
                    token.role = dbUser.role;
                    token.id = dbUser._id.toString();
                    token.account_status = dbUser.account_status;
                    token.warning_count = dbUser.warning_count;
                    token.phone_verified = dbUser.phone_verified;
                }
            }

            // Update token if session is updated (e.g. via update())
            if (trigger === "update") {
                // Fetch fresh user data from database
                await dbConnect();
                const freshUser = await User.findById(token.id);
                if (freshUser) {
                    token.role = freshUser.role;
                    token.account_status = freshUser.account_status;
                    token.warning_count = freshUser.warning_count;
                    token.phone_verified = freshUser.phone_verified;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.account_status = token.account_status;
                session.user.warning_count = token.warning_count;
                session.user.phone_verified = token.phone_verified;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
