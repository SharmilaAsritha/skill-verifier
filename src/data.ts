import { SkillNode, TargetRole, SkillTest, Badge, LeaderboardEntry, PeerReview } from './types';

export const INITIAL_SKILLS: SkillNode[] = [
  // --- Technical: Excel & Analytics ---
  {
    id: 'excel_formulas',
    name: 'Advanced Excel Formulas',
    category: 'technical',
    domain: 'Excel & Analytics',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Mastery of lookup functions (XLOOKUP, INDEX/MATCH), logical reasoning, and array formulas for data parsing.',
  },
  {
    id: 'pivot_tables',
    name: 'Pivot Tables & Modeling',
    category: 'technical',
    domain: 'Excel & Analytics',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Constructing dynamic summaries, calculated fields, and multi-source data relationships.',
    prerequisites: ['excel_formulas'],
  },
  {
    id: 'data_viz_d3',
    name: 'Data Visualization & Charts',
    category: 'technical',
    domain: 'Excel & Analytics',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Transforming dense datasets into clean dashboard trends, using proper chart hierarchies.',
    prerequisites: ['pivot_tables'],
  },

  // --- Technical: HR Management & Policy ---
  {
    id: 'labor_laws',
    name: 'Labor Laws & Compliance',
    category: 'technical',
    domain: 'HR Management',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Navigating employment statutes, wage-and-hour compliance, workplace safety, and EEOC regulations.',
  },
  {
    id: 'comp_benefits',
    name: 'Compensation & Benefits Strategy',
    category: 'technical',
    domain: 'HR Management',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Designing market-competitive salary bands, equity schemas, and benefits programs aligned with corporate budgets.',
    prerequisites: ['labor_laws'],
  },
  {
    id: 'retention_policy',
    name: 'Retention Strategy & Performance',
    category: 'technical',
    domain: 'HR Management',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Synthesizing employee appraisal plans, exit interviews, and wellness schemes to minimize high-value turnover.',
    prerequisites: ['comp_benefits'],
  },

  // --- Technical: Software Engineering ---
  {
    id: 'fe_basics',
    name: 'UI/UX & Component Styling',
    category: 'technical',
    domain: 'Software Engineering',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Building performant UI states, applying proper spacing systems, responsive design principles, and accessibility.',
  },
  {
    id: 'state_management',
    name: 'Advanced State & Client logic',
    category: 'technical',
    domain: 'Software Engineering',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Orchestrating robust client-side stores, data synchronization, and managing complex rendering lifecycles.',
    prerequisites: ['fe_basics'],
  },

  // --- Soft Skills: Negotiation ---
  {
    id: 'salary_neg',
    name: 'Tactful Salary Negotiation',
    category: 'soft',
    domain: 'Negotiation & Influence',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Handling salary offers, positioning value, counter-offering, and anchoring without damaging professional relationships.',
  },
  {
    id: 'client_scope',
    name: 'Client Scope & Contract Negotiation',
    category: 'soft',
    domain: 'Negotiation & Influence',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Managing scope creep, negotiating deadlines, pricing terms, and crafting win-win solutions under stakeholder pressure.',
    prerequisites: ['salary_neg'],
  },

  // --- Soft Skills: Leadership ---
  {
    id: 'conflict_resolution',
    name: 'Interpersonal Conflict Resolution',
    category: 'soft',
    domain: 'Leadership & Comms',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Defusing high-stress workplace disputes, mediating team arguments, and negotiating mutually agreeable resolutions.',
  },
  {
    id: 'team_motivation',
    name: 'Team Inspiration & Delegation',
    category: 'soft',
    domain: 'Leadership & Comms',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Motivating squads during crunches, articulating shared goals, delegating according to strengths, and giving hard feedback.',
    prerequisites: ['conflict_resolution'],
  },
  {
    id: 'exec_comms',
    name: 'Executive Comms & Writing',
    category: 'soft',
    domain: 'Leadership & Comms',
    score: null,
    level: 0,
    maxLevel: 3,
    description: 'Drafting brief, crisp summaries for stakeholders, presenting hard data to leadership, and setting verbal boundaries.',
    prerequisites: ['conflict_resolution'],
  },
];

