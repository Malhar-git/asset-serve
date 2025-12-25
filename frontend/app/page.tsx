import Image from "next/image";
import PortfolioTables from "./UI-Components/portfolio-table";
import Chart from "./UI-Components/chart";
import LoginPage from "./login/login-page";
import DashboardPage from "./dashboard/page";
import PriceTicker from "./UI-Components/price-ticker";

export default function Home() {
  return (
    <div className="mainPage">
      <main>
        <LoginPage />
      </main>
    </div>
  );
}
