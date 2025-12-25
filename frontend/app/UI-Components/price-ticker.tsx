"use client";

import { useEffect, useState } from "react"
import api from "../lib/axios-interceptor";

const PriceTicker: React.FC = () => {
  const [indices, setIndices] = useState({});
  const [previousIndices, setPreviousIndices] = useState<IndicesData>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [prevCloses, setPrevCloses] = useState<Record<string, number>>({});

  interface FetchResult {
    name: string;
    closePrice: number | null;
  }

  const Backend_API = 'http://localhost:8080/api/v1/market/indices';

  const getTokenForIndex = (indexName: string): string => {
    const tokenMap: Record<string, string> = {
      "NIFTY 50": "99926000",
      "BANK NIFTY": "99926009",
      "SENSEX": "99919000"
    };
    return tokenMap[indexName] || "3045";
  };

  const fetchIndices = async () => {
    try {
      setError(null);

      const response = await api.get(Backend_API, {
        method: 'Get',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status != 200) {
        throw new Error(`HTTP ${response.status}: Failed to fetch Indices Data`);
      }
      const data = response.data;

      //Store Previous Values for Change Detection
      if (Object.keys(indices).length > 0) {
        setPreviousIndices(indices);
      }

      setIndices(data);
      setLastUpdate(new Date());
      setLoading(false);
      setIsConnected(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching indices:', err);
      setError(err.message);
      setIsConnected(false);
      setLoading(false);
    }


  };

  //initial fetch and auto-refresh
  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 100000);
    return () => clearInterval(interval);
  }, []);

  // Format number with Indian numbering system
  const formatNumber = (num: number): string => {
    if (typeof num !== 'number') return '0.00';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  //Detect if value increased, decreased or stayed same
  interface IndicesData {
    [key: string]: number;
  }

  type ChangeIndicator = 'up' | 'down' | 'same' | null;

  const getChangeInicator = (name: string, currentValue: number): ChangeIndicator => {
    if (!previousIndices[name]) return null;

    const previous = previousIndices[name] as number;
    if (currentValue > previous) return 'up';
    if (currentValue < previous) return 'down';
    return 'same';
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  //Fetch Indice previous close price history
  useEffect(() => {
    const fetchPreviousCloses = async () => {
      setLoading(true);
      const prevDate = getYesterdayDate();
      const indexNames = Object.keys(indices);

      try {
        const promises = indexNames.map(async (name): Promise<FetchResult> => {
          try {
            const response = await api.get("/priceHistory", {
              params: {
                exchange: "NSE",
                symboltoken: getTokenForIndex(name),
                interval: "ONE_DAY",
                fromDate: `${prevDate} 09:15`,
                toDate: `${prevDate} 15:30`,
              },
            });

            const candles = response.data?.data as Array<unknown[]>;
            if (candles && candles.length > 0) {
              const lastCandle = candles[candles.length - 1];
              const closePrice = lastCandle[4] as number;
              return { name, closePrice };
            }
            return { name, closePrice: null };
          } catch (err) {
            return { name, closePrice: null };
          }
        });

        const results = await Promise.all(promises);

        const newPrevCloses: Record<string, number> = {};
        results.forEach((item) => {
          if (item.closePrice !== null) {
            newPrevCloses[item.name] = item.closePrice;
          }
        });

        setPrevCloses(newPrevCloses);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (Object.keys(indices).length > 0) {
      fetchPreviousCloses();
    }
  }, [indices]);

  // Scrolling ticker component
  const ScrollingTicker = () => {
    const entries = Object.entries(indices);
    if (entries.length === 0) return null;

    return (
      <div className="flex items-center gap-6 overflow-hidden">
        {entries.map(([name, currentValue], index) => {
          const numericValue = typeof currentValue === 'number' ? currentValue : 0;
          const prevClose = prevCloses[name];
          const prevValue = previousIndices[name] as number | undefined;
          let change: 'up' | 'down' | 'neutral' = 'neutral';

          // First check previous close from API
          if (prevClose) {
            if (numericValue > prevClose) change = 'up';
            else if (numericValue < prevClose) change = 'down';
          }
          // Fallback to real-time comparison
          else if (prevValue) {
            if (numericValue > prevValue) change = 'up';
            else if (numericValue < prevValue) change = 'down';
          }

          return (
            <div key={index} className="flex flex-col bg-white rounded-xl p-2 whitespace-nowrap">
              <div className="flex items-center gap-1">
                <span className="text-xs text-black font-medium">{name}</span>
                {change === 'up' && (
                  <span className="text-green-600 text-sm font-bold">↑</span>
                )}
                {change === 'down' && (
                  <span className="text-red-600 text-sm font-bold">↓</span>
                )}
                {change === 'neutral' && (
                  <span className="text-gray-500 text-sm font-bold">–</span>
                )}
              </div>
              <span className={`text-sm font-semibold tabular-nums ${change === 'up' ? 'text-green-600' : change === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                ₹{formatNumber(numericValue)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex items-center">
      {loading && <span className="text-xs text-muted">Loading...</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
      {!loading && !error && <ScrollingTicker />}
    </div>
  );
}

export default PriceTicker;