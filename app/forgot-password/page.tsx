"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          "Unable to send reset link."
        );
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error(
        "FORGOT_PASSWORD_ERROR:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            {submitted ? (
              <Mail className="h-8 w-8 text-primary" />
            ) : (
              <KeyRound className="h-8 w-8 text-primary" />
            )}
          </div>

          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {submitted
                ? "Check your email"
                : "Forgot password?"}
            </CardTitle>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {submitted
                ? "If an account exists with this email, we've sent you a password reset link."
                : "Enter the email address associated with your ChitChat account."}
            </p>
          </div>

        </CardHeader>

        <CardContent>
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email address
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send reset link
                  </>
                )}
              </Button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground border rounded-lg p-2"
              >
                <ArrowLeft size={20} />
                Back to login
              </Link>

            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-sm font-medium break-all">
                  {email}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  Check your inbox and follow the
                  link to create a new password.
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  The reset link will expire after
                  15 minutes.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
              >
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </Button>

            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}