"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";

interface ChartsProps {
  agency: string;
  category: string;
  state: string;
}

interface AwardItem {
  award_id: string;
  amount: number;
  category: string | null;
}

interface VendorItem {
  vendor: string;
  total_amount: number;
  award_count: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  style: "currency",
  currency: "USD",
});

export default function Charts({ agency, category, state }: ChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [vendorData, setVendorData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (agency) queryParams.append("agency", agency);
        if (category) queryParams.append("category", category);
        if (state) queryParams.append("state", state);

        // Fetch Awards (for Category aggregation)
        const awardsPromise = fetch(
          `${API_BASE_URL}/api/awards?limit=100&${queryParams.toString()}`,
          { signal: controller.signal }
        ).then((res) => {
          if (!res.ok) throw new Error("Failed to load category data");
          return res.json();
        });

        // Fetch Vendors
        const vendorsPromise = fetch(
          `${API_BASE_URL}/api/vendors?${queryParams.toString()}`,
          { signal: controller.signal }
        ).then((res) => {
          if (!res.ok) throw new Error("Failed to load vendor data");
          return res.json();
        });

        const [awardsRes, vendorsRes] = await Promise.all([awardsPromise, vendorsPromise]);

        // 1. Process Category Spend
        const awardsList: AwardItem[] = awardsRes.results || [];
        const catMap: Record<string, number> = {};
        
        awardsList.forEach((aw) => {
          let catName = aw.category || "Contracts";
          // Simplify names for clean chart representation
          if (catName.toUpperCase().includes("BLOCK GRANT") || catName.toUpperCase().includes("GRANT")) {
            catName = "Grants";
          } else if (catName.toUpperCase().includes("LOAN")) {
            catName = "Loans";
          } else if (catName.toUpperCase().includes("IDV")) {
            catName = "IDVs";
          } else if (catName === "A" || catName === "B" || catName === "C" || catName === "D") {
            catName = "Contracts";
          }
          catMap[catName] = (catMap[catName] || 0) + aw.amount;
        });

        const catChartData = Object.entries(catMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setCategoryData(catChartData);

        // 2. Process Vendor Spend (Top 5 for clean fit in horizontal chart)
        const vendorsList: VendorItem[] = vendorsRes.results || [];
        const vendorChartData = vendorsList
          .slice(0, 5)
          .map((v) => ({
            name: v.vendor.length > 22 ? v.vendor.substring(0, 22) + "..." : v.vendor,
            value: v.total_amount,
          }))
          // Reverse for bottom-up horizontal bar ordering in ECharts
          .reverse();

        setVendorData(vendorChartData);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch chart data:", err);
          setError("Failed to load data for charts");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [mounted, agency, category, state]);

  if (!mounted) {
    return <div className="h-full w-full bg-surface animate-pulse border border-border" />;
  }

  // Option 1: Category Spend Options
  const categoryOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#1A1410",
      borderColor: "#2E2418",
      textStyle: { color: "#F0E6D3", fontSize: 10 },
      formatter: (params: any) => {
        const item = params[0];
        return `<span class="text-text-muted font-medium">${item.name}</span><br/><span class="text-cyan-custom font-semibold">${compactFormatter.format(item.value)}</span>`;
      },
    },
    grid: {
      left: "4%",
      right: "6%",
      top: "12%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLabel: {
        color: "#7A6A55",
        fontSize: 9,
        formatter: (val: number) => compactFormatter.format(val),
      },
      splitLine: { lineStyle: { color: "#2E2418" } },
    },
    yAxis: {
      type: "category",
      data: categoryData.map((item) => item.name),
      axisLabel: { color: "#7A6A55", fontSize: 9 },
      axisLine: { lineStyle: { color: "#2E2418" } },
      axisTick: { show: false },
    },
    series: [
      {
        name: "Obligations",
        type: "bar",
        data: categoryData.map((item) => item.value),
        itemStyle: {
          color: "#D4891A",
          borderRadius: [0, 3, 3, 0],
        },
        barWidth: "40%",
      },
    ],
  };

  // Option 2: Vendor Spend Options
  const vendorOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#1A1410",
      borderColor: "#2E2418",
      textStyle: { color: "#F0E6D3", fontSize: 10 },
      formatter: (params: any) => {
        const item = params[0];
        return `<span class="text-text-muted font-medium">${item.name}</span><br/><span class="text-indigo-custom font-semibold">${compactFormatter.format(item.value)}</span>`;
      },
    },
    grid: {
      left: "4%",
      right: "6%",
      top: "12%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLabel: {
        color: "#7A6A55",
        fontSize: 9,
        formatter: (val: number) => compactFormatter.format(val),
      },
      splitLine: { lineStyle: { color: "#2E2418" } },
    },
    yAxis: {
      type: "category",
      data: vendorData.map((item) => item.name),
      axisLabel: { color: "#7A6A55", fontSize: 9 },
      axisLine: { lineStyle: { color: "#2E2418" } },
      axisTick: { show: false },
    },
    series: [
      {
        name: "Award Total",
        type: "bar",
        data: vendorData.map((item) => item.value),
        itemStyle: {
          color: "#C4791A",
          borderRadius: [0, 3, 3, 0],
        },
        barWidth: "40%",
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 p-4">
        <div className="flex-1 bg-surface border border-border animate-pulse p-4 space-y-3" style={{ borderRadius: 3 }}>
          <div className="h-3 w-32 bg-border" style={{ borderRadius: 3 }} />
          <div className="h-6 w-full bg-border" style={{ borderRadius: 3 }} />
          <div className="h-6 w-4/5 bg-border" style={{ borderRadius: 3 }} />
        </div>
        <div className="flex-1 bg-surface border border-border animate-pulse p-4 space-y-3" style={{ borderRadius: 3 }}>
          <div className="h-3 w-32 bg-border" style={{ borderRadius: 3 }} />
          <div className="h-6 w-full bg-border" style={{ borderRadius: 3 }} />
          <div className="h-6 w-4/5 bg-border" style={{ borderRadius: 3 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center border border-border bg-surface text-center p-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-red-400">Loading Error</p>
          <p className="text-[11px] text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 p-3 overflow-hidden">
      {/* Chart 1 */}
      <div className="flex-1 min-h-0 border border-border bg-surface p-2.5 flex flex-col h-full" style={{ borderRadius: 3 }}>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">
          Obligations by Category
        </span>
        <div className="flex-1 min-h-0">
          {categoryData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-text-muted">
              No categories available
            </div>
          ) : (
            <ReactECharts
              option={categoryOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          )}
        </div>
      </div>

      {/* Chart 2 */}
      <div className="flex-1 min-w-0 border border-border bg-surface p-2.5 flex flex-col h-full" style={{ borderRadius: 3 }}>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">
          Top Vendor Allocations
        </span>
        <div className="flex-1 min-h-0">
          {vendorData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-text-muted">
              No vendor allocations found
            </div>
          ) : (
            <ReactECharts
              option={vendorOption}
              style={{ height: "100%", width: "100%" }}
              opts={{ renderer: "canvas" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
