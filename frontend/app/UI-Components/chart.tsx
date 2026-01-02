"use client";
import React, { useRef, useEffect, useState } from "react";
import { createChart, ColorType, AreaSeries, Time } from "lightweight-charts";
import { processChartData } from "../lib/chart-utils";
import api, { getErrorMessage } from "../lib/axios-interceptor";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ChartDataPoint {
  time: number;
  value: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
  };
}

export const ChartComponent: React.FC<ChartProps> = (props) => {
  const {
    data,
    colors: {
      backgroundColor = "#ffffff",
      lineColor = "#2563eb",
      textColor = "#64748b",
    } = {},
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: "#6b7280",
        fontSize: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      width: chartContainerRef.current.clientWidth,
      height: 240,
      grid: {
        vertLines: {
          color: "#6366f1",
          style: 1,
          visible: true,
        },
        horzLines: {
          color: "rgba(229, 231, 235, 0.5)",
          style: 1,
          visible: false,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(99, 102, 241, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#6366f1',
        },
        horzLine: {
          color: 'rgba(99, 102, 241, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#6366f1',
        },
      },
      timeScale: {
        borderColor: "#e5e7eb",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 12,
        minBarSpacing: 8,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: "#e5e7eb",
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        mode: 0,
        autoScale: true,
        alignLabels: true,
        borderVisible: true,
      },
      leftPriceScale: {
        visible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      kineticScroll: {
        touch: true,
        mouse: false,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(99, 102, 241, 0.4)',
      bottomColor: 'rgba(99, 102, 241, 0.02)',
      lineColor: '#6366f1',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: '#6366f1',
      crosshairMarkerBackgroundColor: '#ffffff',
      crosshairMarkerBorderWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineWidth: 1,
      priceLineColor: '#6366f1',
      priceLineStyle: 3,
    });

    const formattedData = data.map(item => ({
      time: Math.floor(item.time) as Time,
      value: item.value,
    }));

    areaSeries.setData(formattedData);
    chart.timeScale().fitContent();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, lineColor, textColor]);

  return <div ref={chartContainerRef} className="w-full" />;
};

interface ChartInput {
  symbolToken?: string;
  symbolName?: string;
}

type ChartInterval = "FIVE_MINUTE" | "ONE_HOUR" | "ONE_DAY";
type ChartPeriod = "1Y" | "3Y";

export default function Chart({ symbolToken, symbolName }: ChartInput) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<ChartInterval>("ONE_HOUR");
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("1Y");

  // Default values for NIFTY 50
  const DEFAULT_TOKEN = "99926000";
  const DEFAULT_NAME = "NIFTY 50";

  // Use provided values or defaults
  const activeToken = symbolToken || DEFAULT_TOKEN;
  const activeName = symbolName || DEFAULT_NAME;

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    const toDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 15:30`;

    const fromDate = new Date(now);
    if (selectedPeriod === "1Y") {
      fromDate.setFullYear(fromDate.getFullYear() - 1);
    } else {
      fromDate.setFullYear(fromDate.getFullYear() - 3);
    }
    const fromDateStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}-${String(fromDate.getDate()).padStart(2, "0")} 09:15`;

    return { fromDate: fromDateStr, toDate };
  };

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { fromDate, toDate } = getDateRange();

      const response = await api.get("/priceHistory", {
        params: {
          exchange: "NSE",
          symboltoken: activeToken,
          interval: selectedInterval,
          fromDate: fromDate,
          toDate: toDate,
        },
      });

      const formattedData = processChartData(response.data);
      setChartData(formattedData);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [selectedInterval, selectedPeriod, activeToken]);

  const intervalLabels: Record<ChartInterval, string> = {
    FIVE_MINUTE: "5 MIN",
    ONE_HOUR: "1H",
    ONE_DAY: "1D",
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{activeName}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{intervalLabels[selectedInterval]} Chart</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-56">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm text-gray-400">Loading chart data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{activeName}</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-56 gap-3">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-red-600 text-center px-4">{error}</p>
          <button
            onClick={fetchChartData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-t-lg border border-gray-200">
      {/* Header with interval and period selectors */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{activeName}</h3>
          {!symbolToken && (
            <p className="text-xs text-gray-500 mt-0.5">Default view</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Interval selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            {(["FIVE_MINUTE", "ONE_HOUR", "ONE_DAY"] as const).map((int) => (
              <button
                key={int}
                onClick={() => setSelectedInterval(int)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${selectedInterval === int
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {intervalLabels[int]}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            {(["1Y", "3Y"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${selectedPeriod === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="p-2">
        {chartData.length > 0 ? (
          <ChartComponent data={chartData} />
        ) : (
          <div className="flex items-center justify-center h-56">
            <p className="text-sm text-gray-400">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}