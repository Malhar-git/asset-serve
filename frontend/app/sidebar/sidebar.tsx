import { Button } from "../UI-Components/button";
import PcrCards from "../UI-Components/pcr-cards";
import PriceTicker from "../UI-Components/price-ticker";

export default function Sidebar() {
  const navItems = ["DashBoard", "WatchList", "Market Movement"];

  return (
    <div className="sidebar__content">
      <PcrCards />
    </div>
  );
}

/*
<nav className="sidebar__navigation p-4 ">
        {navItems.map((item) => (
          <Button key={item} variant="opaque" className="w-full">
            {item}
          </Button>
        ))}
      </nav>
*/