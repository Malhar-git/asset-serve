import { useState } from "react";
import Header from "../components/header";
import Sidebar from "../sidebar/sidebar";
import Chart from "../UI-Components/chart";
import PortfolioTables from "../UI-Components/portfolio-table";


export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState();

  return (
    <div className="dashboard__page h-screen grid grid-rows-[auto_1fr]">
      <div className="header bg-slate-300">
        <Header userName={"Malhar"} userEmail={"malhar@1080p@gmail.com"} onScripSelect={(token)=setSelectedToken(token)} />
      </div>
      <div className="grid grid-cols-[16%_84%] bg-slate-300 overflow-hidden">
        <div className="sidebar__content  overflow-y-auto">
          <Sidebar />
        </div>
        <div className="main__content flex flex-col rounded-tl-2xl overflow-hidden">
          <div className="chart__content rounded-tl-2xl flex-shrink-0">
            <Chart token={selectedToken} />
          </div>
          <div className="portfolio__list flex-1 overflow-auto">
            <PortfolioTables />
          </div>
        </div>
      </div>
    </div>
  )
}