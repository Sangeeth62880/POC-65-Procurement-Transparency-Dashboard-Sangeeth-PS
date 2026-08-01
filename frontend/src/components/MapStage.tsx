"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

interface StateData {
  state_code: string;
  state_name: string;
  amount: number;
  population: number;
  per_capita: number;
  lat: number | null;
  lng: number | null;
}

interface MapStageProps {
  styleUrl: string;
  markerColor: string;
  agency: string;
  category: string;
  onStateClick: (state: StateData) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function MapStage({ styleUrl, markerColor, agency, category, onStateClick }: MapStageProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const statesDataRef = useRef<StateData[]>([]);

  const [statesData, setStatesData] = useState<StateData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    state_name: string;
    amount: string;
    per_capita: string;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [-98.5795, 39.8283], // Geometric center of the US
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 10,
      attributionControl: false,
    });

    mapInstance.on("load", () => {
      setIsMapReady(true);
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.current = mapInstance;

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // Fetch States data on filters change
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const fetchStates = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (agency) queryParams.append("agency", agency);
        if (category) queryParams.append("category", category);

        const res = await fetch(`${API_BASE_URL}/api/states?${queryParams.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        setStatesData(data.results || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch states data:", err);
          setError("Failed to load map statistics");
          setStatesData([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStates();

    return () => {
      controller.abort();
    };
  }, [agency, category]);

  // Update Markers and GeoJSON Layer on Map
  useEffect(() => {
    if (!map.current || !isMapReady || statesData.length === 0) {
      // Clear existing layers and source if no data (but only if map style is ready to prevent crashes)
      if (map.current && isMapReady) {
        if (map.current.getLayer("states-points")) {
          map.current.removeLayer("states-points");
        }
        if (map.current.getSource("states-source")) {
          map.current.removeSource("states-source");
        }
      }
      setTooltip(null);
      return;
    }

    statesDataRef.current = statesData;

    // Filter out states with invalid coordinates
    const validStates = statesData.filter(
      (s) => s.lat !== null && s.lng !== null && s.amount > 0
    );

    if (validStates.length === 0) return;

    // Find min and max amount to scale
    const amounts = validStates.map((s) => s.amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    });

    // Create GeoJSON FeatureCollection
    const features = validStates.map((state) => {
      const minRadius = 6;
      const maxRadius = 24;
      let radius = minRadius;

      if (maxAmount !== minAmount) {
        const ratio = (state.amount - minAmount) / (maxAmount - minAmount);
        radius = minRadius + ratio * (maxRadius - minRadius);
      }

      const size = radius * 2;

      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [state.lng!, state.lat!],
        },
        properties: {
          state_code: state.state_code,
          state_name: state.state_name,
          amount: state.amount,
          amount_formatted: formatter.format(state.amount),
          per_capita: state.per_capita,
          per_capita_formatted: `$${Math.round(state.per_capita)}`,
          size,
        },
      };
    });

    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features,
    };

    // Remove old layers and sources
    if (map.current.getLayer("states-points")) {
      map.current.removeLayer("states-points");
    }
    if (map.current.getSource("states-source")) {
      map.current.removeSource("states-source");
    }

    // Add GeoJSON source
    map.current.addSource("states-source", {
      type: "geojson",
      data: geojson,
    });

    // Determine insertion position cleanly without assumptions to prevent styles crash
    const beforeId = map.current.getLayer("poi") ? "poi" : undefined;

    // Add circle layer (visual markers)
    map.current.addLayer(
      {
        id: "states-points",
        type: "circle",
        source: "states-source",
        paint: {
          "circle-radius": ["get", "size"],
          "circle-color": markerColor,
          "circle-opacity": 0.85,
          "circle-stroke-width": 0,
        },
      },
      beforeId
    );

    // Use map.on('mousemove') on the layer (not mouseenter)
    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.current?.queryRenderedFeatures(e.point, { layers: ["states-points"] });
      if (!features || features.length === 0) {
        setTooltip(null);
        if (map.current) {
          map.current.getCanvas().style.cursor = "";
        }
        return;
      }

      const feature = features[0];
      const props = feature.properties;

      setTooltip({
        x: e.point.x,
        y: e.point.y,
        state_name: props?.state_name || props?.state_code || "",
        amount: props?.amount_formatted || "",
        per_capita: `Per capita: ${props?.per_capita_formatted || ""}`,
      });

      if (map.current) {
        map.current.getCanvas().style.cursor = "pointer";
      }
    };

    const handleMouseLeave = () => {
      setTooltip(null);
      if (map.current) {
        map.current.getCanvas().style.cursor = "";
      }
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.current?.queryRenderedFeatures(e.point, { layers: ["states-points"] });
      if (!features || features.length === 0) return;

      const feature = features[0];
      const props = feature.properties;
      const stateCode = props?.state_code;

      const clickedState = statesDataRef.current.find((s) => s.state_code === stateCode);
      if (clickedState) {
        onStateClick(clickedState);
      }
    };

    // Attach event listeners to the layer
    map.current.on("mousemove", "states-points", handleMouseMove);
    map.current.on("mouseleave", "states-points", handleMouseLeave);
    map.current.on("click", "states-points", handleClick);

    // Cleanup function to remove event listeners
    return () => {
      if (map.current) {
        map.current.off("mousemove", "states-points", handleMouseMove);
        map.current.off("mouseleave", "states-points", handleMouseLeave);
        map.current.off("click", "states-points", handleClick);
      }
    };
  }, [statesData, isMapReady, onStateClick]);

  return (
    <div className="relative w-full h-full bg-bg">
      <div ref={mapContainer} className="w-full h-full" />

      {/* React-controlled custom tooltip div outside the WebGL canvas, offset to prevent overlap/flickering */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y - 40,
            background: "#1A1410",
            border: "1px solid #2E2418",
            borderRadius: 3,
            padding: "8px 12px",
            pointerEvents: "none",
            zIndex: 50,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          <div style={{ color: "#F0E6D3", fontSize: "13px", fontWeight: 500 }}>
            {tooltip.state_name}
          </div>
          <div style={{ color: "#D4891A", fontSize: "12px", marginTop: 2, fontWeight: 600 }}>
            {tooltip.amount}
          </div>
          <div style={{ color: "#7A6A55", fontSize: "11px", marginTop: 1 }}>
            {tooltip.per_capita}
          </div>
        </div>
      )}

      {/* Loading overlay overlay */}
      {isLoading && (
        <div className="absolute top-3 right-3 flex items-center space-x-2 border border-border bg-surface px-3 py-1.5 z-30" style={{ borderRadius: 3 }}>
          <div className="h-2 w-2 rounded-full bg-cyan-custom animate-ping" />
          <span className="text-[10px] uppercase font-semibold tracking-wider text-text-muted animate-pulse">
            Fetching Map Data...
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute top-3 right-3 border border-red-950 bg-red-950/20 px-3 py-1.5 text-[10px] font-semibold text-red-400 z-30" style={{ borderRadius: 3 }}>
          {error}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 border border-border bg-surface p-2.5 text-[10px] space-y-1.5 z-30" style={{ borderRadius: 3, backgroundColor: "#1A1410", borderColor: "#2E2418" }}>
        <div className="font-semibold uppercase tracking-wider mb-1 text-[9px]" style={{ color: "#7A6A55" }}>
          Obligation Scale
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: markerColor }} />
          <span style={{ color: "#F0E6D3" }}>Low Spending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: markerColor }} />
          <span style={{ color: "#F0E6D3" }}>Medium Spending</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: markerColor }} />
          <span style={{ color: "#F0E6D3" }}>High Spending</span>
        </div>
      </div>
    </div>
  );
}
