"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapSelectorProps {
  mapCenter: [number, number];
  location: [number, number] | null;
  setLocation: (coords: [number, number]) => void;
}

// Listens for map clicks and sets the location.
// Leaflet returns coordinates as {lat, lng} so we switch to [lng, lat].
function LocationSelector({
  setLocation,
  location,
}: {
  setLocation: (coords: [number, number]) => void;
  location: [number, number] | null;
}) {
  useMapEvents({
    click(e) {
      const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
      setLocation(coords);
    },
  });
  return location ? <Marker position={[location[1], location[0]]} /> : null;
}

// Recenter the map when the center prop changes.
function RecenterAutomatically({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapSelector({ mapCenter, location, setLocation }: MapSelectorProps) {
  // Fix default marker icons on the client side.
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-1.png",
      iconUrl: "/marker-1.png",
      shadowUrl: "/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterAutomatically center={mapCenter} />
      <LocationSelector setLocation={setLocation} location={location} />
    </MapContainer>
  );
}
