export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FKbounce',
  applicationCategory: 'Email Verification Tool',
  operatingSystem: 'Web',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free Plan',
      price: '0',
      priceCurrency: 'USD',
      description: '500 email verifications per month',
    },
    {
      '@type': 'Offer',
      name: 'Pro Plan - Monthly',
      price: '15',
      priceCurrency: 'USD',
      description: '1,000,000 email verifications per month',
      priceValidUntil: '2026-12-31',
    },
    {
      '@type': 'Offer',
      name: 'Pro Plan - Yearly',
      price: '120',
      priceCurrency: 'USD',
      description: '1,000,000 email verifications per month (billed annually)',
      priceValidUntil: '2026-12-31',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
  description:
    'Professional email verification tool with real-time SMTP validation, syntax checking, DNS verification, and disposable email detection. Verify single emails or bulk lists instantly.',
  featureList: [
    'Real-time SMTP verification',
    'Bulk email validation',
    'CSV file upload',
    'Disposable email detection',
    'DNS record checking',
    'Syntax validation',
    'Verification history',
    'Export results (CSV, JSON, Excel)',
  ],
  url: 'https://www.fkbounce.com',
  screenshot: 'https://www.fkbounce.com/OG.png',
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FKbounce',
  url: 'https://www.fkbounce.com',
  logo: 'https://www.fkbounce.com/Logo-black.png',
  description:
    'FKbounce provides professional email verification services to help businesses improve email deliverability and reduce bounce rates.',
  sameAs: [
    // Add your social media profiles here when available
    // 'https://twitter.com/fkbounce',
    // 'https://linkedin.com/company/fkbounce',
  ],
}

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is email verification?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Email verification is the process of checking if an email address is valid, deliverable, and safe to send emails to. It includes syntax validation, DNS record checking, SMTP verification, and disposable email detection.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does FKbounce compare to ZeroBounce and other competitors?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FKbounce offers competitive pricing at $15/month for 1 million verifications, compared to higher prices from ZeroBounce, Bouncer, Kickbox, and NeverBounce. We provide the same enterprise-grade features including SMTP validation, bulk verification, and API access.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I verify emails in bulk?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FKbounce supports bulk email verification through CSV file upload. You can verify thousands of emails at once and export the results in CSV, JSON, or Excel format.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer a free plan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FKbounce offers a free plan with 500 email verifications per month. This includes all basic features like syntax validation, DNS checking, and disposable email detection.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of email verification do you perform?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FKbounce performs comprehensive email verification including: syntax validation, DNS/MX record checking, SMTP mailbox verification, disposable email detection, and role-based email identification.',
      },
    },
  ],
}
