import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";

const NotFound = () => {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Page Not Found | Poshplex</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
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