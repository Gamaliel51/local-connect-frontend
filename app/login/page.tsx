"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { backend_url } from "@/utils/data";
import { redirect } from "next/navigation";

export default function UserLogin() {
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
        `${backend_url}/user/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      sessionStorage.setItem('token', response.data.token)
      sessionStorage.setItem('email', email)
      setSuccess("Logged in successfully!");
      setEmail('')
      setPassword('')
      setTimeout(() => redirect('/dashboard'), 1500)
      // Optionally redirect or store token here
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="max-w-lg mt-28 mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-10 flex flex-col items-center">
      <h1 className="text-xl font-bold text-center text-gray-700 dark:text-gray-200 mb-8">
        User Login
      </h1>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div className="flex items-start flex-col">
          <label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-200">
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex items-start flex-col">
          <label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-200">
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
        Don't have an account?{" "}
        <Link href="/user/signup" className="text-blue-500">
          Sign Up
        </Link>
      </p>
      <Link href={'/loginbusiness'} className="text-blue-600 hover:text-blue-700 mt-2 font-extralight text-xs">business account login</Link>
    </div>
  );
}
