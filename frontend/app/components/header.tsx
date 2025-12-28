import { getCurrentDate, getInitials, getSalutaions } from "../lib/utils";
import { ReactNode, useState } from "react"; // 1. Import useState

interface HeaderProps {
  userName: string;
  userEmail: string;
  searchBar: ReactNode;
}

export default function Header({ userName, userEmail, searchBar }: HeaderProps) {
  // 2. Add state to track if the menu is open
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  let initials = '?';
  try {
    if (userName || userEmail) {
      const initialsResult = getInitials(userName ?? '', userEmail ?? '');
      initials = typeof initialsResult === 'function' ? initialsResult() : initialsResult;
    }
  } catch {
    initials = '?';
  }

  const salutation = getSalutaions();
  const dateDisplay = getCurrentDate();

  const signout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/";
  }

  return (
    <header className="site--header flex items-center justify-between px-4 py-2 h-20 shrink-0 relative">
      <div className="header__logo w-12">
        {/* Logo content */}
      </div>

      <div className="header__salutation flex flex-col">
        <span className="salutation text-sm">
          {salutation}, <strong>{userName || 'User'}</strong>
        </span>
        <span className="current-date text-xs">
          {dateDisplay}
        </span>
      </div>

      <div className="header__searchInput flex-1 max-w-md mx-4">
        {searchBar}
      </div>

      {/*Wrap avatar in a relative div for positioning */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)} // Toggles the menu
          className="header__user-avatar w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold hover:opacity-90 transition"
          title={userEmail}
        >
          {initials || '?'}
        </button>

        {/*The Dropdown (Conditional Render) */}
        {isMenuOpen && (
          <div className="absolute right-full top-0 mr-2 w-32 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
            <button
              onClick={signout} // Actually signs out
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-medium"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}