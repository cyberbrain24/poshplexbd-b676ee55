import { useMemo, useState } from "react";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { useAllPublicReviews } from "@/hooks/useFeaturedReviews";
import ReviewLookCard from "@/components/reviews/ReviewLookCard";
import { Button } from "@/components/ui/button";

type Filter = "all" | "5" | "4plus" | "photos";

const CustomerReviews = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(20);
  const { data: reviews = [], isLoading } = useAllPublicReviews(200);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filter === "5") return r.rating === 5;
      if (filter === "4plus") return r.rating >= 4;
      if (filter === "photos") return (r.images?.length ?? 0) > 0;
      return true;
    });
  }, [reviews, filter]);

  const shown = filtered.slice(0, visible);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "5", label: "5 Stars" },
    { key: "4plus", label: "4+ Stars" },
    { key: "photos", label: "With Photos" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      <main className="px-4 md:px-8 py-10 md:py-16">
        <div className="max-w-[1600px] mx-auto">
          <header className="mb-8 md:mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.95] tracking-tight">
              The Fit Check<br />
              Community<br />
              <span className="text-muted-foreground/40 italic">Archive</span>
            </h1>
            <p className="mt-4 text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Poshplex // All Customer Reviews // #PoshplexFit
            </p>
          </header>

          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setFilter(t.key); setVisible(20); }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors ${
                  filter === t.key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Loading reviews...</div>
          ) : shown.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No reviews yet.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {shown.map((r) => <ReviewLookCard key={r.id} review={r} />)}
              </div>

              {visible < filtered.length && (
                <div className="flex justify-center mt-10">
                  <Button
                    onClick={() => setVisible((v) => v + 20)}
                    className="bg-foreground text-background hover:bg-foreground/90 uppercase font-black tracking-widest text-xs px-8 py-6 rounded-sm"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <PoshplexFooter />
    </div>
  );
};

export default CustomerReviews;
