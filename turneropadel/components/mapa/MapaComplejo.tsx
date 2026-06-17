"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Ubicacion = {
  latitud: number;
  longitud: number;
};

type Props = {
  idCancha: number;
};

export function MapaComplejo({ idCancha }: Props) {
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    fetch(`/api/cancha/${idCancha}/ubicacion`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "No se pudo obtener la ubicacion");
        return json as Ubicacion;
      })
      .then((data) => {
        if (!cancelado) setUbicacion(data);
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : "Error de red");
      });

    return () => {
      cancelado = true;
    };
  }, [idCancha]);

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  if (!ubicacion) {
    return <p className="text-sm text-muted-foreground">Cargando mapa...</p>;
  }

  const posicion: [number, number] = [ubicacion.latitud, ubicacion.longitud];

  return (
    <MapContainer center={posicion} zoom={15} scrollWheelZoom={false} className="h-64 w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={posicion} icon={icon}>
        <Popup>Club Norte</Popup>
      </Marker>
    </MapContainer>
  );
}