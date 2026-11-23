"use client";

// Map of where our drivers are, by area
import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type CoverageArea = { key: string; label: string; lat: number; lng: number; count: number };

function Fit({ areas }: { areas: CoverageArea[] }) {
  const map = useMap();
  useEffect(() => {
    if (areas.length > 1) map.fitBounds(areas.map((a) => [a.lat, a.lng] as [number, number]), { padding: [40, 40], maxZoom: 8 });
  }, [areas, map]);
  return null;
}

export default function CoverageMap({ areas, unit }: { areas: CoverageArea[]; unit: string }) {
  const biggest = Math.max(1, ...areas.map((a) => Number(a.count) || 0));
  return (
    <>
    <style>{`.rnr-dark-tiles{filter:invert(100%) hue-rotate(180deg) brightness(.9) contrast(.9) saturate(.6)}.leaflet-container{background:#0F2438}.rnr-dot{filter:drop-shadow(0 0 6px rgba(247,147,30,.9))}`}</style>
    <MapContainer center={[53.0, -1.9]} zoom={6} scrollWheelZoom={false} className="h-full w-full" attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="rnr-dark-tiles"
      />
      <Fit areas={areas} />
      {areas.map((a) => (
        <CircleMarker
          key={a.key}
          center={[a.lat, a.lng]}
          radius={8 + Math.sqrt((Number(a.count) || 1) / biggest) * 24}
          pathOptions={{ color: "#FFB866", weight: 2, fillColor: "#F7931E", fillOpacity: 0.7, className: "rnr-dot" }}
        >
          <Tooltip direction="top">
            <span className="font-semibold">
              {a.label} area{a.count ? `: ${a.count}+ ${unit}` : ""}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
    </>
  );
}
