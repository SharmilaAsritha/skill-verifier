export interface SkillNode {
  id: string;
  name: string;
  category: 'technical' | 'soft';
  domain: string; // e.g. "Excel & Analytics", "HR Management", "Leadership & Soft Skills"
  score: number | null; // null if untested, 0-100 scale
  level: number; // 0 to 3 (unlocked, beginner, intermediate, advanced)
  maxLevel: number;
  description: string;
  prerequisites?: string[]; // skill IDs required
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'text';
  text: string;
  options?: string[]; // for multiple choice
  correctAnswer?: string; // for multiple choice
  rubricHint?: string; // instructions for text questions
}

export interface SkillTest {
  id: string;
  title: string;
  skillId: string;
  roleId: string;
  durationMinutes: number;
  questions: Question[];
}

export interface RubricBreakdown {
  aspect: string;
  score: number; // 0-100
  feedback: string;
}

export interface AIReviewResult {
  overallScore: number;
  industryLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Unrated';
  readinessPercentage: number;
  rubric: RubricBreakdown[];
  strengths: string[];
  improvements: string[];
  verdict: string;
}

export interface PeerReview {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  skillId: string;
  skillName: string;
  rating: number; // 1-5 stars
  textFeedback: string;
  date: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  unlocked: boolean;
  unlockedAt?: string;
  criteria: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  role: string;
  score: number; // overall skill points
  rank: number;
  isCurrentUser?: boolean;
}

export interface TargetRole {
  id: string;
  name: string;
  description: string;
  averageSalary: string;
  requiredSkills: { skillId: string; weight: number }[]; // weights sum to 1
}

export interface UserState {
  name: string;
  targetRoleId: string;
  skills: SkillNode[];
  completedTests: Record<string, { score: number; completedAt: string }>;
  badges: Badge[];
  peerReviews: PeerReview[];
}
