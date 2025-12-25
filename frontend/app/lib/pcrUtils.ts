// PCR Data Types
export interface PcrData {
  pcr: number;
  tradingSymbol: string;
}

export interface SegregatedPcrData {
  oversold: PcrData[]; // pcr < 0.40
  bearish: PcrData[]; // 0.40 <= pcr < 0.70
  neutral: PcrData[]; // 0.70 <= pcr <= 1.00
  bullish: PcrData[]; // pcr > 1.00
}

/**
 * Cleans the trading symbol by removing the expiry suffix
 * Example: DALBHARAT30DEC25FUT → DALBHARAT
 */
export function cleanTradingSymbol(symbol: string): string {
  const regex = /^(.*?)30DEC25FUT$/;
  const match = symbol.match(regex);
  return match ? match[1] : symbol;
}

/**
 * Segregates PCR data into four categories: Oversold, Bearish, Neutral, Bullish
 * Returns top 2 from each category based on the sorting logic
 */
export function segregatePcrData(data: PcrData[]): SegregatedPcrData {
  // Clean symbols and filter out invalid entries
  const cleanedData = data
    .map((item) => ({
      ...item,
      tradingSymbol: cleanTradingSymbol(item.tradingSymbol),
    }))
    .filter(
      (item) =>
        item.tradingSymbol && item.pcr !== null && item.pcr !== undefined
    );

  // Bucket A: Oversold (pcr < 0.40) - Sort ascending (lowest PCR first)
  const oversold = cleanedData
    .filter((item) =>item.pcr > 0.0 &&  item.pcr < 0.4)
    .sort((a, b) => a.pcr - b.pcr)
    .slice(0, 2);

  // Bucket B: Bearish (0.40 <= pcr < 0.70) - Sort descending
  const bearish = cleanedData
    .filter((item) => item.pcr >= 0.4 && item.pcr < 0.7)
    .sort((a, b) => b.pcr - a.pcr)
    .slice(0, 2);

  // Bucket C: Neutral (0.70 <= pcr <= 1.00) - Sort by closest to 1.0
  const neutral = cleanedData
    .filter((item) => item.pcr >= 0.7 && item.pcr <= 1.0)
    .sort((a, b) => Math.abs(1.0 - a.pcr) - Math.abs(1.0 - b.pcr))
    .slice(0, 2);

  // Bucket D: Bullish (pcr > 1.00) - Sort descending (highest PCR first)
  const bullish = cleanedData
    .filter((item) => item.pcr > 1.0)
    .sort((a, b) => b.pcr - a.pcr)
    .slice(0, 2);

  return { oversold, bearish, neutral, bullish };
}

/**
 * Get category label and color based on PCR value
 */
export function getPcrCategory(pcr: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (pcr < 0.4) {
    return {
      label: "Oversold",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    };
  } else if (pcr >= 0.4 && pcr < 0.7) {
    return { label: "Bearish", color: "text-red-600", bgColor: "bg-red-100" };
  } else if (pcr >= 0.7 && pcr <= 1.0) {
    return { label: "Neutral", color: "text-gray-600", bgColor: "bg-gray-100" };
  } else {
    return {
      label: "Bullish",
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  }
}
