import { Truck, RotateCcw, Clock, ShieldCheck } from "lucide-react";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

interface PolicySection {
  id: string;
  icon: React.ElementType;
  title: string;
  items: { question: string; answer: string }[];
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    id: "shipping",
    icon: Truck,
    title: "Shipping",
    items: [
      {
        question: "How long does standard delivery take?",
        answer:
          "Standard delivery takes 3–5 business days within the country. Express (1–2 business days) is available at checkout for an additional fee.",
      },
      {
        question: "Is there free shipping?",
        answer:
          "Free standard shipping applies to all orders over £50. Orders below that threshold incur a flat £3.99 delivery fee.",
      },
      {
        question: "Do you ship internationally?",
        answer:
          "International shipping is currently available to the EU and select GCC countries. Delivery windows and duties vary by destination and are shown at checkout.",
      },
      {
        question: "How do I track my order?",
        answer:
          "Once your order ships you'll receive a confirmation email containing a tracking link. Order tracking within the app is coming in a future update.",
      },
    ],
  },
  {
    id: "returns",
    icon: RotateCcw,
    title: "Returns & Exchanges",
    items: [
      {
        question: "What is the returns window?",
        answer:
          "You may return most items within 30 days of delivery for a full refund to your original payment method, provided the item is unworn, unwashed, and in its original packaging.",
      },
      {
        question: "How do I start a return?",
        answer:
          "Go to your order history, select the item you'd like to return, and follow the on-screen steps to generate a prepaid return label. Drop-off at any authorised carrier location.",
      },
      {
        question: "Are there non-returnable items?",
        answer:
          "Swimwear, pierced jewellery, and items marked 'Final Sale' at the time of purchase are non-returnable for hygiene reasons.",
      },
      {
        question: "How long do refunds take?",
        answer:
          "Refunds are processed within 2 business days of us receiving the returned item. Depending on your bank, funds may take a further 3–5 working days to appear in your account.",
      },
    ],
  },
  {
    id: "packaging",
    icon: ShieldCheck,
    title: "Packaging & Sustainability",
    items: [
      {
        question: "What packaging do you use?",
        answer:
          "All weAR orders are shipped in recycled cardboard or compostable mailer bags. We do not use bubble wrap or single-use plastics.",
      },
      {
        question: "Can I reuse the packaging for my return?",
        answer:
          "Yes — our packaging is designed to be resealed for returns. Simply fold along the perforated line and apply the enclosed return label.",
      },
    ],
  },
  {
    id: "contact",
    icon: Clock,
    title: "Contact & Response Times",
    items: [
      {
        question: "How do I reach customer support?",
        answer:
          "Email us at support@wear.app. We aim to respond to all enquiries within one business day.",
      },
      {
        question: "What are your support hours?",
        answer:
          "Our team is available Monday–Friday, 09:00–18:00 GMT. We monitor urgent queries outside those hours and will respond by the next business morning.",
      },
    ],
  },
];

export function CustomerShippingReturnsPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section
        className={cn(customerTheme.card, "p-8 sm:p-12")}
        aria-labelledby="sr-heading"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={cn(
              "mb-3 text-sm font-semibold uppercase tracking-widest",
              customerTheme.primaryText,
            )}
          >
            Policies
          </p>
          <h1
            id="sr-heading"
            className="mb-4 text-3xl font-bold tracking-tight text-[#2F2925] sm:text-4xl"
          >
            Shipping & Returns
          </h1>
          <p className={cn("text-lg leading-relaxed", customerTheme.mutedText)}>
            Everything you need to know about getting your order to you — and
            what to do if something isn't right.
          </p>
        </div>
      </section>

      {/* Quick summary cards */}
      <section aria-label="Policy highlights">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {[
            { label: "Standard delivery", value: "3–5 business days" },
            { label: "Free shipping", value: "Orders over £50" },
            { label: "Returns window", value: "30 days" },
            { label: "Refund processing", value: "2 business days" },
          ].map((item) => (
            <li
              key={item.label}
              className={cn(
                customerTheme.softCard,
                "flex flex-col items-center p-5 text-center",
              )}
            >
              <p className="text-xl font-bold text-[#A37E6B]">{item.value}</p>
              <p className={cn("mt-1 text-sm", customerTheme.mutedText)}>
                {item.label}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Policy detail sections */}
      {POLICY_SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`${section.id}-heading`}>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4EDE7]">
              <section.icon
                className="h-5 w-5 text-[#A37E6B]"
                aria-hidden="true"
              />
            </span>
            <h2
              id={`${section.id}-heading`}
              className="text-xl font-bold text-[#2F2925]"
            >
              {section.title}
            </h2>
          </div>

          <dl className="space-y-4">
            {section.items.map((item) => (
              <div
                key={item.question}
                className={cn(customerTheme.softCard, "p-5")}
              >
                <dt className="mb-2 font-semibold text-[#2F2925]">
                  {item.question}
                </dt>
                <dd className={cn("text-sm leading-relaxed", customerTheme.mutedText)}>
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {/* Footer note */}
      <p
        className={cn(
          "rounded-2xl border border-[#E4DCD1] bg-[#F4EDE7] p-5 text-sm leading-relaxed",
          customerTheme.mutedText,
        )}
        role="note"
      >
        Policies apply to purchases made through the weAR storefront. Retailer
        partners may have supplementary policies that are disclosed on individual
        product pages. For any query not covered here, reach us at{" "}
        <a
          href="mailto:support@wear.app"
          className={cn(
            "font-medium underline underline-offset-2",
            customerTheme.primaryText,
            customerTheme.focusRing,
          )}
        >
          support@wear.app
        </a>
        .
      </p>
    </div>
  );
}
