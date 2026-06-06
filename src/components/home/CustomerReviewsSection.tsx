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
  const mobileAutoplay = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  if (!isLoading && reviews.length === 0) return null;

  // Chunk reviews into pages of 6 for mobile (3 cols x 2 rows)
  const mobilePages: typeof reviews[] = [];
  for (let i = 0; i < reviews.length; i += 6) {
    mobilePages.push(reviews.slice(i, i + 6));
  }

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

        {/* Mobile: 3 cols x 2 rows auto-sliding pages */}
        <Carousel
          opts={{ loop: true, align: "start" }}
          plugins={[mobileAutoplay.current]}
          className="w-full md:hidden"
        >
          <CarouselContent>
            {mobilePages.map((page, idx) => (
              <CarouselItem key={idx} className="basis-full">
                <div className="grid grid-cols-3 grid-rows-2 gap-2">
                  {page.map((r) => (
                    <ReviewLookCard key={r.id} review={r} />
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Desktop / tablet carousel */}
        <Carousel
          opts={{ loop: true, align: "start" }}
          plugins={[autoplay.current]}
          className="hidden md:block w-full group"
        >
          <CarouselContent className="-ml-3 md:-ml-4 items-stretch">
            {reviews.map((r) => (
              <CarouselItem
                key={r.id}
                className="pl-3 md:pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 h-auto"
              >
                <div className="h-full">
                  <ReviewLookCard review={r} />
                </div>
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
