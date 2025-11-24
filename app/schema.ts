export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FKbounce - Email Verification Tool',
  alternateName: 'FKbounce Email Validator',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Email Verification Software',
  operatingSystem: 'Web Browser',
  browserRequirements: 'Requires JavaScript. Modern browser recommended.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free Plan',
      price: '0',
      priceCurrency: 'USD',
      description: '500 email verifications per month with all basic features',
      availability: 'https://schema.org/InStock',
      url: 'https://www.fkbounce.com',
    },
    {
      '@type': 'Offer',
      name: 'Pro Plan - Monthly',
      price: '15',
      priceCurrency: 'USD',
      description: '1,000,000 email verifications per month with unlimited API access',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
      url: 'https://www.fkbounce.com',
    },
    {
      '@type': 'Offer',
      name: 'Pro Plan - Yearly',
      price: '120',
      priceCurrency: 'USD',
      description: '1,000,000 email verifications per month - Save $60/year',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
      url: 'https://www.fkbounce.com',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '250',
    bestRating: '5',
    worstRating: '1',
  },
  description:
    'Professional email verification and validation tool with real-time SMTP validation, bulk email checking, syntax validation, DNS verification, disposable email detection, and catch-all detection. Verify single emails or bulk lists instantly. Best alternative to ZeroBounce, Hunter.io, Kickbox, NeverBounce, and Bouncer.',
  featureList: [
    'Real-time SMTP email verification',
    'Bulk email validation (CSV upload)',
    'Single email address checker',
    'Disposable email detection',
    'Catch-all domain detection',
    'DNS/MX record validation',
    'Email syntax validation',
    'Role-based email detection',
    'Verification history tracking',
    'Export results (CSV, JSON, Excel)',
    'RESTful API access',
    'Webhook integrations',
    'Zapier integration',
    'Smart email lists',
    'Usage analytics dashboard',
  ],
  url: 'https://www.fkbounce.com',
  screenshot: 'https://www.fkbounce.com/OG.png',
  softwareVersion: '2.0',
  datePublished: '2024-01-01',
  author: {
    '@type': 'Organization',
    name: 'FKbounce',
  },
  keywords: 'email verification, email validator, email checker, bulk email verification, SMTP validation, email validation API, verify email address, reduce bounce rate, email deliverability',
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FKbounce',
  alternateName: 'FK Bounce Email Verification',
  url: 'https://www.fkbounce.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://www.fkbounce.com/Logo-light.svg',
    width: '200',
    height: '60',
  },
  description:
    'FKbounce provides professional email verification and validation services to help businesses improve email deliverability, reduce bounce rates, and maintain clean email lists. Trusted by marketers, developers, and businesses worldwide.',
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    availableLanguage: ['English'],
  },
  sameAs: [
    // Add your social media profiles here
    // 'https://twitter.com/fkbounce',
    // 'https://linkedin.com/company/fkbounce',
    // 'https://facebook.com/fkbounce',
  ],
}

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is email verification and why do I need it?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Email verification is the process of checking if an email address is valid, deliverable, and safe to send emails to. It helps reduce bounce rates, improve email deliverability, protect sender reputation, and save money by only sending emails to valid addresses. FKbounce performs comprehensive checks including syntax validation, DNS/MX record checking, SMTP mailbox verification, and disposable email detection.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does FKbounce compare to ZeroBounce, Hunter.io, Kickbox, and NeverBounce?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FKbounce offers exceptional value at $15/month for 1 million verifications, significantly lower than competitors like ZeroBounce, Hunter.io, Kickbox, NeverBounce, and Bouncer. We provide the same enterprise-grade features including real-time SMTP validation, bulk verification, API access, catch-all detection, and disposable email checking. Our service is faster, more accurate, and more affordable.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I verify emails in bulk? How many can I process at once?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FKbounce supports bulk email verification through CSV file upload. You can verify thousands of emails in a single batch. The Pro plan includes 1 million verifications per month. Results can be exported in CSV, JSON, or Excel format with detailed verification status for each email address.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer a free plan or free trial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FKbounce offers a generous free plan with 500 email verifications per month forever. No credit card required. The free plan includes all basic features like syntax validation, DNS checking, SMTP verification, and disposable email detection. Perfect for testing our service or small projects.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of email verification checks does FKbounce perform?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FKbounce performs comprehensive multi-step email verification: (1) Syntax validation to check email format, (2) DNS/MX record verification to confirm domain exists, (3) SMTP mailbox verification to check if the mailbox exists, (4) Disposable email detection to identify temporary email services, (5) Catch-all domain detection, (6) Role-based email identification (info@, support@, etc.), and (7) Spam trap detection.',
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate is FKbounce email verification?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FKbounce maintains 98%+ accuracy through real-time SMTP verification and advanced validation techniques. We use direct mailbox checking, not just syntax validation. Our service reduces false positives and provides detailed verification results including valid, invalid, risky, catch-all, and disposable classifications.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does FKbounce offer an API for email verification?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FKbounce provides a powerful RESTful API for seamless integration into your applications. The API supports single email verification, bulk verification, webhook notifications, and real-time results. Pro users get unlimited API requests within their monthly quota. We also support Zapier integration for no-code automation.',
      },
    },
    {
      '@type': 'Question',
      name: 'How fast is the email verification process?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Single email verification completes in 2-5 seconds. Bulk verification processes hundreds of emails per minute. Our infrastructure is optimized for speed with connection pooling, domain caching, and parallel processing. Pro users benefit from priority processing and faster throughput.',
      },
    },
  ],
}
