// Type definition for stock/scrip price data from API
export interface ScripPriceData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Type for lightweight-charts time format (UTCTimestamp)
type UTCTimestamp = number;

// Transforms raw API price data into chart-compatible format
export const processChartData = (data: ScripPriceData[]) => {
  // Sort data chronologically by timestamp
  const sortedData = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Map to lightweight-charts format with Unix timestamp and close price
  return sortedData.map((item) => ({
    time: Math.floor(new Date(item.timestamp).getTime() / 1000) as UTCTimestamp,
    value: item.close,
  }));
};
