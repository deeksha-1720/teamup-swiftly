import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProjectMatch — Find your teammates" },
      {
        name: "description",
        content:
          "ProjectMatch connects students and industry professionals to form project teams based on skills, interests, and availability.",
      },
      { property: "og:title", content: "ProjectMatch — Find your teammates" },
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ProjectMatch
          </span>
          {sessionChecked &&
            (session ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {session.user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        {!session && sessionChecked && (
          <section className="mx-auto max-w-2xl py-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Find the right people for your next project
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              ProjectMatch connects students and industry professionals to form
              teams based on skills, interests, and availability.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Create account</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </section>
        )}

        {session && (
          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                People on ProjectMatch
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {profiles?.length ?? 0} profiles — matching and filters are
                coming next.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles?.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {p.user_type === "student"
                            ? [p.college_name, p.year_of_study]
                                .filter(Boolean)
                                .join(" · ")
                            : [p.current_role, p.company]
                                .filter(Boolean)
                                .join(" · ") || "Industry professional"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={p.user_type === "student" ? "secondary" : "default"}
                      >
                        {p.user_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.role_category && (
                      <p className="text-sm text-muted-foreground">
                        {p.role_category}
                      </p>
                    )}
                    {p.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.skills.map((s) => (
                          <Badge key={s} variant="outline">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {[
                        p.availability,
                        p.work_mode === "in-person" ? p.city : p.work_mode,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
