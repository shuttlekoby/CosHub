import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import SectionContainer from "@/components/ui/section-container";
import SectionHeader from "./section-header";
import { Star } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type TestimonialsBlock = Extract<Block, { _type: "testimonials" }>;

export default function Testimonials(props: any) {
  const { padding, colorVariant, sectionHeader, testimonials, layout } = props;
  const color = stegaClean(colorVariant);
  const layoutType = stegaClean(layout) || "grid";

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const TestimonialCard = ({ testimonial }: { testimonial: any }) => (
    <div className="bg-card rounded-lg p-6 shadow-sm border">
      <div className="flex items-center mb-4">
        {renderStars(testimonial.rating || 5)}
      </div>
      <blockquote className="text-card-foreground mb-4">
        "{testimonial.quote}"
      </blockquote>
      <div className="flex items-center">
        {testimonial.author?.avatar && (
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
            <Image
              src={urlFor(testimonial.author.avatar)?.width(48).height(48).url() || ""}
              alt={testimonial.author.avatar.alt || testimonial.author.name || ""}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <div className="font-semibold text-card-foreground">
            {testimonial.author?.name}
          </div>
          {(testimonial.author?.title || testimonial.author?.company) && (
            <div className="text-sm text-muted-foreground">
              {[testimonial.author?.title, testimonial.author?.company]
                .filter(Boolean)
                .join(" at ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTestimonials = () => {
    if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) return null;

    switch (layoutType) {
      case "carousel":
        return (
          <div className="overflow-x-auto">
            <div className="flex gap-6 pb-4" style={{ width: `${testimonials.length * 400}px` }}>
              {testimonials.map((testimonial: any, index: number) => (
                <div key={index} className="w-96 flex-shrink-0">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>
        );
      case "single":
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {testimonials.map((testimonial: any, index: number) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        );
      default: // grid
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial: any, index: number) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        );
    }
  };

  return (
    <SectionContainer color={color} padding={padding}>
      {sectionHeader && <SectionHeader {...sectionHeader} />}
      {renderTestimonials()}
    </SectionContainer>
  );
} 