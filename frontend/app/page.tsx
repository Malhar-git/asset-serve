import Image from "next/image";
import PortfolioTables from "./UI-Components/portfolio-table";

export default function Home() {
  return (
    <div className="mainPage">
      <main>
       <PortfolioTables/>
      </main>
    </div>
  );
}
