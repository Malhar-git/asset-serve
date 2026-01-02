"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios-interceptor";
import { PcrData, SegregatedPcrData, segregatePcrData } from "../lib/pcrUtils";

interface CategorySectionProps {
  title: string;
  items: PcrData[];
  color: string;
}

function CategorySection({ title, items, color }: CategorySectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="py-2 mt-0.5 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center">
        <h4 className={`text-xs font-semibold ${color}`}>{title}</h4>
      </div>
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded"
          >
            <span className="text-xs font-medium text-gray-800 truncate max-w-[90px]">
              {item.tradingSymbol}
            </span>
            <span className={`text-xs font-bold ${color}`}>
              {item.pcr.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PcrCards({ authReady }: { authReady: boolean }) {
  const [pcrData, setPcrData] = useState<SegregatedPcrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    let isActive = true;

    const fetchPcrData = async (showLoader: boolean) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        const response = await api.get("/dashboard/pcr");

        let data: PcrData[] = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        }

        const segregated = segregatePcrData(data);
        if (!isActive) {
          return;
        }
        setPcrData(segregated);
        setError(null);
      } catch (err) {
        console.error("Error fetching PCR data:", err);
        if (!isActive) {
          return;
        }
        setError("Failed to load PCR data");
      } finally {
        if (!isActive) {
          return;
        }
        if (showLoader) {
          setLoading(false);
        }
      }
    };

    fetchPcrData(true);
    const interval = setInterval(() => fetchPcrData(false), 300000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [authReady]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-xs text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (!pcrData) return null;

  return (
    <div className="px-2">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <h3 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-200">
          PCR Analysis
        </h3>
        <CategorySection
          title="Oversold"
          items={pcrData.oversold}
          color="text-purple-600"
        />
        <CategorySection
          title="Bearish"
          items={pcrData.bearish}
          color="text-red-600"
        />
        <CategorySection
          title="Neutral"
          items={pcrData.neutral}
          color="text-gray-600"
        />
        <CategorySection
          title="Bullish"
          items={pcrData.bullish}
          color="text-green-600"
        />
      </div>
    </div>
  );
}