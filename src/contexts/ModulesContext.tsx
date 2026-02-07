import { createContext, useContext, ReactNode, useMemo } from "react";
import { useActiveModules, SystemModule, isRouteActive, getActiveRoutes } from "@/hooks/useModules";

interface ModulesContextType {
  modules: SystemModule[] | undefined;
  isLoading: boolean;
  isModuleActive: (moduleKey: string) => boolean;
  isRouteAccessible: (pathname: string) => boolean;
  activeRoutes: string[];
}

const ModulesContext = createContext<ModulesContextType | undefined>(undefined);

export const ModulesProvider = ({ children }: { children: ReactNode }) => {
  const { data: modules, isLoading } = useActiveModules();

  const value = useMemo(() => ({
    modules,
    isLoading,
    isModuleActive: (moduleKey: string) => {
      if (!modules) return true;
      const module = modules.find(m => m.module_key === moduleKey);
      return module?.is_active ?? false;
    },
    isRouteAccessible: (pathname: string) => isRouteActive(modules, pathname),
    activeRoutes: getActiveRoutes(modules),
  }), [modules, isLoading]);

  return (
    <ModulesContext.Provider value={value}>
      {children}
    </ModulesContext.Provider>
  );
};

export const useModulesContext = () => {
  const context = useContext(ModulesContext);
  if (!context) {
    throw new Error("useModulesContext must be used within a ModulesProvider");
  }
  return context;
};
