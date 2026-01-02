"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../lib/axios-interceptor";
import { AlertCircle, RefreshCw } from "lucide-react";

interface PortfolioItem {
  tradingSymbol: string;
  symbolToken: string;
  quantity: number;
  averagePrice: number;
  ltp: number;
  pnl: number;
  profitPercentage: number;
}

export default function PortfolioTables({ authReady }: { authReady: boolean }) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await api.get("/dashboard/portfolio");
      setPortfolio(response.data);
    } catch (err) {
      const message = getErrorMessage(err);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) {
      return;
    }

    fetchPortfolio();
  }, [authReady]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading portfolio...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-8 text-center bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
        <p className="text-red-600 mb-3">{errorMessage}</p>
        <button
          onClick={fetchPortfolio}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative  max-h-[500px] bg-neutral-primary-soft shadow-xs rounded-base">
      <table className="w-full text-sm text-left rtl:text-right text-body border-2 border-neutral-100">
        <thead className="text-sm text-body bg-neutral-100 sticky top-0 ">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium border-0 sticky top-0 left-0 bg-neutral-secondary-soft z-30">
              Name
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Symbol Token
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              LTP
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Avg
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Qty
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              Value
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              P&L
            </th>
            <th scope="col" className="px-6 py-3 font-medium border-0">
              P&L %
            </th>
          </tr>
        </thead>
        <tbody>
          {portfolio.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                No portfolio items found
              </td>
            </tr>
          ) : (
            portfolio.map((item, index) => (
              <tr
                key={item.symbolToken}
                className={`${index % 2 === 0 ? "bg-white" : "bg-neutral-100"} border-none`}
              >
                <th
                  scope="row"
                  className={`px-6 py-4 font-medium text-heading whitespace-nowrap border-0 sticky left-0 z-20 bg-neutral-secondary-soft`}
                >
                  {item.tradingSymbol}
                </th>
                <td className="px-6 py-4 border-0">{item.symbolToken}</td>
                <td className="px-6 py-4 border-0">₹{(item.ltp ?? 0).toFixed(2)}</td>
                <td className="px-6 py-4 border-0">₹{(item.averagePrice ?? 0).toFixed(2)}</td>
                <td className="px-6 py-4 border-0">{item.quantity}</td>
                <td className="px-6 py-4 border-0">
                  ₹{((item.ltp ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                </td>
                <td
                  className={`px-6 py-4 border-0 font-medium ${(item.pnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {(item.pnl ?? 0) >= 0 ? "+" : ""}₹{(item.pnl ?? 0).toFixed(2)}
                </td>
                <td
                  className={`px-6 py-4 border-0 font-medium ${(item.profitPercentage ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {(item.profitPercentage ?? 0) >= 0 ? "+" : ""}
                  {(item.profitPercentage ?? 0).toFixed(2)}%
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}