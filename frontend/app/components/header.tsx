import { getCurrentDate, getInitials, getSalutaions } from "../lib/utils";
import PriceTicker from "../UI-Components/price-ticker";
import SearchInput from "../UI-Components/search-input";
import { ReactNode } from "react";
interface HeaderProps {
  userName: string;
  userEmail: string;
  searchBar: ReactNode; // Slot pattern
}

export default function Header({ userName, userEmail, searchBar }: HeaderProps) {

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

  return (
    <header className="site--header flex items-center justify-between px-4 py-2 h-20 shrink-0">
      <div className="header__logo w-12">

      </div>
      <div className="header__salutation flex flex-col">
        <span className="salutation text-sm">
          {salutation}, <strong>{userName || 'User'}</strong>
        </span>
        <span className="current-date text-xs">
          {dateDisplay}
        </span>
      </div>
      <div className="header__ticker flex-shrink-0">
        <PriceTicker />
      </div>
      <div className="header__searchInput flex-1 max-w-md mx-4">
        {searchBar}
      </div>
      <div className="header__user-avatar w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold" title={userEmail}>
        {initials || '?'}
      </div>
    </header>
  )
}
