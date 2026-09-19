/**
 * ToolVerse Schema Markup (JSON-LD) Engine
 * Generates valid Schema.org structured data for Google Rich Results.
 * Pure TypeScript with zero external dependencies.
 */

export type SchemaType =
  | 'Article'
  | 'Product'
  | 'WebApplication'
  | 'FAQPage'
  | 'LocalBusiness'
  | 'BreadcrumbList'
  | 'HowTo'
  | 'Event';

// Data Interfaces
export interface ArticleSchemaData {
  type: 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description: string;
  image: string;
  authorName: string;
  authorUrl?: string;
  publisherName: string;
  publisherLogo?: string;
  datePublished: string;
  dateModified?: string;
  url?: string;
}

export interface ProductSchemaData {
  name: string;
  description: string;
  image: string;
  brand: string;
  sku?: string;
  mpn?: string;
  price: string;
  priceCurrency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  ratingValue?: string;
  reviewCount?: string;
  url?: string;
}

export interface WebAppSchemaData {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  price: string;
  priceCurrency: string;
  url?: string;
  ratingValue?: string;
  ratingCount?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSchemaData {
  faqs: FaqItem[];
}

export interface LocalBusinessSchemaData {
  name: string;
  image: string;
  telephone: string;
  email?: string;
  addressStreet: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  latitude?: string;
  longitude?: string;
  priceRange?: string;
  openingHours?: string; // e.g. "Mo-Fr 09:00-18:00"
  url?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbSchemaData {
  items: BreadcrumbItem[];
}

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface HowToSchemaData {
  name: string;
  description: string;
  totalTime?: string; // e.g. "PT30M"
  steps: HowToStep[];
}

export interface EventSchemaData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  locationType: 'Place' | 'VirtualLocation';
  locationName: string;
  locationAddressOrUrl: string;
  eventStatus?: 'EventScheduled' | 'EventPostponed' | 'EventCancelled';
  price?: string;
  priceCurrency?: string;
  url?: string;
}

export type SchemaFormData =
  | { type: 'Article'; data: ArticleSchemaData }
  | { type: 'Product'; data: ProductSchemaData }
  | { type: 'WebApplication'; data: WebAppSchemaData }
  | { type: 'FAQPage'; data: FaqSchemaData }
  | { type: 'LocalBusiness'; data: LocalBusinessSchemaData }
  | { type: 'BreadcrumbList'; data: BreadcrumbSchemaData }
  | { type: 'HowTo'; data: HowToSchemaData }
  | { type: 'Event'; data: EventSchemaData };

export interface SchemaValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

/**
 * Generate JSON-LD Object based on schema form data
 */
export function buildSchemaJson(formData: SchemaFormData): Record<string, any> {
  const base = {
    '@context': 'https://schema.org',
  };

  switch (formData.type) {
    case 'Article': {
      const d = formData.data;
      const schema: Record<string, any> = {
        ...base,
        '@type': d.type || 'Article',
        headline: d.headline,
        description: d.description,
        image: d.image ? [d.image] : undefined,
        datePublished: d.datePublished,
        dateModified: d.dateModified || d.datePublished,
        author: {
          '@type': 'Person',
          name: d.authorName,
          url: d.authorUrl || undefined,
        },
        publisher: {
          '@type': 'Organization',
          name: d.publisherName,
          logo: d.publisherLogo
            ? {
                '@type': 'ImageObject',
                url: d.publisherLogo,
              }
            : undefined,
        },
      };
      if (d.url) schema.mainEntityOfPage = { '@type': 'WebPage', '@id': d.url };
      return schema;
    }

    case 'Product': {
      const d = formData.data;
      const schema: Record<string, any> = {
        ...base,
        '@type': 'Product',
        name: d.name,
        description: d.description,
        image: d.image ? [d.image] : undefined,
        brand: {
          '@type': 'Brand',
          name: d.brand,
        },
        offers: {
          '@type': 'Offer',
          price: d.price,
          priceCurrency: d.priceCurrency || 'USD',
          availability: `https://schema.org/${d.availability || 'InStock'}`,
          url: d.url || undefined,
        },
      };
      if (d.sku) schema.sku = d.sku;
      if (d.mpn) schema.mpn = d.mpn;
      if (d.ratingValue && d.reviewCount) {
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: d.ratingValue,
          reviewCount: d.reviewCount,
          bestRating: '5',
          worstRating: '1',
        };
      }
      return schema;
    }

    case 'WebApplication': {
      const d = formData.data;
      const schema: Record<string, any> = {
        ...base,
        '@type': 'WebApplication',
        name: d.name,
        description: d.description,
        applicationCategory: d.applicationCategory || 'DeveloperApplication',
        operatingSystem: d.operatingSystem || 'All',
        offers: {
          '@type': 'Offer',
          price: d.price || '0',
          priceCurrency: d.priceCurrency || 'USD',
        },
      };
      if (d.url) schema.url = d.url;
      if (d.ratingValue && d.ratingCount) {
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: d.ratingValue,
          ratingCount: d.ratingCount,
        };
      }
      return schema;
    }

    case 'FAQPage': {
      const d = formData.data;
      return {
        ...base,
        '@type': 'FAQPage',
        mainEntity: d.faqs
          .filter((f) => f.question.trim() && f.answer.trim())
          .map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.answer,
            },
          })),
      };
    }

    case 'LocalBusiness': {
      const d = formData.data;
      const schema: Record<string, any> = {
        ...base,
        '@type': 'LocalBusiness',
        name: d.name,
        image: d.image || undefined,
        telephone: d.telephone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: d.addressStreet,
          addressLocality: d.addressLocality,
          addressRegion: d.addressRegion,
          postalCode: d.postalCode,
          addressCountry: d.addressCountry,
        },
      };
      if (d.email) schema.email = d.email;
      if (d.url) schema.url = d.url;
      if (d.priceRange) schema.priceRange = d.priceRange;
      if (d.latitude && d.longitude) {
        schema.geo = {
          '@type': 'GeoCoordinates',
          latitude: d.latitude,
          longitude: d.longitude,
        };
      }
      if (d.openingHours) schema.openingHours = d.openingHours;
      return schema;
    }

    case 'BreadcrumbList': {
      const d = formData.data;
      return {
        ...base,
        '@type': 'BreadcrumbList',
        itemListElement: d.items
          .filter((item) => item.name.trim())
          .map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
      };
    }

    case 'HowTo': {
      const d = formData.data;
      const schema: Record<string, any> = {
        ...base,
        '@type': 'HowTo',
        name: d.name,
        description: d.description,
        step: d.steps
          .filter((s) => s.name.trim() && s.text.trim())
          .map((s, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            name: s.name,
            text: s.text,
            image: s.image || undefined,
          })),
      };
      if (d.totalTime) schema.totalTime = d.totalTime;
      return schema;
    }

    case 'Event': {
      const d = formData.data;
      const isVirtual = d.locationType === 'VirtualLocation';
      const schema: Record<string, any> = {
        ...base,
        '@type': 'Event',
        name: d.name,
        description: d.description,
        startDate: d.startDate,
        endDate: d.endDate,
        eventStatus: `https://schema.org/${d.eventStatus || 'EventScheduled'}`,
        eventAttendanceMode: isVirtual
          ? 'https://schema.org/OnlineEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
        location: isVirtual
          ? {
              '@type': 'VirtualLocation',
              url: d.locationAddressOrUrl,
            }
          : {
              '@type': 'Place',
              name: d.locationName,
              address: d.locationAddressOrUrl,
            },
      };
      if (d.price) {
        schema.offers = {
          '@type': 'Offer',
          price: d.price,
          priceCurrency: d.priceCurrency || 'USD',
          availability: 'https://schema.org/InStock',
          url: d.url || undefined,
        };
      }
      return schema;
    }
  }
}

/**
 * Validate schema for Google Rich Results requirements
 */
export function validateSchema(formData: SchemaFormData): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];

  switch (formData.type) {
    case 'Article': {
      const d = formData.data;
      if (!d.headline) issues.push({ severity: 'error', field: 'headline', message: 'Article headline is required.' });
      if (!d.authorName) issues.push({ severity: 'error', field: 'authorName', message: 'Author name is required by Google.' });
      if (!d.publisherName) issues.push({ severity: 'error', field: 'publisherName', message: 'Publisher name is required by Google.' });
      if (!d.datePublished) issues.push({ severity: 'error', field: 'datePublished', message: 'Date published is required.' });
      if (!d.image) issues.push({ severity: 'warning', field: 'image', message: 'An article image is strongly recommended for Google Discover.' });
      break;
    }
    case 'Product': {
      const d = formData.data;
      if (!d.name) issues.push({ severity: 'error', field: 'name', message: 'Product name is required.' });
      if (!d.price) issues.push({ severity: 'error', field: 'price', message: 'Product price is required.' });
      if (!d.brand) issues.push({ severity: 'warning', field: 'brand', message: 'Brand is strongly recommended for Product rich snippets.' });
      if (!d.image) issues.push({ severity: 'warning', field: 'image', message: 'Product image is recommended for rich results.' });
      break;
    }
    case 'FAQPage': {
      const d = formData.data;
      const valid = d.faqs.filter((f) => f.question.trim() && f.answer.trim());
      if (valid.length === 0) issues.push({ severity: 'error', field: 'faqs', message: 'At least one Question and Answer is required.' });
      break;
    }
    case 'LocalBusiness': {
      const d = formData.data;
      if (!d.name) issues.push({ severity: 'error', field: 'name', message: 'Business name is required.' });
      if (!d.addressStreet || !d.addressLocality) issues.push({ severity: 'error', field: 'address', message: 'Street and city address are required.' });
      if (!d.telephone) issues.push({ severity: 'warning', field: 'telephone', message: 'Telephone is recommended for local knowledge graphs.' });
      break;
    }
    case 'BreadcrumbList': {
      const d = formData.data;
      if (d.items.length < 2) issues.push({ severity: 'warning', field: 'items', message: 'A breadcrumb list typically contains 2 or more levels.' });
      break;
    }
  }

  return issues;
}

