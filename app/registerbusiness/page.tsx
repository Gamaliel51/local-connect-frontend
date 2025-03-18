"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { backend_url } from "@/utils/data";

// Fix default marker icon issues with Next.js and Leaflet
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-1.png",
  iconUrl: "/marker-1.png",
  shadowUrl: "/marker-shadow.png",
});

// Component that listens for map clicks and sets the selected location
function LocationSelector({
  setLocation,
  location,
}: {
  setLocation: (coords: [number, number]) => void;
  location: [number, number] | null;
}) {
  useMapEvents({
    click(e) {
      // Leaflet gives latlng as [lat, lng]. We store as [lng, lat].
      const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
      setLocation(coords);
    },
  });
  return location ? <Marker position={[location[1], location[0]]} /> : null;
}

// Component to automatically recenter the map when center changes
function RecenterAutomatically({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function RegisterBusiness() {
  // Form state fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Instead of profileImageUrl text input, we use a file.
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  // For tags, we use a separate input and array.
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // On mount, fetch the user's current location and set it as default.
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
    // Create a FormData object to handle the file upload and other fields.
    const formData = new FormData();
    formData.append("email", email);
    formData.append("name", name);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }
    formData.append("password", password);
    formData.append("about", about);
    formData.append("address", address);
    // Append location as a JSON string, or as separate fields if your backend expects that.
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

  // Determine the map center. If location is set, convert [lng, lat] to [lat, lng]; otherwise, fallback to [0, 0]
  const mapCenter: [number, number] = location ? [location[1], location[0]] : [0, 0];

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-28 flex flex-col items-center">
      <h1 className="text-xl font-bold text-center text-gray-700 dark:text-gray-200 mb-8">
        Register Your Business
      </h1>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Business Name */}
        <div className="flex items-start flex-col">
          <label htmlFor="name" className="text-sm text-gray-700 dark:text-gray-200">
            Business Name:
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Profile Image File Input */}
        <div className="flex items-start flex-col">
          <label htmlFor="profileImage" className="text-sm text-gray-700 dark:text-gray-200">
            Profile Image:
          </label>
          <input
            type="file"
            id="profileImage"
            name="profileImage"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setProfileImage(e.target.files[0]);
              }
            }}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* About */}
        <div className="flex items-start flex-col">
          <label htmlFor="about" className="text-sm text-gray-700 dark:text-gray-200">
            About (Business Description):
          </label>
          <textarea
            id="about"
            name="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={3}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category as a Select Input */}
        <div className="flex items-start flex-col">
          <label htmlFor="category" className="text-sm text-gray-700 dark:text-gray-200">
            Category:
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
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

        {/* Tags Input */}
        <div className="flex items-start flex-col">
          <label htmlFor="tagInput" className="text-sm text-gray-700 dark:text-gray-200">
            Add Tag:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="tagInput"
              name="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3 dark:text-gray-200 dark:bg-gray-900 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md shadow-sm"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Section for selecting business location */}
        <div className="w-full h-64">
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
            Click on the map to select your business location:
          </p>
          <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterAutomatically center={mapCenter} />
            <LocationSelector setLocation={setLocation} location={location} />
          </MapContainer>
          {location && (
            <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
              Selected Location: Longitude: {location[0].toFixed(4)}, Latitude: {location[1].toFixed(4)}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium mt-16 py-4 px-4 rounded-md shadow-sm"
        >
          Register
        </button>
      </form>

      {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-sm">{success}</p>}

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-500 dark:text-gray-300">
          Already have an account?{" "}
        </span>
        <Link href="/loginbusiness" className="text-blue-500 hover:text-blue-600">
          Login
        </Link>
      </div>
    </div>
  );
}
