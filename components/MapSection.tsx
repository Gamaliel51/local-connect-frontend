"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface MapSectionProps {
  mapCenter: [number, number];
  userPos: [number, number];
  businessPos: [number, number];
  selectedBusinessName: string;
}

export default function MapSection({
  mapCenter,
  userPos,
  businessPos,
  selectedBusinessName,
}: MapSectionProps) {
  // Fix default marker icon issues
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-1.png",
      iconUrl: "/marker-1.png",
      shadowUrl: "/marker-shadow.png",
    });
  }, []);

  return (
    <div className="w-full h-[450px]">
      <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={userPos}>
          <Popup>You are here</Popup>
        </Marker>
        <Marker position={businessPos}>
          <Popup>{selectedBusinessName}</Popup>
        </Marker>
        <Polyline positions={[userPos, businessPos]} color="blue" />
      </MapContainer>
    </div>
  );
}
