import { Link } from "react-router-dom";
import { Sparkles, Shirt, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

const VALUES = [
  {
    icon: Sparkles,
    title: "Fit-First Technology",
    description:
      "Our AR try-on engine maps garments to your body so you can explore fashion with real confidence before you commit.",
  },
  {
    icon: Shirt,
    title: "Curated Selection",
    description:
      "Every retailer on weAR is vetted for quality and transparency. You browse less noise and discover more things you'll actually wear.",
  },
  {
    icon: Heart,
    title: "Style on Your Terms",
    description:
      "Save favourites, build wishlists, and come back to your shortlist whenever inspiration strikes. Your wardrobe, your pace.",
  },
];

const TEAM = [
  { name: "Amira Khalil", role: "Co-founder & CEO" },
  { name: "Karim Mansour", role: "Co-founder & CTO" },
  { name: "Nour El-Din", role: "Head of Product" },
  { name: "Yasmine Farouk", role: "Head of Retail Partnerships" },
];

export function CustomerAboutPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section
        className={cn(customerTheme.card, "overflow-hidden p-8 sm:p-12 lg:p-16")}
        aria-labelledby="about-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className={cn("mb-3 text-sm font-semibold uppercase tracking-widest", customerTheme.primaryText)}>
            Our story
          </p>
          <h1
            id="about-heading"
            className="mb-6 text-3xl font-bold tracking-tight text-[#2F2925] sm:text-4xl"
          >
            Fashion discovery, reinvented
          </h1>
          <p className={cn("text-lg leading-relaxed", customerTheme.mutedText)}>
            weAR started from a simple frustration: online shopping asks you to
            imagine how clothes will look on you. We built the technology to
            show you instead.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section aria-labelledby="mission-heading">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2
              id="mission-heading"
              className="mb-4 text-2xl font-bold text-[#2F2925]"
            >
              What we're building
            </h2>
            <p className={cn("mb-4 leading-relaxed", customerTheme.mutedText)}>
              We're creating a storefront where augmented reality closes the gap
              between inspiration and purchase. Customers should be able to see
              themselves in a garment — not a generic model — before they decide.
            </p>
            <p className={cn("leading-relaxed", customerTheme.mutedText)}>
              By combining accurate fit data with a carefully curated retailer
              network, we aim to make returns the exception rather than the rule
              and help people build wardrobes they genuinely love.
            </p>
          </div>
          <div
            className={cn(
              customerTheme.softCard,
              "flex items-center justify-center p-10",
            )}
            aria-hidden="true"
          >
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F4EDE7]">
              <Sparkles className="h-12 w-12 text-[#A37E6B]" />
            </span>
          </div>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values-heading">
        <h2
          id="values-heading"
          className="mb-8 text-center text-2xl font-bold text-[#2F2925]"
        >
          What we stand for
        </h2>
        <ul className="grid gap-6 sm:grid-cols-3" role="list">
          {VALUES.map((v) => (
            <li key={v.title} className={cn(customerTheme.softCard, "p-6")}>
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F4EDE7]">
                <v.icon className="h-5 w-5 text-[#A37E6B]" aria-hidden="true" />
              </span>
              <h3 className="mb-2 font-semibold text-[#2F2925]">{v.title}</h3>
              <p className={cn("text-sm leading-relaxed", customerTheme.mutedText)}>
                {v.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Team */}
      <section aria-labelledby="team-heading">
        <h2
          id="team-heading"
          className="mb-8 text-center text-2xl font-bold text-[#2F2925]"
        >
          Meet the team
        </h2>
        <ul
          className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2"
          role="list"
        >
          {TEAM.map((member) => (
            <li
              key={member.name}
              className={cn(customerTheme.softCard, "flex items-center gap-4 p-5")}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F4EDE7] text-lg font-bold text-[#A37E6B]"
                aria-hidden="true"
              >
                {member.name.charAt(0)}
              </span>
              <div>
                <p className="font-semibold text-[#2F2925]">{member.name}</p>
                <p className={cn("text-sm", customerTheme.mutedText)}>
                  {member.role}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section
        className={cn(
          customerTheme.pageMuted,
          "rounded-3xl p-8 text-center sm:p-12",
        )}
        aria-labelledby="about-cta-heading"
      >
        <h2
          id="about-cta-heading"
          className="mb-3 text-2xl font-bold text-[#2F2925]"
        >
          Ready to explore?
        </h2>
        <p className={cn("mb-6", customerTheme.mutedText)}>
          Browse the curated shop or try on something new.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            asChild
            className={cn(
              "rounded-full bg-[#A37E6B] text-white",
              customerTheme.primaryHover,
              customerTheme.focusRing,
            )}
          >
            <Link to={CUSTOMER_ROUTES.shop}>Browse Shop</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={cn(
              "rounded-full border-[#E4DCD1] text-[#A37E6B]",
              customerTheme.focusRing,
            )}
          >
            <Link to={CUSTOMER_ROUTES.tryOn}>Try On Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
