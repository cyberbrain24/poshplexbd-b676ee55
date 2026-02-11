import AnnouncementBar from "./AnnouncementBar";

const SITE_NAME = "POSHPLEX";

const CheckoutHeader = () => {
  return (
    <header className="w-full sticky top-0 z-50 bg-background">
      <AnnouncementBar />
      <nav className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-14 px-6 py-3 sm:py-0 border-b border-border gap-1 sm:gap-0">
        {/* Logo - no link */}
        <span className="text-2xl font-black tracking-tighter text-foreground">
          {SITE_NAME}
        </span>

        {/* Center message */}
        <span className="text-xs sm:text-sm font-medium tracking-wider text-muted-foreground uppercase">
          Ensure Your Contact Number &amp; Address
        </span>

        {/* Empty right side for balance - hidden on mobile */}
        <div className="hidden sm:block w-8" />
      </nav>
    </header>
  );
};

export default CheckoutHeader;