export const TARGET_ROLES: TargetRole[] = [
  {
    id: 'hr_analyst',
    name: 'HR Analyst / HR Operations Specialist',
    description: 'Optimizes talent acquisition, manages compliance audits, and implements company-wide compensation or retention programs.',
    averageSalary: '$68,000 - $92,000',
    requiredSkills: [
      { skillId: 'labor_laws', weight: 0.25 },
      { skillId: 'comp_benefits', weight: 0.20 },
      { skillId: 'retention_policy', weight: 0.20 },
      { skillId: 'conflict_resolution', weight: 0.20 },
      { skillId: 'excel_formulas', weight: 0.15 },
    ],
  },
  {
    id: 'biz_analyst',
    name: 'Business Intelligence & Operations Analyst',
    description: 'Mines corporate datasets, builds spreadsheets, designs KPI visualizers, and guides leadership through tactical data insights.',
    averageSalary: '$75,000 - $105,000',
    requiredSkills: [
      { skillId: 'excel_formulas', weight: 0.30 },
      { skillId: 'pivot_tables', weight: 0.30 },
      { skillId: 'data_viz_d3', weight: 0.20 },
      { skillId: 'exec_comms', weight: 0.10 },
      { skillId: 'client_scope', weight: 0.10 },
    ],
  },
  {
    id: 'product_manager',
    name: 'Associate Product Manager',
    description: 'Bridges technical teams and commercial stakeholders. Prioritizes roadmap scopes, negotiates client expectations, and motivates engineers.',
    averageSalary: '$90,000 - $125,000',
    requiredSkills: [
      { skillId: 'client_scope', weight: 0.25 },
      { skillId: 'team_motivation', weight: 0.25 },
      { skillId: 'exec_comms', weight: 0.20 },
      { skillId: 'pivot_tables', weight: 0.15 },
      { skillId: 'fe_basics', weight: 0.15 },
    ],
  },
  {
    id: 'fe_developer',
    name: 'Front-End / UI Engineer',
    description: 'Crafts responsive interfaces, styles components, manages web app state, and translates designs into production-ready modules.',
    averageSalary: '$85,000 - $115,000',
    requiredSkills: [
      { skillId: 'fe_basics', weight: 0.40 },
      { skillId: 'state_management', weight: 0.30 },
      { skillId: 'data_viz_d3', weight: 0.15 },
      { skillId: 'exec_comms', weight: 0.15 },
    ],
  },
];

