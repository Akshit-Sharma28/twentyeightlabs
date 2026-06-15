export const companyStats = [
  { value: "01", label: "Venture studio parent company" },
  { value: "04", label: "Security research tracks" },
  { value: "2026", label: "Active AI systems research" },
];

export const ventures = [
  {
    name: "Atomix",
    label: "Flagship product",
    status: "Live",
    description:
      "An AI-native operating layer for security work, built to help teams organize research, workflows, and system intelligence.",
    highlights: [
      "AI-assisted security workflows",
      "Research-backed product direction",
      "Built inside Twenty Eight Labs",
    ],
    ctaLabel: "Visit Atomix",
    ctaHref: "https://atomix.solutions",
  },
  {
    name: "Twenty Eight Labs Research",
    label: "Independent lab",
    status: "Ongoing",
    description:
      "Applied research into AI security, application attack paths, and practical threat modeling for modern systems.",
    highlights: [
      "LLM threat modeling",
      "Prompt injection analysis",
      "Secure product architecture",
    ],
    ctaLabel: "Read research",
    ctaHref: "/research",
  },
];

export const capabilities = [
  {
    title: "AI Security Research",
    text: "Prompt injection, model misuse, agentic workflows, data exposure, and control failures in LLM-enabled products.",
    points: [
      "Prompt and context boundary testing",
      "Agent permission review",
      "AI data leakage analysis",
    ],
  },
  {
    title: "Application Security",
    text: "Deep review of modern web, API, and cloud-native systems with an emphasis on exploitable attack paths.",
    points: [
      "Web/API attack surface mapping",
      "Auth and authorization review",
      "Pre-pentest hardening checks",
    ],
  },
  {
    title: "Product Incubation",
    text: "Turning research findings into focused security tools, internal platforms, and production-grade systems.",
    points: [
      "Atomix tooling experiments",
      "Security workflow automation",
      "Research-to-product loops",
    ],
  },
  {
    title: "Security Engineering",
    text: "Design reviews, architecture validation, and threat modeling for teams building with AI and automation.",
    points: [
      "Architecture risk profiling",
      "Control design and validation",
      "Secure launch readiness",
    ],
  },
];

export const research = [
  {
    slug: "llm-security-basics",
    title: "Foundations of LLM Security",
    date: "2026-01",
    tag: "LLM Security",
    status: "Published",
    readTime: "7 min",
    audience: "Builders and security teams",
    summary:
      "An overview of common attack surfaces in large language models, including prompt injection, data leakage, and misuse patterns.",
    topics: ["Prompt injection", "Data leakage", "Tool misuse"],
    takeaways: [
      "LLM inputs can carry executable intent, not just passive data.",
      "The strongest controls live around model context, tools, and data boundaries.",
      "Testing should use malicious prompts, documents, and realistic workflows.",
    ],
    methods: [
      "Instruction hierarchy review",
      "Untrusted content boundary mapping",
      "Model-tool permission analysis",
    ],
    relatedTools: ["llm-prompt-tester", "ai-threat-modeler"],
  },
  {
    slug: "ai-threat-modeling",
    title: "Threat Modeling AI Systems",
    date: "2026-01",
    tag: "AI Security",
    status: "Published",
    readTime: "8 min",
    audience: "Product and platform teams",
    summary:
      "A practical approach to identifying and mitigating threats in AI-enabled architectures.",
    topics: ["Threat modeling", "Agentic systems", "Tool permissions"],
    takeaways: [
      "AI threat models should start with model, data, tool, and human approval boundaries.",
      "High-risk paths usually combine untrusted context with sensitive data or side effects.",
      "Useful outputs are control decisions that teams can test and monitor.",
    ],
    methods: [
      "Trust boundary mapping",
      "Abuse path decomposition",
      "Control validation planning",
    ],
    relatedTools: ["ai-threat-modeler", "api-attack-mapper"],
  },
  {
    slug: "llm-attack-vectors-2026",
    title: "New LLM Attack Vectors and Defensive Patterns",
    date: "2026-06",
    tag: "LLM Security",
    status: "Published",
    readTime: "11 min",
    audience: "AI product builders",
    summary:
      "A detailed look at indirect prompt injection, system prompt poisoning, excessive agency, RAG poisoning, tool-call abuse, and practical engineering controls.",
    topics: [
      "Indirect prompt injection",
      "System prompt poisoning",
      "RAG poisoning",
      "Excessive agency",
    ],
    takeaways: [
      "Treat every retrieved document, web page, email, and tool response as untrusted input.",
      "Do not rely on the model to enforce security boundaries against itself.",
      "Constrain tools, validate outputs, and isolate secrets outside prompt context.",
    ],
    methods: [
      "Prompt boundary review",
      "Tool permission minimization",
      "Output filtering and provenance checks",
    ],
    relatedTools: ["llm-prompt-tester", "ai-threat-modeler"],
  },
  {
    slug: "zero-day-cve-response-ai-era",
    title: "Zero-Day CVE Response in the AI Era",
    date: "2026-06",
    tag: "Vulnerability Response",
    status: "Published",
    readTime: "9 min",
    audience: "Security leads and founders",
    summary:
      "A practical response model for actively exploited CVEs, browser zero-days, AI-native vulnerabilities, and exposure-driven patch prioritization.",
    topics: [
      "Zero-day triage",
      "CISA KEV monitoring",
      "Browser exploit chains",
      "AI-native CVEs",
    ],
    takeaways: [
      "Exploitability and exposure should drive patch order more than raw CVSS alone.",
      "AI systems need CVE response plans for dependencies, browsers, plugins, and model-adjacent services.",
      "Detection should include asset inventory, compensating controls, and rapid rollback paths.",
    ],
    methods: [
      "KEV and vendor advisory monitoring",
      "Exposure-based triage",
      "Compensating control review",
    ],
    relatedTools: ["webapp-quick-test", "api-attack-mapper", "ai-threat-modeler"],
  },
];

