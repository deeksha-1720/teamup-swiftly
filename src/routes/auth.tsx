import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RetroFlower, RetroSparkle } from "@/components/retro-decorations";
import { Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — ProjectMatch" },
      {
        name: "description",
        content:
          "Sign in to ProjectMatch or create your account to find students and industry professionals for your next team.",
      },
      { property: "og:title", content: "Sign in — ProjectMatch" },
      {
        property: "og:description",
        content:
          "Sign in to ProjectMatch or create your account to find your next team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign up fields
  const [name, setName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [userType, setUserType] = useState<"student" | "industry">("student");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { data: { name, user_type: userType } },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        name,
        email: signUpEmail,
        user_type: userType,
      });
      setLoading(false);
      if (profileError) {
        setError(`Account created, but profile setup failed: ${profileError.message}`);
        return;
      }
      navigate({ to: "/profile" });
    } else {
      setLoading(false);
      setError("Signup did not return a user. Please try signing in.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-orange-200">
      <header className="border-b border-orange-200/70 bg-card/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <RetroFlower size={24} color="#EA580C" centerColor="#FDE047" />
            <span className="font-heading text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              ProjectMatch
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background decorative doodles */}
        <div className="absolute top-12 left-10 opacity-70 pointer-events-none hidden md:block">
          <RetroFlower size={40} color="#FB923C" centerColor="#FEF08A" />
        </div>
        <div className="absolute bottom-12 right-12 opacity-80 pointer-events-none hidden md:block">
          <RetroSparkle size={32} color="#F59E0B" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="rounded-3xl border-2 border-orange-200/90 bg-card shadow-lg shadow-orange-950/5">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-2">
                <RetroFlower size={34} color="#EA580C" centerColor="#FDE047" />
              </div>
              <CardTitle className="font-heading text-2xl font-bold text-foreground">
                Join the Community
              </CardTitle>
              <CardDescription className="text-stone-600 text-xs">
                Sign in to your account or create a new profile to team up!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-full p-1 bg-orange-100/70 border border-orange-200/70">
                  <TabsTrigger
                    value="signin"
                    className="rounded-full text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-full text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    Sign up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-xs font-semibold text-stone-700">
                        Email address
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="rounded-xl border-orange-200 focus-visible:ring-orange-500 bg-white/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-password" className="text-xs font-semibold text-stone-700">
                        Password
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl border-orange-200 focus-visible:ring-orange-500 bg-white/70"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm mt-2"
                        disabled={loading}
                      >
                        {loading ? "Signing in…" : "Sign in to ProjectMatch"}
                      </Button>
                    </motion.div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name" className="text-xs font-semibold text-stone-700">
                        Full name
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Asha Rao"
                        className="rounded-xl border-orange-200 focus-visible:ring-orange-500 bg-white/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs font-semibold text-stone-700">
                        Email address
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="rounded-xl border-orange-200 focus-visible:ring-orange-500 bg-white/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs font-semibold text-stone-700">
                        Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="rounded-xl border-orange-200 focus-visible:ring-orange-500 bg-white/70"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-usertype" className="text-xs font-semibold text-stone-700">
                        I am a
                      </Label>
                      <Select
                        value={userType}
                        onValueChange={(v) => setUserType(v as "student" | "industry")}
                      >
                        <SelectTrigger id="signup-usertype" className="rounded-xl border-orange-200 bg-white/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-orange-200">
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="industry">Industry professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm mt-2"
                        disabled={loading}
                      >
                        {loading ? "Creating account…" : "Create account"}
                      </Button>
                    </motion.div>
                    <p className="text-[11px] text-center text-stone-500">
                      ✨ Instant access — no email confirmation required.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>

              {error && (
                <p className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

