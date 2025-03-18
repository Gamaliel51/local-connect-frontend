"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";

interface MapSectionProps {
  mapCenter: [number, number];
  userPos: [number, number];
  businessPos: [number, number];
  selectedBusinessName: string;
}

// This component sets up the routing control using leaflet-routing-machine.
function Routing({
  userPos,
  businessPos,
}: {
  userPos: [number, number];
  businessPos: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    // @ts-ignore
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userPos[0], userPos[1]),
        L.latLng(businessPos[0], businessPos[1]),
      ],
      lineOptions: {
        styles: [{ color: "blue", weight: 4 }],
      },
      // Disable automatic marker creation (we already have our own markers)
      createMarker: function () {
        return null;
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, userPos, businessPos]);

  return null;
}

export default function MapSection({
  mapCenter,
  userPos,
  businessPos,
  selectedBusinessName,
}: MapSectionProps) {
  // Fix default marker icon issues on the client side.
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
        {/* Add the routing control to display directions */}
        <Routing userPos={userPos} businessPos={businessPos} />
      </MapContainer>
    </div>
  );
}
