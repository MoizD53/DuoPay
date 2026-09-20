"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-6">
      <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center font-bold text-2xl mb-8 shadow-xl">
        D
      </div>
      <h1 className="text-3xl font-bold mb-2">DuoPay</h1>
      <p className="text-gray-500 mb-8 text-center">Split. Simplify. Get to ₹0.</p>

      <div className="w-full max-w-sm space-y-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
        </div>

        <button 
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white font-bold rounded-xl py-4 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          Continue with Google
        </button>
      </div>

      <p className="mt-8 text-gray-500 text-sm">
        New to DuoPay? <Link href="/signup" className="text-black dark:text-white font-bold">Create account</Link>
      </p>
    </div>
  );
}
