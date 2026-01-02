import PcrCards from "../UI-Components/pcr-cards";
import PriceTicker from "../UI-Components/price-ticker";

interface SidebarProps {
  authReady: boolean;
}

export default function Sidebar({ authReady }: SidebarProps) {
  return (
    <div className="sidebar__content">
      <div className="sidebar__price-ticker flex justify-center mb-6">
        <PriceTicker />
      </div>
      <PcrCards authReady={authReady} />
    </div>
  );
}
