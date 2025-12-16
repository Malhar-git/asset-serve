import Image from "next/image";
import PortfolioTables from "./UI-Components/portfolio-table";
import Chart from "./UI-Components/chart";
import LoginPage from "./components/login-page";

export default function Home() {
  return (
    <div className="mainPage">
      <main>
        <LoginPage/>
      </main>
    </div>
  );
}
