"use client";
import { useEffect, useState } from "react";
import Header from "../UI-Components/header";
import Sidebar from "../sidebar/sidebar";
import Chart from "../UI-Components/chart";
import PortfolioTables from "../UI-Components/portfolio-table";
import SearchInput from "../UI-Components/search-input";

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [authReady, setAuthReady] = useState(false);
  const [userDetails, setUserDetails] = useState({ name: "", email: "" });

  useEffect(() => {
    const loadProfile = () => {
      try {
        const raw = localStorage.getItem("userProfile");
        if (raw) {
          const parsed = JSON.parse(raw);
          setUserDetails({
            name: typeof parsed?.name === "string" ? parsed.name : "",
            email: typeof parsed?.email === "string" ? parsed.email : "",
          });
        }
      } catch {
        // ignore
      }
    };

    const checkAuth = () => {
      const token = localStorage.getItem("jwt_token");
      setAuthReady(Boolean(token));
      loadProfile();
    };

    checkAuth();

    window.addEventListener("auth-token-updated", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("auth-token-updated", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <div className="dashboard__page h-screen grid grid-rows-[auto_1fr] bg-indigo-50">
      <div className="header">
        <Header
          userName={userDetails.name}
          userEmail={userDetails.email}
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
      <div className="grid grid-cols-[18%_82%] overflow-hidden">
        <div className="sidebar__content  overflow-y-auto">
          <Sidebar authReady={authReady} />
        </div>
        <div className="main__content flex flex-col rounded-tl-2xl overflow-hidden">
          <div className="chart__content rounded-tl-2xl shrink-0">
            <Chart symbolToken={selectedToken || ""} symbolName={selectedName} />
          </div>
          <div className="portfolio__list flex-1 overflow-auto">
            <PortfolioTables authReady={authReady} />
          </div>
        </div>
      </div>
    </div>
  )
}