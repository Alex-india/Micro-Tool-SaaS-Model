import { ToolMeta, ToolCategory } from "./types";
import { SITE_NAME } from "./constants";

export interface ToolSEOArticle {
  wordCount: number;
  metaHeading: string;
  introduction: {
    title: string;
    paragraphs: string[];
    keyTakeaways: string[];
  };
  howToGuide: {
    title: string;
    steps: Array<{ stepNumber: number; heading: string; description: string }>;
    proTip: string;
  };
  technicalMechanics: {
    title: string;
    explanation: string;
    formula?: string;
    variables?: Array<{ symbol: string; meaning: string }>;
    exampleScenario?: string;
  };
  useCases: {
    title: string;
    cases: Array<{ role: string; scenario: string; benefit: string }>;
  };
  comparisonMatrix: {
    title: string;
    headers: string[];
    rows: Array<{ feature: string; toolVerse: string; traditional: string }>;
  };
  bestPractices: {
    title: string;
    dos: string[];
    donts: string[];
  };
  faqs: Array<{ question: string; answer: string }>;
}

export function generateToolSEOArticle(tool: ToolMeta): ToolSEOArticle {
  const name = tool.name;
  const category = tool.category;
  const description = tool.longDescription || tool.description;

  // Category specific contextual enhancements
  const categoryContext = getCategoryContext(category, name);

  // Deep Overview
  const introParagraphs = [
    `${description} ${SITE_NAME}'s ${name} executes securely and instantly in your browser with zero server uploads, keeping all your data 100% private.`,
  ];

  const keyTakeaways = [
    `100% Client-Side: Runs locally in your browser with zero server uploads.`,
    `Instant & Accurate: Real-time calculation with deterministic precision.`,
    `Free & Private: No sign-up required, ad-free, and zero trackers.`,
    `Fast Workflow: Designed for instant, daily productivity.`,
  ];

  // Step-by-Step Practical Guide
  const howToGuide = {
    title: `How to Use the ${name} (Step-by-Step Guide)`,
    steps: [
      {
        stepNumber: 1,
        heading: `Enter Your Input`,
        description: `Type, paste, or upload your data into the input field above.`,
      },
      {
        stepNumber: 2,
        heading: `Adjust Settings`,
        description: `Customize any optional parameters or options as needed.`,
      },
      {
        stepNumber: 3,
        heading: `Get Instant Results`,
        description: `Results and metrics are calculated in real-time right in your browser.`,
      },
      {
        stepNumber: 4,
        heading: `Copy or Download`,
        description: `Click to copy the output or export your results instantly.`,
      },
    ],
    proTip: `Pro Tip: Bookmark this page for fast, one-click access anytime.`,
  };

  // Technical Mechanics & Formula
  const technicalMechanics = {
    title: `Mathematical Logic & Technical Specifications`,
    explanation:
      tool.formulaText
        ? `The calculation model behind the ${name} follows established mathematical and financial standards. Every computation is performed in 64-bit floating-point precision with rigorous edge-case sanitization (such as division-by-zero guards and boundary clamps).`
        : `The algorithmic pipeline behind the ${name} leverages optimized standard libraries, WebAssembly, and native browser canvas/crypto APIs to process data in memory without server latency.`,
    formula: tool.formulaText || undefined,
    exampleScenario:
      tool.exampleCalculation ||
      `For example, if you supply baseline parameters under standard operating thresholds, the system computes the exact delta, percentage variations, and amortization schedules instantaneously, displaying both rounded summaries and full-precision raw metrics.`,
    variables: getToolVariables(tool),
  };

  // Real-world use cases
  const useCases = {
    title: `Practical Real-World Use Cases & Applications`,
    cases: categoryContext.cases,
  };

  // Comparison Matrix
  const comparisonMatrix = {
    title: `Why Choose ${SITE_NAME}?`,
    headers: ["Feature", `${SITE_NAME}`, "Other Web Tools"],
    rows: [
      {
        feature: "Data Privacy",
        toolVerse: "100% On-Device (Zero server uploads)",
        traditional: "Sends data to external servers",
      },
      {
        feature: "Speed",
        toolVerse: "Instant local execution (<5ms)",
        traditional: "Slow server roundtrips",
      },
      {
        feature: "Experience",
        toolVerse: "Clean, ad-free dark UI",
        traditional: "Full-page ads & popups",
      },
      {
        feature: "Access",
        toolVerse: "Free & No login needed",
        traditional: "Mandatory accounts & paywalls",
      },
    ],
  };

  // Best Practices
  const bestPractices = {
    title: `Best Practices & Tips`,
    dos: [
      `Check your input values and formatting before calculating.`,
      `Use the one-click copy or export button to save results.`,
    ],
    donts: [
      `Don't upload sensitive private data to unverified tools.`,
      `Avoid tools with slow server roundtrips or intrusive ads.`,
    ],
  };

  // Comprehensive FAQs
  const faqs = tool.faq && tool.faq.length >= 4
    ? tool.faq
    : [
        {
          question: `Is the ${name} completely free to use?`,
          answer: `Yes, ${name} on ${SITE_NAME} is 100% free for standard calculations and conversions. There are no hidden paywalls, forced subscriptions, or trial limits for everyday use.`,
        },
        {
          question: `How does ${SITE_NAME} protect my data privacy?`,
          answer: `All calculations, text manipulation, and file operations execute directly within your browser's client-side runtime. We do not store, transmit, or analyze your inputs on external servers.`,
        },
        {
          question: `Can I enter custom decimal numbers and custom durations?`,
          answer: `Yes! Every input field, slider, and selector features an interactive numerical box where you can type exact custom values, decimal percentages (e.g. 12.5%), and arbitrary tenures.`,
        },
        {
          question: `How accurate are the results generated by this tool?`,
          answer: `Our calculations adhere strictly to standard international mathematical, financial, and computational formulas. Results are computed to full IEEE 754 floating-point accuracy and formatted cleanly to standard currency or unit precision.`,
        },
        {
          question: `Does this tool work on mobile devices and tablets?`,
          answer: `Yes. ${SITE_NAME} is fully responsive and optimized for mobile screens, tablets, laptops, and ultra-wide desktop monitors with touch-friendly controls.`,
        },
        {
          question: `Can I print or save a PDF summary of my results?`,
          answer: `Yes, you can easily copy results to your clipboard, capture a print-ready report via your browser's Print dialog (Ctrl/Cmd + P), or download generated output files directly.`,
        },
      ];

  // Calculate approximate word count
  const allText = [
    ...introParagraphs,
    ...keyTakeaways,
    ...howToGuide.steps.map((s) => s.description),
    howToGuide.proTip,
    technicalMechanics.explanation,
    technicalMechanics.exampleScenario || "",
    ...useCases.cases.map((c) => `${c.role} ${c.scenario} ${c.benefit}`),
    ...comparisonMatrix.rows.map((r) => `${r.feature} ${r.toolVerse} ${r.traditional}`),
    ...bestPractices.dos,
    ...bestPractices.donts,
    ...faqs.map((f) => `${f.question} ${f.answer}`),
  ].join(" ");

  const wordCount = allText.split(/\s+/).filter(Boolean).length;

  return {
    wordCount,
    metaHeading: `Comprehensive Guide to ${name}`,
    introduction: {
      title: `What is the ${name}?`,
      paragraphs: introParagraphs,
      keyTakeaways,
    },
    howToGuide,
    technicalMechanics,
    useCases,
    comparisonMatrix,
    bestPractices,
    faqs,
  };
}

