"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import provincesGeoJSON from "@/data/indonesia-provinces.json";

// Timer for distinguishing click from double-click
let clickTimer: ReturnType<typeof setTimeout> | null = null;

interface Penempatan {
  no: number;
  nama: string;
  jabatan: string;
  unitKerja: string;
  provinsi: string;
}

interface MapComponentProps {
  provinceStats: { [key: string]: Penempatan[] };
  selectedProvince: string | null;
  onProvinceSelect: (province: string | null) => void;
  onProvinceHover?: (province: string | null) => void;
  onProvinceDoubleClick?: (province: string) => void;
}

// Mapping from GeoJSON names (title case) to data names (uppercase)
const provinceNameMapping: { [key: string]: string } = {
  Aceh: "ACEH",
  Bali: "BALI",
  Banten: "BANTEN",
  Bengkulu: "BENGKULU",
  "Daerah Istimewa Yogyakarta": "DAERAH ISTIMEWA YOGYAKARTA",
  "DKI Jakarta": "DKI JAKARTA",
  Gorontalo: "GORONTALO",
  Jambi: "JAMBI",
  "Jawa Barat": "JAWA BARAT",
  "Jawa Tengah": "JAWA TENGAH",
  "Jawa Timur": "JAWA TIMUR",
  "Kalimantan Barat": "KALIMANTAN BARAT",
  "Kalimantan Selatan": "KALIMANTAN SELATAN",
  "Kalimantan Tengah": "KALIMANTAN TENGAH",
  "Kalimantan Timur": "KALIMANTAN TIMUR",
  "Kalimantan Utara": "KALIMANTAN UTARA",
  "Kepulauan Bangka Belitung": "KEPULAUAN BANGKA BELITUNG",
  "Kepulauan Riau": "KEPULAUAN RIAU",
  Lampung: "LAMPUNG",
  Maluku: "MALUKU",
  "Maluku Utara": "MALUKU UTARA",
  "Nusa Tenggara Barat": "NUSA TENGGARA BARAT",
  "Nusa Tenggara Timur": "NUSA TENGGARA TIMUR",
  Papua: "PAPUA",
  "Papua Barat": "PAPUA BARAT",
  "Papua Barat Daya": "PAPUA BARAT DAYA",
  "Papua Pegunungan": "PAPUA PEGUNUNGAN",
  "Papua Selatan": "PAPUA SELATAN",
  "Papua Tengah": "PAPUA TENGAH",
  Riau: "RIAU",
  "Sulawesi Barat": "SULAWESI BARAT",
  "Sulawesi Selatan": "SULAWESI SELATAN",
  "Sulawesi Tengah": "SULAWESI TENGAH",
  "Sulawesi Tenggara": "SULAWESI TENGGARA",
  "Sulawesi Utara": "SULAWESI UTARA",
  "Sumatera Barat": "SUMATERA BARAT",
  "Sumatera Selatan": "SUMATERA SELATAN",
  "Sumatera Utara": "SUMATERA UTARA",
};

function getColor(count: number): string {
  if (count === 0) return "#e2e8f0";
  if (count <= 5) return "#dbeafe";
  if (count <= 10) return "#93c5fd";
  if (count <= 15) return "#60a5fa";
  if (count <= 20) return "#3b82f6";
  return "#1e40af";
}

