"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { backend_url } from "@/utils/data";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await axios.post(`${backend_url}/user/signup`, {
        name,
        email,
        password,
        address
      });
      setSuccess("User registered successfully!");
      setAddress('')
      setEmail('')
      setConfirmPassword('')
      setPassword('')
      setName('')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-10 flex flex-col items-center">
      <h1 className="text-xl font-bold text-center text-gray-700 dark:text-gray-200 mb-8">
        Sign Up
      </h1>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Name */}
        <div className="flex items-start flex-col">
          <label htmlFor="name" className="text-sm text-gray-700 dark:text-gray-200">
            Name:
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Email */}
        <div className="flex items-start flex-col">
          <label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-200">
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password */}
        <div className="flex items-start flex-col">
          <label htmlFor="password" className="text-sm text-gray-700 dark:text-gray-200">
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="flex items-start flex-col">
          <label htmlFor="confirmPassword" className="text-sm text-gray-700 dark:text-gray-200">
            Confirm Password:
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Address */}
        <div className="flex items-start flex-col">
          <label htmlFor="address" className="text-sm text-gray-700 dark:text-gray-200">
            Address:
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Success Message */}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Sign Up
        </button>
      </form>

      {/* Redirect to Login */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
        Already have an account? <Link href="/login" className="text-blue-500">Log in</Link>
      </p>
      <Link href={'/registerbusiness'} className="text-blue-600 hover:text-blue-700 mt-2 font-extralight text-xs">register business</Link>
    </div>
  );
}
