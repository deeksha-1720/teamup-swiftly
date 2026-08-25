import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
  RetroFlower,
  RetroSparkle,
  RetroWave,
  CartoonAvatar,
} from "@/components/retro-decorations";
import { Sparkles, Users, Compass, ArrowRight, GraduationCap, Briefcase, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProjectMatch — Find your dream teammates" },
      {
        name: "description",
        content:
          "ProjectMatch connects students and industry professionals to form project teams based on skills, interests, and availability.",
      },
      { property: "og:title", content: "ProjectMatch — Find your dream teammates" },
      {
        property: "og:description",
        content:
          "Connect with students and industry professionals to form project teams based on skills, interests, and availability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-orange-200">
      {/* Top Navigation */}
      <header className="border-b border-orange-200/70 bg-card/75 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <RetroFlower size={26} color="#EA580C" centerColor="#FDE047" />
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              ProjectMatch
            </span>
          </Link>

          {sessionChecked &&
            (session ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden text-xs font-medium text-muted-foreground md:inline bg-orange-100/60 px-3 py-1 rounded-full border border-orange-200/50">
                  {session.user.email}
                </span>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button asChild size="sm" className="rounded-full shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4">
                    <Link to="/find">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Find teammates
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button asChild variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground">
                    <Link to="/profile">Edit profile</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-full border-orange-300 hover:bg-orange-50">
                    Sign out
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link to="/auth">Sign in</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button asChild size="sm" className="rounded-full shadow-sm bg-primary hover:bg-primary/90 px-4 font-medium">
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </motion.div>
              </div>
            ))}
        </div>
      </header>

      <main className="flex-1">
        {/* Unauthenticated Landing Hero */}
        {!session && sessionChecked && (
          <section className="relative overflow-hidden pt-12 pb-20 md:py-24 px-4 sm:px-6">
            {/* Background floating retro doodles */}
            <div className="absolute top-10 left-8 md:left-24 opacity-80 pointer-events-none">
              <RetroFlower size={36} color="#F97316" centerColor="#FDE047" />
            </div>
            <div className="absolute top-20 right-10 md:right-28 opacity-80 pointer-events-none">
              <RetroSparkle size={28} color="#F59E0B" />
            </div>
            <div className="absolute bottom-24 left-12 md:left-32 opacity-70 pointer-events-none hidden sm:block">
              <RetroSparkle size={24} color="#EA580C" />
            </div>
            <div className="absolute bottom-16 right-16 md:right-36 opacity-75 pointer-events-none">
              <RetroFlower size={42} color="#FB923C" centerColor="#FEF08A" />
            </div>

            <div className="mx-auto max-w-3xl text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-100/90 border border-orange-300/80 text-orange-900 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Team Up for Hackathons & Projects
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-heading text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.08]"
              >
                Find the <span className="text-primary underline decoration-amber-400 decoration-wavy decoration-3 underline-offset-8">right people</span> for your next project.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 text-lg sm:text-xl text-stone-700 max-w-2xl mx-auto font-normal leading-relaxed"
              >
                ProjectMatch brings students & industry builders together. Match on skills, work mode, and schedule with smart compatibility rankings.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-9 flex flex-wrap justify-center gap-4"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild size="lg" className="rounded-full shadow-md px-8 py-6 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-orange-600/20">
                    <Link to="/auth">
                      Create Your Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button asChild variant="outline" size="lg" className="rounded-full shadow-xs px-7 py-6 text-base font-medium border-2 border-orange-300 hover:bg-orange-50/80">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Scalloped Wavy Divider */}
        <RetroWave />

        {/* Authenticated Dashboard */}
        {session && (
          <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/70 border border-orange-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <RetroFlower size={24} color="#EA580C" centerColor="#FDE047" animate={false} />
                  <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                    Explore Community Members
                  </h1>
                </div>
                <p className="mt-1.5 text-sm text-stone-600">
                  {profiles?.length ?? 0} creators & builders ready to collaborate. Launch the wizard to get ranked matches!
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button asChild size="lg" className="rounded-full shadow-md bg-primary hover:bg-primary/90 px-6 font-semibold shrink-0">
                  <Link to="/find">
                    <Compass className="mr-2 h-4 w-4" />
                    Find Teammates →
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Profile Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {profiles?.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                >
                  <Card className="rounded-2xl border-2 border-orange-200/80 bg-card hover:border-orange-300 hover:shadow-md transition-all h-full flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <CartoonAvatar name={p.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <CardTitle className="text-base font-bold truncate">
                              {p.name}
                            </CardTitle>
                            <Badge
                              variant="secondary"
                              className="text-[11px] rounded-full capitalize font-medium shrink-0 bg-orange-100 text-orange-900 border border-orange-200"
                            >
                              {p.user_type}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs mt-0.5 text-stone-600 truncate">
                            {p.user_type === "student" ? (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3 inline shrink-0 text-orange-600" />
                                {[p.college_name, p.year_of_study]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3 inline shrink-0 text-orange-600" />
                                {[p.current_role, p.company]
                                  .filter(Boolean)
                                  .join(" · ") || "Industry builder"}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        {p.role_category && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            {p.role_category}
                          </span>
                        )}

                        {p.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.skills.map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="rounded-full text-[11px] py-0 px-2 border-orange-200/80 bg-orange-50/50 text-stone-700"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-orange-100">
                        {p.availability && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            {p.availability}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-orange-600" />
                          {p.work_mode === "in-person"
                            ? p.city || "In-person"
                            : "Remote"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

