export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  author: string;
  publishedAt: string;
  category: string;
  readingTimeMin: number;
  coverAlt: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "virtual-try-on-future-of-fashion",
    title: "Virtual Try-On: The Future of Fashion Discovery",
    excerpt:
      "How AR technology is removing the guesswork from online shopping and helping customers build wardrobes they love.",
    body: [
      "The biggest frustration in online fashion shopping has always been the gap between what you see on screen and what arrives at your door. Virtual try-on technology is closing that gap.",
      "At weAR, our try-on engine maps clothing onto your own measurements so you can see how a garment drapes, fits, and moves before committing to a purchase. The result is fewer returns and more confidence at checkout.",
      "Early adopters on our platform report a 40% reduction in returns compared to standard photo-based browsing. More importantly, they describe a fundamentally different shopping experience — one where style exploration feels low-stakes and genuinely fun.",
      "As 3D scanning hardware matures and browser capabilities improve, we expect virtual try-on to become the default mode for fashion discovery within the next five years. We're building the infrastructure now so our customers are ready.",
    ],
    author: "weAR Editorial",
    publishedAt: "2026-05-20",
    category: "Technology",
    readingTimeMin: 3,
    coverAlt: "A model wearing a flowing summer dress against a warm ivory background",
  },
  {
    id: "2",
    slug: "curating-a-capsule-wardrobe",
    title: "How to Curate a Capsule Wardrobe That Actually Works",
    excerpt:
      "A practical guide to building a small, intentional collection of clothes that maximises outfit combinations and minimises decision fatigue.",
    body: [
      "The capsule wardrobe concept sounds simple: own fewer things, but make each one count. In practice, most people struggle because they start with the wrong question.",
      "Don't ask 'what should I remove?' Ask instead 'what do I reach for again and again?' Those repeating anchors are the skeleton of your capsule. Build around them.",
      "A functional starter capsule needs approximately 30–35 pieces — roughly 10 tops, 5 bottoms, 3 dresses or jumpsuits, 5 layers, 5 shoes, and a handful of accessories. Quality over quantity applies, but budget is real; prioritise pieces that touch your body (knitwear, trousers, shoes) over statement layers.",
      "Colour discipline matters more than any individual item. Three neutrals plus one accent colour creates a system where almost everything works with almost everything else. Our shop filters let you search by colour family, which makes auditing your existing wardrobe surprisingly straightforward.",
      "Finally, review seasonally, not annually. A capsule that suits September needs gentle adjustment for January. Small tweaks prevent the wardrobe drift that usually ends in a cluttered, unwearable collection.",
    ],
    author: "Style Studio",
    publishedAt: "2026-04-10",
    category: "Style",
    readingTimeMin: 4,
    coverAlt: "A neatly arranged selection of neutral clothing items on hangers",
  },
  {
    id: "3",
    slug: "sustainable-fabric-guide",
    title: "A Shopper's Guide to Sustainable Fabrics",
    excerpt:
      "Not all eco-friendly labels mean the same thing. Here's what to look for when you want your wardrobe choices to align with your values.",
    body: [
      "Sustainability in fashion is a spectrum, not a binary. Understanding where different fabrics fall on that spectrum helps you make better trade-offs.",
      "Organic cotton uses significantly less pesticide than conventional cotton, but still requires substantial water. Tencel (lyocell) is produced in a closed-loop solvent process that recaptures nearly all chemicals. Recycled polyester reduces landfill pressure but still sheds microplastics in the wash.",
      "The most sustainable garment is usually the one you already own and continue to wear. After that, look for durable natural fibres or certified recycled materials from brands that publish their supply-chain data.",
      "At weAR, we partner with retailers who are working toward greater transparency in their material sourcing. We're building category filters that will surface certifications like GOTS, OEKO-TEX, and Bluesign so you can apply your values during browsing, not just during research.",
      "In the meantime, the best proxy for sustainability is longevity: choose pieces designed to last, care for them properly, and wear them often.",
    ],
    author: "weAR Editorial",
    publishedAt: "2026-03-15",
    category: "Sustainability",
    readingTimeMin: 4,
    coverAlt: "Close-up of natural linen fabric texture in warm light",
  },
];
