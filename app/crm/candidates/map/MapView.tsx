"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type Area = {
  key: string;
  label: string;
  lat: number;
  lng: number;
  people: { id: string; name: string; job_title: string | null; stage: string }[];
};

function FlyTo({ focus }: { focus: Area | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], 10, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

export default function MapView({ areas, focus }: { areas: Area[]; focus: Area | null }) {
  const biggest = Math.max(1, ...areas.map((a) => a.people.length));
  return (
    <MapContainer center={[53.2, -1.8]} zoom={6} scrollWheelZoom className="h-full w-full rounded-2xl">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FlyTo focus={focus} />
      {areas.map((a) => {
        const n = a.people.length;
        const radius = 6 + Math.sqrt(n / biggest) * 28;
        return (
          <CircleMarker
            key={a.key}
            center={[a.lat, a.lng]}
            radius={radius}
            pathOptions={{ color: "#C2410C", weight: 1.5, fillColor: "#F7931E", fillOpacity: 0.55 }}
          >
            <Tooltip direction="top">
              <span className="font-semibold">
                {a.label}: {n} {n === 1 ? "candidate" : "candidates"}
              </span>
            </Tooltip>
            <Popup maxWidth={320}>
              <div className="max-h-64 overflow-y-auto">
                <p className="mb-2 text-sm font-bold text-[#1F3447]">
                  {a.label} ({n})
                </p>
                <ul className="space-y-1">
                  {a.people.slice(0, 60).map((p) => (
                    <li key={p.id} className="text-xs">
                      <Link href={`/crm/candidates/view?id=${p.id}`} className="font-semibold text-[#1F3447] hover:underline">
                        {p.name}
                      </Link>
                      {p.job_title && <span className="text-slate-500">, {p.job_title}</span>}
                    </li>
                  ))}
                </ul>
                {n > 60 && <p className="mt-2 text-xs text-slate-500">and {n - 60} more</p>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}