import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export interface SearchCriteria {
  projectType: "college" | "industry";
  roleCategory: string;
  minYearsOfExperience: string;
  workMode: "remote" | "in-person";
  city: string;
  collegeName: string;
  desiredSkills: string[];
  desiredInterests: string[];
  ranking: {
    skillsMatch: "High" | "Medium" | "Low";
    availabilityMatch: "High" | "Medium" | "Low";
    experienceFit: "High" | "Medium" | "Low";
    sharedInterests: "High" | "Medium" | "Low";
  };
}

export interface MatchScore {
  overall: number; // 0 - 100
  breakdown: {
    skills: number;
    availability: number;
    experience: number;
    interests: number;
  };
  matchedSkills: string[];
  matchedInterests: string[];
  skillsReasoning?: string;
  isAiScored?: boolean;
}

const IMPORTANCE_WEIGHTS: Record<"High" | "Medium" | "Low", number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

/**
 * Common technology and skill domain synonyms for robust semantic fallback.
 */
const SKILL_RELATIONS: Record<string, string[]> = {
  react: ["reactjs", "frontend", "frontend development", "ui", "javascript", "typescript", "web development", "nextjs"],
  typescript: ["javascript", "frontend", "backend", "fullstack", "node", "nodejs"],
  python: ["django", "flask", "fastapi", "data science", "machine learning", "ai", "pandas", "numpy"],
  "machine learning": ["ml", "ml engineer", "ai", "deep learning", "pytorch", "tensorflow", "data science", "scikit-learn"],
  "frontend development": ["frontend", "react", "vue", "angular", "html", "css", "javascript", "ui", "ui/ux"],
  "backend development": ["backend", "node", "nodejs", "express", "go", "golang", "python", "sql", "api", "databases"],
  figma: ["ui", "ux", "ui/ux", "prototyping", "product design", "design systems", "wireframing"],
  sql: ["postgresql", "postgres", "mysql", "databases", "relational databases", "sqlite"],
  aws: ["cloud", "devops", "docker", "kubernetes", "infra", "infrastructure", "terraform"],
};

/**
 * Evaluates semantic overlap using heuristics as a reliable fallback when API is unreachable.
 */
function scoreSkillsFallback(
  candidateSkills: string[],
  desiredSkills: string[],
): { score: number; reasoning: string; matchedSkills: string[] } {
  const normCandidate = candidateSkills.map((s) => s.trim().toLowerCase());
  const normDesired = desiredSkills.map((s) => s.trim().toLowerCase());

  if (normDesired.length === 0) {
    const score = Math.min(100, (candidateSkills.length || 0) * 25) || 75;
    return {
      score,
      reasoning: "No specific skills required; candidate has a general skill set.",
      matchedSkills: candidateSkills,
    };
  }

  const matchedSkills: string[] = [];
  let totalScoreUnits = 0;

  for (const desired of normDesired) {
    const directMatch = normCandidate.find(
      (cs) => cs === desired || cs.includes(desired) || desired.includes(cs),
    );

    if (directMatch) {
      totalScoreUnits += 1.0;
      const original = candidateSkills.find(
        (s) => s.trim().toLowerCase() === directMatch,
      );
      if (original && !matchedSkills.includes(original)) matchedSkills.push(original);
      continue;
    }

    // Semantic / synonym check
    const relations = SKILL_RELATIONS[desired] || [];
    const relatedMatch = normCandidate.find((cs) =>
      relations.some((rel) => cs.includes(rel) || rel.includes(cs)),
    );

    if (relatedMatch) {
      totalScoreUnits += 0.7; // Partial credit for related skill
      const original = candidateSkills.find(
        (s) => s.trim().toLowerCase() === relatedMatch,
      );
      if (original && !matchedSkills.includes(original)) matchedSkills.push(original);
    }
  }

  const rawScore = Math.min(100, Math.round((totalScoreUnits / normDesired.length) * 100));
  const score = Math.max(0, rawScore);

  let reasoning = `${matchedSkills.length} of ${desiredSkills.length} skills matched or closely related.`;
  if (score >= 90) {
    reasoning = "Strong direct match with required skill set.";
  } else if (score >= 60) {
    reasoning = "Moderate overlap with relevant transferrable skills.";
  } else if (score > 0) {
    reasoning = "Limited overlap with requested technologies.";
  } else {
    reasoning = "No direct or related skill matches found.";
  }

  return { score, reasoning, matchedSkills };
}

/**
 * Calls Anthropic API (model: claude-sonnet-4-6) to semantically score candidate skills.
 * Falls back to local semantic heuristic if API is unavailable.
 */