export const SKILL_TESTS: SkillTest[] = [
  // Excel formulas
  {
    id: 'test_excel_formulas',
    title: 'Excel Analytical Rigor Test',
    skillId: 'excel_formulas',
    roleId: 'biz_analyst',
    durationMinutes: 10,
    questions: [
      {
        id: 'q_ex_1',
        type: 'multiple-choice',
        text: 'You have a transactional ledger where IDs are occasionally duplicated. Which formula combo retrieves the VERY LAST occurrence of an ID instead of the first?',
        options: [
          'VLOOKUP(id, table, col, FALSE)',
          'XLOOKUP(id, lookup_array, return_array, , , -1)',
          'INDEX(array, MATCH(id, lookup_array, 0))',
          'LOOKUP(2, 1/(lookup_array=id), return_array)'
        ],
        correctAnswer: 'XLOOKUP(id, lookup_array, return_array, , , -1)',
      },
      {
        id: 'q_ex_2',
        type: 'text',
        text: 'Scenario: Your manager sends you a raw file of 12,000 rows where transaction values are stored as text (e.g. "$1,240.50 USD"). Explain the exact steps and formulas you would write to parse, clean, and convert this column into true numerical currency for auditing.',
        rubricHint: 'Must demonstrate parsing string functions (SUBSTITUTE, VALUE, MID) or Excel formatting procedures.',
      }
    ]
  },
  // Pivot tables
  {
    id: 'test_pivot_tables',
    title: 'Pivot Modeling Scenario Challenge',
    skillId: 'pivot_tables',
    roleId: 'biz_analyst',
    durationMinutes: 8,
    questions: [
      {
        id: 'q_p_1',
        type: 'text',
        text: 'Scenario: You are designing a regional sales dashboard. You have a fact table of "Orders" and a dimension table of "Rep Target Goals". How do you set up a Pivot Table or Data Model in Excel to display "Actual Sales vs Goal %" by Region without writing manual lookup duplicates?',
        rubricHint: 'Explain utilizing Excel Data Model (Power Pivot), creating relationships on common keys, and writing an explicit DAX measure.',
      }
    ]
  },
  // Labor Laws
  {
    id: 'test_labor_laws',
    title: 'Employment Standards Compliance Audit',
    skillId: 'labor_laws',
    roleId: 'hr_analyst',
    durationMinutes: 12,
    questions: [
      {
        id: 'q_ll_1',
        type: 'multiple-choice',
        text: 'Under standard FLSA (Fair Labor Standards Act) guidelines, which of the following is the primary criteria to classify an employee as EXEMPT from overtime compensation?',
        options: [
          'They are paid an hourly rate higher than $25.00/hour.',
          'They sign an agreement explicitly waiving overtime benefits.',
          'They meet the salary threshold and perform executive, administrative, or professional duties.',
          'They work remotely and manage their own daily schedules.'
        ],
        correctAnswer: 'They meet the salary threshold and perform executive, administrative, or professional duties.',
      },
      {
        id: 'q_ll_2',
        type: 'text',
        text: 'Scenario: An department supervisor requests to hire three independent contractors (1099) to run core customer support lines, working set 9-to-5 shifts using corporate software. Detail your compliance warning and legal rationale to the supervisor regarding potential misclassification risk.',
        rubricHint: 'Evaluate based on control guidelines, core business integration, and risk of EEOC or IRS penalties.',
      }
    ]
  },
  // Comp Benefits
  {
    id: 'test_comp_benefits',
    title: 'Compensation Banding Strategy',
    skillId: 'comp_benefits',
    roleId: 'hr_analyst',
    durationMinutes: 15,
    questions: [
      {
        id: 'q_cb_1',
        type: 'text',
        text: 'Scenario: Your company is losing critical mid-level engineering staff to local tech competitors. You have a budget expansion cap of 7% total payroll. Outline how you would run a salary benchmarking study and structure a compensation adjustment that optimizes retention while keeping equity fair for legacy employees.',
        rubricHint: 'Explain using comp-ratios, salary range midpoints, and targeted adjustments for at-risk performers over blanket raises.',
      }
    ]
  },
  // Retention Policy
  {
    id: 'test_retention_policy',
    title: 'Talent Retention & Appraisals',
    skillId: 'retention_policy',
    roleId: 'hr_analyst',
    durationMinutes: 10,
    questions: [
      {
        id: 'q_rp_1',
        type: 'text',
        text: 'Scenario: Employee survey results show high dissatisfaction with "career progression opportunities." However, the organizational chart is flat and promotions are rare. Detail a non-monetary, structural career pathing program you can pitch to the C-suite to improve retention.',
        rubricHint: 'Focus on horizontal growth tracks, structured mentorships, skill badging, or project rotations.',
      }
    ]
  },
  // Salary Negotiation
  {
    id: 'test_salary_neg',
    title: 'Salary Counter-Offer Mediation',
    skillId: 'salary_neg',
    roleId: 'product_manager',
    durationMinutes: 10,
    questions: [
      {
        id: 'q_sn_1',
        type: 'text',
        text: 'Scenario: You received a job offer for $95,000, but your researched market value is $108,000. Write the exact negotiation script or email response you would send to the recruiter to confidently counter-offer at $112,000, framing your accomplishments to justify the gap without sounding adversarial.',
        rubricHint: 'Assess on collaborative anchoring, value-focused justifications, and polite tone.',
      }
    ]
  },
  // Client Scope
  {
    id: 'test_client_scope',
    title: 'Scope Creep Stakeholder Negotiation',
    skillId: 'client_scope',
    roleId: 'product_manager',
    durationMinutes: 12,
    questions: [
      {
        id: 'q_cs_1',
        type: 'text',
        text: 'Scenario: A high-value corporate client demands a major feature addition just 10 days before the scheduled product release, warning that a delay or refusal will hurt renewal chances. Drafting a professional reply: how do you negotiate a phased delivery or trade-off while maintaining trust?',
        rubricHint: 'Focus on transparency, introducing trade-off frameworks, phased release structures, and win-win negotiation tactics.',
      }
    ]
  },
  // Conflict Resolution
  {
    id: 'test_conflict_resolution',
    title: 'Cross-functional Conflict Resolution',
    skillId: 'conflict_resolution',
    roleId: 'product_manager',
    durationMinutes: 10,
    questions: [
      {
        id: 'q_cr_1',
        type: 'text',
        text: 'Scenario: Your lead UI Designer and lead Back-End Developer are arguing aggressively over feature layout. The designer claims the developer is lazy; the developer claims the designer does not understand database limits. This is freezing progress. Describe how you would mediate this impasse.',
        rubricHint: 'Mediate with an objective framework, separating people from the problem, setting joint objectives, and establishing collaborative prototypes.',
      }
    ]
  },
  // UI basics
  {
    id: 'test_fe_basics',
    title: 'Responsive Grid & Usability Audit',
    skillId: 'fe_basics',
    roleId: 'fe_developer',
    durationMinutes: 8,
    questions: [
      {
        id: 'q_feb_1',
        type: 'multiple-choice',
        text: 'When implementing WCAG-compliant color contrast, what is the minimum required contrast ratio for standard body text against its background?',
        options: [
          '3.0:1',
          '4.5:1',
          '7.0:1',
          '2.1:1'
        ],
        correctAnswer: '4.5:1',
      },
      {
        id: 'q_feb_2',
        type: 'text',
        text: 'Scenario: A customer reports that on mobile devices, they cannot tap any checkbox in your list because it constantly triggers the row details page instead. Detail the CSS/HTML properties and touch-target strategies you would implement to solve this issue.',
        rubricHint: 'Discuss touch targets of at least 44x44px, using stopPropagation on handlers, and appropriate relative padding.',
      }
    ]
  }
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge_first_step',
    name: 'Reality Checked',
    description: 'Completed your first skill reality assessment and faced true industry feedback.',
    icon: 'Target',
    unlocked: false,
    criteria: 'Submit 1 evaluation test'
  },
  {
    id: 'badge_excel_master',
    name: 'Excel Auditor',
    description: 'Achieved 70+ in an advanced spreadsheet analysis test.',
    icon: 'FileSpreadsheet',
    unlocked: false,
    criteria: 'Excel score >= 70'
  },
  {
    id: 'badge_comms_guru',
    name: 'Tactful Negotiator',
    description: 'Achieved 80+ in an advanced negotiation or scope-management challenge.',
    icon: 'Handshake',
    unlocked: false,
    criteria: 'Negotiation/Salary test score >= 80'
  },
  {
    id: 'badge_compliance_officer',
    name: 'Compliance Guardian',
    description: 'Passed the Employment Standards Compliance Audit with an exemplary rating.',
    icon: 'ShieldCheck',
    unlocked: false,
    criteria: 'Labor Law score >= 75'
  },
  {
    id: 'badge_peer_reviewer',
    name: 'Peer Mentor',
    description: 'Provided thorough feedback reviews for fellow students.',
    icon: 'MessageSquareText',
    unlocked: false,
    criteria: 'Submit 1 peer review'
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'lb_1', name: 'Alara Vance', role: 'Data Intelligence', score: 285, rank: 1 },
  { id: 'lb_2', name: 'Marcus Chen', role: 'HR Operations', score: 260, rank: 2 },
  { id: 'lb_3', name: 'Siddharth Nair', role: 'Associate PM', score: 245, rank: 3 },
  { id: 'lb_4', name: 'Chloe Dubois', role: 'Tech Operations', score: 220, rank: 4 },
  { id: 'lb_5', name: 'Elena Rostova', role: 'HR Analyst', score: 195, rank: 5 },
  { id: 'lb_user', name: 'You (Student)', role: 'Evaluating...', score: 0, rank: 6, isCurrentUser: true }
];

