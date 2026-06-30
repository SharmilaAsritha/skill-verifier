import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Target,
  FileSpreadsheet,
  Handshake,
  ShieldCheck,
  MessageSquareText,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Brain,
  User,
  TrendingUp,
  Sparkles,
  Plus,
  Search,
  Building,
  Briefcase,
  ArrowRight,
  Lock,
  Mail,
  RefreshCw,
  Star,
  ThumbsUp,
  Check,
  Users,
  Mic,
  MicOff,
  Volume2,
  Play,
  Fingerprint,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
} from 'recharts';
import { INITIAL_SKILLS, TARGET_ROLES, SKILL_TESTS, INITIAL_BADGES, INITIAL_LEADERBOARD, SIMULATED_PEERS_FOR_REVIEW, INITIAL_PEER_REVIEWS } from './data';
import { SkillNode, TargetRole, SkillTest, Badge, LeaderboardEntry, PeerReview, AIReviewResult, Question } from './types';
import { generatePDFReport } from './utils/reportGenerator';
import { DOMAINS, DEFAULT_ROLES, generateSkillsAndTests } from './taskGenerator';

function getAutoCorrectedDomain(input: string): string {
  const clean = (input || "")
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "Software Engineering & Web Development";

  if (clean.includes("software") || clean.includes("web") || clean.includes("swe") || clean.includes("dev")) {
    return "Software Engineering & Web Development";
  }
  if (clean.includes("prompt") || clean.includes("promp") || clean.includes("gen") || clean.includes("generative")) {
    return "Prompt Engineering & Generative AI";
  }
  if (clean.includes("bank") || clean.includes("bnk") || clean.includes("investment") || clean.includes("retail") || clean.includes("financial") || clean.includes("credit")) {
    return "Banking & Financial Services";
  }
  if (clean.includes("cyber") || clean.includes("secur") || clean.includes("penetration") || clean.includes("ciber") || clean.includes("threat") || clean.includes("defense")) {
    return "Cyber Security & Threat Defense";
  }
  if (clean.includes("machine") || clean.includes("machin") || clean.includes("learning") || clean.includes("ml") || clean.includes("ai ")) {
    return "Machine Learning & AI Systems";
  }
  if (clean.includes("cloud") || clean.includes("clod") || clean.includes("infrastructure") || clean.includes("computing")) {
    return "Cloud Computing & Infrastructure";
  }
  if (clean.includes("hr") || clean.includes("human") || clean.includes("talent") || clean.includes("people") || clean.includes("recruit")) {
    return "HR, Talent & People Operations";
  }
  if (clean.includes("business intelligence") || clean.includes("bi") || clean.includes("analytics") || clean.includes("data")) {
    return "Business Intelligence & Data Analytics";
  }
  if (clean.includes("product") || clean.includes("pm") || clean.includes("marketing") || clean.includes("strategy")) {
    return "Product Management & Marketing Strategy";
  }
  if (clean.includes("health") || clean.includes("clinical") || clean.includes("medical") || clean.includes("compliance")) {
    return "Healthcare Operations & Compliance";
  }
  if (clean.includes("finance") || clean.includes("account") || clean.includes("risk") || clean.includes("forecaster")) {
    return "Finance, Accounting & Risk";
  }
  
  return "Custom Domain";
}

