"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error?.message || "Signup failed");
        setLoading(false);
        return;
      }

      // Automatically log them in
      await signIn("credentials", { email, password, callbackUrl: "/" });
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-6 py-12">
      <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center font-bold text-2xl mb-8 shadow-xl">
        D
      </div>
      <h1 className="text-3xl font-bold mb-2">Create Account</h1>
      <p className="text-gray-500 mb-8 text-center">Join DuoPay today.</p>

      <div className="w-full max-w-sm space-y-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl p-4 outline-none font-medium"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl p-4 outline-none font-medium"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Password</label>
            <input 
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl p-4 outline-none font-medium"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl py-4 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-gray-500 text-sm">
        Already have an account? <Link href="/login" className="text-black dark:text-white font-bold">Log in</Link>
      </p>
    </div>
  );
}
