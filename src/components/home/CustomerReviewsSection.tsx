import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useFeaturedReviews } from "@/hooks/useFeaturedReviews";
import ReviewLookCard from "@/components/reviews/ReviewLookCard";

const CustomerReviewsSection = () => {
  const { data: reviews = [], isLoading } = useFeaturedReviews(8);

  if (!isLoading && reviews.length === 0) return null;

  return (
    <section className="w-full px-4 md:px-8 py-12 md:py-20 bg-background">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8 md:mb-12">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase leading-[0.95] tracking-tight">
            The Fit Check<br />
            Community<br />
            <span className="relative inline-block">
              Archive
              <span className="ml-3 text-muted-foreground/40 italic font-black">#fitcheck</span>
            </span>
          </h2>
          <p className="mt-4 text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Poshplex // Customer Reviews // #PoshplexFit
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {reviews.map((r) => (
            <ReviewLookCard key={r.id} review={r} />
          ))}
        </div>

        <div className="flex justify-end mt-8">
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-foreground/90 transition-colors rounded-sm"
          >
            Load More Looks <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviewsSection;
