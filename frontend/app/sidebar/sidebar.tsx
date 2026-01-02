import PcrCards from "../UI-Components/pcr-cards";
import PriceTicker from "../UI-Components/price-ticker";

interface SidebarProps {
  authReady: boolean;
}

export default function Sidebar({ authReady }: SidebarProps) {
  const navItems = ["DashBoard", "WatchList", "Market Movement"];

  return (
    <div className="sidebar__content">
      <div className="sidebar__price-ticker flex justify-center mb-6">
        <PriceTicker />
      </div>
      <PcrCards authReady={authReady} />
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