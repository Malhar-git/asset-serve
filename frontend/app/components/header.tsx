import { useRouter } from "next/navigation";
import { ReactNode, useState, useSyncExternalStore } from "react";
import { removeAuthToken } from "../lib/axios-interceptor";
import { getCurrentDate, getInitials, getSalutaions } from "../lib/utils";
import { Button } from "../UI-Components/button";

const emptySubscribe = () => () => { };

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface HeaderProps {
  userName: string;
  userEmail: string;
  searchBar?: ReactNode;
  showBackToDashboard?: boolean;
}

export default function Header({ userName, userEmail, searchBar, showBackToDashboard = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isClient = useIsClient();

  const salutation = isClient ? getSalutaions() : "";
  const dateDisplay = isClient ? getCurrentDate() : "";
  const initials = isClient && (userName || userEmail)
    ? getInitials(userName ?? "", userEmail ?? "")
    : "";
  const displayTitle = isClient ? userEmail : "";

  //Using next.js router for Watchlist page traversal
  const router = useRouter();


  const signOut = () => {
    removeAuthToken();
    localStorage.removeItem("userProfile");
    setIsMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="site--header flex items-center justify-between p-4 py-2 h-20">
      <div className="header__profile flex flex-row">
        <div className="header__logo text-4xl pr-6 font-bold font-serif">
          Asset Serve
        </div>
        <div className="Header__salutation flex flex-col">
          <span className="salutation font-semibold">
            {salutation}, {userName || 'User'}
          </span>
          <span className="current-date text-sm">
            {dateDisplay}
          </span>
        </div>

      </div>

      <div className="header__functions flex flex-row px-3 items-center">
        {/* Search Scrip - only show if provided */}
        {searchBar && (
          <div className="header__searchInput flex-1 min-w-80">
            {searchBar}
          </div>
        )}

        {/* Navigation Button */}
        <div className="header__navigation relative flex-2 ml-16">
          {showBackToDashboard ? (
            <Button size="md" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          ) : (
            <Button size="md" onClick={() => router.push("/watchlist")}>WatchList</Button>
          )}
        </div>

        {/*Wrap avatar in a relative div for positioning */}
        <div className="header__profile flex-3 ml-8 relative">
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)} // Toggles the menu
            className="header__user-avatar w-10 h-10 flex items-center justify-center font-semibold hover:opacity-90 transition"
            title={displayTitle}
            size={"rounded"}
          >
            {initials || '?'}
          </Button>
          {/*The Dropdown (Conditional Render) */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-medium"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}