"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
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
  const mapRef = useRef<LeafletMap | null>(null);

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

  // Recalcula el tamaño del mapa cuando cambia el viewport (resize, rotacion de mobile, etc.)
  useEffect(() => {
    function handleResize() {
      mapRef.current?.invalidateSize();
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Recalcula una vez apenas el mapa termina de montarse, por si midio mal en el primer render
  useEffect(() => {
    if (!ubicacion) return;

    const timeout = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

    return () => clearTimeout(timeout);
  }, [ubicacion]);

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  if (!ubicacion) {
    return <p className="text-sm text-muted-foreground">Cargando mapa...</p>;
  }

  const posicion: [number, number] = [ubicacion.latitud, ubicacion.longitud];

  return (
    <div className="w-full overflow-hidden rounded-xl" style={{ isolation: "isolate" }}>
      <MapContainer
        center={posicion}
        zoom={15}
        scrollWheelZoom={false}
        ref={mapRef}
        className="h-48 sm:h-64 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={posicion} icon={icon}>
          <Popup>Club Norte</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}