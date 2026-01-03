"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../lib/axios-interceptor";

interface IndexData {
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  percentChange: number;
  trend?: "UP" | "DOWN" | "NEUTRAL";
}

interface IndicesFullData {
  [key: string]: IndexData;
}

type TrendIndicator = 'up' | 'down' | 'neutral';

const PriceTicker: React.FC = () => {
  const [indicesData, setIndicesData] = useState<IndicesFullData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const INDICES_API_ENDPOINT = 'market/indices/full';

  // Fetch full indices data with OHLC and change information
  const fetchIndicesData = async () => {
    try {
      setErrorMessage(null);

      const response = await api.get(INDICES_API_ENDPOINT);

      if (response.status !== 200) {
        throw new Error(`Unable to fetch market data`);
      }

      const data: IndicesFullData = response.data;

      setIndicesData(data);
      setIsLoading(false);
      setIsConnected(true);
    } catch (err) {
      const message = getErrorMessage(err);
      setErrorMessage(message);
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 5 seconds
  useEffect(() => {
    fetchIndicesData();
    const intervalId = setInterval(fetchIndicesData, 5000);
    return () => clearInterval(intervalId);
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

  const getTrend = (indexData: IndexData, change: number): TrendIndicator => {
    if (indexData.trend) {
      if (indexData.trend === "UP") {
        return "up";
      }
      if (indexData.trend === "DOWN") {
        return "down";
      }
      return "neutral";
    }

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
          const trend = getTrend(data, change);
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
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-xs text-gray-500">Loading market data...</span>
        </div>
      )}
      {errorMessage && !isLoading && (
        <div className="p-3 text-center">
          <span className="text-xs text-red-600">{errorMessage}</span>
          <button
            onClick={fetchIndicesData}
            className="ml-2 text-xs text-indigo-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      {!isLoading && !errorMessage && isConnected && (
        <div className="overflow-x-auto">
          <ScrollingTicker />
        </div>
      )}
      {!isConnected && !isLoading && (
        <div className="p-3 text-center">
          <span className="text-xs text-amber-600">
            Connection lost. Reconnecting...
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceTicker;