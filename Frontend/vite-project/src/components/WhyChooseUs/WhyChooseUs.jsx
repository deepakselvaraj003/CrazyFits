import { Star, Truck, Palette, Layers } from "lucide-react";

const features = [
  {
    icon: Star,
    title: "Premium Quality",
    description: "High-quality fabric with long-lasting prints.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Quick production and delivery across India.",
  },
  {
    icon: Palette,
    title: "Custom Designs",
    description: "Design exactly the way you imagine.",
  },
  {
    icon: Layers,
    title: "Bulk Orders",
    description: "Affordable pricing for colleges, events, and businesses.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-background py-20">
     <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">  
        <h2 className="mb-14 text-center text-3xl font-extrabold text-dark md:text-4xl lg:text-5xl font-heading">
          Why Choose Us
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div className="group flex flex-col items-center rounded-[24px] border border-border bg-surface p-10 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:shadow-xl" key={index}>
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary mb-6 transition-colors duration-300">
                  <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-dark mb-3 font-heading">
                  {feature.title}
                </h3>

                <p className="text-sm leading-7 text-secondary">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}