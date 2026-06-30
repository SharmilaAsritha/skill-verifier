import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const key = process.env.GEMINI_API_KEY;
  // Check if key exists and is not the placeholder
  if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Successfully initialized GoogleGenAI client with key.");
      return aiClient;
    } catch (err) {
      console.error("Error initializing GoogleGenAI client:", err);
    }
  }
  return null;
}

// REST API for AI Evaluation of skill test responses
app.post("/api/evaluate-ai", async (req, res) => {
  const { skillName, domain, questionText, userAnswer, skillLevel } = req.body;

  const currentLevel = Number(skillLevel) || 1;

  if (!skillName || !questionText || !userAnswer) {
    return res.status(400).json({ error: "Missing required evaluation fields." });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      console.log(`Evaluating answer for Skill: ${skillName} at Level: ${currentLevel} using Gemini.`);
      
      let levelLabel = "Beginner (L1)";
      let directives = "";

      if (currentLevel === 1) {
        levelLabel = "Beginner (L1)";
        directives = `
1. Candidates are evaluated strictly as BEGINNERS. Assess whether they grasp the fundamental core concepts, main ideas, or raw principles.
2. DO NOT penalize them for lacking advanced industry experience, technical depth, or enterprise-level strategic execution.
3. Be highly encouraging and generous. If they answer the questions correctly and clearly with correct basic concepts, they should easily achieve an overall score of 80+.
4. **CRITICAL**: Ignore any punctuation, grammar, or spelling errors in the student's typed answers. Focus strictly on whether they understood the key conceptual points, and award full points if they show correct core understanding. Do not penalize typo/grammar mistakes at all.`;
      } else if (currentLevel === 2) {
        levelLabel = "Mid-Level (L2)";
        directives = `
1. Candidates are evaluated as Mid-Level professionals. Evaluate based on solid implementation principles, clear logic, and functional technical/soft skill structure.
2. Be fair and constructive. Award 80+ if they demonstrate clean workflow application and clear strategic understanding.
3. **CRITICAL**: Ignore any punctuation, grammar, or spelling errors in the student's typed answers. Focus strictly on whether they understood the key conceptual points, and award full points if they show correct core understanding. Do not penalize typo/grammar mistakes at all.`;
      } else {
        levelLabel = "Advanced (L3)";
        directives = `
1. Candidates are evaluated as Advanced/Senior professionals. Be strict and require deep strategic insights, tactical nuances, risk management, or clear technical/strategic excellence for an 80+ score.
2. Evaluate based on senior industry standards.
3. **CRITICAL**: Ignore any punctuation, grammar, or spelling errors in the student's typed answers. Focus strictly on whether they understood the key conceptual points, and award full points if they show correct core understanding. Do not penalize typo/grammar mistakes at all.`;
      }

      const systemInstruction = `You are an elite Industry Recruiter & Principal Skill Evaluator. 
Your goal is to evaluate student test answers for the target level: ${levelLabel}.

CRITICAL GRADING DIRECTIVES FOR ${levelLabel}:
${directives}

Provide an overall readiness score (percentage readiness for the target industry benchmark at the ${levelLabel} level).`;

      const prompt = `
Skill Area: ${skillName} (Domain: ${domain})
Target Difficulty Level: ${levelLabel}
Test Question: ${questionText}
Candidate's Written Answer: "${userAnswer}"

Please evaluate this answer and return the result strictly structured as requested.
Assess across 3 rubrics specific to this skill. For example:
- For Negotiation: Strategy, Tone/Empathy, Value-Creation.
- For Excel: Accuracy, Structural Design, Automation logic.
- For HR: Labor Law understanding, Employee Retention, Strategic alignment.
- For Leadership: Team Motivation, Problem Resolution, Communication clarity.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { 
                type: Type.INTEGER,
                description: "The grade on a 0-100 scale representing the technical/soft skill quality relative to the target level."
              },
              industryLevel: { 
                type: Type.STRING, 
                description: "The estimated professional level matching this attempt: 'Junior', 'Mid-Level', or 'Senior'."
              },
              readinessPercentage: { 
                type: Type.INTEGER,
                description: "Estimated percentage of industry readiness relative to this specific skill tier (0-100)."
              },
              rubric: {
                type: Type.ARRAY,
                description: "Detailed evaluation breakdown of 3 rubrics relevant to this specific skill.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    aspect: { type: Type.STRING, description: "Aspect evaluated (e.g., Tactical execution, Tone/Empathy, Policy Accuracy)." },
                    score: { type: Type.INTEGER, description: "Score out of 100." },
                    feedback: { type: Type.STRING, description: "Honest, descriptive, encouraging feedback on how to level up." }
                  },
                  required: ["aspect", "score", "feedback"]
                }
              },
              strengths: {
                type: Type.ARRAY,
                description: "2 key strengths identified in their answer.",
                items: { type: Type.STRING }
              },
              improvements: {
                type: Type.ARRAY,
                description: "2 concrete, actionable ways to improve this answer.",
                items: { type: Type.STRING }
              },
              verdict: { 
                type: Type.STRING, 
                description: "A summary review of the candidate's capability at this level (1-2 sentences)." 
              }
            },
            required: ["overallScore", "industryLevel", "readinessPercentage", "rubric", "strengths", "improvements", "verdict"]
          }
        }
      });

      if (response && response.text) {
        const jsonResult = JSON.parse(response.text.trim());
        return res.json({ result: jsonResult, isMock: false });
      } else {
        throw new Error("Empty response from Gemini model.");
      }
    } catch (err) {
      console.error("Gemini call failed, falling back to mock evaluator:", err);
      // Fallback is defined below
    }
  }

  // Graceful rule-based evaluator fallback if key is missing or call fails
  console.log("Using standard deterministic mock evaluator fallback.");
  
  // Custom grading depending on answer length, vocabulary, and selected skill level
  const ansLower = userAnswer.toLowerCase();
  const wordCount = userAnswer.trim().split(/\s+/).length;
  
  let score = 40;
  let level: 'Junior' | 'Mid-Level' | 'Senior' = 'Junior';
  let readiness = 35;
  let strengths: string[] = ["Expressed a prompt baseline perspective", "Demonstrated initial interest"];
  let improvements: string[] = ["Incorporate quantitative frameworks and industry terms", "Address potential trade-offs and secondary impacts"];

  if (currentLevel === 1) {
    // Beginner level - very lenient
    level = 'Junior';
    if (wordCount > 60) {
      score = 88;
      readiness = 90;
      strengths = [
        "Clearly explained the basic core concepts with solid understanding",
        "Constructed a structured multi-sentence description showing great effort"
      ];
      improvements = [
        "Try referencing slightly more field-specific terms as you build experience",
        "Consider outlining step-by-step contingency actions"
      ];
    } else if (wordCount > 15) {
      score = 82;
      readiness = 84;
      strengths = [
        "Stated the fundamental stance with excellent clarity",
        "Demonstrated appropriate tone for a junior team member"
      ];
      improvements = [
        "Add one or two more sentences to explain your logical reasoning",
        "Try using industry frameworks in future tasks"
      ];
    } else {
      score = 75;
      readiness = 78;
      strengths = ["Responded promptly to the scenario with the basic answer"];
      improvements = [
        "Elaborate slightly more to describe your core ideas",
        "Write at least 2 full sentences to expand your thoughts"
      ];
    }
  } else if (currentLevel === 2) {
    // Mid-level - moderate
    if (wordCount > 60) {
      score = 78;
      level = 'Mid-Level';
      readiness = 80;
      strengths = [
        "Provided a structured, multi-step process representing reliable implementation",
        "Demonstrated sound logical arguments and professional tact"
      ];
      improvements = [
        "Provide concrete metrics or reference industry standards (e.g. specific laws, Excel pivot practices)",
        "Proactively manage risks and communicate trade-offs to senior leadership"
      ];
    } else if (wordCount > 30) {
      score = 68;
      level = 'Junior';
      readiness = 70;
      strengths = [
        "Stated a clear stance on the core challenge",
        "Easy-to-read, standard communication style"
      ];
      improvements = [
        "Deepen your response by outlining a step-by-step strategy",
        "Expand on technical variables (e.g., formulas, policy standards, negotiation hooks)"
      ];
    } else {
      score = 55;
      level = 'Junior';
      readiness = 58;
      strengths = ["Responded promptly with a basic perspective"];
      improvements = [
        "Elaborate on the scenario with real-world examples",
        "Write at least 3 sentences to explain your reasoning"
      ];
    }
  } else {
    // Advanced/Senior level - strict
    if (wordCount > 60) {
      score = 68;
      level = 'Mid-Level';
      readiness = 62;
      strengths = [
        "Provided a structured process representing reliable implementation",
        "Demonstrated sound logical arguments and professional tact"
      ];
      improvements = [
        "Provide concrete metrics or reference industry standards (e.g. specific laws, Excel pivot practices)",
        "Proactively manage risks and communicate trade-offs to senior leadership"
      ];
    } else if (wordCount > 30) {
      score = 52;
      level = 'Junior';
      readiness = 46;
      strengths = [
        "Stated a clear stance on the core challenge",
        "Easy-to-read, standard communication style"
      ];
      improvements = [
        "Deepen your response by outlining a step-by-step strategy",
        "Expand on technical variables (e.g., formulas, policy standards, negotiation hooks)"
      ];
    } else {
      score = 35;
      level = 'Junior';
      readiness = 28;
      strengths = ["Responded promptly to the scenario"];
      improvements = [
        "Elaborate on the scenario with real-world examples",
        "Write at least 3 sentences to explain your reasoning"
      ];
    }
  }

  // Adjust score based on certain high-value words
  const keyBuzzwords = ["leverage", "prioritize", "compliance", "standard", "documentation", "negotiate", "collaboration", "audit", "index", "lookup", "stakeholder"];
  let matchedCount = 0;
  keyBuzzwords.forEach(word => {
    if (ansLower.includes(word)) matchedCount++;
  });
  score += Math.min(matchedCount * 3, 12);
  readiness = Math.round(score * 0.95 + matchedCount * 1.5);

  const mockResult = {
    overallScore: Math.min(score, 100),
    industryLevel: level,
    readinessPercentage: Math.min(readiness, 100),
    rubric: [
      {
        aspect: "Tactical Execution & Method",
        score: Math.min(score + 2, 100),
        feedback: wordCount > 30 
          ? "Great attempt. To elevate even further, add precise techniques rather than broad principles." 
          : "Elaborate slightly more on step-by-step actions for greater impact."
      },
      {
        aspect: "Industry Terminology & Context",
        score: Math.min(score - 2 + (matchedCount * 3), 100),
        feedback: matchedCount > 1 
          ? "Successfully used professional concepts to articulate your response." 
          : "Consider adding a few more field-specific terms to reinforce your expertise."
      },
      {
        aspect: "Risk Management & Communication Tone",
        score: Math.min(score - 1, 100),
        feedback: score > 75 
          ? "Demonstrated encouraging alignment and wonderful soft skills." 
          : "Good baseline response. In future iterations, add more surrounding details."
      }
    ],
    strengths,
    improvements,
    verdict: currentLevel === 1 
      ? `Fantastic effort! You achieved an overall score of ${Math.min(score, 100)} at the Beginner level. Your response successfully covers the core principles.`
      : `You evaluated at a ${level} level. Your response shows a reasonable baseline. For higher tiers, add more structural detail to reach advanced status.`
  };

  return res.json({ result: mockResult, isMock: true });
});

// INTERVIEW SIMULATION ENDPOINTS
app.post("/api/interview/generate-question", async (req, res) => {
  const { roleName } = req.body;
  if (!roleName) {
    return res.status(400).json({ error: "Missing required roleName parameter." });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      console.log(`Generating interview question for role: ${roleName} using Gemini.`);
      const systemInstruction = `You are a tough, world-class Lead recruiter from a highly competitive Fortune 100 enterprise. You conduct stress-test interviews where you push candidates to their logical limits.`;
      const prompt = `Generate a single, tough, situational "stress test" interview scenario or question for a candidate applying for the role of "${roleName}".
The question must force them to solve a complex crisis, deal with an ethics problem, manage critical risk, or handle severe operational resource constraint.
Keep the output short, direct, and conversational—strictly one or two sentence question. Do not include introductory text, numbers, or greeting. Ask them directly.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { systemInstruction },
      });

      if (response && response.text) {
        return res.json({ questionText: response.text.trim(), isMock: false });
      }
    } catch (err) {
      console.error("Gemini failed to generate interview question:", err);
    }
  }

  // Fallbacks
  const lowerRole = roleName.toLowerCase();
  let questionText = "An unexpected regulatory audit reveals a major compliance discrepancy in your team's historical spreadsheets. You have 3 hours to present a remediation plan. What are your immediate actions?";

  if (lowerRole.includes("credit") || lowerRole.includes("finance") || lowerRole.includes("analyst")) {
    questionText = "An enterprise client with a history of late payments is requesting a $10M extension on an unsecured loan facility, but their cash reserves are down by 35%. Our risk policies strictly prohibit it, but losing them hurts our annual targets. How do you handle this request?";
  } else if (lowerRole.includes("negotiation") || lowerRole.includes("legal") || lowerRole.includes("specialist")) {
    questionText = "A critical sole-source vendor has unilaterally announced a 15% price increase, citing supply-chain pressure, and threatens to halt shipments if we do not sign their updated contract in 24 hours. What is your exact response plan?";
  } else if (lowerRole.includes("executive") || lowerRole.includes("manager") || lowerRole.includes("director")) {
    questionText = "Your two highest-performing team leads have entered a toxic personal dispute, threatening to resign and take their entire departments with them if the other is not demoted. How do you defuse this without losing either leader?";
  } else if (lowerRole.includes("analyst") || lowerRole.includes("excel") || lowerRole.includes("audit")) {
    questionText = "You discover that a major statistical report sent to the CEO yesterday contains a broken index formula that skewed key projections. The Board meeting is in one hour. How do you manage this crisis?";
  }

  return res.json({ questionText, isMock: true });
});

app.post("/api/interview/evaluate", async (req, res) => {
  const { roleName, questionText, userTranscript, fillerCount, skillLevel } = req.body;

  const currentLevel = Number(skillLevel) || 1;

  if (!roleName || !questionText) {
    return res.status(400).json({ error: "Missing required evaluation fields." });
  }

  const cleanTranscript = (userTranscript || "").trim();
  const wordCount = cleanTranscript.split(/\s+/).filter(Boolean).length;

  const ai = getGeminiClient();

  if (ai && cleanTranscript.length > 5) {
    try {
      console.log(`Evaluating spoken interview response for ${roleName} at Level ${currentLevel} using Gemini.`);
      
      let levelLabel = "Beginner (L1)";
      let directives = "";

      if (currentLevel === 1) {
        levelLabel = "Beginner (L1)";
        directives = `
1. Candidates are evaluated strictly as BEGINNERS. Assess whether they grasp the fundamental core concepts or basic solutions to the crisis.
2. DO NOT penalize them for lacking advanced senior-level experience, complex corporate jargon, or heavy strategic planning.
3. Be highly encouraging and generous. Award 80+ if they give a straightforward, honest, and sensible approach to the situation.
4. **CRITICAL**: Spoken answers are transcribed live and might have slight typos. Absolutely ignore any spelling, punctuation, grammar, or minor pronunciation errors in the transcript. Focus strictly on their raw intent and conceptual understanding.`;
      } else if (currentLevel === 2) {
        levelLabel = "Mid-Level (L2)";
        directives = `
1. Candidates are evaluated as Mid-Level professionals. Evaluate based on clear logical progression, functional workflow steps, and realistic coordination.
2. Be fair and encouraging. Award 80+ if they demonstrate structured thinking and reasonable risk resolution.
3. **CRITICAL**: Spoken answers are transcribed live and might have slight typos. Absolutely ignore any spelling, punctuation, or grammar errors in the transcript. Focus on their raw intent and conceptual understanding.`;
      } else {
        levelLabel = "Advanced (L3)";
        directives = `
1. Candidates are evaluated as Advanced/Senior professionals. Be strict and require high-level corporate frameworks, STAR format, crisis containment protocols, and risk mitigation strategies.
2. **CRITICAL**: Spoken answers are transcribed live and might have slight typos. Absolutely ignore any spelling, punctuation, or grammar errors in the transcript. Focus on their raw intent and conceptual understanding.`;
      }

      const systemInstruction = `You are an elite, highly selective Executive Recruiter & Stress-Test Interviewer.
Your goal is to evaluate candidate responses for a ${levelLabel} role.

CRITICAL EVALUATION DIRECTIVES FOR ${levelLabel}:
${directives}

Provide constructive, honest feedback on content correctness, structured thinking (like STAR method), risk handling, and verbal delivery.`;

      const prompt = `
Role: ${roleName}
Target Difficulty Level: ${levelLabel}
Stress-Test Question: "${questionText}"
Candidate's Spoken Answer Transcript: "${cleanTranscript}"
Filler Words Detected: ${fillerCount || 0}

Please evaluate the answer and return a JSON object with the requested properties.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.INTEGER, description: "Grade from 0-100 reflecting quality relative to the target level." },
              professionalLevel: { type: Type.STRING, description: "Estimated candidate level matching this attempt: 'Junior', 'Mid-Level', or 'Senior'." },
              deliveryConfidence: { type: Type.INTEGER, description: "Delivery confidence score out of 100, slightly penalized by high filler words." },
              rubric: {
                type: Type.ARRAY,
                description: "Evaluation of 3 relevant rubrics (e.g., Crisis Management, Professional Delivery, Strategic Correctness)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    aspect: { type: Type.STRING },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["aspect", "score", "feedback"]
                }
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 key strengths of their response." },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2 critical gaps or ways they can improve." },
              sampleSeniorResponse: { type: Type.STRING, description: "A masterfully worded, bulletproof senior-level response to this exact question." },
              verdict: { type: Type.STRING, description: "A final encouraging reality-check verdict (1-2 sentences)." }
            },
            required: ["overallScore", "professionalLevel", "deliveryConfidence", "rubric", "strengths", "gaps", "sampleSeniorResponse", "verdict"]
          }
        }
      });

      if (response && response.text) {
        const resultJson = JSON.parse(response.text.trim());
        return res.json({ result: resultJson, isMock: false });
      }
    } catch (err) {
      console.error("Gemini interview evaluation failed, falling back to mock evaluator:", err);
    }
  }

  // Standard high-quality mock evaluator fallback
  let score = 50;
  let level: 'Junior' | 'Mid-Level' | 'Senior' = 'Junior';
  let deliveryConfidence = Math.max(100 - (fillerCount || 0) * 10, 40);
  let strengths = ["Demonstrated composure in a high-pressure situation", "Offered a clear immediate first step"];
  let gaps = ["Lacks references to official compliance or audit frameworks", "Needs a structured STAR response format to build authority"];
  let sampleSeniorResponse = "Under stressful conditions, my immediate step is containment: I would secure all relevant source files and audit logs to verify the scope of the discrepancy. I would then schedule an emergency sync with the compliance lead to formulate a two-pronged remediation strategy—fixing the direct data anomaly while creating a secondary review circuit to guarantee error prevention moving forward, followed by transparently presenting this to the Board.";

  if (wordCount === 0) {
    score = 0;
    level = 'Junior';
    deliveryConfidence = 0;
    strengths = ["No speech was transcribed."];
    gaps = ["Please check your microphone and speak clearly into the device."];
  } else if (currentLevel === 1) {
    // Beginner level fallback - very generous
    level = 'Junior';
    deliveryConfidence = Math.max(100 - (fillerCount || 0) * 6, 60);
    if (wordCount > 50) {
      score = 88;
      strengths = ["Outstanding elaboration for a beginner level candidate", "Addressed the primary concern with great empathy"];
      gaps = ["Keep practicing to reduce natural verbal filler pauses", "Try adding a timeline to your implementation plan"];
    } else if (wordCount > 15) {
      score = 82;
      strengths = ["Gave a highly structured and straightforward first action", "Maintained an appropriate, respectful professional tone"];
      gaps = ["Elaborate slightly more to provide surrounding details", "Describe who on the team you would notify first"];
    } else {
      score = 75;
      strengths = ["Offered a sensible quick response to the situation"];
      gaps = ["Expand your thoughts into at least 2 full sentences to demonstrate complete mastery"];
    }
  } else if (currentLevel === 2) {
    // Mid-level fallback
    deliveryConfidence = Math.max(100 - (fillerCount || 0) * 10, 40);
    if (wordCount > 50) {
      score = 76;
      level = 'Mid-Level';
      strengths = ["Excellent verbal elaboration and scenario reasoning", "Identified key stakeholders to align with immediately"];
      gaps = ["Provide a more definitive execution path rather than general planning", "Ensure your speech has fewer filler pauses like 'um' or 'uh'"];
    } else if (wordCount > 20) {
      score = 64;
      level = 'Junior';
      strengths = ["Offered a good logical first step"];
      gaps = ["Elaborate on the scenario with real-world examples", "Deepen your response by outlining a step-by-step strategy"];
    } else {
      score = 55;
      level = 'Junior';
    }
  } else {
    // Advanced fallback
    deliveryConfidence = Math.max(100 - (fillerCount || 0) * 12, 30);
    if (wordCount > 50) {
      score = 68;
      level = 'Mid-Level';
    } else if (wordCount > 20) {
      score = 52;
      level = 'Junior';
    } else {
      score = 35;
      level = 'Junior';
    }
  }

  const mockResult = {
    overallScore: score,
    professionalLevel: level,
    deliveryConfidence,
    rubric: [
      {
        aspect: "Tactical Response Structure",
        score: Math.min(score + 5, 100),
        feedback: wordCount > 20 ? "Your response shows a solid logical progression of steps." : "Your answer is too short to fully address the dimensions of the crisis. Elongate your solution."
      },
      {
        aspect: "Verbal Delivery & Poise",
        score: deliveryConfidence,
        feedback: (fillerCount || 0) > 3 ? "Frequent verbal filters detected. Practice slowing down your speaking tempo to project confidence." : "Excellent spoken execution. Clear pronunciation and stable tempo."
      },
      {
        aspect: "Strategic Risk Handling",
        score: Math.min(score + 2, 100),
        feedback: currentLevel === 1 
          ? "Wonderful attempt. You successfully prioritized immediate risk management."
          : "To operate at a Senior level, prioritize containment first, then compliance, and lastly transparent escalation."
      }
    ],
    strengths,
    gaps,
    sampleSeniorResponse,
    verdict: wordCount > 0 
      ? (currentLevel === 1 
          ? `Great job! You achieved a score of ${score} at the Beginner level. Your response successfully covered the core concepts.`
          : `You evaluated at a ${level} level. Your response is structured but would benefit from advanced tactical terminology and reduced verbal fillers.`)
      : "No voice input detected. Please tap the microphone button and deliver your response aloud."
  };

  return res.json({ result: mockResult, isMock: true });
});

// Start server function
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