/**
 * Generate formatted HTML <script> tag
 */
export function generateScriptTag(schemaObj: Record<string, any>): string {
  return `<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n</script>`;
}

/**
 * Generate Next.js App Router code
 */
export function generateNextJsAppCode(schemaObj: Record<string, any>): string {
  return `export default function Page() {
  const jsonLd = ${JSON.stringify(schemaObj, null, 2)};

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main>
        {/* Page Content */}
      </main>
    </>
  );
}`;
}

// ---------------- Preset Configurations ----------------
export const SCHEMA_PRESETS: { id: string; label: string; description: string; formData: SchemaFormData }[] = [
  {
    id: 'tech_article',
    label: 'Tech Blog Article',
    description: 'Article schema with author, publisher, and Google Discover image',
    formData: {
      type: 'Article',
      data: {
        type: 'BlogPosting',
        headline: 'Understanding Database Indexing & B-Trees in Modern Applications',
        description: 'A comprehensive visual guide to how B-Tree indexes work in PostgreSQL and MySQL to optimize query execution speed.',
        image: 'https://toolverse.app/blog/images/database-indexing-cover.png',
        authorName: 'Alex Rivera',
        authorUrl: 'https://toolverse.app/creators/alex-rivera',
        publisherName: 'ToolVerse Engineering',
        publisherLogo: 'https://toolverse.app/logo.png',
        datePublished: '2025-01-15',
        dateModified: '2025-02-01',
        url: 'https://toolverse.app/blog/database-indexing-guide',
      },
    },
  },
  {
    id: 'saas_product',
    label: 'SaaS Software Product',
    description: 'Product schema with offer pricing, aggregate ratings, and review count',
    formData: {
      type: 'Product',
      data: {
        name: 'ToolVerse Pro Developer Subscription',
        description: 'High-speed offline-capable micro tools suite with unlimited video conversions and batch developer utilities.',
        image: 'https://toolverse.app/images/toolverse-pro-box.png',
        brand: 'ToolVerse',
        sku: 'TV-PRO-ANNUAL',
        price: '49.00',
        priceCurrency: 'USD',
        availability: 'InStock',
        ratingValue: '4.9',
        reviewCount: '128',
        url: 'https://toolverse.app/pricing',
      },
    },
  },
  {
    id: 'faq_page',
    label: 'Interactive FAQ Page',
    description: 'FAQPage schema with questions and answers for Google search accordions',
    formData: {
      type: 'FAQPage',
      data: {
        faqs: [
          {
            question: 'Are tools on ToolVerse free to use?',
            answer: 'Yes, ToolVerse provides over 200 free, browser-native utility tools for developers, creators, and professionals.',
          },
          {
            question: 'Is my data stored or uploaded to remote servers?',
            answer: 'No. All conversions, formatting, encoding, and calculations run 100% locally in your browser with zero tracking.',
          },
          {
            question: 'Can I generate structured data schema for my website?',
            answer: 'Yes! The Schema Markup Generator outputs valid Google Rich Results JSON-LD code in 1 click.',
          },
        ],
      },
    },
  },
  {
    id: 'local_business',
    label: 'Local Business & Office',
    description: 'LocalBusiness schema with physical address, geo coordinates, and hours',
    formData: {
      type: 'LocalBusiness',
      data: {
        name: 'ToolVerse Tech Labs',
        image: 'https://toolverse.app/office.jpg',
        telephone: '+1-555-019-2834',
        email: 'contact@toolverse.app',
        addressStreet: '100 Innovation Way, Suite 400',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        postalCode: '94105',
        addressCountry: 'US',
        latitude: '37.7749',
        longitude: '-122.4194',
        priceRange: '$$',
        openingHours: 'Mo-Fr 09:00-18:00',
        url: 'https://toolverse.app',
      },
    },
  },
  {
    id: 'breadcrumbs',
    label: 'Site Breadcrumbs',
    description: 'BreadcrumbList hierarchy for Google search breadcrumb display',
    formData: {
      type: 'BreadcrumbList',
      data: {
        items: [
          { name: 'Home', url: 'https://toolverse.app' },
          { name: 'Developer Tools', url: 'https://toolverse.app/tools?category=developer' },
          { name: 'SQL Formatter', url: 'https://toolverse.app/developer/sql-formatter' },
        ],
      },
    },
  },
];
