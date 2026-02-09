/**
 * OurStorySection - Brand story, community, and manifesto section
 * Three-column layout on desktop, stacked on mobile
 */

const OurStorySection = () => {
  const sections = [
    {
      title: "OUR STORY",
      content:
        "PoshPlex was born from street culture and the need to wear your identity out loud. We started with a vision to turn everyday fits into statements of attitude and belonging. What began as a small idea among creatives grew into a label shaped by movement, music, and city life. Every drop reflects raw energy, originality, and the pulse of the streets. Our story is written by those who live bold and wear PoshPlex their way.",
    },
    {
      title: "COMMUNITY",
      content:
        "PoshPlex stands on a community that creates, not follows. We are inspired by skaters, artists, musicians, and everyday rule-breakers redefining style. Every tag, share, and street photo connects us closer to the culture we represent. We listen to the voices that wear us and let them shape what comes next. Together, we build more than fashion — we build a movement.",
    },
    {
      title: "MANIFESTO",
      content:
        "We believe clothing is a voice before you even speak. We stand for originality over imitation and culture over hype. We value confidence, creativity, and fearless self-expression in every piece we release. We commit to designs that carry meaning, attitude, and street energy. This is PoshPlex — made from the streets, worn with purpose.",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-foreground text-background">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-lg font-bold tracking-widest">
                {section.title}
              </h3>
              <p className="text-sm leading-relaxed text-background/80">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurStorySection;