export default function App() {
  // Career choice dynamic states
  const [customDomain, setCustomDomain] = useState<string>(() => {
    try {
      return localStorage.getItem("skillverifier_custom_domain") || "Software Engineering & Web Development";
    } catch (e) {
      return "Software Engineering & Web Development";
    }
  });
  const [domainMode, setDomainMode] = useState<'select' | 'type'>('select');
  const [domainTypedInput, setDomainTypedInput] = useState<string>("");
  const [customRole, setCustomRole] = useState<string>(() => {
    try {
      return localStorage.getItem("skillverifier_custom_role") || "React UI Architect";
    } catch (e) {
      return "React UI Architect";
    }
  });
  const [customLevel, setCustomLevel] = useState<'L1' | 'L2' | 'L3'>(() => {
    try {
      const val = localStorage.getItem("skillverifier_custom_level");
      return (val as 'L1' | 'L2' | 'L3') || 'L2';
    } catch (e) {
      return 'L2';
    }
  });

  const initialData = generateSkillsAndTests(customDomain, customRole, customLevel);

  // Core state
  const [skills, setSkills] = useState<SkillNode[]>(initialData.skills);
  const [activeTestsList, setActiveTestsList] = useState<SkillTest[]>(initialData.tests);
  const [targetRoleId, setTargetRoleId] = useState<string>('custom_role');
  const [completedTests, setCompletedTests] = useState<Record<string, { score: number; completedAt: string }>>(() => {
    try {
      const stored = localStorage.getItem("skillverifier_completed_tests");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error loading completed tests:", e);
    }
    return {};
  });
  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const stored = localStorage.getItem("skillverifier_badges");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error loading badges:", e);
    }
    return INITIAL_BADGES;
  });
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>(() => {
    try {
      const stored = localStorage.getItem("skillverifier_peer_reviews");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error loading peer reviews:", e);
    }
    return INITIAL_PEER_REVIEWS;
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  // UI Active Elements
  const [activeTab, setActiveTab] = useState<'trees' | 'interview' | 'reviews' | 'leaderboard'>('trees');
  const [selectedSkillId, setSelectedSkillId] = useState<string>(initialData.skills[0]?.id || '');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Interview Simulation states
  const [interviewQuestion, setInterviewQuestion] = useState<string>('');
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState<boolean>(false);
  const [isInterviewRecording, setIsInterviewRecording] = useState<boolean>(false);
  const [interviewTranscript, setInterviewTranscript] = useState<string>('');
  const [interviewFillerCount, setInterviewFillerCount] = useState<number>(0);
  const [isEvaluatingInterview, setIsEvaluatingInterview] = useState<boolean>(false);
  const [interviewResult, setInterviewResult] = useState<any | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  
  // Authentication states
  const [registeredUsers, setRegisteredUsers] = useState<Array<{name: string, email: string, password: string}>>(() => {
    try {
      const stored = localStorage.getItem("skillverifier_registered_users");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error loading registered users:", e);
    }
    return [{ name: "Alex Mercer", email: "candidate@career.net", password: "pass123" }];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem("skillverifier_authenticated") === "true";
    } catch (e) {
      return false;
    }
  });

  const [authEmail, setAuthEmail] = useState<string>(() => {
    return localStorage.getItem("skillverifier_auth_email") || "candidate@career.net";
  });

  const [authPassword, setAuthPassword] = useState<string>(() => {
    return localStorage.getItem("skillverifier_auth_password") || "pass123";
  });

  const [authName, setAuthName] = useState<string>(() => {
    return localStorage.getItem("skillverifier_auth_name") || "Alex Mercer";
  });

  const [currentUser, setCurrentUser] = useState<{name: string, email: string} | null>(() => {
    try {
      const stored = localStorage.getItem("skillverifier_current_user_profile");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error loading profile from localStorage:", e);
    }
    const storedName = localStorage.getItem("skillverifier_auth_name");
    const storedEmail = localStorage.getItem("skillverifier_auth_email");
    if (storedName || storedEmail) {
      return {
        name: storedName || "Alex Mercer",
        email: storedEmail || "candidate@career.net"
      };
    }
    return null;
  });

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [inputEmail, setInputEmail] = useState<string>("candidate@career.net");
  const [inputPassword, setInputPassword] = useState<string>("pass123");
  const [inputName, setInputName] = useState<string>("Alex Mercer");

  // Sync registered users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("skillverifier_registered_users", JSON.stringify(registeredUsers));
    } catch (e) {
      console.error(e);
    }
  }, [registeredUsers]);

  // Sync auth state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("skillverifier_authenticated", isAuthenticated ? "true" : "false");
      localStorage.setItem("skillverifier_auth_email", authEmail);
      localStorage.setItem("skillverifier_auth_password", authPassword);
      localStorage.setItem("skillverifier_auth_name", authName);
      if (currentUser) {
        localStorage.setItem("skillverifier_current_user_profile", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("skillverifier_current_user_profile");
      }
    } catch (e) {
      console.error(e);
    }
  }, [isAuthenticated, authEmail, authPassword, authName, currentUser]);

  // Sync career choice states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("skillverifier_custom_domain", customDomain);
      localStorage.setItem("skillverifier_custom_role", customRole);
      localStorage.setItem("skillverifier_custom_level", customLevel);
    } catch (e) {
      console.error(e);
    }
  }, [customDomain, customRole, customLevel]);

  // Sync test progress and reviews to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("skillverifier_completed_tests", JSON.stringify(completedTests));
    } catch (e) {
      console.error(e);
    }
  }, [completedTests]);

  useEffect(() => {
    try {
      localStorage.setItem("skillverifier_badges", JSON.stringify(badges));
    } catch (e) {
      console.error(e);
    }
  }, [badges]);

  useEffect(() => {
    try {
      localStorage.setItem("skillverifier_peer_reviews", JSON.stringify(peerReviews));
    } catch (e) {
      console.error(e);
    }
  }, [peerReviews]);

  // Test Runner States
  const [activeTest, setActiveTest] = useState<SkillTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationProgress, setEvaluationProgress] = useState<string>('');
  const [evaluationResult, setEvaluationResult] = useState<AIReviewResult | null>(null);
  const [testTimer, setTestTimer] = useState<number>(0);
  
  // Peer review writing state
  const [selectedPeerId, setSelectedPeerId] = useState<string>('');
  const [peerRating, setPeerRating] = useState<number>(0);
  const [peerFeedbackText, setPeerFeedbackText] = useState<string>('');
  const [peerSuccessMessage, setPeerSuccessMessage] = useState<string>('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Synchronize dynamic skills and tests
  useEffect(() => {
    const { skills: newSkills, tests: newTests } = generateSkillsAndTests(customDomain, customRole, customLevel);
    
    const updatedSkills = newSkills.map(ns => {
      const matchingTestResult = completedTests[`test_${ns.id}`] || completedTests[ns.id];
      const score = matchingTestResult ? matchingTestResult.score : null;
      let newLvl = ns.level;
      if (score !== null) {
        if (score >= 80) newLvl = 3;
        else if (score >= 60) newLvl = 2;
        else newLvl = 1;
      }
      return {
        ...ns,
        score,
        level: newLvl
      };
    });

    setSkills(updatedSkills);
    setActiveTestsList(newTests);
    
    if (!updatedSkills.some(s => s.id === selectedSkillId)) {
      setSelectedSkillId(updatedSkills[0]?.id || '');
    }
  }, [customDomain, customRole, customLevel, completedTests]);

  // Fetch the selected target role details
  const currentRole: TargetRole = {
    id: 'custom_role',
    name: customRole,
    description: `Targeting standard ${customLevel === 'L1' ? 'Beginner (L1)' : customLevel === 'L2' ? 'Intermediate (L2)' : 'Advanced (L3)'} expertise in the ${customDomain} domain.`,
    averageSalary: customLevel === 'L3' ? '$130,000 - $170,000' : customLevel === 'L2' ? '$90,000 - $120,000' : '$60,000 - $80,000',
    requiredSkills: skills.map(t => ({ skillId: t.id, weight: 1 / skills.length }))
  };

  const radarData = currentRole.requiredSkills.map(req => {
    const node = skills.find(s => s.id === req.skillId);
    return {
      subject: node?.name || req.skillId,
      "My Score": node?.score !== null ? (node?.score || 0) : 0,
      "Target Score": 85,
    };
  });

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Timer effect for the Active Test
  useEffect(() => {
    let interval: any;
    if (activeTest && testTimer > 0) {
      interval = setInterval(() => {
        setTestTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            showToast("Time's up! Submitting your answers for AI critique...", "info");
            handleTestSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTest, testTimer]);

  // Dynamic user performance and readiness calculation
  // Readiness is computed as: sum(tested_skill_score * weight) / sum(required_skill_weights)
  // Let's assume untested skills default to 0. We display this dynamically!
  const calculateRoleReadiness = (role: TargetRole) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    role.requiredSkills.forEach(req => {
      const skillNode = skills.find(s => s.id === req.skillId);
      const score = skillNode?.score || 0;
      totalScore += score * req.weight;
      totalWeight += req.weight;
    });

    if (totalWeight === 0) return 0;
    return Math.round((totalScore / totalWeight));
  };

  const currentReadiness = calculateRoleReadiness(currentRole);

  // Update overall Leaderboard with user's score dynamically
  useEffect(() => {
    // Total user skill score is the average of completed test scores, multiplied by 3 for point scaling
    const testedSkills = skills.filter(s => s.score !== null);
    const userTotalScorePoints = testedSkills.reduce((sum, s) => sum + (s.score || 0), 0);

    setLeaderboard(prev => {
      const updated = prev.map(entry => {
        if (entry.isCurrentUser) {
          return {
            ...entry,
            score: userTotalScorePoints,
            role: currentRole.name
          };
        }
        return entry;
      });
      // Re-rank entries based on score
      const sorted = [...updated].sort((a, b) => b.score - a.score);
      return sorted.map((entry, idx) => ({
        ...entry,
        rank: idx + 1
      }));
    });
  }, [skills, targetRoleId]);

  // Check Badge accomplishments
  const checkBadgeUnlocks = (updatedSkills: SkillNode[], updatedReviewsCount: number) => {
    let badgeUnlockedCount = 0;
    
    const newBadges = badges.map(badge => {
      if (badge.unlocked) return badge;

      let shouldUnlock = false;
      if (badge.id === 'badge_first_step') {
        shouldUnlock = updatedSkills.some(s => s.score !== null);
      } else if (badge.id === 'badge_excel_master') {
        const excelSkills = updatedSkills.filter(s => s.domain === 'Excel & Analytics');
        shouldUnlock = excelSkills.some(s => s.score !== null && s.score >= 70);
      } else if (badge.id === 'badge_comms_guru') {
        const softSkills = updatedSkills.filter(s => s.category === 'soft');
        shouldUnlock = softSkills.some(s => s.score !== null && s.score >= 80);
      } else if (badge.id === 'badge_compliance_officer') {
        const laborLaw = updatedSkills.find(s => s.id === 'labor_laws');
        shouldUnlock = laborLaw !== undefined && laborLaw.score !== null && laborLaw.score >= 75;
      } else if (badge.id === 'badge_peer_reviewer') {
        shouldUnlock = updatedReviewsCount > 0;
      }

      if (shouldUnlock) {
        badgeUnlockedCount++;
        return {
          ...badge,
          unlocked: true,
          unlockedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return badge;
    });

    if (badgeUnlockedCount > 0) {
      setBadges(newBadges);
      showToast(`🏆 Congratulations! You unlocked ${badgeUnlockedCount} new Achievement Badge!`, 'success');
    }
  };

  // Launch a test assessment
  const startSkillTest = (skillId: string) => {
    const test = activeTestsList.find(t => t.skillId === skillId);
    if (!test) {
      showToast("Test scenario content is currently being drafted. Try another node!", "info");
      return;
    }
    
    // Check prerequisites
    const node = skills.find(s => s.id === skillId);
    if (node?.prerequisites) {
      const unmet = node.prerequisites.filter(prereqId => {
        const prNode = skills.find(s => s.id === prereqId);
        return !prNode || prNode.score === null;
      });
      
      if (unmet.length > 0) {
        const unmetNames = unmet.map(id => skills.find(s => s.id === id)?.name || id).join(', ');
        alert(`🔒 Prerequisite Unmet! Please complete the "${unmetNames}" reality check test first before unlocking this advanced node.`);
        return;
      }
    }

    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setTestAnswers({});
    setEvaluationResult(null);
    setTestTimer(test.durationMinutes * 60);
    showToast(`Test Started: ${test.title}. You have ${test.durationMinutes} minutes.`, 'info');
  };

  // Submit test and trigger AI evaluation API
  const handleTestSubmit = async () => {
    if (!activeTest) return;

    setIsEvaluating(true);
    setEvaluationResult(null); // Clear previous score sheets immediately so loading state displays cleanly
    setEvaluationProgress("Scanning critical concepts...");
    
    // Quick progress steps simulation for higher fidelity
    const steps = [
      "Analyzing written context depth...",
      "Benchmarking response against executive rubrics...",
      "Formulating brutally honest recruiter feedback...",
      "Done!"
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        setEvaluationProgress(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(progressInterval);
      }
    }, 1500);

    const targetSkill = skills.find(s => s.id === activeTest.skillId);
    
    // Compile answers
    let combinedAnswersText = "";
    activeTest.questions.forEach((q, idx) => {
      combinedAnswersText += `[Question ${idx + 1}: ${q.text}] -> Answer: ${testAnswers[q.id] || "No Answer Supplied"}\n\n`;
    });

    try {
      const response = await fetch("/api/evaluate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName: targetSkill?.name || "Job Application Standard",
          domain: targetSkill?.domain || "General Professional",
          questionText: "Full assessment prompt details.",
          userAnswer: combinedAnswersText,
          skillLevel: targetSkill?.level || 1
        })
      });

      const data = await response.json();
      clearInterval(progressInterval);

      if (data.result) {
        const result: AIReviewResult = data.result;
        setEvaluationResult(result);

        // Update skill score in local nodes
        const updatedSkills = skills.map(s => {
          if (s.id === activeTest.skillId) {
            // Level up skill based on performance
            let newLvl = s.level;
            if (result.overallScore >= 80) newLvl = 3; // Advanced
            else if (result.overallScore >= 60) newLvl = 2; // Intermediate
            else if (result.overallScore >= 40) newLvl = 1; // Beginner
            else newLvl = 1;

            return {
              ...s,
              score: result.overallScore,
              level: newLvl
            };
          }
          return s;
        });

        setSkills(updatedSkills);
        setCompletedTests(prev => ({
          ...prev,
          [activeTest.id]: { score: result.overallScore, completedAt: new Date().toLocaleTimeString() }
        }));

        // Check badges
        checkBadgeUnlocks(updatedSkills, peerReviews.filter(r => r.reviewerName === 'You (Student)').length);
        
        showToast(`AI Reality Check Complete: Scored ${result.overallScore} (${result.industryLevel} Level)`, 'success');
      } else {
        throw new Error("Invalid format from server");
      }
    } catch (err) {
      console.error(err);
      showToast("Evaluation encountered an error, please try again.", "info");
    } finally {
      setIsEvaluating(false);
    }
  };

  // User submits a peer review
  const handlePeerReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeerId || peerRating === 0 || !peerFeedbackText.trim()) {
      alert("Please select a peer, provide a rating, and write constructive feedback.");
      return;
    }

    const peer = SIMULATED_PEERS_FOR_REVIEW.find(p => p.id === selectedPeerId);
    if (!peer) return;

    const newReview: PeerReview = {
      id: `pr_user_${Date.now()}`,
      reviewerName: 'You (Student)',
      reviewerRole: 'Peer Auditor',
      skillId: 'custom',
      skillName: peer.skillName,
      rating: peerRating,
      textFeedback: peerFeedbackText,
      date: 'Just now'
    };

    const updatedReviews = [newReview, ...peerReviews];
    setPeerReviews(updatedReviews);
    setPeerSuccessMessage(`Successfully submitted review for ${peer.studentName}!`);
    setPeerRating(0);
    setPeerFeedbackText('');
    setSelectedPeerId('');

    // Check badges for unlocking Peer Reviewer badge
    checkBadgeUnlocks(skills, updatedReviews.filter(r => r.reviewerName === 'You (Student)').length);

    setTimeout(() => setPeerSuccessMessage(''), 5000);
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target': return <Target className="w-5 h-5 text-indigo-500" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'Handshake': return <Handshake className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-cyan-500" />;
      case 'MessageSquareText': return <MessageSquareText className="w-5 h-5 text-pink-500" />;
      default: return <Award className="w-5 h-5 text-blue-500" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-indigo-500/30 text-slate-100 px-5 py-4 rounded-xl shadow-2xl animate-bounce">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        <div className="w-full max-w-md bg-slate-900/60 border border-slate-900 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl relative z-10">
          <div className="text-center space-y-2">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25 group overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
              <Fingerprint className="w-7 h-7 text-white relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white font-sans">SkillVerifier</h2>
              <p className="text-xs text-slate-400 font-medium">Verify your industry competence with Gemini AI</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Tab selection */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-2xl border border-slate-900/60">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  if (!inputName.trim()) {
                    setInputName("Alex Mercer");
                  }
                  if (!inputEmail.trim()) {
                    setInputEmail("candidate@career.net");
                  }
                  if (!inputPassword.trim()) {
                    setInputPassword("pass123");
                  }
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${!isSignUp ? 'bg-indigo-600 text-white shadow-lg font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  if (inputEmail === "candidate@career.net") {
                    setInputEmail("");
                  }
                  if (inputPassword === "pass123") {
                    setInputPassword("");
                  }
                  if (inputName === "Alex Mercer") {
                    setInputName("");
                  }
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${isSignUp ? 'bg-indigo-600 text-white shadow-lg font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">
                  {isSignUp ? "Create a New Assessment Profile" : "Corporate Gateway Active"}
                </strong>
                {isSignUp 
                  ? "Register your credentials to track, download, and publish your certified competency badges."
                  : "Please sign in to authorize verification logs and load customized domain modules."}
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              
              if (isSignUp) {
                // Sign Up validation
                if (!inputName.trim() || !inputEmail.trim() || !inputPassword.trim()) {
                  showToast("Please enter all details to register.", "info");
                  return;
                }
                
                // Check if user exists
                const userExists = registeredUsers.some(u => u.email.toLowerCase() === inputEmail.toLowerCase().trim());
                if (userExists) {
                  showToast("This email is already registered. Please sign in instead.", "info");
                  return;
                }

                // Add to register database
                const newUser = {
                  name: inputName.trim(),
                  email: inputEmail.toLowerCase().trim(),
                  password: inputPassword
                };
                setRegisteredUsers(prev => [...prev, newUser]);
                
                // Login immediately
                setAuthName(newUser.name);
                setAuthEmail(newUser.email);
                setAuthPassword(newUser.password);
                setCurrentUser({ name: newUser.name, email: newUser.email });
                setIsAuthenticated(true);
                showToast(`Account created! Welcome, ${newUser.name}.`, "success");
              } else {
                // Sign In validation
                if (!inputEmail.trim() || !inputPassword.trim()) {
                  showToast("Please enter email and password.", "info");
                  return;
                }

                const matchedUser = registeredUsers.find(
                  u => u.email.toLowerCase() === inputEmail.toLowerCase().trim() && u.password === inputPassword
                );

                if (matchedUser) {
                  setAuthName(matchedUser.name);
                  setAuthEmail(matchedUser.email);
                  setAuthPassword(matchedUser.password);
                  setCurrentUser({ name: matchedUser.name, email: matchedUser.email });
                  setIsAuthenticated(true);
                  showToast(`Welcome back, ${matchedUser.name}!`, "success");
                } else {
                  showToast("Invalid credentials. Please verify your details or Sign Up.", "info");
                }
              }
            }} className="space-y-4">
              
              {/* Full Name - ONLY show in sign-up mode */}
              {isSignUp && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Candidate Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-700 outline-none transition"
                    />
                    <User className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3.5" />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Professional Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="candidate@career.net"
                    className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-700 outline-none transition"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Secure Token / Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-700 outline-none transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Target Domain preset */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Initial Target Career Path</label>
                <div className="max-h-40 overflow-y-auto border border-slate-900 rounded-xl p-1 bg-slate-950 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {DOMAINS.map((d) => {
                    const isSelected = customDomain === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const matched = d;
                          setCustomDomain(matched);
                          setCustomRole(DEFAULT_ROLES[matched] || "Strategic Analyst");
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold' 
                            : 'bg-slate-900/40 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <span className="truncate pr-2">{d}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isSignUp ? "Register Account & Begin" : "Unlock Assessment Dashboard"}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isSignUp) {
                      setIsSignUp(false);
                      if (!inputName.trim()) {
                        setInputName("Alex Mercer");
                      }
                      if (!inputEmail.trim()) {
                        setInputEmail("candidate@career.net");
                      }
                      if (!inputPassword.trim()) {
                        setInputPassword("pass123");
                      }
                    } else {
                      setIsSignUp(true);
                      if (inputEmail === "candidate@career.net") {
                        setInputEmail("");
                      }
                      if (inputPassword === "pass123") {
                        setInputPassword("");
                      }
                      if (inputName === "Alex Mercer") {
                        setInputName("");
                      }
                    }
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition underline cursor-pointer font-medium"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-900/60"></div>
              <span className="flex-shrink mx-4 text-[9px] text-slate-600 font-bold uppercase tracking-widest">Demo Sandbox</span>
              <div className="flex-grow border-t border-slate-900/60"></div>
            </div>

            <button
              onClick={() => {
                setInputName("Alex Mercer");
                setInputEmail("candidate@career.net");
                setInputPassword("pass123");
                setIsSignUp(false);
                setAuthName("Alex Mercer");
                setAuthEmail("candidate@career.net");
                setAuthPassword("pass123");
                setCurrentUser({ name: "Alex Mercer", email: "candidate@career.net" });
                setIsAuthenticated(true);
                showToast("Logged in with prefilled candidate profile!", "success");
              }}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Use Demo Candidate Credentials</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Toast System */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-indigo-500/30 text-slate-100 px-5 py-4 rounded-xl shadow-2xl animate-bounce">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main Header navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group overflow-hidden">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
            <div className="relative flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-white" />
              <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-emerald-400/50">
                <Cpu className="w-2.5 h-2.5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="app-title" className="text-lg font-bold tracking-tight text-white">SkillVerifier</h1>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
                PRO LEVEL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold tracking-wide text-indigo-300">Tested. Measured. Proven.</p>
          </div>
        </div>

        {/* Global Live Target Role Status */}
        <div className="hidden md:flex items-center gap-6 bg-slate-900/60 border border-slate-900 rounded-xl p-2 px-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Current Target Career</span>
            <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="max-w-[180px] truncate">{customRole}</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                {customLevel === 'L1' ? 'L1 Beginner' : customLevel === 'L2' ? 'L2 Mid' : 'L3 Senior'}
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-800"></div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Industry Readiness</span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${currentReadiness >= 75 ? 'text-emerald-400' : currentReadiness >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {currentReadiness}%
                </span>
                <span className="text-[11px] text-slate-400">ready</span>
              </div>
            </div>
            {/* Visual Mini Progress circle */}
            <div className="w-9 h-9 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="14" className="stroke-slate-800" strokeWidth="3" fill="transparent" />
                <circle 
                  cx="18" cy="18" r="14" 
                  className={`transition-all duration-1000 ${currentReadiness >= 75 ? 'stroke-emerald-400' : currentReadiness >= 45 ? 'stroke-amber-400' : 'stroke-rose-400'}`}
                  strokeWidth="3" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 * (1 - currentReadiness / 100)}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* User Stats Profile Mini */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Student Identity</span>
              <span className="text-xs font-bold text-white block">{currentUser?.name || authName}</span>
              <span className="text-[11px] text-slate-400 block font-mono">{currentUser?.email || authEmail}</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <button
            onClick={() => {
              // Clear authentication state from localStorage
              localStorage.removeItem("skillverifier_authenticated");
              localStorage.removeItem("skillverifier_auth_email");
              localStorage.removeItem("skillverifier_auth_name");
              localStorage.removeItem("skillverifier_auth_password");
              localStorage.removeItem("skillverifier_current_user_profile");
              
              // Reset application state
              setIsAuthenticated(false);
              setCurrentUser(null);
              setInputEmail("candidate@career.net");
              setInputPassword("pass123");
              setInputName("Alex Mercer");
              setIsSignUp(false);
              showToast("Logged out successfully.", "info");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Target Career Setup & Level Configurator (Full Width at the Beginning) */}
        <div className="lg:col-span-12 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900/80">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Target Career Setup & Level Configurator</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Customize your domain, target role title, and competency level to dynamically generate tailored assessment tasks.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wide">
                Live Dynamic Engine
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. CAREER DOMAIN */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">1. Career Domain</label>
                <div className="flex gap-1.5 bg-slate-950 p-0.5 rounded-md border border-slate-900">
                  <button
                    type="button"
                    onClick={() => setDomainMode('select')}
                    className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase transition-all cursor-pointer ${domainMode === 'select' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDomainMode('type');
                      if (!domainTypedInput) {
                        setDomainTypedInput(customDomain);
                      }
                    }}
                    className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase transition-all cursor-pointer ${domainMode === 'type' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Type
                  </button>
                </div>
              </div>

              {domainMode === 'select' ? (
                <div className="relative">
                  <select
                    value={customDomain}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDomain(val);
                      setCustomRole(DEFAULT_ROLES[val] || "Strategic Analyst");
                      showToast(`Domain loaded: ${val}`, 'info');
                    }}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-8 text-xs text-slate-200 outline-none transition appearance-none cursor-pointer"
                  >
                    {DOMAINS.map(domain => (
                      <option key={domain} value={domain} className="bg-slate-950">
                        {domain}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={domainTypedInput}
                      onChange={(e) => {
                        const txt = e.target.value;
                        setDomainTypedInput(txt);
                        const matched = getAutoCorrectedDomain(txt);
                        if (matched && matched !== customDomain) {
                          setCustomDomain(matched);
                          setCustomRole(DEFAULT_ROLES[matched] || "Strategic Analyst");
                        }
                      }}
                      placeholder="e.g. promt engneer, bankin, cyber..."
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl py-2 pl-3 pr-3 text-xs text-slate-200 placeholder-slate-700 outline-none transition"
                    />
                  </div>
                  {domainTypedInput && (
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-1.5 flex items-center justify-between gap-1">
                      <span className="text-[9px] text-indigo-400 font-mono">Matched:</span>
                      <span className="text-[9px] text-white font-bold tracking-tight bg-indigo-600/30 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        {getAutoCorrectedDomain(domainTypedInput)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. TARGET CAREER ROLE */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">2. Target Career Role Title</label>
              <div className="relative">
                <input 
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer, SEO Lead..."
                  className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-700 outline-none transition"
                />
                <Briefcase className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* 3. COMPETENCY LEVEL */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">3. Audited Competency Level</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['L1', 'L2', 'L3'] as const).map((lvl) => {
                  const isActive = customLevel === lvl;
                  const label = lvl === 'L1' ? 'Beginner' : lvl === 'L2' ? 'Mid-Level' : 'Senior';
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setCustomLevel(lvl);
                        showToast(`Level switched to ${label} (${lvl})`, 'info');
                      }}
                      className={`py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="bg-slate-950/40 border border-slate-900/50 rounded-xl p-3 text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300">
                Evaluating <strong className="text-white">{customRole}</strong> competency across <strong className="text-indigo-400">{skills.length} core tasks</strong>.
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[10px]">
              Average Target Benchmark: 85% Score
            </span>
          </div>
        </div>

        {/* LEFT COLUMN: Target Career Details & Leaderboard Sidecar & Achievements */}
        <section className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* Achievement Badges Grid */}
          <div id="badges-card" className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Gamified Badges</h3>
              </div>
              <span className="text-[11px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded font-medium">
                {badges.filter(b => b.unlocked).length} / {badges.length} unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {badges.map(badge => (
                <div 
                  key={badge.id}
                  className={`p-3 rounded-xl border transition-all duration-300 ${
                    badge.unlocked 
                      ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50' 
                      : 'bg-slate-950/40 border-slate-900/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${badge.unlocked ? 'bg-indigo-500/10' : 'bg-slate-900'}`}>
                      {getBadgeIcon(badge.icon)}
                    </div>
                    {badge.unlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-700" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">{badge.name}</h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{badge.description}</p>
                  {badge.unlocked && badge.unlockedAt && (
                    <span className="text-[9px] text-indigo-400 font-mono block mt-2">Unlocked {badge.unlockedAt}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Workspaces */}
        <section className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* Main Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-px">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => { setActiveTab('trees'); setActiveTest(null); }}
                className={`px-4 py-3 text-sm font-semibold transition-all duration-200 relative border-b-2 ${
                  activeTab === 'trees' 
                    ? 'text-white border-indigo-500' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Skill Trees & Assessments</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('interview'); setActiveTest(null); }}
                className={`px-4 py-3 text-sm font-semibold transition-all duration-200 relative border-b-2 ${
                  activeTab === 'interview' 
                    ? 'text-white border-indigo-500' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  <span>Interview Simulation</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('reviews'); setActiveTest(null); }}
                className={`px-4 py-3 text-sm font-semibold transition-all duration-200 relative border-b-2 ${
                  activeTab === 'reviews' 
                    ? 'text-white border-indigo-500' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Peer Review Center</span>
                </div>
              </button>

              <button
                onClick={() => { setActiveTab('leaderboard'); setActiveTest(null); }}
                className={`px-4 py-3 text-sm font-semibold transition-all duration-200 relative border-b-2 ${
                  activeTab === 'leaderboard' 
                    ? 'text-white border-indigo-500' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Global Leaderboard</span>
                </div>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Evaluating Real-Time</span>
            </div>
          </div>

          {/* ACTIVE WORKSPACE OVERLAY / WORKSPACE */}
          {activeTest ? (
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* If AI is active evaluating */}
              {isEvaluating ? (
                <div className="text-center py-16 space-y-5">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-indigo-500/10 rounded-full">
                    <Brain className="w-10 h-10 text-indigo-400 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white">Generating AI Reality Critique</h4>
                    <p className="text-xs text-indigo-400 font-mono animate-pulse">{evaluationProgress}</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Our Gemini grading engine is reviewing your answer's context depth, technical terminology, and regulatory alignment.
                    </p>
                  </div>
                </div>
              ) : evaluationResult ? (
                /* AI SCORECARD RESULT */
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest font-mono">Dossier Evaluation Sheet</span>
                      <h3 className="text-base font-black text-white mt-1">{activeTest.title} Result</h3>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-xl font-mono uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      {evaluationResult.industryLevel} Level Verified
                    </span>
                  </div>

                  {/* Score Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="md:col-span-4 bg-slate-950 border border-slate-900 p-6 rounded-2xl text-center space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Compliance Score</span>
                      <span className="text-4xl font-black text-white block font-mono">{evaluationResult.overallScore}%</span>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide block">Audited Grade</span>
                    </div>

                    <div className="md:col-span-8 space-y-4">
                      {/* Key Strengths */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-1 text-xs">
                        <span className="font-bold text-emerald-400 block flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Key Strengths Verified</span>
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] mt-1">
                          {evaluationResult.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl space-y-1 text-xs">
                        <span className="font-bold text-rose-400 block flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Tactical Gaps & Improvements</span>
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] mt-1">
                          {evaluationResult.improvements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Rubric Details */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-400 block">Performance Matrix Rubrics</span>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {evaluationResult.rubric.map((rub, idx) => (
                        <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-200">{rub.aspect}</span>
                            <span className="text-indigo-400 font-mono">{rub.score}%</span>
                          </div>
                          <p className="text-slate-400 leading-relaxed font-sans">{rub.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recruiter Verdict */}
                  <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-1.5 text-xs">
                    <span className="font-mono text-indigo-400 font-bold uppercase tracking-widest block text-[10px]">Verifying Officer Verdict</span>
                    <p className="text-slate-300 italic leading-relaxed">"{evaluationResult.verdict}"</p>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => {
                      setActiveTest(null);
                      setEvaluationResult(null);
                      showToast("Competency profile records updated!", "success");
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Close Assessment & Return to Skill Tree
                  </button>
                </div>
              ) : (
                /* ACTIVE TEST QUESTION SEQUENCE */
                <div className="space-y-6">
                  {/* Test Header */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                    <div>
                      <span className="text-[10px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-2.5 py-1 rounded-lg font-mono font-bold uppercase tracking-wider block w-max">
                        Active Verification Audit
                      </span>
                      <h3 className="text-base font-black text-white mt-2">{activeTest.title}</h3>
                    </div>
                    {/* Countdown Timer */}
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-xl font-mono text-xs text-rose-400 font-bold">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>
                        {Math.floor(testTimer / 60).toString().padStart(2, '0')}:
                        {(testTimer % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Concept {currentQuestionIndex + 1} of {activeTest.questions.length}</span>
                      <span className="font-mono">{Math.round(((currentQuestionIndex + 1) / activeTest.questions.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / activeTest.questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Active Question Box */}
                  <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-100 leading-relaxed font-sans">
                      {activeTest.questions[currentQuestionIndex].text}
                    </h4>

                    {/* Choice question */}
                    {activeTest.questions[currentQuestionIndex].type === 'multiple-choice' ? (
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        {activeTest.questions[currentQuestionIndex].options?.map((option, oIdx) => {
                          const optionLetter = String.fromCharCode(65 + oIdx);
                          const isSelected = testAnswers[activeTest.questions[currentQuestionIndex].id] === option;
                          return (
                            <button
                              key={option}
                              onClick={() => {
                                setTestAnswers(prev => ({
                                  ...prev,
                                  [activeTest.questions[currentQuestionIndex].id]: option
                                }));
                              }}
                              className={`p-4 rounded-xl border text-left text-xs transition duration-150 flex items-center gap-3 cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-semibold' 
                                  : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-lg font-mono font-bold flex items-center justify-center shrink-0 border ${
                                isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}>
                                {optionLetter}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Text/Scenario question */
                      <div className="space-y-4 pt-2">
                        <textarea
                          rows={6}
                          value={testAnswers[activeTest.questions[currentQuestionIndex].id] || ''}
                          onChange={(e) => {
                            setTestAnswers(prev => ({
                              ...prev,
                              [activeTest.questions[currentQuestionIndex].id]: e.target.value
                            }));
                          }}
                          placeholder="Compose your strategic, real-world execution response here..."
                          className="w-full bg-slate-950 border border-slate-900 hover:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-700 font-mono outline-none transition"
                        ></textarea>

                        {/* Rubric Advice card */}
                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl flex items-start gap-3 text-xs text-slate-300">
                          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white block mb-0.5">Evaluation Rubric Advice:</strong>
                            {activeTest.questions[currentQuestionIndex].rubricHint}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center gap-4 pt-2">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-900 rounded-xl text-xs text-slate-300 font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      Back
                    </button>

                    {currentQuestionIndex < activeTest.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={handleTestSubmit}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-500/10 cursor-pointer"
                      >
                        Submit Answers for Evaluation
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* TAB 1: Dynamic Role Assessment Tasks */}
              {activeTab === 'trees' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Two column grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT PANEL: Task Lists */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Dynamic Assessment Tasks ({skills.length})
                          </h4>
                        </div>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
                          Target Level: {customLevel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {skills.map((skill, index) => {
                          const isSelected = skill.id === selectedSkillId;
                          const isCompleted = skill.score !== null;
                          return (
                            <button
                              key={skill.id}
                              onClick={() => setSelectedSkillId(skill.id)}
                              className={`w-full p-4 rounded-xl border text-left transition relative flex flex-col gap-2.5 cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-500/5 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20' 
                                  : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50'
                              }`}
                            >
                              {isCompleted && (
                                <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                  <span>{skill.score} pts</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                </div>
                              )}
                              
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                                  <span>Task {index + 1}</span>
                                  <span>•</span>
                                  <span>{skill.category.toUpperCase()}</span>
                                </div>
                                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{skill.name}</span>
                                </h5>
                              </div>
                              
                              <p className="text-[11px] text-slate-400 leading-relaxed font-sans pr-16">{skill.description}</p>
                              
                              <div className="flex items-center justify-between text-[10px] mt-1 border-t border-slate-900/50 pt-2 text-slate-500">
                                <span className="font-mono">
                                  Auditing standard: L{skill.level} Expertise
                                </span>
                                {isCompleted ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    ✓ Assessment Complete
                                  </span>
                                ) : (
                                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                                    ● Audit Pending
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT PANEL: Selected Task details */}
                    <div className="lg:col-span-5">
                      {(() => {
                        const selectedSkill = skills.find(s => s.id === selectedSkillId);
                        if (!selectedSkill) return (
                          <div className="bg-slate-900/20 border border-slate-900/50 rounded-2xl p-6 text-center text-slate-500 text-xs">
                            Select an assessment task on the left to review scenario details and launch the audit.
                          </div>
                        );
                        const isCompleted = selectedSkill.score !== null;
                        return (
                          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4 sticky top-24">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                              <div>
                                <span className="text-[9px] text-indigo-400 font-bold font-mono uppercase tracking-widest">Active Scenario</span>
                                <h4 className="text-sm font-bold text-white mt-1">{selectedSkill.name}</h4>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border uppercase bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                                {selectedSkill.category}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed font-sans">
                              {selectedSkill.description}
                            </p>

                            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 space-y-2">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Scope Evaluation Framework:</span>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                This challenge assesses your executive problem-solving capabilities in real-world professional contexts. You will face tailored situation-based questions to measure trade-offs, code clarity, and architectural soundness.
                              </p>
                            </div>

                            {isCompleted && completedTests[selectedSkill.id] && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-1.5 text-xs">
                                <span className="font-bold text-emerald-400 block uppercase tracking-wide text-[10px]">Verified Credentials</span>
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-slate-400">Tested Score:</span>
                                  <span className="font-bold font-mono text-white">{selectedSkill.score} pts</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-slate-400">Certified Grade:</span>
                                  <span className="font-bold text-emerald-400">
                                    {selectedSkill.level === 3 ? 'Expert Grade (L3)' : selectedSkill.level === 2 ? 'Senior Grade (L2)' : 'Beginner Grade (L1)'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-slate-400">Completed:</span>
                                  <span className="text-slate-400 font-mono">{completedTests[selectedSkill.id].completedAt}</span>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => startSkillTest(selectedSkill.id)}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10"
                            >
                              <span>{isCompleted ? 'Re-Audit Competency Scenario' : 'Launch Reality Check Audit'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: Peer Review Center */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  
                  {/* Review Workspace Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Submit peer evaluation form */}
                    <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <h3 className="text-base font-bold text-white">Assess Peer Submissions</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        Giving critical audits is a key trait of senior executives. Review a fellow student's draft response below and rate their industry readiness.
                      </p>

                      <form onSubmit={handlePeerReviewSubmit} className="space-y-4 pt-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1.5 font-semibold">Select Peer Submission to Audit</label>
                          <select
                            value={selectedPeerId}
                            onChange={(e) => {
                              setSelectedPeerId(e.target.value);
                              setPeerRating(0);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- Choose a peer answer to evaluate --</option>
                            {SIMULATED_PEERS_FOR_REVIEW.map(p => (
                              <option key={p.id} value={p.id}>{p.studentName} ({p.skillName})</option>
                            ))}
                          </select>
                        </div>

                        {selectedPeerId && (() => {
                          const peer = SIMULATED_PEERS_FOR_REVIEW.find(p => p.id === selectedPeerId);
                          if (!peer) return null;
                          return (
                            <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-3">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-indigo-400">{peer.studentName} ({peer.targetRole})</span>
                                <span className="text-slate-500 font-mono">{peer.submittedDate}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Scenario Context</span>
                                <span className="text-xs text-slate-300 leading-relaxed font-mono block mt-1">{peer.scenarioPrompt}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Their Written Answer</span>
                                <span className="text-xs text-slate-200 block italic leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-900 mt-1">
                                  "{peer.peerAnswer}"
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {selectedPeerId && (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs text-slate-400 block font-semibold">Reality Score (Stars)</label>
                              <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((stars) => (
                                  <button
                                    key={stars}
                                    type="button"
                                    onClick={() => setPeerRating(stars)}
                                    className="focus:outline-none"
                                  >
                                    <Star className={`w-6 h-6 transition ${stars <= peerRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                                  </button>
                                ))}
                                <span className="text-xs font-semibold text-slate-500 ml-2">
                                  {peerRating === 1 ? 'Extremely superficial / Fail' :
                                   peerRating === 2 ? 'Junior standard' :
                                   peerRating === 3 ? 'Mid-level standard' :
                                   peerRating === 4 ? 'Solid professional' :
                                   peerRating === 5 ? 'Senior expert grade' : 'Select Rating'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs text-slate-400 block font-semibold">Qualitative Audit Critique</label>
                              <textarea
                                rows={4}
                                placeholder="Identify gaps, missing terms, laws or formulas. Give constructive advice on how they can level up."
                                value={peerFeedbackText}
                                onChange={(e) => setPeerFeedbackText(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 font-mono"
                              ></textarea>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-pink-500/10 cursor-pointer"
                            >
                              Submit Peer Audit Report
                            </button>
                          </>
                        )}

                        {peerSuccessMessage && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium text-center">
                            {peerSuccessMessage}
                          </div>
                        )}
                      </form>
                    </div>

                    {/* Received peer reviews */}
                    <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <MessageSquareText className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-base font-bold text-white">Audits Received</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        Read feedback, critiques, and star evaluations from peers and elite industry recruiters who audited your work.
                      </p>

                      <div className="space-y-3 pt-2 max-h-[480px] overflow-y-auto pr-1">
                        {peerReviews.map((review) => (
                          <div key={review.id} className="bg-slate-950 border border-slate-900 p-4 rounded-xl space-y-2.5 hover:border-slate-800 transition">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                              <div>
                                <span className="text-xs font-bold text-white block">{review.reviewerName}</span>
                                <span className="text-[10px] text-slate-500">{review.reviewerRole}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{review.date}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((starIdx) => (
                                <Star key={starIdx} className={`w-3.5 h-3.5 ${starIdx <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-800'}`} />
                              ))}
                              <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-bold ml-1.5 font-mono">
                                {review.skillName}
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 italic leading-relaxed">
                              "{review.textFeedback}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 3: Global Leaderboard */}
              {activeTab === 'leaderboard' && (
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Global Student Leaderboard</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Rankings are strictly based on average performance scores achieved across analytical and leadership test metrics.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-xl font-mono">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Interactive Class</span>
                    </div>
                  </div>

                  <div className="border border-slate-900 rounded-xl overflow-hidden mt-4 bg-slate-950">
                    <div className="grid grid-cols-12 bg-slate-950 border-b border-slate-900 p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                      <div className="col-span-2 text-center">Rank</div>
                      <div className="col-span-5">Candidate Name</div>
                      <div className="col-span-3">Target Industry Domain</div>
                      <div className="col-span-2 text-right">Tested Score</div>
                    </div>

                    <div className="divide-y divide-slate-900/60">
                      {leaderboard.map((entry) => (
                        <div 
                          key={entry.id} 
                          className={`grid grid-cols-12 p-3.5 items-center text-xs transition ${
                            entry.isCurrentUser 
                              ? 'bg-indigo-500/5 text-slate-100 font-semibold border-y border-indigo-500/20' 
                              : 'hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="col-span-2 text-center flex items-center justify-center">
                            {entry.rank === 1 ? (
                              <span className="w-6 h-6 bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold flex items-center justify-center rounded-lg shadow-sm">1</span>
                            ) : entry.rank === 2 ? (
                              <span className="w-6 h-6 bg-slate-300/10 border border-slate-300/30 text-slate-300 font-bold flex items-center justify-center rounded-lg">2</span>
                            ) : entry.rank === 3 ? (
                              <span className="w-6 h-6 bg-amber-600/10 border border-amber-600/30 text-amber-700 font-bold flex items-center justify-center rounded-lg">3</span>
                            ) : (
                              <span className="text-slate-500 font-mono font-medium">{entry.rank}</span>
                            )}
                          </div>
                          
                          <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              entry.isCurrentUser 
                                ? 'bg-indigo-500 text-white' 
                                : entry.rank <= 3 ? 'bg-slate-900 text-indigo-400 border border-slate-800' : 'bg-slate-950 text-slate-400'
                            }`}>
                              {entry.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-slate-200 block truncate">{entry.name}</span>
                              {entry.isCurrentUser && (
                                <span className="text-[10px] text-indigo-400 font-semibold block mt-0.5 font-mono">Active Candidate</span>
                              )}
                            </div>
                          </div>

                          <div className="col-span-3 text-slate-400 truncate pr-2 font-sans">
                            {entry.role}
                          </div>

                          <div className="col-span-2 text-right font-mono font-bold text-slate-100">
                            {entry.score > 0 ? `${entry.score} pts` : 'No score yet'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic motivational banner */}
                  <div className="mt-4 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center gap-3.5 text-xs text-slate-300 leading-relaxed">
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Strive for Senior Grade</span>
                      Submit highly contextual, detailed answers to text scenarios to raise your overall points. Recruiter audits carry a maximum of 100 points per skill.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 4: Voice-Based Interview Simulation */}
          {activeTab === 'interview' && (
            <div className="space-y-6">
              
              {/* Header and Introduction */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Reality Check Simulation</span>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Mic className="w-5 h-5 text-indigo-400" />
                      <span>Stress-Test Interview Simulator</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      Deliver spoken, real-time responses to critical crisis questions customized for the <span className="text-indigo-300 font-semibold">{currentRole.name}</span> benchmark.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-400 self-start md:self-auto shrink-0">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mic Auto-Sensing Active</span>
                  </div>
                </div>
              </div>

              {/* Main Simulation Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Simulator Controls & Mic Capture */}
                <div className="lg:col-span-7 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
                  
                  {/* Recruiter Persona & Active Question */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 relative">
                        <Sparkles className="w-4 h-4 text-indigo-400 absolute -top-1 -right-1" />
                        <span>AI</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Executive Partner</h4>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">Lead Recruiter & Recruiter Panelist</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 min-h-[100px] flex items-center justify-center relative">
                      {isGeneratingQuestion ? (
                        <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                          <span>Drafting situational crisis question...</span>
                        </div>
                      ) : interviewQuestion ? (
                        <p className="text-xs text-slate-200 leading-relaxed font-mono font-medium select-all">
                          "{interviewQuestion}"
                        </p>
                      ) : (
                        <div className="text-center space-y-3 py-4">
                          <p className="text-xs text-slate-500 italic max-w-sm">
                            Click below to begin the stress test. You will face a highly targeted, realistic crisis scenario tailored specifically for your target level.
                          </p>
                          <button
                            onClick={async () => {
                              setIsGeneratingQuestion(true);
                              setInterviewResult(null);
                              setInterviewTranscript("");
                              setInterviewFillerCount(0);
                              try {
                                const res = await fetch("/api/interview/generate-question", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ roleName: currentRole.name })
                                });
                                const data = await res.json();
                                setInterviewQuestion(data.questionText);
                                showToast("Question generated! Microphone ready.", "info");
                              } catch (e) {
                                showToast("Failed to fetch dynamic question. Fallback applied.", "info");
                                setInterviewQuestion("An unexpected regulatory audit reveals a major compliance discrepancy in your team's historical spreadsheets. You have 3 hours to present a remediation plan. What are your immediate actions?");
                              } finally {
                                setIsGeneratingQuestion(false);
                              }
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Begin Stress Test</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Recording State */}
                  {interviewQuestion && !interviewResult && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-400">Response Capture Mode</span>
                        <div className="flex items-center gap-1.5">
                          {isInterviewRecording ? (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                          )}
                          <span className={`font-mono text-[10px] ${isInterviewRecording ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                            {isInterviewRecording ? 'RECORDING SPOKEN RESPONSE' : 'MIC STANDBY'}
                          </span>
                        </div>
                      </div>

                      {/* Waveform / signal feedback */}
                      {isInterviewRecording && (
                        <div className="flex items-center justify-center gap-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900/60">
                          <div className="w-1.5 h-6 bg-indigo-500 rounded animate-[bounce_0.8s_infinite_100ms]"></div>
                          <div className="w-1.5 h-10 bg-indigo-400 rounded animate-[bounce_0.8s_infinite_200ms]"></div>
                          <div className="w-1.5 h-14 bg-purple-500 rounded animate-[bounce_0.8s_infinite_300ms]"></div>
                          <div className="w-1.5 h-8 bg-indigo-500 rounded animate-[bounce_0.8s_infinite_150ms]"></div>
                          <div className="w-1.5 h-12 bg-indigo-400 rounded animate-[bounce_0.8s_infinite_250ms]"></div>
                          <div className="w-1.5 h-4 bg-purple-400 rounded animate-[bounce_0.8s_infinite_50ms]"></div>
                        </div>
                      )}

                      {/* Microphone Toggle Buttons */}
                      <div className="flex items-center justify-center gap-2">
                        {!isInterviewRecording ? (
                          <button
                            onClick={() => {
                              const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                              if (!SpeechRecognitionClass) {
                                showToast("Web Speech API not supported. You can write your answer instead.", "info");
                                setIsInterviewRecording(true);
                                return;
                              }
                              try {
                                const rec = new SpeechRecognitionClass();
                                rec.continuous = true;
                                rec.interimResults = true;
                                rec.lang = 'en-US';
                                rec.onstart = () => {
                                  setIsInterviewRecording(true);
                                  setInterviewTranscript("");
                                  setInterviewFillerCount(0);
                                  showToast("Microphone listening...", "success");
                                };
                                rec.onresult = (event: any) => {
                                  let finalTrans = "";
                                  for (let i = event.resultIndex; i < event.results.length; ++i) {
                                    finalTrans += event.results[i][0].transcript;
                                  }
                                  setInterviewTranscript(finalTrans);
                                  const fillers = (finalTrans.toLowerCase().match(/\b(um|uh|like|so|basically|actually|you\s+know)\b/g) || []).length;
                                  setInterviewFillerCount(fillers);
                                };
                                rec.onerror = () => {
                                  setIsInterviewRecording(false);
                                  showToast("Microphone disconnected. Please type your response.", "info");
                                };
                                rec.onend = () => {
                                  setIsInterviewRecording(false);
                                };
                                setRecognitionInstance(rec);
                                rec.start();
                              } catch (err) {
                                setIsInterviewRecording(false);
                                showToast("Permission denied or mic error.", "info");
                              }
                            }}
                            className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/25 flex items-center gap-2 transition cursor-pointer"
                          >
                            <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
                            <span>Start Speaking</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (recognitionInstance) {
                                recognitionInstance.stop();
                              }
                              setIsInterviewRecording(false);
                              showToast("Microphone muted. Edit transcript below if needed.", "info");
                            }}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-slate-700"
                          >
                            <MicOff className="w-4 h-4 text-slate-400" />
                            <span>Stop Recording</span>
                          </button>
                        )}
                      </div>

                      {/* Transcribed Text Feedback */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Spoken Transcript Output (Editable)</label>
                        <textarea
                          rows={4}
                          value={interviewTranscript}
                          onChange={(e) => {
                            setInterviewTranscript(e.target.value);
                            const fillers = (e.target.value.toLowerCase().match(/\b(um|uh|like|so|basically|actually|you\s+know)\b/g) || []).length;
                            setInterviewFillerCount(fillers);
                          }}
                          placeholder="Your spoken words will appear here in real-time. Feel free to tweak or type manual additions..."
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-700 font-mono focus:outline-none focus:border-indigo-500"
                        ></textarea>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Word Count: {interviewTranscript.split(/\s+/).filter(Boolean).length}</span>
                          <span className={`font-bold ${interviewFillerCount > 3 ? 'text-amber-500' : 'text-slate-500'}`}>
                            Filler Words Caught: {interviewFillerCount} (e.g. um, uh, like)
                          </span>
                        </div>
                      </div>

                      {/* Submit response */}
                      <button
                        onClick={async () => {
                          if (isInterviewRecording && recognitionInstance) {
                            try {
                              recognitionInstance.stop();
                            } catch (e) {}
                            setIsInterviewRecording(false);
                          }
                          if (!interviewTranscript.trim()) {
                            showToast("Please provide an answer before submitting evaluation.", "info");
                            return;
                          }
                          setIsEvaluatingInterview(true);
                          setInterviewResult(null); // Clear previous dossier sheet immediately so loading displays cleanly
                          try {
                            const res = await fetch("/api/interview/evaluate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                roleName: currentRole.name,
                                questionText: interviewQuestion,
                                userTranscript: interviewTranscript,
                                fillerCount: interviewFillerCount,
                                skillLevel: customLevel === 'L1' ? 1 : (customLevel === 'L2' ? 2 : 3)
                              })
                            });
                            const data = await res.json();
                            setInterviewResult(data.result);
                            showToast("Speech assessment complete!", "success");
                          } catch (e) {
                            showToast("Failed to compile speech grades.", "info");
                          } finally {
                            setIsEvaluatingInterview(false);
                          }
                        }}
                        disabled={isEvaluatingInterview}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isEvaluatingInterview ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Analyzing Verbal & Analytical Poise...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Submit spoken response for audit</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* If report is completed, show a button to restart test */}
                  {interviewResult && (
                    <button
                      onClick={() => {
                        setInterviewQuestion("");
                        setInterviewTranscript("");
                        setInterviewFillerCount(0);
                        setInterviewResult(null);
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition border border-slate-700 cursor-pointer mt-auto"
                    >
                      Conduct Another Stress Test
                    </button>
                  )}
                </div>

                {/* Right Side: Results Display Panel */}
                <div className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col justify-center min-h-[400px]">
                  {isEvaluatingInterview ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-indigo-500/10 rounded-full">
                        <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Auditing Verbal Response</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Gemini is grading tactical strategy, delivery confidence, filler pauses, and scenario correctness against industry standards...
                        </p>
                      </div>
                    </div>
                  ) : interviewResult ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-sm font-bold text-white">AI RECRUITER SPEECH REPORT</h4>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          interviewResult.overallScore >= 75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {interviewResult.professionalLevel} Grade
                        </span>
                      </div>

                      {/* Main score metrics row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-center space-y-1">
                          <span className="text-[9px] text-slate-500 font-semibold uppercase block">Correctness Score</span>
                          <span className={`text-2xl font-black block ${
                            interviewResult.overallScore >= 75 ? 'text-emerald-400' : 'text-indigo-400'
                          }`}>
                            {interviewResult.overallScore}%
                          </span>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-center space-y-1">
                          <span className="text-[9px] text-slate-500 font-semibold uppercase block">Delivery Confidence</span>
                          <span className="text-2xl font-black text-amber-400 block">
                            {interviewResult.deliveryConfidence}%
                          </span>
                        </div>
                      </div>

                      {/* Rubrics Critique */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Recruiter Matrix Scores</span>
                        <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
                          {interviewResult.rubric.map((rub: any, idx: number) => (
                            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-xs mb-2">
                              <div className="flex justify-between items-center font-bold text-slate-300 border-b border-slate-900/40 pb-1 mb-1.5">
                                <span className="truncate pr-2">{rub.aspect}</span>
                                <span className="font-mono text-indigo-400">{rub.score}%</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                "{rub.feedback}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strengths & Gaps lists */}
                      <div className="space-y-3">
                        <div className="bg-emerald-500/5 p-3.5 rounded-xl border border-emerald-500/10 text-xs space-y-1.5">
                          <span className="font-bold text-emerald-400 block">✓ Key Verbal Strengths</span>
                          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                            {interviewResult.strengths.map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-rose-500/5 p-3.5 rounded-xl border border-rose-500/10 text-xs space-y-1.5">
                          <span className="font-bold text-rose-400 block">✗ Gaps Identified</span>
                          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                            {interviewResult.gaps ? (
                              interviewResult.gaps.map((g: string, idx: number) => (
                                <li key={idx}>{g}</li>
                              ))
                            ) : (
                              <li>More structured crisis context required.</li>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Sample Response */}
                      {interviewResult.sampleSeniorResponse && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 text-xs space-y-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-widest">Masterclass Recruiter Sample Answer</span>
                          <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-900">
                            "{interviewResult.sampleSeniorResponse}"
                          </p>
                        </div>
                      )}

                      {/* Recruiter Verdict */}
                      <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/15 text-xs text-slate-300 leading-relaxed font-mono">
                        <span className="font-bold text-indigo-400 block mb-1">RECRUITER AUDIT VERDICT:</span>
                        "{interviewResult.verdict}"
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3 text-slate-500">
                      <Mic className="w-8 h-8 text-slate-700 mx-auto animate-pulse" />
                      <p className="text-xs italic max-w-xs mx-auto">
                        Once you submit your spoken crisis response, Gemini's deep audit reports will populate here in real-time.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </section>

        {/* Role Match Analysis & Verification Report Deck (Full Width at the Bottom) */}
        <div id="radar-benchmark-card" className="lg:col-span-12 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Role Match Analysis</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Comparison of your current audited scores against the target benchmark (85%) required for <strong className="text-slate-200">{currentRole.name}</strong>.
                </p>
              </div>
            </div>
            <span className="text-[10px] w-max bg-indigo-500/10 text-indigo-400 font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/20">
              Interactive Radar Matrix
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left side: Radar Chart */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/40 rounded-2xl border border-slate-900 p-5 min-h-[340px]">
              <div className="space-y-1 mb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono block">Visual Benchmark Radar</span>
                <p className="text-[11px] text-slate-400">Targeting at least <strong className="text-emerald-400">85 points</strong> in each core skill.</p>
              </div>

              <div className="w-full h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: '#475569', fontSize: 8 }} 
                    />
                    <Radar 
                      name="My Score" 
                      dataKey="My Score" 
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.25} 
                    />
                    <Radar 
                      name="Target Score" 
                      dataKey="Target Score" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.05} 
                      strokeDasharray="4 4"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#f8fafc'
                      }} 
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right side: Detailed list of required skills & deficit, and action button */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="bg-slate-950/60 rounded-2xl border border-slate-900 p-5 space-y-4 flex-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Competency Audit Breakdown</h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Target: 85%
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {currentRole.requiredSkills.map(req => {
                    const node = skills.find(s => s.id === req.skillId);
                    const myScore = node?.score !== null ? (node?.score || 0) : 0;
                    const targetScore = 85;
                    const isPassed = myScore >= targetScore;
                    const deficit = targetScore - myScore;

                    return (
                      <div key={req.skillId} className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{node?.name || req.skillId}</span>
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900/50">
                              Weight: {Math.round(req.weight * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <span className="capitalize">{node?.category} Aspect</span>
                            <span>•</span>
                            <span>{node?.domain}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Verified Score</span>
                            <span className={`font-mono font-bold text-sm ${isPassed ? 'text-emerald-400' : 'text-indigo-400'}`}>
                              {myScore}% <span className="text-slate-600 font-normal">/ {targetScore}%</span>
                            </span>
                          </div>

                          <div className="min-w-[85px] text-right">
                            {isPassed ? (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                MATCHED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                                -{deficit}% GAP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button Segment */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-indigo-500/5 p-4 border border-indigo-500/10 rounded-2xl">
                <div className="text-xs text-slate-400 space-y-0.5 flex-1 text-center sm:text-left">
                  <p className="font-bold text-slate-200">Want to export your professional dossier?</p>
                  <p className="text-[11px] text-slate-500">Generate a signed credentials report reflecting all your audited grades and peer approvals.</p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/20 whitespace-nowrap"
                >
                  <Award className="w-4 h-4 text-white animate-pulse" />
                  <span>Generate Industry Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Industry Profile Report Modal Overlay */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Certified Industry Profile</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-lg font-bold w-8 h-8 rounded-lg hover:bg-slate-900 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-950 text-slate-100">
              {/* Dossier Sheet Layout (Paper look-alike inside dark UI) */}
              <div className="bg-white text-slate-800 rounded-xl p-6 md:p-8 shadow-xl border border-slate-200 space-y-6 font-sans relative overflow-hidden">
                {/* Decorative Side Stamp */}
                <div className="absolute -top-3 -right-3 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute top-6 right-6 border-2 border-dashed border-indigo-500/30 rounded-xl p-2 rotate-12 flex items-center justify-center pointer-events-none opacity-30">
                  <span className="text-[10px] text-indigo-600 font-extrabold tracking-widest uppercase">VERIFIED DOSSIER</span>
                </div>

                {/* Dossier Header */}
                <div className="border-b-4 border-slate-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase">Skill Reality Check</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">OFFICIAL COMPETENCY RECORD</p>
                  </div>
                  <div className="text-left md:text-right text-xs">
                    <div className="font-semibold text-slate-700">ID: {currentUser?.email || authEmail}</div>
                    <div className="text-slate-500">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>

                {/* Candidate Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benchmark Assessment Profile</span>
                    <h5 className="text-lg font-extrabold text-slate-900">{currentRole.name}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      This certificate verifies actual written execution and compliance capabilities tested against rigorous executive standards.
                    </p>
                  </div>
                  
                  <div className="md:col-span-4 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Verified Readiness</span>
                    <span className={`text-3xl font-black block mt-1 ${
                      currentReadiness >= 75 ? 'text-emerald-600' : currentReadiness >= 45 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {currentReadiness}%
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">
                      {currentReadiness >= 75 ? 'Senior Tier' : currentReadiness >= 45 ? 'Mid-Level Tier' : 'Junior Tier'}
                    </span>
                  </div>
                </div>

                {/* Skill Ratings Table */}
                <div className="space-y-3">
                  <h6 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    Verified Competency Matrices
                  </h6>
                  <div className="space-y-2">
                    {currentRole.requiredSkills.map(req => {
                      const node = skills.find(s => s.id === req.skillId);
                      const isTested = node?.score !== null;
                      return (
                        <div key={req.skillId} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                          <div className="min-w-0 pr-3">
                            <span className="font-bold text-slate-800 block truncate">{node?.name || req.skillId}</span>
                            <span className="text-[9px] text-slate-500 block truncate">{node?.domain}</span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 font-mono text-right">
                            <span className="text-[9px] text-slate-400">Weight: {Math.round(req.weight * 100)}%</span>
                            <span className={`font-bold ${isTested ? 'text-indigo-600' : 'text-slate-400 italic'}`}>
                              {isTested ? `${node?.score}%` : 'Untested'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Achievement Credentials / Badges */}
                <div className="space-y-3">
                  <h6 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    Unlocked Credentials
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {badges.filter(b => b.unlocked).length > 0 ? (
                      badges.filter(b => b.unlocked).map(badge => (
                        <div key={badge.id} className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 flex items-start gap-2.5">
                          <div className="p-1 rounded bg-teal-100 text-teal-600 mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{badge.name}</span>
                            <span className="text-[9px] text-slate-500 line-clamp-1">{badge.description}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic col-span-2">No achievement credentials unlocked yet.</span>
                    )}
                  </div>
                </div>

                {/* Audits & Feedback Received */}
                <div className="space-y-3">
                  <h6 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    Peer Audits & Verifications
                  </h6>
                  <div className="space-y-2">
                    {peerReviews.filter(r => r.reviewerName !== 'You (Student)').slice(0, 1).map(review => (
                      <div key={review.id} className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between font-bold text-slate-700 text-[9px] mb-1">
                          <span>{review.reviewerName} ({review.reviewerRole})</span>
                          <span className="text-amber-500">{'★'.repeat(review.rating)}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic leading-relaxed">
                          "{review.textFeedback}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row gap-2 justify-between items-center">
              <span className="text-[10px] text-slate-500 italic">
                A4 Printable Passport File Format
              </span>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    generatePDFReport({
                      userEmail: currentUser?.email || authEmail,
                      targetRole: currentRole,
                      skills,
                      readinessScore: currentReadiness,
                      badges,
                      peerReviews
                    });
                    showToast("Downloading your competency dossier...", "success");
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Download Verified PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aesthetic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-6 px-6 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 Skill Reality Check. Built for Students Facing Competitive Industry Criteria.</p>
        <p className="mt-1 text-[10px] text-slate-600">Deep Learning Recruiter Audits are powered by the Gemini 3.5 Flash Model.</p>
      </footer>
    </div>
  );
}
