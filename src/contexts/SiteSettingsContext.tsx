import React, { createContext, useContext, ReactNode } from "react";
import { useSiteSettings, SiteSettings, DEFAULT_SETTINGS } from "@/hooks/useSiteSettings";

interface SiteSettingsContextValue {
  settings: SiteSettings;
  isLoading: boolean;
  isError: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, isError } = useSiteSettings();

  // Always provide valid settings (fallback to defaults)
  const settings = data || (DEFAULT_SETTINGS as SiteSettings);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, isError }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettingsContext = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    // Return defaults if used outside provider (fallback safety)
    return {
      settings: DEFAULT_SETTINGS as SiteSettings,
      isLoading: false,
      isError: false,
    };
  }
  return context;
};

export default SiteSettingsContext;
