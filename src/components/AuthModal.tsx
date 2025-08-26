import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) toast({ title: "Error", description: error.message });
    setLoading(false);
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    if (mode === "signIn") {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }
    if (result.error) {
      toast({ title: "Error", description: result.error.message });
    } else {
      toast({ title: "Check your email", description: "Follow the link to complete sign in." });
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">
            {mode === "signIn" ? "Sign In" : "Sign Up"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            className="w-full bg-gradient-to-r from-red-500 to-yellow-500 text-white"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </Button>
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-slate-300 dark:border-slate-600" />
            <span className="mx-2 text-slate-400 text-xs">or</span>
            <div className="flex-1 border-t border-slate-300 dark:border-slate-600" />
          </div>
          <form className="space-y-3" onSubmit={handleEmail}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-white dark:bg-slate-700"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-white dark:bg-slate-700"
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600"
              disabled={loading}
            >
              {mode === "signIn" ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="text-center text-sm mt-2">
            {mode === "signIn" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-blue-600 underline"
                  onClick={() => setMode("signUp")}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-blue-600 underline"
                  onClick={() => setMode("signIn")}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}