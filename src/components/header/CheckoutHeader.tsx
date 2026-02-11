import { Link } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";

const SITE_NAME = "POSHPLEX";

const CheckoutHeader = () => {
  return (
    <header className="w-full sticky top-0 z-50 bg-background">
      <AnnouncementBar />
      <nav className="flex items-center justify-between h-14 px-6 border-b border-border">
        {/* Logo */}
        <Link to="/">
          <span className="text-2xl font-black tracking-tighter text-foreground">
            {SITE_NAME}
          </span>
        </Link>

        {/* Center message replacing category nav */}
        <span className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
          Ensure Your Contact Number &amp; Address
        </span>

        {/* Empty right side for balance */}
        <div className="w-8" />
      </nav>
    </header>
  );
};

export default CheckoutHeader;
