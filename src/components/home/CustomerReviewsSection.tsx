import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useFeaturedReviews } from "@/hooks/useFeaturedReviews";
import ReviewLookCard from "@/components/reviews/ReviewLookCard";

const CustomerReviewsSection = () => {
  const { data: reviews = [], isLoading } = useFeaturedReviews(18);
  const autoplay = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true })
  );

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

        <Carousel
          opts={{ loop: true, align: "start" }}
          plugins={[autoplay.current]}
          className="w-full group"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {reviews.map((r) => (
              <CarouselItem
                key={r.id}
                className="pl-3 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6"
              >
                <ReviewLookCard review={r} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CarouselNext className="hidden md:flex -right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Carousel>

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
