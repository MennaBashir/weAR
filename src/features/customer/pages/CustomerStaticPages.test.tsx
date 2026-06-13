import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerAboutPage } from "@/features/customer/pages/CustomerAboutPage";
import { CustomerShippingReturnsPage } from "@/features/customer/pages/CustomerShippingReturnsPage";
import { CustomerBlogPage } from "@/features/customer/pages/CustomerBlogPage";
import { BLOG_POSTS } from "@/features/customer/fixtures/blogFixtures";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";

const renderIn = (ui: React.ReactNode, route = "/customer/about") =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

// ─── Route constants ──────────────────────────────────────────────────────────

describe("CUSTOMER_ROUTES static page constants", () => {
  it("defines /customer/about", () => {
    expect(CUSTOMER_ROUTES.about).toBe("/customer/about");
  });

  it("defines /customer/shipping-returns", () => {
    expect(CUSTOMER_ROUTES.shippingReturns).toBe("/customer/shipping-returns");
  });

  it("defines /customer/blog", () => {
    expect(CUSTOMER_ROUTES.blog).toBe("/customer/blog");
  });
});

// ─── About page ───────────────────────────────────────────────────────────────

describe("CustomerAboutPage", () => {
  it("renders the main heading", () => {
    renderIn(<CustomerAboutPage />);
    expect(
      screen.getByRole("heading", { name: /fashion discovery, reinvented/i }),
    ).toBeInTheDocument();
  });

  it("renders the mission section", () => {
    renderIn(<CustomerAboutPage />);
    expect(
      screen.getByRole("heading", { name: /what we're building/i }),
    ).toBeInTheDocument();
  });

  it("renders value items", () => {
    renderIn(<CustomerAboutPage />);
    expect(
      screen.getByRole("heading", { name: /fit-first technology/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /curated selection/i }),
    ).toBeInTheDocument();
  });

  it("renders CTA links to shop and try-on", () => {
    renderIn(<CustomerAboutPage />);
    expect(screen.getByRole("link", { name: /browse shop/i })).toHaveAttribute(
      "href",
      CUSTOMER_ROUTES.shop,
    );
    expect(
      screen.getByRole("link", { name: /try on now/i }),
    ).toHaveAttribute("href", CUSTOMER_ROUTES.tryOn);
  });

  it("has no duplicate landmark IDs (about-heading used once)", () => {
    renderIn(<CustomerAboutPage />);
    const els = document.querySelectorAll("#about-heading");
    expect(els.length).toBe(1);
  });
});

// ─── Shipping & Returns page ──────────────────────────────────────────────────

describe("CustomerShippingReturnsPage", () => {
  it("renders the main heading", () => {
    renderIn(<CustomerShippingReturnsPage />, "/customer/shipping-returns");
    expect(
      screen.getByRole("heading", { name: /shipping & returns/i }),
    ).toBeInTheDocument();
  });

  it("renders shipping section", () => {
    renderIn(<CustomerShippingReturnsPage />, "/customer/shipping-returns");
    expect(
      screen.getByRole("heading", { name: /^shipping$/i }),
    ).toBeInTheDocument();
  });

  it("renders returns section", () => {
    renderIn(<CustomerShippingReturnsPage />, "/customer/shipping-returns");
    expect(
      screen.getByRole("heading", { name: /returns & exchanges/i }),
    ).toBeInTheDocument();
  });

  it("renders summary highlight cards", () => {
    renderIn(<CustomerShippingReturnsPage />, "/customer/shipping-returns");
    expect(screen.getByText("3–5 business days")).toBeInTheDocument();
    expect(screen.getByText("30 days")).toBeInTheDocument();
  });

  it("renders a support email link", () => {
    renderIn(<CustomerShippingReturnsPage />, "/customer/shipping-returns");
    const link = screen.getByRole("link", { name: /support@wear\.app/i });
    expect(link).toHaveAttribute("href", "mailto:support@wear.app");
  });
});

// ─── Blog page ────────────────────────────────────────────────────────────────

describe("CustomerBlogPage – list view", () => {
  it("renders the blog heading", () => {
    renderIn(<CustomerBlogPage />, "/customer/blog");
    expect(
      screen.getByRole("heading", { name: /style & stories/i }),
    ).toBeInTheDocument();
  });

  it("renders all fixture posts", () => {
    renderIn(<CustomerBlogPage />, "/customer/blog");
    for (const post of BLOG_POSTS) {
      expect(screen.getByText(post.title)).toBeInTheDocument();
    }
  });

  it("renders category filter buttons", () => {
    renderIn(<CustomerBlogPage />, "/customer/blog");
    expect(
      screen.getByRole("button", { name: /^all$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /technology/i }),
    ).toBeInTheDocument();
  });

  it("filters posts by category", () => {
    renderIn(<CustomerBlogPage />, "/customer/blog");
    fireEvent.click(screen.getByRole("button", { name: /sustainability/i }));
    expect(
      screen.getByText(/a shopper's guide to sustainable fabrics/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/curating a capsule wardrobe/i),
    ).not.toBeInTheDocument();
  });

  it("restores all posts when All is clicked again", () => {
    renderIn(<CustomerBlogPage />, "/customer/blog");
    fireEvent.click(screen.getByRole("button", { name: /technology/i }));
    fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
    expect(screen.getAllByRole("article").length).toBe(BLOG_POSTS.length);
  });
});

describe("CustomerBlogPage – post detail view", () => {
  it("opens post detail when Read button is clicked", () => {
    renderIn(<CustomerBlogPage />, "/customer/blog");
    const firstPost = BLOG_POSTS[0];
    fireEvent.click(screen.getByRole("button", { name: `Read: ${firstPost.title}` }));
    expect(
      screen.getByRole("heading", { name: firstPost.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(firstPost.body[0])).toBeInTheDocument();
  });

  it("returns to list view when Back is clicked", () => {
    renderIn(<CustomerBlogPage />, "/customer/blog");
    const firstPost = BLOG_POSTS[0];
    fireEvent.click(screen.getByRole("button", { name: `Read: ${firstPost.title}` }));
    fireEvent.click(screen.getByRole("button", { name: /back to blog list/i }));
    expect(
      screen.getByRole("heading", { name: /style & stories/i }),
    ).toBeInTheDocument();
  });
});

// ─── Blog fixtures ────────────────────────────────────────────────────────────

describe("BLOG_POSTS fixture integrity", () => {
  it("has at least one post", () => {
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
  });

  it("every post has required typed fields", () => {
    for (const post of BLOG_POSTS) {
      expect(typeof post.id).toBe("string");
      expect(typeof post.slug).toBe("string");
      expect(typeof post.title).toBe("string");
      expect(typeof post.excerpt).toBe("string");
      expect(Array.isArray(post.body)).toBe(true);
      expect(post.body.length).toBeGreaterThan(0);
      expect(typeof post.author).toBe("string");
      expect(typeof post.publishedAt).toBe("string");
      expect(typeof post.category).toBe("string");
      expect(typeof post.readingTimeMin).toBe("number");
    }
  });

  it("slugs are unique", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("ids are unique", () => {
    const ids = BLOG_POSTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