export const SIMULATED_PEERS_FOR_REVIEW = [
  {
    id: 'peer_1',
    studentName: 'Danielle Carter',
    targetRole: 'HR Analyst',
    skillName: 'Retention Strategy & Performance',
    scenarioPrompt: 'Scenario: Employee survey results show high dissatisfaction with career progression. Design a horizontal non-monetary plan.',
    peerAnswer: 'I would set up a newsletter telling everyone what different departments do. Also, we could host weekly pizza lunches where people talk about their career goals, and managers should make checklists for their subordinates so everyone knows how to move up. If people are unhappy we can also offer flexible Fridays so they can learn on their own.',
    submittedDate: '2 hours ago'
  },
  {
    id: 'peer_2',
    studentName: 'Jordan Vance',
    targetRole: 'Business Analyst',
    skillName: 'Advanced Excel Formulas',
    scenarioPrompt: 'Scenario: Raw file of 12,000 rows with dirty text currency (e.g. "$1,240.50 USD"). How do you parse and sanitize this numerical field?',
    peerAnswer: 'I would probably just highlight the column and do Find & Replace to get rid of "$", then Find & Replace to remove "USD". Once they are gone, I would wrap the whole column in =VALUE() in a new column to convert it to actual numbers. If there are trailing spaces I can use the TRIM function too.',
    submittedDate: '1 day ago'
  }
];

export const INITIAL_PEER_REVIEWS: PeerReview[] = [
  {
    id: 'pr_1',
    reviewerName: 'Devon Miller (Senior HR Director)',
    reviewerRole: 'HR Expert Reviewer',
    skillId: 'labor_laws',
    skillName: 'Labor Laws & Compliance',
    rating: 4,
    textFeedback: 'Good understanding of the administrative exemption test. However, you left out the minimum salary criteria which is absolutely vital to avoid IRS misclassification claims. Be precise.',
    date: '3 days ago'
  },
  {
    id: 'pr_2',
    reviewerName: 'Sofia Martinez (Lead Product Partner)',
    reviewerRole: 'Peer Alum',
    skillId: 'client_scope',
    skillName: 'Client Scope & Contract Negotiation',
    rating: 5,
    textFeedback: 'Outstanding phased delivery strategy script! Presenting clear alternative trades is how we preserve key contracts. You write with great commercial posture.',
    date: 'Yesterday'
  }
];
