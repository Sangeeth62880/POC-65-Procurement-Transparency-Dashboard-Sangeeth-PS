"use client";

import React, { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import FilterBar from "@/components/FilterBar";
import MapStage from "@/components/MapStage";
import Charts from "@/components/Charts";
import Sidebar from "@/components/Sidebar";

interface Agency {
  id: number;
  code: string | null;
  name: string;
  abbreviation: string | null;
}

interface StateData {
  state_code: string;
  state_name: string;
  amount: number;
  population: number;
  per_capita: number;
  lat: number | null;
  lng: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  
  // Active Filter states
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  // Map click drilldown state
  const [selectedStateData, setSelectedStateData] = useState<StateData | null>(null);

  // Toggle to show/hide charts modal (default to hidden)
  const [showCharts, setShowCharts] = useState(false);

  // Fetch agencies on mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchAgencies = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/agencies`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch agencies");
        const data = await res.json();
        setAgencies(data.results || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching agencies:", err);
        }
      }
    };

    fetchAgencies();

    return () => {
      controller.abort();
    };
  }, []);

  const handleClearFilters = () => {
    setSelectedAgency("");
    setSelectedCategory("");
    setSelectedState("");
    setSelectedStateData(null);
  };

  const handleStateClick = (stateData: StateData) => {
    setSelectedStateData(stateData);
    setSelectedState(stateData.state_code);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-text-primary">
      {/* Top Header */}
      <Topbar />

      {/* Filter Row */}
      <FilterBar
        agencies={agencies}
        selectedAgency={selectedAgency}
        selectedCategory={selectedCategory}
        selectedState={selectedState}
        onAgencyChange={setSelectedAgency}
        onCategoryChange={setSelectedCategory}
        onStateChange={setSelectedState}
        onClearFilters={handleClearFilters}
      />

      {/* Main Layout Container - NO LAYOUT SHIFT */}
      <div className="flex flex-col flex-1 w-full h-[calc(100vh-96px)] overflow-hidden relative">
        
        {/* Fixed Split Layout: Map (70%) & Sidebar (30%) - ALWAYS SAME HEIGHT */}
        <div className="grid grid-cols-[70%_30%] w-full h-full">
          {/* Map Stage (70% width) */}
          <div className="w-full h-full border-r border-border relative overflow-hidden bg-bg">
            <MapStage
              agency={selectedAgency}
              category={selectedCategory}
              onStateClick={handleStateClick}
            />

            {/* Toggle Button in bottom-right corner of Map */}
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="absolute bottom-3 right-3 flex items-center space-x-1.5 border border-border bg-surface hover:bg-surface/80 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-text-muted transition-colors duration-200 z-20 cursor-pointer shadow-lg animate-fadeIn"
            >
              <span>{showCharts ? "Hide Charts" : "Show Charts"}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transform transition-transform duration-300 ${showCharts ? "rotate-180" : ""}`}
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>

          {/* Sidebar Section (30% width) - Fixed/Always Visible */}
          <div className="w-full h-full overflow-hidden">
            <Sidebar
              agency={selectedAgency}
              category={selectedCategory}
              state={selectedState}
              selectedStateData={selectedStateData}
              onCloseStateDetail={() => setSelectedStateData(null)}
            />
          </div>
        </div>

        {/* Charts Modal Overlay - POSITIONED ABOVE MAP & SIDEBAR, NO LAYOUT SHIFT */}
        {showCharts && (
          <>
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-xs z-30 transition-opacity duration-300 cursor-pointer"
              onClick={() => setShowCharts(false)}
            />

            {/* Charts Modal Panel */}
            <div className="absolute inset-0 z-40 p-6 overflow-hidden flex items-center justify-center pointer-events-none">
              <div className="w-full h-full bg-surface border border-border rounded-md shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-fadeIn">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                    Procurement Analytics
                  </h2>
                  <button
                    onClick={() => setShowCharts(false)}
                    className="flex items-center justify-center w-8 h-8 rounded border border-border hover:border-cyan-custom hover:bg-bg transition-colors duration-200 cursor-pointer text-text-muted hover:text-text-primary"
                    aria-label="Close charts"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content - Charts */}
                <div className="flex-1 overflow-auto">
                  <Charts
                    agency={selectedAgency}
                    category={selectedCategory}
                    state={selectedState}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add animation for modal fade-in cleanly using standard HTML/React dangerous inner HTML style sheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}
