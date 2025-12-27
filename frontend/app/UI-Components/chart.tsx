/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useEffect, useState } from "react";
import { LineSeries, createChart, ColorType } from "lightweight-charts";
import { processChartData } from "../lib/chartUtils";
import api from "../lib/axios-interceptor";

interface ChartProps {
  data: { time: number; value: number }[];
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
        textColor: textColor,
        fontSize: 11,
      },
      width: chartContainerRef.current.clientWidth,
      height: 220,
      grid: {
        vertLines: { color: "#f1f5f9" },
        horzLines: { color: "#f1f5f9" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#cbd5e1',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2563eb',
        },
        horzLine: {
          color: '#cbd5e1',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2563eb',
        },
      },
      timeScale: {
        borderColor: "#e2e8f0",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 10,
        minBarSpacing: 5,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      rightPriceScale: {
        borderColor: "#e2e8f0",
        scaleMargins: {
          top: 0.2,
          bottom: 0.15,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: '#ffffff',
      lastValueVisible: true,
      priceLineVisible: true,
    });

    const formattedData = data.map(item => ({
      time: Math.floor(item.time) as any,
      value: item.value,
    }));

    lineSeries.setData(formattedData);
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
  symbolToken: string;
  symbolName: string;
}

export default function Chart({ symbolToken, symbolName }: ChartInput) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<"ONE_HOUR" | "ONE_DAY" | "ONE_WEEK">("ONE_HOUR");
  const [period, setPeriod] = useState<"1Y" | "3Y">("1Y");

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    const toDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 15:30`;

    const fromDate = new Date(now);
    if (period === "1Y") {
      fromDate.setFullYear(fromDate.getFullYear() - 1);
    } else {
      fromDate.setFullYear(fromDate.getFullYear() - 3);
    }
    const fromDateStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}-${String(fromDate.getDate()).padStart(2, "0")} 09:15`;

    return { fromDate: fromDateStr, toDate };
  };

  useEffect(() => {
    if (!symbolToken) return;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { fromDate, toDate } = getDateRange();
        const response = await api.get("/priceHistory", {
          params: {
            exchange: "NSE",
            symboltoken: symbolToken,
            interval: interval,
            fromDate: fromDate,
            toDate: toDate,
          },
        });
        const formattedData = processChartData(response.data);
        setChartData(formattedData);
      } catch (error) {
        console.error("Failed to load chart", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [interval, period, symbolToken]);

  const intervalLabels = {
    ONE_HOUR: "1H",
    ONE_DAY: "1D",
    ONE_WEEK: "1W",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">SBI Performance</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{intervalLabels[interval]} Chart</span>
          </div>
        </div>
        <div className="flex items-center justify-center h-56">
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-t-lg">
      {/* Header with interval and period selectors */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{symbolName}</h3>

        <div className="flex items-center gap-3">
          {/* Interval selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            {(["ONE_HOUR", "ONE_DAY", "ONE_WEEK"] as const).map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${interval === int
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
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${period === p
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