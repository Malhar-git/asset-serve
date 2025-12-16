/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useEffect, useState } from "react";
import { AreaSeries, createChart, ColorType } from "lightweight-charts";
import { processChartData } from "../lib/chartUtils";
import axios from 'axios';

// Props interface defining the chart configuration options
interface ChartProps {
  data: { time: string; value: number }[];
  colors?: {
    backgroundColor?: string;
    line?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

// ChartComponent renders an interactive area chart using lightweight-charts library
export const ChartComponent: React.FC<ChartProps> = (props) => {
  // Destructure props with default color values for customization
  const {
    data,
    colors: {
      backgroundColor = "white",
      line = "blue",
      textColor = "black",
      areaTopColor = "blue",
      areaBottomColor = "blue",
    } = {},
  } = props;

  // Reference to the container div element for chart rendering
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Effect hook to initialize chart and handle cleanup
  useEffect(() => {
    // Guard clause to ensure container ref is available
    if (!chartContainerRef.current) return;

    // Handler to resize chart when window dimensions change
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    // Create the chart instance with layout and dimension settings
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    // Automatically fit all data points within the visible time range
    chart.timeScale().fitContent();

    // Add area series with specified color configuration
    const newSeries = chart.addSeries(AreaSeries, {
      lineColor: line,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
    });

    // Populate the series with provided data points
    newSeries.setData(data);

    // Subscribe to window resize events for responsive behavior
    window.addEventListener("resize", handleResize);

    // Cleanup function to remove event listener and dispose chart
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, line, textColor, areaTopColor, areaBottomColor]);

  // Render the chart container div
  return <div ref={chartContainerRef} />;
};

// Sample data for demonstration purposes

// Default export with sample data for quick testing
export default function Chart() {

  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Enter your JWT token here
        const JWT_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJmaXJzdE5hbWUiOiJTYW1lZXIiLCJzdWIiOiJzYW1lZXJAdGVzdC5jb20iLCJpYXQiOjE3NjU4ODE5OTksImV4cCI6MTc2NTk2ODM5OX0.gQrrNOkAizF8SxrwiB8OfLzBykceOKffeJPkUiy6wdrITZbdWkpVLO5kQbOlbKaG7qLvgd9S6i5NZfrobqPgYA";

        const response = await axios.get("http://localhost:8080/api/v1/priceHistory", {
          params: {
            exchange: "NSE",
            symboltoken: "3045",
            interval: "ONE_HOUR",
            fromDate: "2023-10-01 09:15",
            toDate: "2023-10-10 15:30",
          },
          headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
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
  }, []);

  if (loading) return <div>Loading Chart..</div>

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">SBI Performance</h2>

      {/* 3. Render the Chart with transformed data */}
      {chartData.length > 0 ? (
        <ChartComponent data={chartData} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
}
