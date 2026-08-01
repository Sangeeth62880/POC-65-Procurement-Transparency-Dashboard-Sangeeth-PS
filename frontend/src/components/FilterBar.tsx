"use client";

import React from "react";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const CATEGORIES = ["contracts", "grants", "loans", "idvs", "other"];

interface AgencyOption {
  id: number;
  code: string | null;
  name: string;
  abbreviation: string | null;
}

interface FilterBarProps {
  agencies: AgencyOption[];
  selectedAgency: string;
  selectedCategory: string;
  selectedState: string;
  onAgencyChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onStateChange: (val: string) => void;
  onClearFilters: () => void;
  isDark: boolean;
}

export default function FilterBar({
  agencies,
  selectedAgency,
  selectedCategory,
  selectedState,
  onAgencyChange,
  onCategoryChange,
  onStateChange,
  onClearFilters,
  isDark,
}: FilterBarProps) {
  const containerBg = 'rgba(26, 20, 16, 0.92)';
  const containerBorder = '#2E2418';
  const inputBg = undefined;
  const inputBorder = undefined;
  const inputText = undefined;
  const placeholderText = undefined;
  const activeBorder = '#D4891A';
  const activeText = '#D4891A';
  return (
    <div className="fixed top-[56px] left-3 z-30 flex items-center px-4 py-2 space-x-3" style={{ background: containerBg, border: `1px solid ${containerBorder}`, borderRadius: 3 }}>
      {/* Agency Dropdown */}
      <div className="flex flex-col">
        <select
          value={selectedAgency}
          onChange={(e) => onAgencyChange(e.target.value)}
          className={`h-8 w-60 px-2.5 text-xs border outline-none transition-colors ${
            selectedAgency
              ? "font-medium"
              : "hover:border-text-muted"
          }`}
          style={{
            borderRadius: 3,
            backgroundColor: inputBg,
            borderColor: selectedAgency ? activeBorder : inputBorder,
            color: selectedAgency ? activeText : (inputText || (selectedAgency ? undefined : undefined)),
          }}
        >
          <option value="">Select Agency</option>
          {agencies.map((agency) => (
            <option key={agency.id} value={agency.name}>
              {agency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category Dropdown */}
      <div className="flex flex-col">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`h-8 w-44 px-2.5 text-xs border outline-none transition-colors capitalize ${
            selectedCategory
              ? "font-medium"
              : "hover:border-text-muted"
          }`}
          style={{
            borderRadius: 3,
            backgroundColor: inputBg,
            borderColor: selectedCategory ? activeBorder : inputBorder,
            color: selectedCategory ? activeText : (inputText || undefined),
          }}
        >
          <option value="">Select Category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* State Dropdown */}
      <div className="flex flex-col">
        <select
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value)}
          className={`h-8 w-36 px-2.5 text-xs border outline-none transition-colors ${
            selectedState
              ? "font-medium"
              : "hover:border-text-muted"
          }`}
          style={{
            borderRadius: 3,
            backgroundColor: inputBg,
            borderColor: selectedState ? activeBorder : inputBorder,
            color: selectedState ? activeText : (inputText || undefined),
          }}
        >
          <option value="">Select State</option>
          {US_STATES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Button */}
      {(selectedAgency || selectedCategory || selectedState) && (
        <button
          onClick={onClearFilters}
          className="flex h-8 items-center justify-center px-3 text-xs font-medium transition-colors"
          style={{
            borderRadius: 3,
            backgroundColor: inputBg,
            border: `1px solid ${containerBorder}`,
            color: '#7A6A55',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = activeBorder; e.currentTarget.style.color = activeText; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = containerBorder; e.currentTarget.style.color = '#7A6A55'; }}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
