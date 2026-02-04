import { Truck, Shield, RotateCcw, MessageCircle } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "1-2 days"
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% encrypted"
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day policy"
  },
  {
    icon: MessageCircle,
    title: "24/7 Support",
    description: "WhatsApp"
  }
];

const FeaturesBar = () => {
  return (
    <section className="w-full bg-background border-y border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <div 
            key={feature.title}
            className={`flex items-center gap-4 px-6 py-6 ${
              index < features.length - 1 ? 'border-r border-border' : ''
            }`}
          >
            <feature.icon 
              size={24} 
              strokeWidth={1} 
              className="text-foreground shrink-0"
            />
            <div>
              <p className="text-sm font-medium tracking-wide text-foreground">
                {feature.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesBar;