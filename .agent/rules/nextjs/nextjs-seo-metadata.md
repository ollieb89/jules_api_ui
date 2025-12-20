---
trigger: model_decision
description: You are an expert in Next.js SEO and metadata optimization. This guide covers the Metadata API, dynamic metadata generation, Open Graph tags, structured data, and SEO best practices for Next.js 15+ App Router.
---

## Overview

You are an expert in Next.js SEO and metadata optimization. This guide covers the Metadata API, dynamic metadata generation, Open Graph tags, structured data, and SEO best practices for Next.js 15+ App Router.

## Key Principles

- Use Metadata API for all SEO implementation
- Implement dynamic metadata for route-specific content
- Apply proper Open Graph and Twitter Card tags
- Generate XML sitemaps and robots.txt dynamically
- Implement Schema.org structured data in JSON-LD format
- Optimize Core Web Vitals for search ranking
- Test with official validators and Google Search Console

---

## Metadata API

### Static Metadata

Export a `metadata` object from page or layout:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description under 160 characters",
  keywords: ["keyword1", "keyword2"],
};

export default function Page() {
  // ...
}
```

### Dynamic Metadata with generateMetadata

Use `generateMetadata` for route-specific or data-driven metadata:

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchData(params.id);

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      images: [{ url: data.image }],
    },
  };
}
```

### Metadata Templates

Use templates in root layout to extend metadata across routes:

```tsx
export const metadata: Metadata = {
  title: {
    template: "%s | PumplAI",
    default: "PumplAI - AI Fitness Coaching",
  },
  description: "Default description",
};
```

---

## Title Optimization

- Keep titles under 60 characters (optimal: 50-55)
- Include primary keyword naturally
- Use title templates in root layout
- Make titles unique per page
- Avoid keyword stuffing
- Place important keywords at start when possible

### Example

```tsx
export const metadata: Metadata = {
  title: "Workout Plans | PumplAI",
  // Renders as: "Workout Plans | PumplAI"
};
```

---

## Meta Description

- Write compelling, action-oriented descriptions
- Keep under 160 characters (optimal: 150-158)
- Include primary keyword once naturally
- Include call-to-action when appropriate
- Ensure uniqueness across pages
- Avoid duplication from page content

### Example of Metadata Description

```tsx
export const metadata: Metadata = {
  description:
    "Get personalized AI-powered workout plans tailored to your fitness level and goals. Start training smarter today.",
};
```

---

## Open Graph Tags

Set Open Graph metadata for social media sharing:

```tsx
export const metadata: Metadata = {
  openGraph: {
    title: "Page Title",
    description: "Compelling description for social sharing",
    url: "https://pumpl.app/page",
    siteName: "PumplAI",
    images: [
      {
        url: "https://pumpl.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Descriptive alt text",
        type: "image/png",
      },
    ],
    type: "website",
    locale: "en_US",
  },
};
```

### Open Graph Best Practices

- Use images of 1200×630px for optimal display
- Include descriptive `alt` text for accessibility
- Set `type` appropriately: `website`, `article`, `product`
- Use absolute URLs (include domain)
- Include `og:site_name` for branding
- Test with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

---

## Twitter Card Tags

Optimize sharing on Twitter/X:

```tsx
export const metadata: Metadata = {
  twitter: {
    card: "summary_large_image",
    title: "Page Title",
    description: "Description for Twitter",
    images: ["https://pumpl.app/twitter-image.png"],
    creator: "@pumplai",
    site: "@pumplai",
  },
};
```

### Twitter Card Types

- `summary`: Small preview with text
- `summary_large_image`: Large featured image
- `app`: For mobile apps

---

## Canonical URLs

Prevent duplicate content issues:

```tsx
export const metadata: Metadata = {
  canonical: "https://pumpl.app/page",
  alternates: {
    canonical: "https://pumpl.app/page",
  },
};
```

### Canonical URL Guidelines

- Use for pagination: point first page as canonical
- Handle `www` vs non-`www` consistently
- Always use absolute URLs
- Point to primary version of content
- Update if URL changes

---

## Structured Data (JSON-LD)

Implement Schema.org structured data for rich results:

```tsx
// app/workouts/[id]/page.tsx

export default function WorkoutPage({ params }: Props) {
  const workout = await fetchWorkout(params.id);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: workout.title,
    description: workout.description,
    image: workout.imageUrl,
    author: {
      "@type": "Person",
      name: workout.trainerName,
    },
    datePublished: workout.createdAt,
    dateModified: workout.updatedAt,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      {/* Page content */}
    </>
  );
}
```

### Common Schema Types

- `Article`: Blog posts, guides
- `Product`: E-commerce items
- `Event`: Scheduled classes or events
- `Organization`: Company information
- `Person`: Coach or trainer profiles
- `BreadcrumbList`: Navigation hierarchy

### Testing Structured Data

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

---

## Sitemap Generation

Create dynamic XML sitemap:

```tsx
// app/sitemap.ts

import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const workouts = await fetchAllWorkouts();

  return [
    {
      url: "https://pumpl.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://pumpl.app/workouts",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...workouts.map((workout) => ({
      url: `https://pumpl.app/workouts/${workout.id}`,
      lastModified: new Date(workout.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
```

### Sitemap Guidelines

- Update `lastModified` when content changes
- Set `priority` based on importance (0-1)
- Set `changeFrequency`: `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never`
- Generate dynamically from database when possible
- Submit to Google Search Console

---

## Robots.txt

Control crawler access:

```tsx
// app/robots.ts

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/private"],
      },
      {
        userAgent: "AdsBot-Google",
        allow: "/",
      },
    ],
    sitemap: "https://pumpl.app/sitemap.xml",
  };
}
```

---

## Image Optimization for SEO

```tsx
import Image from "next/image";

export default function Component() {
  return (
    <Image
      src="/workout.webp"
      alt="High intensity interval training workout"
      width={1200}
      height={630}
      priority // For above-fold images
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}
```

### Image Optimization Checklist

- Always include descriptive `alt` text
- Use semantic filenames: `hiit-workout.webp` not `image123.webp`
- Lazy load images below fold
- Set `priority` for LCP images
- Use WebP format when possible
- Provide `sizes` prop for responsive images
- Compress images before upload

---

## Core Web Vitals Optimization

### Largest Contentful Paint (LCP)

- Optimize images and preload critical resources
- Use `priority` on important images
- Minimize JavaScript blocking rendering
- Use fonts with `font-display: swap`

### Cumulative Layout Shift (CLS)

- Reserve space for images with `width` and `height`
- Avoid inserting content above existing content
- Use `transform` for animations instead of position changes
- Load ads/embeds with reserved space

### First Input Delay (FID) / Interaction to Next Paint (INP)

- Break up long JavaScript tasks
- Use `useTransition` for non-urgent updates
- Avoid excessive event listeners
- Optimize third-party scripts

---

## Mobile Optimization

- Use responsive design with Tailwind CSS
- Set viewport meta tag (done automatically in Next.js)
- Test mobile usability in Google Search Console
- Ensure touch targets ≥48px
- Use mobile-first CSS approach
- Test with Lighthouse mobile audit

---

## International SEO (hreflang)

```tsx
export const metadata: Metadata = {
  alternates: {
    languages: {
      "en-US": "https://pumpl.app/en-us/workouts",
      "es-ES": "https://pumpl.app/es/entrenamientos",
      "fr-FR": "https://pumpl.app/fr/seances",
      "x-default": "https://pumpl.app/workouts",
    },
  },
};
```

---

## Implementation Checklist

### Technical SEO

- [ ] Configure metadata API in root layout
- [ ] Implement `generateMetadata` for dynamic routes
- [ ] Generate sitemap.ts and robots.ts
- [ ] Set canonical URLs
- [ ] Use HTTPS in production
- [ ] Implement proper caching headers

### Content SEO

- [ ] Write unique titles (50-55 characters)
- [ ] Write compelling descriptions (150-158 characters)
- [ ] Use semantic HTML5 markup
- [ ] Implement proper heading hierarchy (h1 per page)
- [ ] Add internal linking structure
- [ ] Create quality, original content

### Technical Performance

- [ ] Optimize Core Web Vitals
- [ ] Implement ISR for frequently updated content
- [ ] Minimize JavaScript bundle
- [ ] Optimize images and fonts
- [ ] Enable compression and caching

### Social & Rich Data

- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Implement JSON-LD structured data
- [ ] Test with Facebook Debugger
- [ ] Test with Google Rich Results Test

### Monitoring

- [ ] Set up Google Search Console
- [ ] Monitor Core Web Vitals in Analytics
- [ ] Check crawl errors regularly
- [ ] Track rankings and traffic
- [ ] Monitor structured data coverage
- [ ] Set up Sentry for runtime errors

---

## Testing & Validation

| Tool                                                               | Purpose                                 |
| ------------------------------------------------------------------ | --------------------------------------- |
| [Google Search Console](https://search.google.com/search-console)  | Monitor indexing and search performance |
| [Google Page Speed](https://pagespeed.web.dev/)                    | Test Core Web Vitals and performance    |
| [Google Rich Results](https://search.google.com/test/rich-results) | Validate structured data                |
| [Facebook Debugger](https://developers.facebook.com/tools/debug/)  | Preview Open Graph sharing              |
| [Schema Validator](https://validator.schema.org/)                  | Validate JSON-LD                        |
| [Lighthouse](https://chrome.google.com/webstore)                   | Full page audit                         |

---

## Common Pitfalls to Avoid

❌ Duplicating content across pages without canonicals
❌ Using generic or truncated meta descriptions
❌ Forgetting alt text on images
❌ Ignoring mobile optimization
❌ Using poor quality Open Graph images
❌ Not updating `lastModified` in sitemaps
❌ Blocking important resources in robots.txt
❌ Ignoring Core Web Vitals

✅ Use unique, keyword-focused titles and descriptions
✅ Implement proper canonical URLs
✅ Test with official tools regularly
✅ Optimize images and performance metrics
✅ Keep content fresh and relevant
✅ Monitor Search Console data
