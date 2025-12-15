import Image from "next/image";
import PortfolioTables from "./UI-Components/portfolio-table";
import Chart from "./UI-Components/chart";

export default function Home() {
  return (
    <div className="mainPage">
      <main>
       <PortfolioTables/>
       <Chart />
      </main>
    </div>
  );
}
