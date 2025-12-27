"use client";
import { useState } from "react";
import Header from "../components/header";
import Sidebar from "../sidebar/sidebar";
import Chart from "../UI-Components/chart";
import PortfolioTables from "../UI-Components/portfolio-table";
import SearchInput from "../UI-Components/search-input";

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");

  return (
    <div className="dashboard__page h-screen grid grid-rows-[auto_1fr]">
      <div className="header bg-slate-300">
        <Header
          userName="Malhar"
          userEmail="malhar@1080p@gmail.com"
          searchBar={
            <SearchInput
              onScripSelect={(token: string, name: string) => {
                setSelectedToken(token);
                setSelectedName(name);
              }}
            />
          }
        />
      </div>
      <div className="grid grid-cols-[16%_84%] bg-slate-300 overflow-hidden">
        <div className="sidebar__content  overflow-y-auto">
          <Sidebar />
        </div>
        <div className="main__content flex flex-col rounded-tl-2xl overflow-hidden">
          <div className="chart__content rounded-tl-2xl shrink-0">
            <Chart symbolToken={selectedToken || ""} symbolName={selectedName} />
          </div>
          <div className="portfolio__list flex-1 overflow-auto">
            <PortfolioTables />
          </div>
        </div>
      </div>
    </div>
  )
}