function getCategoryContext(category: ToolCategory, name: string) {
  switch (category) {
    case "finance":
      return {
        cases: [
          {
            role: "Individual Investors & Salaried Employees",
            scenario: "Planning monthly SIP allocations, retirement corpuses, and estimating tax liabilities under new and old regimes.",
            benefit: "Gains clear visual clarity over compound interest growth and optimal monthly contribution targets.",
          },
          {
            role: "Homebuyers & Loan Borrowers",
            scenario: "Evaluating EMI repayment schedules, prepayments, and interest savings across multiple bank interest rates.",
            benefit: "Avoids costly long-term interest traps by modeling custom amortization schedules before signing loan agreements.",
          },
          {
            role: "Chartered Accountants & Financial Advisors",
            scenario: "Quickly validating client investment projections and tax breakdowns with zero lag during advisory meetings.",
            benefit: "Accelerates consultation workflows with clean, exportable, ad-free financial summaries.",
          },
        ],
      };
    case "developer":
      return {
        cases: [
          {
            role: "Full-Stack Software Engineers",
            scenario: "Formatting JSON payloads, inspecting JWT token claims, testing regular expressions, and generating secure UUIDs.",
            benefit: "Eliminates repetitive terminal scripting with zero risk of transmitting internal tokens or payload keys over the public web.",
          },
          {
            role: "DevOps & Cloud Architects",
            scenario: "Validating Base64 configurations, hash checksums, and generating environment secrets.",
            benefit: "Guarantees offline-capable, tamper-proof local execution without security compliance violations.",
          },
          {
            role: "API Developers & QA Testers",
            scenario: "Diffing API responses, verifying serialization schemas, and debugging webhook payloads.",
            benefit: "Spots schema discrepancies and malformed syntax instantly in a clean code editor layout.",
          },
        ],
      };
    case "pdf":
    case "image":
    case "video":
      return {
        cases: [
          {
            role: "Content Creators & Social Media Managers",
            scenario: "Resizing banners, converting images between modern WebP/AVIF/PNG formats, and trimming short-form clips.",
            benefit: "Prepares platform-perfect dimensions for YouTube, Instagram, TikTok, and LinkedIn without expensive subscriptions.",
          },
          {
            role: "Office Administrators & Legal Professionals",
            scenario: "Merging confidential contracts, protecting PDFs with encryption, or splitting invoice archives.",
            benefit: "Total privacy compliance since client documents never leave the local device.",
          },
          {
            role: "E-Commerce Merchants",
            scenario: "Compressing high-resolution catalog photos to optimize website loading speeds and Core Web Vitals.",
            benefit: "Reduces bandwidth costs and accelerates store page speed without sacrificing visual fidelity.",
          },
        ],
      };
    case "business":
      return {
        cases: [
          {
            role: "Startup Founders & CFOs",
            scenario: "Calculating runway months, zero-cash dates, customer acquisition cost (CAC), and customer lifetime value (LTV).",
            benefit: "Accurately models unit economics for investor pitch decks and financial planning.",
          },
          {
            role: "Freelancers & Agency Owners",
            scenario: "Drafting professional GST-compliant client invoices and computing gross profit margins per project.",
            benefit: "Generates print-ready PDFs and streamlines billing operations instantly.",
          },
          {
            role: "Marketing Directors & Growth Leads",
            scenario: "Evaluating Return on Ad Spend (ROAS) across paid campaigns and determining break-even sales volume.",
            benefit: "Identifies profitable ad channels and avoids overspending on negative-margin campaigns.",
          },
        ],
      };
    case "student":
      return {
        cases: [
          {
            role: "University & College Students",
            scenario: "Tracking semester CGPA/SGPA, calculating required exam marks to achieve a target grade, and planning class attendance buffers.",
            benefit: "Eliminates academic anxiety with accurate, customizable grade projections.",
          },
          {
            role: "Teachers & Academic Counselors",
            scenario: "Converting grading scales, calculating class percentile distributions, and advising at-risk students on attendance thresholds.",
            benefit: "Fast, reliable academic calculations without complex spreadsheet setups.",
          },
        ],
      };
    default:
      return {
        cases: [
          {
            role: "Everyday Consumers & Shoppers",
            scenario: `Using the ${name} to calculate discounts, sales tax, unit rates, and everyday ratios on the go.`,
            benefit: "Provides instant answers without downloading heavy smartphone apps or dealing with ad popups.",
          },
          {
            role: "Professionals & Knowledge Workers",
            scenario: `Performing rapid conversions, text transformations, and statistical checks during daily tasks.`,
            benefit: "Speeds up daily productivity with deterministic, browser-based tools.",
          },
        ],
      };
  }
}

