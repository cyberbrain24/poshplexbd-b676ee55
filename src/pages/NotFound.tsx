import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PoshplexHeader />
      
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-8xl md:text-[12rem] font-black text-muted-foreground/20 block">
            404
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4 -mt-8">
            PAGE NOT FOUND
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-medium tracking-wider hover:bg-primary-hover transition-colors"
          >
            RETURN HOME
          </Link>
        </div>
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default NotFound;