export default function MapComponent({
  provinceStats,
  selectedProvince,
  onProvinceSelect,
  onProvinceHover,
  onProvinceDoubleClick,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    count: number;
    people: Penempatan[];
    x: number;
    y: number;
  } | null>(null);

  const getDataProvinceName = (geoJsonName: string): string => {
    return provinceNameMapping[geoJsonName] || geoJsonName.toUpperCase();
  };

  const handleMouseEvent = useCallback(
    (
      provinceName: string,
      people: Penempatan[],
      count: number,
      event: L.LeafletMouseEvent
    ) => {
      const mapContainer = mapRef.current;
      if (!mapContainer) return;

      const rect = mapContainer.getBoundingClientRect();
      const x = event.originalEvent.clientX - rect.left;
      const y = event.originalEvent.clientY - rect.top;

      setTooltipContent({
        name: provinceName,
        count,
        people,
        x,
        y,
      });

      onProvinceHover?.(provinceName);
    },
    [onProvinceHover]
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-2.5, 118],
      zoom: 5,
      minZoom: 4,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: false, // Disable to allow custom double-click handling
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const geoJsonLayer = L.geoJSON(
      provincesGeoJSON as GeoJSON.FeatureCollection,
      {
        style: (feature) => {
          const geoJsonName = feature?.properties?.PROVINSI || "";
          const dataName = getDataProvinceName(geoJsonName);
          const count = provinceStats[dataName]?.length || 0;
          const isSelected = selectedProvince === dataName;

          return {
            fillColor: getColor(count),
            fillOpacity: isSelected ? 0.9 : 0.75,
            color: isSelected ? "#1e3a5f" : "#64748b",
            weight: isSelected ? 3 : 1,
            opacity: 1,
          };
        },
        onEachFeature: (feature, layer) => {
          const geoJsonName = feature.properties?.PROVINSI || "";
          const dataName = getDataProvinceName(geoJsonName);
          const people = provinceStats[dataName] || [];
          const count = people.length;

          layer.on({
            mouseover: (e: L.LeafletMouseEvent) => {
              const targetLayer = e.target;
              targetLayer.setStyle({
                weight: 3,
                color: "#1e3a5f",
                fillOpacity: 0.9,
              });
              targetLayer.bringToFront();
              handleMouseEvent(dataName, people, count, e);
            },
            mouseout: (e: L.LeafletMouseEvent) => {
              geoJsonLayer.resetStyle(e.target);
              setTooltipContent(null);
              onProvinceHover?.(null);
            },
            mousemove: (e: L.LeafletMouseEvent) => {
              const mapContainer = mapRef.current;
              if (!mapContainer) return;
              const rect = mapContainer.getBoundingClientRect();
              const x = e.originalEvent.clientX - rect.left;
              const y = e.originalEvent.clientY - rect.top;
              setTooltipContent((prev) => (prev ? { ...prev, x, y } : null));
            },
            click: (e: L.LeafletMouseEvent) => {
              // Use timeout to distinguish single click from double click
              if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
              }
              clickTimer = setTimeout(() => {
                onProvinceSelect(
                  dataName === selectedProvince ? null : dataName
                );
                clickTimer = null;
              }, 250);
            },
            dblclick: (e: L.LeafletMouseEvent) => {
              // Cancel single click action
              if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
              }
              // Prevent default map zoom
              L.DomEvent.stopPropagation(e);
              if (count > 0) {
                onProvinceDoubleClick?.(dataName);
              }
            },
          });
        },
      }
    ).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;
  }, [
    provinceStats,
    selectedProvince,
    onProvinceSelect,
    onProvinceHover,
    onProvinceDoubleClick,
    handleMouseEvent,
  ]);

  // Calculate tooltip position to keep it in viewport
  const getTooltipStyle = () => {
    if (!tooltipContent || !mapRef.current) return {};

    const mapRect = mapRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 100;

    let left = tooltipContent.x + 15;
    let top = tooltipContent.y - 10;

    if (left + tooltipWidth > mapRect.width) {
      left = tooltipContent.x - tooltipWidth - 15;
    }
    if (top + tooltipHeight > mapRect.height) {
      top = mapRect.height - tooltipHeight - 10;
    }
    if (top < 10) {
      top = 10;
    }

    return { left, top };
  };

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="leaflet-map"></div>

      {tooltipContent && (
        <div
          className="custom-tooltip simple-tooltip"
          style={getTooltipStyle()}
        >
          <div className="tooltip-header">
            <h3>{tooltipContent.name}</h3>
            <span className="tooltip-count">{tooltipContent.count} orang</span>
          </div>
          <div className="tooltip-hint">
            (double klik untuk informasi lengkap)
          </div>
        </div>
      )}
    </div>
  );
}
