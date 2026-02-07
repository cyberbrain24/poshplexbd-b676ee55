import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for admin pages
 * Catches errors during rendering and displays a fallback UI
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin module error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-medium mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            An error occurred while loading this module. This could be due to a 
            network issue or temporary server problem.
          </p>
          <Button onClick={this.handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-6 p-4 bg-muted text-left text-sm overflow-auto max-w-full rounded">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error display for query errors
 */
export const QueryErrorDisplay = ({ 
  error, 
  onRetry 
}: { 
  error: Error | null; 
  onRetry?: () => void;
}) => {
  if (!error) return null;

  return (
    <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-destructive mb-1">Failed to load data</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {error.message || "An unexpected error occurred while fetching data."}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