export async function scoreSkillsSemantic(
  candidateSkills: string[],
  desiredSkills: string[],
): Promise<{ score: number; reasoning: string; isAiScored: boolean; matchedSkills: string[] }> {
  // If no desired skills are specified, evaluate baseline
  if (!desiredSkills || desiredSkills.length === 0) {
    const fallback = scoreSkillsFallback(candidateSkills, desiredSkills);
    return { ...fallback, isAiScored: false };
  }

  const apiKey =
    (typeof import.meta !== "undefined" && import.meta.env?.["VITE_ANTHROPIC_API_KEY"]) ||
    (typeof process !== "undefined" && process.env?.["ANTHROPIC_API_KEY"]) ||
    "";

  if (apiKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: `Compare the following candidate skills against the desired skills for a project team match.
Desired skills: ${desiredSkills.join(", ")}
Candidate skills: ${candidateSkills.join(", ")}

Evaluate the semantic overlap and relevance between the candidate's skills and the desired skills.
- Related skills (e.g. "React" and "Frontend Development", "PostgreSQL" and "SQL", "PyTorch" and "Machine Learning") should receive sensible partial or high credit.
- Completely unrelated skills should receive low score.
- Exact and strong matches should receive high score (80-100).

Respond with ONLY a valid JSON object in this exact format, with no markdown formatting or other text:
{"score": <number 0-100>, "reasoning": "<one short sentence>"}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.content?.[0]?.text?.trim() || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.score === "number" && typeof parsed.reasoning === "string") {
            const matchedSkills = candidateSkills.filter((cs) =>
              desiredSkills.some(
                (ds) =>
                  cs.toLowerCase().includes(ds.toLowerCase()) ||
                  ds.toLowerCase().includes(cs.toLowerCase()),
              ),
            );
            return {
              score: Math.min(100, Math.max(0, Math.round(parsed.score))),
              reasoning: parsed.reasoning.trim(),
              isAiScored: true,
              matchedSkills: matchedSkills.length > 0 ? matchedSkills : candidateSkills.slice(0, 2),
            };
          }
        }
      }
    } catch (apiError) {
      console.warn("[matching] Claude API call failed, using semantic fallback:", apiError);
    }
  }

  // Graceful fallback
  const fallback = scoreSkillsFallback(candidateSkills, desiredSkills);
  return { ...fallback, isAiScored: false };
}

/**
 * Synchronous candidate scoring (used for instant initial render or sync evaluations).
 */
export function scoreCandidate(
  candidate: Profile,
  criteria: SearchCriteria,
): MatchScore {
  const { score: skillsScore, reasoning, matchedSkills } = scoreSkillsFallback(
    candidate.skills || [],
    criteria.desiredSkills || [],
  );

  const candidateInterests = (candidate.interests || []).map((i) => i.trim().toLowerCase());
  const desiredInterests = (criteria.desiredInterests || []).map((i) => i.trim().toLowerCase());

  // 2. Availability score
  let availabilityScore = 70;
  const avail = candidate.availability?.toLowerCase() || "";
  if (avail.includes("full-time") || avail === "full-time") {
    availabilityScore = 100;
  } else if (avail.includes("part-time")) {
    availabilityScore = 85;
  } else if (avail.includes("weekend")) {
    availabilityScore = 75;
  }

  // 3. Experience fit score
  let experienceScore = 75;
  const minReq = criteria.minYearsOfExperience?.trim() !== "" ? Number(criteria.minYearsOfExperience) : 0;

  if (candidate.user_type === "industry") {
    const candidateYoe = candidate.years_of_experience ?? 0;
    if (minReq === 0) {
      experienceScore = Math.min(100, 60 + candidateYoe * 8);
    } else if (candidateYoe >= minReq + 2) {
      experienceScore = 100;
    } else if (candidateYoe >= minReq) {
      experienceScore = 90;
    } else if (candidateYoe > 0) {
      experienceScore = Math.max(40, Math.round((candidateYoe / minReq) * 80));
    } else {
      experienceScore = 40;
    }
  } else {
    const yos = (candidate.year_of_study || "").toLowerCase();
    if (yos.includes("postgraduate") || yos.includes("4th")) {
      experienceScore = 100;
    } else if (yos.includes("3rd")) {
      experienceScore = 90;
    } else if (yos.includes("2nd")) {
      experienceScore = 80;
    } else if (yos.includes("1st")) {
      experienceScore = 70;
    } else {
      experienceScore = 75;
    }
  }

  // 4. Shared interests score
  const matchedInterests: string[] = [];
  let interestsScore = 70;

  if (desiredInterests.length > 0) {
    const matches = desiredInterests.filter((desired) => {
      const match = candidateInterests.some(
        (ci) => ci === desired || ci.includes(desired) || desired.includes(ci),
      );
      if (match) {
        const original = (candidate.interests || []).find(
          (i) => i.trim().toLowerCase() === desired || i.trim().toLowerCase().includes(desired),
        );
        if (original && !matchedInterests.includes(original)) {
          matchedInterests.push(original);
        }
      }
      return match;
    });

    interestsScore = Math.min(100, Math.round((matches.length / desiredInterests.length) * 100));
  } else {
    interestsScore = Math.min(100, (candidate.interests?.length || 0) * 25);
    if (interestsScore === 0) interestsScore = 60;
  }

  // Weighted overall calculation
  const wSkills = IMPORTANCE_WEIGHTS[criteria.ranking?.skillsMatch || "High"];
  const wAvail = IMPORTANCE_WEIGHTS[criteria.ranking?.availabilityMatch || "Medium"];
  const wExp = IMPORTANCE_WEIGHTS[criteria.ranking?.experienceFit || "Medium"];
  const wInt = IMPORTANCE_WEIGHTS[criteria.ranking?.sharedInterests || "Low"];

  const totalWeight = wSkills + wAvail + wExp + wInt;
  const rawOverall =
    (wSkills * skillsScore +
      wAvail * availabilityScore +
      wExp * experienceScore +
      wInt * interestsScore) /
    totalWeight;

  const overall = Math.min(100, Math.max(0, Math.round(rawOverall)));

  return {
    overall,
    breakdown: {
      skills: skillsScore,
      availability: availabilityScore,
      experience: experienceScore,
      interests: interestsScore,
    },
    matchedSkills,
    matchedInterests,
    skillsReasoning: reasoning,
    isAiScored: false,
  };
}

/**
 * Asynchronous semantic candidate scoring using Claude Sonnet 4.6 for skills.
 */
export async function scoreCandidateSemantic(
  candidate: Profile,
  criteria: SearchCriteria,
): Promise<MatchScore> {
  const { score: skillsScore, reasoning, isAiScored, matchedSkills } =
    await scoreSkillsSemantic(
      candidate.skills || [],
      criteria.desiredSkills || [],
    );

  const candidateInterests = (candidate.interests || []).map((i) => i.trim().toLowerCase());
  const desiredInterests = (criteria.desiredInterests || []).map((i) => i.trim().toLowerCase());

  // Availability
  let availabilityScore = 70;
  const avail = candidate.availability?.toLowerCase() || "";
  if (avail.includes("full-time") || avail === "full-time") {
    availabilityScore = 100;
  } else if (avail.includes("part-time")) {
    availabilityScore = 85;
  } else if (avail.includes("weekend")) {
    availabilityScore = 75;
  }

  // Experience
  let experienceScore = 75;
  const minReq = criteria.minYearsOfExperience?.trim() !== "" ? Number(criteria.minYearsOfExperience) : 0;

  if (candidate.user_type === "industry") {
    const candidateYoe = candidate.years_of_experience ?? 0;
    if (minReq === 0) {
      experienceScore = Math.min(100, 60 + candidateYoe * 8);
    } else if (candidateYoe >= minReq + 2) {
      experienceScore = 100;
    } else if (candidateYoe >= minReq) {
      experienceScore = 90;
    } else if (candidateYoe > 0) {
      experienceScore = Math.max(40, Math.round((candidateYoe / minReq) * 80));
    } else {
      experienceScore = 40;
    }
  } else {
    const yos = (candidate.year_of_study || "").toLowerCase();
    if (yos.includes("postgraduate") || yos.includes("4th")) {
      experienceScore = 100;
    } else if (yos.includes("3rd")) {
      experienceScore = 90;
    } else if (yos.includes("2nd")) {
      experienceScore = 80;
    } else if (yos.includes("1st")) {
      experienceScore = 70;
    } else {
      experienceScore = 75;
    }
  }

  // Interests
  const matchedInterests: string[] = [];
  let interestsScore = 70;

  if (desiredInterests.length > 0) {
    const matches = desiredInterests.filter((desired) => {
      const match = candidateInterests.some(
        (ci) => ci === desired || ci.includes(desired) || desired.includes(ci),
      );
      if (match) {
        const original = (candidate.interests || []).find(
          (i) => i.trim().toLowerCase() === desired || i.trim().toLowerCase().includes(desired),
        );
        if (original && !matchedInterests.includes(original)) {
          matchedInterests.push(original);
        }
      }
      return match;
    });

    interestsScore = Math.min(100, Math.round((matches.length / desiredInterests.length) * 100));
  } else {
    interestsScore = Math.min(100, (candidate.interests?.length || 0) * 25);
    if (interestsScore === 0) interestsScore = 60;
  }

  // Weighted overall calculation
  const wSkills = IMPORTANCE_WEIGHTS[criteria.ranking?.skillsMatch || "High"];
  const wAvail = IMPORTANCE_WEIGHTS[criteria.ranking?.availabilityMatch || "Medium"];
  const wExp = IMPORTANCE_WEIGHTS[criteria.ranking?.experienceFit || "Medium"];
  const wInt = IMPORTANCE_WEIGHTS[criteria.ranking?.sharedInterests || "Low"];

  const totalWeight = wSkills + wAvail + wExp + wInt;
  const rawOverall =
    (wSkills * skillsScore +
      wAvail * availabilityScore +
      wExp * experienceScore +
      wInt * interestsScore) /
    totalWeight;

  const overall = Math.min(100, Math.max(0, Math.round(rawOverall)));

  return {
    overall,
    breakdown: {
      skills: skillsScore,
      availability: availabilityScore,
      experience: experienceScore,
      interests: interestsScore,
    },
    matchedSkills,
    matchedInterests,
    skillsReasoning: reasoning,
    isAiScored,
  };
}

