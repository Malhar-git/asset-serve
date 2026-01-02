"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios-interceptor";

interface IndexData {
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  percentChange: number;
}

interface IndicesFullData {
  [key: string]: IndexData;
}

type TrendIndicator = 'up' | 'down' | 'neutral';

const PriceTicker: React.FC = () => {
  const [indicesData, setIndicesData] = useState<IndicesFullData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const INDICES_FULL_API = '/market/indices/full';

  // Fetch full indices data with OHLC and change information
  const fetchIndicesFullData = async () => {
    try {
      setError(null);

      const response = await api.get(INDICES_FULL_API);

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch Indices Data`);
      }

      const data: IndicesFullData = response.data;

      setIndicesData(data);
      setLoading(false);
      setIsConnected(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching indices:', err);
      setError(err.message || 'Failed to fetch indices data');
      setIsConnected(false);
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 5 seconds
  useEffect(() => {
    fetchIndicesFullData();
    const interval = setInterval(fetchIndicesFullData, 5000);
    return () => clearInterval(interval);
  }, []);


  // Format number with Indian numbering system
  const formatNumber = (num: number): string => {
    if (typeof num !== 'number' || !Number.isFinite(num)) return '0.00';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const toNumber = (value: unknown): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getEffectiveChange = (indexData: IndexData): number => {
    const change = toNumber(indexData.change);
    const ltp = toNumber(indexData.ltp);
    const close = toNumber(indexData.close);
    const baselineChange = ltp - close;

    if (Math.abs(change) > 0.01) {
      return change;
    }

    if (Math.abs(baselineChange) > 0.01) {
      return baselineChange;
    }

    const percentDerived = (toNumber(indexData.percentChange) / 100) * (close || ltp);
    return Math.abs(percentDerived) > 0.01 ? percentDerived : 0;
  };

  const getEffectivePercentChange = (indexData: IndexData, effectiveChange: number): number => {
    const explicitPercent = toNumber(indexData.percentChange);
    if (Math.abs(explicitPercent) > 0.01) {
      return explicitPercent;
    }

    const close = toNumber(indexData.close);
    const baseline = close || (toNumber(indexData.ltp) - effectiveChange);
    if (Math.abs(baseline) < 0.01) {
      return 0;
    }

    return (effectiveChange / baseline) * 100;
  };

  const getTrend = (change: number): TrendIndicator => {
    if (change > 0.01) return 'up';
    if (change < -0.01) return 'down';
    return 'neutral';
  };

  const formatChangePercent = (percentChange: number): string => {
    if (!Number.isFinite(percentChange) || Math.abs(percentChange) < 0.01) {
      return '0.00%';
    }
    const sign = percentChange > 0 ? '+' : '-';
    return `${sign}${Math.abs(percentChange).toFixed(2)}%`;
  };

  const formatChange = (change: number): string => {
    if (!Number.isFinite(change) || Math.abs(change) < 0.01) {
      return '0.00 pts';
    }
    const sign = change > 0 ? '+' : '-';
    return `${sign}${formatNumber(Math.abs(change))} pts`;
  };

  // Scrolling ticker component
  const ScrollingTicker = () => {
    const entries = Object.entries(indicesData);
    if (entries.length === 0) return null;

    if (process.env.NODE_ENV === 'development') {
      // Helpful in dev builds to verify incoming payloads
      console.log('Indices Data:', indicesData);
    }

    return (
      <div className="flex flex-col gap-3 px-2 min-w-max ">
        {entries.map(([name, data], index) => {
          const change = getEffectiveChange(data);
          const percentChange = getEffectivePercentChange(data, change);
          const trend = getTrend(change);
          const trendColor =
            trend === 'up'
              ? 'text-green-600'
              : trend === 'down'
                ? 'text-red-600'
                : 'text-gray-600';

          return (
            <div
              key={index}
              className={`flex flex-col h-24 rounded-lg p-2 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Index Name and Trend Icon */}
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-gray-900">{name}</span>
              </div>

              {/* Current Price */}
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold tabular-nums text-gray-700`}>
                  ₹{formatNumber(toNumber(data.ltp))}
                </span>
                <div className="text-2xl font-bold">
                  {trend === 'up' && (
                    <span className="text-green-600">↑</span>
                  )}
                  {trend === 'down' && (
                    <span className="text-red-600">↓</span>
                  )}
                  {trend === 'neutral' && (
                    <span className="text-gray-400">–</span>
                  )}
                </div>

              </div>

              {/* Change and Percentage - More Prominent */}
              <div className="pl-1 flex items-end justify-between text-sm">
                <div className={`font-semibold ${trendColor}`}>
                  {formatChange(change)}
                </div>
                <div className={`font-semibold ${trendColor}`}>
                  {formatChangePercent(percentChange)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full">
      {loading && <span className="text-xs text-gray-500">Loading...</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
      {!loading && !error && isConnected && (
        <div className="overflow-x-auto">
          <ScrollingTicker />
        </div>
      )}
      {!isConnected && (
        <span className="text-xs text-red-600">
          Connection lost. Retrying...
        </span>
      )}
    </div>
  );
};

export default PriceTicker;