function getToolVariables(tool: ToolMeta): Array<{ symbol: string; meaning: string }> | undefined {
  if (tool.slug.includes("sip")) {
    return [
      { symbol: "M", meaning: "Monthly SIP Investment Amount (₹)" },
      { symbol: "r", meaning: "Monthly periodic interest rate (Annual Rate / 12 / 100)" },
      { symbol: "n", meaning: "Total number of monthly installments (Years × 12)" },
      { symbol: "FV", meaning: "Future Maturity Value of accumulated wealth" },
    ];
  }
  if (tool.slug.includes("emi")) {
    return [
      { symbol: "P", meaning: "Principal Loan Amount borrowed" },
      { symbol: "r", meaning: "Monthly interest rate (Annual Rate / 12 / 100)" },
      { symbol: "n", meaning: "Loan tenure in total months (Years × 12)" },
      { symbol: "EMI", meaning: "Equated Monthly Installment payable each month" },
    ];
  }
  if (tool.slug.includes("gst")) {
    return [
      { symbol: "A", meaning: "Net Base Amount or Gross Price" },
      { symbol: "R", meaning: "Applicable GST Tax Rate percentage (e.g., 5%, 12%, 18%, 28%)" },
      { symbol: "CGST / SGST", meaning: "Equal 50/50 tax split for Intra-State supply transactions" },
      { symbol: "IGST", meaning: "Integrated GST for Inter-State supply transactions" },
    ];
  }
  return undefined;
}
