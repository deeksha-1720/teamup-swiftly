import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  scoreCandidateSemantic,
  type Profile,
  type SearchCriteria,
  type MatchScore,
} from "@/lib/matching";
import { SEARCH_CRITERIA_KEY } from "@/routes/_authenticated/find";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RetroFlower,
  RetroSparkle,
  CartoonAvatar,
  AnimatedCounter,
} from "@/components/retro-decorations";
import {
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  Send,
  UserX,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/results")({
  head: () => ({
    meta: [
      { title: "Matched Teammates — ProjectMatch" },
      {
        name: "description",
        content: "Ranked teammate matches based on your project requirements.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

interface ScoredCandidate {
  profile: Profile;
  score: MatchScore;
}

function ResultsPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext() as unknown as {
    user: { id: string; email?: string };
  };

  const [criteria, setCriteria] = useState<SearchCriteria | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ScoredCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SEARCH_CRITERIA_KEY);
      if (saved) {
        setCriteria(JSON.parse(saved));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!criteria) return;
    const targetCriteria = criteria;

    let cancelled = false;

    async function fetchAndScore(activeCriteria: SearchCriteria) {
      setLoading(true);
      setError(null);

      try {
        const targetUserType = activeCriteria.projectType === "college" ? "student" : "industry";

        let query = supabase
          .from("profiles")
          .select("*")
          .neq("user_id", user.id)
          .eq("user_type", targetUserType);

        if (activeCriteria.roleCategory) {
          query = query.eq("role_category", activeCriteria.roleCategory);
        }

        if (activeCriteria.workMode) {
          query = query.eq("work_mode", activeCriteria.workMode);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        if (cancelled) return;

        let filteredList: Profile[] = data || [];

        if (activeCriteria.workMode === "in-person" && activeCriteria.city?.trim()) {
          const cityQuery = activeCriteria.city.trim().toLowerCase();
          filteredList = filteredList.filter((p) =>
            p.city ? p.city.toLowerCase().includes(cityQuery) : true,
          );
        }

        if (
          activeCriteria.projectType === "college" &&
          activeCriteria.collegeName?.trim()
        ) {
          const collegeQuery = activeCriteria.collegeName.trim().toLowerCase();
          filteredList = filteredList.filter((p) =>
            p.college_name
              ? p.college_name.toLowerCase().includes(collegeQuery)
              : true,
          );
        }

        if (
          activeCriteria.projectType === "industry" &&
          activeCriteria.minYearsOfExperience?.trim()
        ) {
          const minYears = Number(activeCriteria.minYearsOfExperience);
          if (!Number.isNaN(minYears) && minYears > 0) {
            filteredList = filteredList.filter(
              (p) => (p.years_of_experience ?? 0) >= minYears,
            );
          }
        }

        const scoredList: ScoredCandidate[] = await Promise.all(
          filteredList.map(async (p) => {
            const score = await scoreCandidateSemantic(p, activeCriteria);
            return { profile: p, score };
          }),
        );

        if (cancelled) return;

        scoredList.sort((a, b) => b.score.overall - a.score.overall);

        setCandidates(scoredList);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch and score candidates. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAndScore(targetCriteria);

    return () => {
      cancelled = true;
    };
  }, [criteria, user.id]);

  function handleConnect(candidateId: string) {
    setConnectingId(candidateId);
    setTimeout(() => {
      setConnectedIds((prev) => new Set(prev).add(candidateId));
      setConnectingId(null);
    }, 600);
  }

  const filterSummary = useMemo(() => {
    if (!criteria) return [];
    const items: string[] = [
      criteria.projectType === "college" ? "🎓 College project" : "💼 Industry project",
    ];
    if (criteria.roleCategory) items.push(criteria.roleCategory);
    items.push(
      criteria.workMode === "in-person"
        ? `📍 ${criteria.city || "In-person"}`
        : "🌐 Remote",
    );
    if (criteria.collegeName?.trim()) items.push(`🏛️ ${criteria.collegeName}`);
    if (criteria.minYearsOfExperience?.trim())
      items.push(`≥ ${criteria.minYearsOfExperience} yrs exp`);
    return items;
  }, [criteria]);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-orange-200">
      <header className="border-b border-orange-200/70 bg-card/75 backdrop-blur-md sticky top-0 z-20 shadow-xs">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <RetroFlower size={24} color="#EA580C" centerColor="#FDE047" />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              ProjectMatch
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button asChild variant="outline" size="sm" className="rounded-full border-orange-300 hover:bg-orange-50 font-medium">
                <Link to="/find">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                  Refine search
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-foreground/80">
                <Link to="/profile">Profile</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-8">
        {!criteria && !loading && (
          <div className="mx-auto max-w-md text-center py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 border-2 border-orange-300 text-primary mb-4">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">No active search criteria</h2>
            <p className="mt-2 text-sm text-stone-600">
              Run the teammate search wizard first to set your role, skill, and location preferences.
            </p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="mt-6 inline-block">
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm" size="lg">
                <Link to="/find">Launch teammate wizard</Link>
              </Button>
            </motion.div>
          </div>
        )}

        {criteria && (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/70 border border-orange-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <RetroFlower size={24} color="#EA580C" centerColor="#FDE047" animate={false} />
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Recommended Teammates
                  </h1>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-stone-600">
                  Ranked by Claude AI semantic skill evaluations & your custom priority weights.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {filterSummary.map((f) => (
                  <Badge key={f} variant="outline" className="text-xs rounded-full bg-orange-50/60 border-orange-200 text-stone-700 font-medium py-0.5 px-2.5">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
                {error}
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary py-4 bg-orange-100/50 rounded-2xl border border-orange-200">
                  <RetroSparkle size={18} color="#EA580C" />
                  <span>Evaluating candidate skill overlap semantically with Claude AI...</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse rounded-3xl border-2 border-orange-200/60 bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-orange-200/50 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-28 rounded-full bg-orange-200/50" />
                            <div className="h-3 w-40 rounded-full bg-orange-200/30" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="h-12 rounded-2xl bg-orange-100/50" />
                        <div className="h-6 w-3/4 rounded-full bg-orange-100/40" />
                        <div className="h-8 rounded-full bg-orange-200/40" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!loading && candidates.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-orange-200 p-12 text-center bg-card/50">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 border border-orange-300 text-stone-600 mb-3">
                  <UserX className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">No matching candidates found</h3>
                <p className="mx-auto mt-2 max-w-sm text-xs text-stone-600 leading-relaxed">
                  No candidates currently match all strict filter criteria (role, work mode, city, or experience requirement).
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    <Link to="/find">Broaden search criteria</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-orange-300">
                    <Link to="/">View all community profiles</Link>
                  </Button>
                </div>
              </div>
            )}

            {!loading && candidates.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {candidates.map(({ profile, score }, idx) => {
                  const isConnected = connectedIds.has(profile.id);
                  const isConnecting = connectingId === profile.id;

                  const scoreBadgeStyle =
                    score.overall >= 80
                      ? "bg-emerald-100 text-emerald-950 border-emerald-300 ring-2 ring-emerald-400/20"
                      : score.overall >= 50
                        ? "bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-400/20"
                        : "bg-rose-100 text-rose-950 border-rose-300 ring-2 ring-rose-400/20";

                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                    >
                      <Card className="rounded-3xl border-2 border-orange-200/90 bg-card hover:border-orange-300 hover:shadow-lg transition-all flex flex-col justify-between h-full overflow-hidden shadow-xs">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <CartoonAvatar name={profile.name} size="md" />
                              <div className="space-y-0.5 min-w-0">
                                <CardTitle className="font-heading text-lg font-bold truncate">
                                  {profile.name}
                                </CardTitle>
                                <CardDescription className="text-xs text-stone-600 truncate">
                                  {profile.user_type === "student" ? (
                                    <span className="flex items-center gap-1">
                                      <GraduationCap className="h-3 w-3 inline text-orange-600 shrink-0" />
                                      {[profile.college_name, profile.year_of_study]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="h-3 w-3 inline text-orange-600 shrink-0" />
                                      {[
                                        profile.current_role,
                                        profile.company,
                                        profile.years_of_experience != null
                                          ? `${profile.years_of_experience} yrs`
                                          : null,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ") || "Industry builder"}
                                    </span>
                                  )}
                                </CardDescription>
                              </div>
                            </div>

                            <div
                              className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-1.5 shrink-0 ${scoreBadgeStyle}`}
                            >
                              <span className="font-heading text-xl font-bold tracking-tight leading-none">
                                <AnimatedCounter value={score.overall} />%
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                                Match
                              </span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            {profile.role_category && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                {profile.role_category}
                              </span>
                            )}

                            {profile.skills && profile.skills.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                  Skills & Technologies
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {profile.skills.map((s) => {
                                    const isMatched = score.matchedSkills.some(
                                      (ms) => ms.toLowerCase() === s.toLowerCase(),
                                    );
                                    return (
                                      <Badge
                                        key={s}
                                        variant={isMatched ? "default" : "outline"}
                                        className={`text-[11px] py-0 px-2 rounded-full font-medium ${
                                          isMatched
                                            ? "bg-primary text-primary-foreground font-semibold"
                                            : "border-orange-200 text-stone-600 bg-orange-50/40"
                                        }`}
                                      >
                                        {s}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-3 space-y-2.5">
                              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                                Compatibility Breakdown
                              </span>

                              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                <div>
                                  <div className="flex justify-between items-center text-[11px] mb-1 text-stone-600">
                                    <span className="flex items-center gap-1 font-medium">
                                      Skills
                                      {score.skillsReasoning && (
                                        <TooltipProvider delayDuration={100}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button
                                                type="button"
                                                className="text-primary hover:opacity-80 inline-flex items-center cursor-pointer"
                                                aria-label="AI reasoning"
                                              >
                                                <RetroSparkle size={13} color="#EA580C" />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs text-xs p-2.5 bg-card text-foreground border-2 border-orange-200 rounded-2xl shadow-md">
                                              <p className="font-bold text-[11px] text-primary flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                AI Semantic Match Insight
                                              </p>
                                              <p className="mt-1 text-[11px] text-stone-600">
                                                {score.skillsReasoning}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </span>
                                    <span className="font-bold text-stone-900">
                                      {score.breakdown.skills}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-orange-200/50 overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all"
                                      style={{ width: `${score.breakdown.skills}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[11px] mb-1 text-stone-600">
                                    <span className="font-medium">Availability</span>
                                    <span className="font-bold text-stone-900">
                                      {score.breakdown.availability}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-orange-200/50 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all"
                                      style={{ width: `${score.breakdown.availability}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[11px] mb-1 text-stone-600">
                                    <span className="font-medium">Experience</span>
                                    <span className="font-bold text-stone-900">
                                      {score.breakdown.experience}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-orange-200/50 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all"
                                      style={{ width: `${score.breakdown.experience}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[11px] mb-1 text-stone-600">
                                    <span className="font-medium">Interests</span>
                                    <span className="font-bold text-stone-900">
                                      {score.breakdown.interests}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-orange-200/50 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all"
                                      style={{ width: `${score.breakdown.interests}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {score.skillsReasoning && (
                                <div className="flex items-start gap-1.5 pt-1.5 border-t border-orange-200/60 text-[10.5px] text-stone-600">
                                  <RetroSparkle size={13} color="#EA580C" className="shrink-0 mt-0.5" />
                                  <span className="italic leading-snug font-medium">
                                    {score.skillsReasoning}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-1">
                              {profile.availability && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-orange-600" />
                                  {profile.availability}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-orange-600" />
                                {profile.work_mode === "in-person"
                                  ? profile.city || "In-person"
                                  : "Remote"}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-orange-100 flex items-center gap-2">
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-full border-orange-200 text-xs font-semibold hover:bg-orange-50"
                                onClick={() => setSelectedCandidate({ profile, score })}
                              >
                                View Profile
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                              <Button
                                size="sm"
                                variant={isConnected ? "secondary" : "default"}
                                className={`w-full rounded-full text-xs font-semibold shadow-xs ${
                                  isConnected
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                                }`}
                                disabled={isConnected || isConnecting}
                                onClick={() => handleConnect(profile.id)}
                              >
                                {isConnected ? (
                                  <span className="flex items-center gap-1 text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Requested
                                  </span>
                                ) : isConnecting ? (
                                  "Connecting..."
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Send className="h-3 w-3" />
                                    Connect
                                  </span>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Dialog
        open={!!selectedCandidate}
        onOpenChange={(open) => !open && setSelectedCandidate(null)}
      >
        <DialogContent className="max-w-lg rounded-3xl border-2 border-orange-200 bg-card p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {selectedCandidate && (
                <CartoonAvatar name={selectedCandidate.profile.name} size="lg" />
              )}
              <div className="flex-1">
                <DialogTitle className="font-heading text-2xl font-bold flex items-center justify-between gap-2">
                  <span>{selectedCandidate?.profile.name}</span>
                  {selectedCandidate && (
                    <Badge
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        selectedCandidate.score.overall >= 80
                          ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                          : selectedCandidate.score.overall >= 50
                            ? "bg-amber-100 text-amber-950 border-amber-300"
                            : "bg-rose-100 text-rose-950 border-rose-300"
                      }`}
                    >
                      {selectedCandidate.score.overall}% Match
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-600 mt-0.5">
                  {selectedCandidate?.profile.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Background
                </span>
                {selectedCandidate.profile.user_type === "student" ? (
                  <p className="text-stone-800 font-medium">
                    Student at {selectedCandidate.profile.college_name || "College"} (
                    {selectedCandidate.profile.branch || "General"}, {selectedCandidate.profile.year_of_study})
                  </p>
                ) : (
                  <p className="text-stone-800 font-medium">
                    {selectedCandidate.profile.current_role} at {selectedCandidate.profile.company || "Independent"} ·{" "}
                    {selectedCandidate.profile.years_of_experience ?? 0} years experience
                  </p>
                )}
              </div>

              {selectedCandidate.profile.skills?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                    Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.profile.skills.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="rounded-full px-2.5 py-0.5 text-xs bg-orange-100 text-orange-950 border border-orange-200"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.profile.interests?.length > 0 && (
               <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                  Interests & Domains
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.profile.interests.map((i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="rounded-full px-2.5 py-0.5 text-xs border-orange-200 bg-orange-50/50 text-stone-700"
                    >
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <span className="font-medium capitalize">
              {selectedCandidate.profile.work_mode}{" "}
              {selectedCandidate.profile.city
                ? `(${selectedCandidate.profile.city})`
                : ""}
            </span>

            <div className="pt-2">
              <Button
                className="w-full"
                disabled={connectedIds.has(selectedCandidate.profile.id)}
                onClick={() => {
                  handleConnect(selectedCandidate.profile.id);
                  setSelectedCandidate(null);
                }}
              >
                {connectedIds.has(selectedCandidate.profile.id)
                  ? "Connection Requested"
                  : "Send Teammate Request"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
);
}

