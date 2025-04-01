"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { backend_url } from "@/utils/data";
import { redirect } from "next/navigation";

export default function BusinessLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${backend_url}/business/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('email', email);
      setSuccess("Logged in successfully!");
      setEmail("");
      setPassword("");
      setTimeout(() => redirect('/businessdashboard'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eff6ff]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">
          Business Login
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label htmlFor="email" className="text-sm text-blue-900 mb-1">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="password" className="text-sm text-blue-900 mb-1">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Login
          </button>
        </form>
        <p className="text-sm text-blue-700 mt-4 text-center">
          Don't have an account?{" "}
          <Link href="/registerbusiness" className="text-blue-500 hover:text-blue-600">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
