"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import dynamic from "next/dynamic";
import { backend_url } from "@/utils/data";

const MapSelector = dynamic(() => import("@/components/MapSelector"), { ssr: false });

export default function RegisterBusiness() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setLocation(userCoords);
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!location) {
      setError("Please select your business location on the map.");
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("name", name);
    if (profileImage) formData.append("profileImage", profileImage);
    formData.append("password", password);
    formData.append("about", about);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("location", JSON.stringify(location));
    formData.append("category", category);
    formData.append("tags", JSON.stringify(tags));

    try {
      await axios.post(`${backend_url}/business/signup`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Business registered successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const mapCenter: [number, number] = location ? [location[1], location[0]] : [0, 0];

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <div className="bg-gradient-to-br from-blue-50 to-white pt-16">
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-8 text-center">
              Register Your Business
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && setProfileImage(e.target.files[0])}
                  className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* About */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="Restaurants">Restaurants</option>
                  <option value="Retail">Retail</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Services">Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Health">Health</option>
                  <option value="Beauty">Beauty</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter a tag and press Add"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = tagInput.trim();
                      if (trimmed && !tags.includes(trimmed)) {
                        setTags([...tags, trimmed]);
                        setTagInput("");
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md shadow-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Map Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Business Location
                </label>
                <div className="w-full h-96 rounded-xl overflow-hidden border border-gray-200">
                  <MapSelector mapCenter={mapCenter} location={location} setLocation={setLocation} />
                </div>
                {location && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected Coordinates: {location[0].toFixed(4)}, {location[1].toFixed(4)}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md transition-colors duration-200"
              >
                Register Business
              </button>

              {/* Status Messages */}
              {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
              {success && <p className="mt-4 text-green-600 text-center">{success}</p>}
            </form>

            <div className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link 
                href="/loginbusiness" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Login here
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Local Connect
              </h3>
              <p className="text-gray-600">
                Connecting communities with local businesses
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/faq" className="text-gray-600 hover:text-blue-600">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 hover:text-blue-600">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-gray-600 hover:text-blue-600">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-600 hover:text-blue-600">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} Local Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}