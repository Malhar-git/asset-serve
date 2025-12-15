"use client";
import React, { useRef, useEffect } from "react";
import { AreaSeries, createChart, ColorType } from "lightweight-charts";

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
const initialData = [
  { time: "2018-12-22", value: 32.51 },
  { time: "2018-12-23", value: 31.11 },
  { time: "2018-12-24", value: 27.02 },
  { time: "2018-12-25", value: 27.32 },
  { time: "2018-12-26", value: 25.17 },
  { time: "2018-12-27", value: 28.89 },
  { time: "2018-12-28", value: 25.46 },
  { time: "2018-12-29", value: 23.92 },
  { time: "2018-12-30", value: 22.68 },
  { time: "2018-12-31", value: 22.67 },
];

// Default export with sample data for quick testing
export default function Chart() {
  return <ChartComponent data={initialData} />;
}
