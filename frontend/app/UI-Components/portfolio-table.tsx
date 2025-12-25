"use client";

import { useEffect, useState } from "react";
import api from "../lib/axios-interceptor";

interface PortfolioItem {
  tradingSymbol: string;
  symbolToken: string;
  quantity: number;
  averagePrice: number;
  ltp: number;
  pnl: number;
  profitPercentage: number;
}

export default function PortfolioTables() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const response = await api.get("/dashboard/portfolio");
        setPortfolio(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
        setError("Failed to load portfolio data");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        {error}
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto overflow-y-auto max-h-[500px] bg-neutral-primary-soft shadow-xs rounded-base">
      <table className="w-full text-sm text-left rtl:text-right text-body">
        <thead className="text-sm text-body bg-slate-50 sticky top-0 ">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium border-0 sticky left-0 bg-neutral-secondary-soft z-30">
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
                  className="px-6 py-4 font-medium text-heading whitespace-nowrap border-0 sticky left-0 z-10"
                  style={{ backgroundColor: index % 2 === 0 ? 'white' : 'rgb(245 245 245)' }}
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