export const tools = [
  {
    slug: "webapp-quick-test",
    name: "Quick Web Security Review",
    status: "Live",
    category: "Application Security",
    maturity: 82,
    bestFor: "Quick preliminary public web app security checks",
    description:
      "A quick preliminary passive review for public endpoints that scores security headers, TLS certificate posture, CORS exposure, cache policy, CSP, HSTS, client-side signals, service exposure, and version disclosure before a deeper pentest.",
    capabilities: [
      "OWASP-style security header scoring",
      "TLS certificate metadata review",
      "Atomix AI preliminary threat analysis",
    ],
    inputs: [
      "Public HTTP or HTTPS endpoint",
      "Optional Atomix access phrase for AI analysis",
      "No credentials or exploit payloads required",
    ],
    outputs: [
      "Security score out of 100",
      "Professional posture report with score rationale",
      "Certificate and disclosure report",
      "AI-assisted threat analysis",
    ],
    workflow: [
      "Normalize and validate the public endpoint.",
      "Passively probe HTTP headers and TLS certificate metadata.",
      "Score CSP, HSTS, cache-control, CORS, framing, MIME, cookie, token, form, and client-side exposure controls.",
      "Use Atomix AI to summarize likely attack paths and next testing priorities.",
    ],
    useCases: [
      "Pre-pentest hygiene check",
      "Security header regression review",
      "Fast vendor or staging environment triage",
    ],
    metrics: [
      { label: "Primary Surface", value: "Web Headers + TLS" },
      { label: "Review Mode", value: "Passive Probe" },
      { label: "Output", value: "Score + Report" },
    ],
  },
  {
    slug: "llm-prompt-tester",
    name: "LLM Prompt Tester",
    status: "Experimental",
    category: "AI Security",
    maturity: 62,
    bestFor: "Testing model behavior before release",
    description:
      "A framework for testing prompt injection, instruction leakage, and unsafe model behaviors across LLM deployments.",
    capabilities: [
      "Prompt injection scenario design",
      "Instruction hierarchy checks",
      "Unsafe output pattern tracking",
    ],
    inputs: [
      "System prompt or policy summary",
      "Sample user workflows",
      "Tool and retrieval context",
    ],
    outputs: [
      "Prompt abuse scenarios",
      "Observed failure patterns",
      "Recommended guardrail priorities",
    ],
    workflow: [
      "Define the model role, tools, and data boundaries.",
      "Run direct and indirect prompt injection cases.",
      "Classify failures by leakage, override, and unsafe action.",
      "Document fixes and retest high-risk prompts.",
    ],
    useCases: [
      "Pre-launch LLM feature review",
      "Regression testing after prompt or model changes",
      "Unsafe response pattern discovery",
    ],
    metrics: [
      { label: "Primary Surface", value: "Prompt + Context" },
      { label: "Review Mode", value: "Scenario Testing" },
      { label: "Output", value: "Risk Notes" },
    ],
  },
  {
    slug: "ai-threat-modeler",
    name: "AI Threat Modeler",
    status: "In Progress",
    category: "Architecture",
    maturity: 74,
    bestFor: "Mapping risks in AI-enabled systems",
    description:
      "A structured approach for identifying threat surfaces in AI-enabled architectures, including agents and tool-using models.",
    capabilities: [
      "Asset and trust boundary mapping",
      "Agent/tool abuse path analysis",
      "Control recommendation templates",
    ],
    inputs: [
      "System architecture notes",
      "Model and agent responsibilities",
      "Data stores, tools, and permission scopes",
    ],
    outputs: [
      "AI trust boundary map",
      "Prioritized abuse paths",
      "Control checklist for engineering teams",
    ],
    workflow: [
      "Identify assets, actors, and delegated permissions.",
      "Separate trusted instructions from untrusted content.",
      "Trace model, retrieval, tool, and human approval flows.",
      "Prioritize controls by impact and likelihood.",
    ],
    useCases: [
      "AI product design review",
      "Agent permission scoping",
      "Security requirements planning",
    ],
    metrics: [
      { label: "Primary Surface", value: "Model + Tools" },
      { label: "Review Mode", value: "Threat Model" },
      { label: "Output", value: "Control Plan" },
    ],
  },
  {
    slug: "api-attack-mapper",
    name: "API Attack Mapper",
    status: "Prototype",
    category: "Application Security",
    maturity: 55,
    bestFor: "Cataloging web and API abuse paths",
    description:
      "Maps common API abuse patterns and misconfigurations in modern web and cloud-native applications.",
    capabilities: [
      "Endpoint behavior cataloging",
      "Auth and authorization checks",
      "Abuse case prioritization",
    ],
    inputs: [
      "Endpoint inventory",
      "Role and permission model",
      "Known user and admin workflows",
    ],
    outputs: [
      "API attack surface map",
      "Authorization test ideas",
      "Abuse case backlog",
    ],
    workflow: [
      "Group endpoints by asset, role, and action.",
      "Map trust assumptions in request flows.",
      "Identify auth, authorization, rate, and state abuse paths.",
      "Rank findings by exploitability and product impact.",
    ],
    useCases: [
      "API review preparation",
      "Authorization testing",
      "Cloud-native product hardening",
    ],
    metrics: [
      { label: "Primary Surface", value: "Web/API" },
      { label: "Review Mode", value: "Attack Mapping" },
      { label: "Output", value: "Abuse Backlog" },
    ],
  },
];
