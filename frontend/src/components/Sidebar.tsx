"use client";

import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface StateData {
  state_code: string;
  state_name: string;
  amount: number;
  population: number;
  per_capita: number;
  lat: number | null;
  lng: number | null;
}

interface VendorData {
  vendor: string;
  total_amount: number;
  award_count: number;
}

interface StateAward {
  award_id: string;
  vendor: string;
  amount: number;
  agency: string;
}

interface SidebarProps {
  agency: string;
  category: string;
  state: string;
  selectedStateData: StateData | null;
  onCloseStateDetail: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isDark?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const formatterCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
});

const formatterFull = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Sidebar({
  agency,
  category,
  state,
  selectedStateData,
  onCloseStateDetail,
  isOpen,
  onClose,
  isDark = true,
}: SidebarProps) {

  // Aggregate states total metric
  const [totalObligation, setTotalObligation] = useState<number>(0);
  const [statesCount, setStatesCount] = useState<number>(0);
  const [isStatesLoading, setIsStatesLoading] = useState(false);

  // Vendor table data
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);

  // State Detail Awards
  const [stateAwards, setStateAwards] = useState<StateAward[]>([]);
  const [isAwardsLoading, setIsAwardsLoading] = useState(false);

  // Active Tab state: obligations or opportunities
  const [activeTab, setActiveTab] = useState<"obligations" | "opportunities">("obligations");

  // Opportunities state
  interface Opportunity {
    notice_id: string;
    title: string;
    solicitation_number: string;
    notice_type: string;
    posted_date: string;
    response_deadline: string;
    department: string;
    state: string;
    ui_url: string;
  }

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunitiesTotal, setOpportunitiesTotal] = useState<number>(0);
  const [oppsPage, setOppsPage] = useState<number>(1);
  const [isOppsLoading, setIsOppsLoading] = useState<boolean>(false);
  const [isSimulatedFeed, setIsSimulatedFeed] = useState<boolean>(true);


  // Fetch /api/states to aggregate total metric
  useEffect(() => {
    const controller = new AbortController();
    setIsStatesLoading(true);

    const fetchStates = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (agency) queryParams.append("agency", agency);
        if (category) queryParams.append("category", category);

        const res = await fetch(
          `${API_BASE_URL}/api/states?${queryParams.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to load states for sidebar");
        const data = await res.json();
        
        const list: StateData[] = data.results || [];
        const sum = list.reduce((acc, curr) => acc + curr.amount, 0);
        setTotalObligation(sum);
        setStatesCount(list.filter((s) => s.amount > 0).length);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setTotalObligation(0);
          setStatesCount(0);
        }
      } finally {
        setIsStatesLoading(false);
      }
    };

    fetchStates();

    return () => {
      controller.abort();
    };
  }, [agency, category]);

  // Fetch /api/vendors for the Top 10 Table
  useEffect(() => {
    const controller = new AbortController();
    setIsVendorsLoading(true);

    const fetchVendors = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (agency) queryParams.append("agency", agency);
        if (category) queryParams.append("category", category);
        if (state) queryParams.append("state", state);

        const res = await fetch(
          `${API_BASE_URL}/api/vendors?${queryParams.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to load vendors");
        const data = await res.json();
        setVendors((data.results || []).slice(0, 10));
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setVendors([]);
        }
      } finally {
        setIsVendorsLoading(false);
      }
    };

    fetchVendors();

    return () => {
      controller.abort();
    };
  }, [agency, category, state]);

  // Fetch /api/awards for Selected State Detail
  useEffect(() => {
    if (!selectedStateData) return;

    const controller = new AbortController();
    setIsAwardsLoading(true);

    const fetchStateAwards = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("state", selectedStateData.state_code);
        if (agency) queryParams.append("agency", agency);
        if (category) queryParams.append("category", category);
        queryParams.append("limit", "5");

        const res = await fetch(
          `${API_BASE_URL}/api/awards?${queryParams.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to load state awards");
        const data = await res.json();
        setStateAwards(data.results || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setStateAwards([]);
        }
      } finally {
        setIsAwardsLoading(false);
      }
    };

    fetchStateAwards();

    return () => {
      controller.abort();
    };
  }, [selectedStateData, agency, category]);

  // Fetch /api/opportunities when tab is active or filters/page change
  useEffect(() => {
    if (activeTab !== "opportunities") return;

    const controller = new AbortController();
    setIsOppsLoading(true);

    const fetchOpps = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (agency) queryParams.append("agency", agency);
        if (state) queryParams.append("state", state);
        queryParams.append("page", oppsPage.toString());
        queryParams.append("limit", "5");

        const res = await fetch(
          `${API_BASE_URL}/api/opportunities?${queryParams.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to load opportunities");
        const data = await res.json();
        setOpportunities(data.results || []);
        setOpportunitiesTotal(data.total || 0);
        setIsSimulatedFeed(!!data.is_simulated);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setOpportunities([]);
          setOpportunitiesTotal(0);
        }
      } finally {
        setIsOppsLoading(false);
      }
    };

    fetchOpps();

    return () => {
      controller.abort();
    };
  }, [activeTab, agency, state, oppsPage]);

  // Reset opportunities page when filters change
  useEffect(() => {
    setOppsPage(1);
  }, [agency, state]);

  // Setup TanStack Table
  const columnHelper = createColumnHelper<VendorData>();
  const columns = [
    columnHelper.accessor("vendor", {
      header: () => <span className="text-left select-none">Vendor</span>,
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className="block truncate text-text-primary max-w-40 font-medium">
            {val}
          </span>
        );
      },
    }),
    columnHelper.accessor("total_amount", {
      header: () => <span className="text-right select-none">Obligation</span>,
      cell: (info) => (
        <span className="text-right block font-mono text-cyan-custom font-semibold">
          {formatterCompact.format(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("award_count", {
      header: () => <span className="text-right select-none">Count</span>,
      cell: (info) => (
        <span className="text-right block font-mono text-text-primary">
          {info.getValue()}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: vendors,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Build Download Link URL
  const downloadUrl = () => {
    const params = new URLSearchParams();
    if (agency) params.append("agency", agency);
    if (category) params.append("category", category);
    if (state) params.append("state", state);
    return `${API_BASE_URL}/api/awards/csv?${params.toString()}`;
  };

  return (
    <aside
      className="w-full h-full border-l border-border bg-surface flex flex-col justify-between overflow-hidden"
    >
      {/* Premium Tab Bar (Sticky at top) */}
      <div
        className="flex items-center border-b border-border bg-bg p-2 space-x-1.5 shrink-0"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 border border-border bg-surface text-text-muted transition-colors hover:border-cyan-custom hover:text-cyan-custom shrink-0 cursor-pointer"
            style={{ borderRadius: 3 }}
            aria-label="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
        )}
        <button
          onClick={() => setActiveTab("obligations")}
          className={`flex-1 text-center py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "obligations"
              ? "bg-surface text-cyan-custom border border-border"
              : "text-text-muted hover:text-text-primary hover:bg-surface/30"
          }`}
          style={{ borderRadius: 3 }}
        >
          Obligations
        </button>
        <button
          onClick={() => setActiveTab("opportunities")}
          className={`flex-1 text-center py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "opportunities"
              ? "bg-surface text-cyan-custom border border-border"
              : "text-text-muted hover:text-text-primary hover:bg-surface/30"
          }`}
          style={{ borderRadius: 3 }}
        >
          Opportunities
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === "obligations" ? (
          <>
            {/* Section A — Header metric */}
            <div className="border border-border bg-bg/50 p-4" style={{ borderRadius: 3 }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Total Federal Awards
              </div>
              {isStatesLoading ? (
                <div className="h-7 w-48 bg-surface animate-pulse" style={{ borderRadius: 3 }} />
              ) : (
                <div className="text-xl font-bold text-text-primary font-mono tracking-tight">
                  {formatterFull.format(totalObligation)}
                </div>
              )}
              <div className="text-[10px] text-text-muted mt-1">
                Aggregated across <span className="font-semibold text-text-primary">{statesCount}</span> jurisdictions
              </div>
            </div>

            {/* Section B — Why This Matters */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-1">
                Why This Matters
              </div>
              <p className="text-[11px] leading-relaxed text-text-muted">
                Public procurement is the largest capital-allocation rail most citizens never see. Federal contracts
                shape which industries grow, which regions receive investment, and which vendors gain structural advantage.
                This dashboard makes the rail visible.
              </p>
            </div>

            {/* Section D — Selected State Detail (Conditional) */}
            {selectedStateData && (
              <div className="p-3.5 space-y-3 relative" style={{ background: 'rgba(212,137,26,0.06)', border: '1px solid rgba(212,137,26,0.2)', borderRadius: 3 }}>
                {/* Close button */}
                <button
                  onClick={onCloseStateDetail}
                  className="absolute top-2.5 right-2.5 text-text-muted hover:text-text-primary"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
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

                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-cyan-custom">
                    Selected Jurisdiction
                  </div>
                  <div className="text-sm font-bold text-text-primary mt-0.5">
                    {selectedStateData.state_name} ({selectedStateData.state_code})
                  </div>
                </div>

                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-[10px] text-text-muted">Total Obligations</span>
                  <span className="text-[11px] font-bold text-text-primary font-mono">
                    {formatterFull.format(selectedStateData.amount)}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-border pt-2">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-text-muted">
                    Top State Awards
                  </div>
                  {isAwardsLoading ? (
                    <div className="space-y-1 animate-pulse">
                      <div className="h-3 w-full bg-border" style={{ borderRadius: 3 }} />
                      <div className="h-3 w-4/5 bg-border" style={{ borderRadius: 3 }} />
                    </div>
                  ) : stateAwards.length === 0 ? (
                    <div className="text-[10px] text-text-muted italic">No state awards found</div>
                  ) : (
                    <div className="space-y-1.5">
                      {stateAwards.map((aw) => (
                        <div key={aw.award_id} className="flex flex-col text-[10px] bg-bg p-1.5 border border-border" style={{ borderRadius: 3 }}>
                          <div className="flex justify-between font-medium">
                            <span className="text-text-primary truncate max-w-36">{aw.vendor}</span>
                            <span className="text-cyan-custom font-mono">{formatterCompact.format(aw.amount)}</span>
                          </div>
                          <span className="text-[9px] text-text-muted truncate mt-0.5">{aw.agency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section C — Who Controls the Rail */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border/50 pb-1">
                Who Controls the Rail
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">
                This metric provides a high-fidelity **vendor ranking** displaying lead contractors sorted by total active obligations and cumulative award counts inside the selected visual parameters.
              </p>
              {isVendorsLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-6 w-full bg-bg/50 rounded" />
                  <div className="h-6 w-full bg-bg/50 rounded" />
                  <div className="h-6 w-full bg-bg/50 rounded" />
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-[11px] text-text-muted italic text-center py-4 bg-bg/20 border border-border" style={{ borderRadius: 3 }}>
                  No allocation data available
                </div>
              ) : (
                <div className="overflow-hidden border border-border" style={{ borderRadius: 3 }}>
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}
                          className="border-b border-border bg-bg text-text-muted"
                        >
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="p-2 font-medium text-left">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`border-b border-border last:border-0 hover:bg-bg/25 transition-colors ${
                            idx === 0 ? "border-l-2 border-l-cyan-custom" : ""
                          }`}
                          style={idx === 0 ? { background: 'rgba(212,137,26,0.05)' } : undefined}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-2">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Header / Info box */}
            <div className="space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Federal Solicitations
                </div>
                {isSimulatedFeed ? (
                  <span
                    title="No SAM_API_KEY detected in environment. Displaying simulated listings."
                    className="inline-flex items-center px-2 py-0.5 text-[8px] font-semibold"
                    style={{ borderRadius: 3, background: 'rgba(212,137,26,0.08)', color: '#D4891A', border: '1px solid rgba(212,137,26,0.2)' }}
                  >
                    Simulated Feed
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[8px] font-semibold"
                    style={{ borderRadius: 3, background: 'rgba(109,191,138,0.08)', color: '#6DBF8A', border: '1px solid rgba(109,191,138,0.2)' }}
                  >
                    Live Feed
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Active opportunities, presolicitations, and solicitations published to SAM.gov matching the active filters.
              </p>
            </div>

            {/* Opportunities List */}
            {isOppsLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-20 bg-bg/50 border border-border/50" style={{ borderRadius: 3 }} />
                <div className="h-20 bg-bg/50 border border-border/50" style={{ borderRadius: 3 }} />
                <div className="h-20 bg-bg/50 border border-border/50" style={{ borderRadius: 3 }} />
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-[11px] text-text-muted italic text-center py-8 bg-bg/20 border border-border" style={{ borderRadius: 3 }}>
                No active opportunities found
              </div>
            ) : (
              <div className="space-y-3.5 animate-fadeIn">
                {opportunities.map((opp) => (
                  <div
                    key={opp.notice_id}
                    className="border border-border bg-bg p-3 space-y-2.5 transition-colors duration-200"
                    style={{ borderRadius: 3, borderColor: undefined }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(212,137,26,0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2E2418')}
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <span className="text-[9px] font-bold tracking-wider font-mono text-text-muted shrink-0">
                        {opp.solicitation_number}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase`}
                        style={opp.notice_type.toLowerCase().includes("solicitation")
                          ? { borderRadius: 3, background: 'rgba(212,137,26,0.08)', color: '#D4891A', border: '1px solid rgba(212,137,26,0.2)' }
                          : { borderRadius: 3, background: 'rgba(122,106,85,0.08)', color: '#7A6A55', border: '1px solid rgba(122,106,85,0.2)' }
                        }>
                        {opp.notice_type.split("/").pop()}
                      </span>
                    </div>

                    <h4 className="text-[11px] font-bold text-text-primary leading-snug line-clamp-2">
                      {opp.title}
                    </h4>

                    <div className="space-y-1 text-[9px] text-text-muted border-t border-border pt-1.5">
                      <div className="flex justify-between">
                        <span>Agency:</span>
                        <span className="font-semibold text-text-primary truncate max-w-44">{opp.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Performance:</span>
                        <span className="font-semibold text-text-primary">{opp.state || "USA"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Posted:</span>
                        <span className="font-semibold text-text-primary">{opp.posted_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deadline:</span>
                        <span className={`font-semibold ${
                          opp.response_deadline.includes("-") ? "text-cyan-custom" : "text-text-primary"
                        }`}>{opp.response_deadline}</span>
                      </div>
                    </div>

                    <a
                      href={opp.ui_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-full items-center justify-center border border-border bg-bg text-[9px] font-bold uppercase tracking-wider text-text-muted transition-colors hover:border-cyan-custom hover:text-cyan-custom"
                      style={{ borderRadius: 3 }}
                    >
                      View on SAM.gov
                      <svg
                        className="ml-1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                ))}

                {/* Pagination */}
                {opportunitiesTotal > 5 && (
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <button
                      disabled={oppsPage <= 1}
                      onClick={() => setOppsPage((p) => p - 1)}
                      className="px-2 py-1 text-[9px] font-bold uppercase border border-border bg-bg rounded hover:border-cyan-custom hover:text-cyan-custom disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted transition-colors"
                      style={{ borderRadius: 3 }}
                    >
                      Previous
                    </button>
                    <span className="text-[9px] text-text-muted font-mono">
                      Page {oppsPage} of {Math.ceil(opportunitiesTotal / 5)}
                    </span>
                    <button
                      disabled={oppsPage >= Math.ceil(opportunitiesTotal / 5)}
                      onClick={() => setOppsPage((p) => p + 1)}
                      className="px-2 py-1 text-[9px] font-bold uppercase border border-border bg-bg rounded hover:border-cyan-custom hover:text-cyan-custom disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-muted transition-colors"
                      style={{ borderRadius: 3 }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA/Download Button */}
      <div
        className="p-4 border-t border-border bg-surface shrink-0"
      >
        {activeTab === "obligations" ? (
          <a
            href={downloadUrl()}
            download
            className="flex h-10 w-full items-center justify-center border border-border bg-bg text-[11px] font-bold uppercase tracking-wider text-text-primary transition-colors hover:border-cyan-custom hover:text-cyan-custom"
            style={{ borderRadius: 3 }}
          >
            Download Sample Data
          </a>
        ) : (
          <a
            href="https://sam.gov/content/opportunities"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-full items-center justify-center border border-border bg-bg text-[11px] font-bold uppercase tracking-wider text-text-primary transition-colors hover:border-cyan-custom hover:text-cyan-custom"
            style={{ borderRadius: 3 }}
          >
            Go to SAM.gov Portal
            <svg
              className="ml-1.5"
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </aside>
  );
}

