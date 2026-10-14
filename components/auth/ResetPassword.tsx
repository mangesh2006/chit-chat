"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
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

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [error, setError] = useState("");

    const [passwordStrength, setPasswordStrength] = useState<
        "weak" | "medium" | "strong" | ""
    >("");

    useEffect(() => {
        if (!password) {
            setPasswordStrength("");
            return;
        }

        if (password.length < 8) {
            setPasswordStrength("weak");
        } else if (
            password.length >= 8 &&
            (!/[A-Z]/.test(password) ||
                !/[0-9]/.test(password))
        ) {
            setPasswordStrength("medium");
        } else {
            setPasswordStrength("strong");
        }
    }, [password]);

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");

        if (!token) {
            setError("Invalid or missing reset link.");
            return;
        }

        if (!password || !confirmPassword) {
            setError("Please fill in both password fields.");
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must be at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "/api/auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Unable to reset password."
                );
                return;
            }

            setSuccess(true);
        } catch (error) {
            console.error(
                "RESET_PASSWORD_ERROR:",
                error
            );

            setError(
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="w-full max-w-md border-border/60 shadow-lg">
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight">
                            Password updated!
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Your password has been changed successfully.
                            You can now sign in using your new password.
                        </p>

                        <Button className="mt-6 w-full">
                            <Link href="/login">
                                Sign in
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
            <Card className="w-full max-w-md border-border/60 shadow-lg">
                <CardHeader className="space-y-5 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>

                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Create new password
                        </CardTitle>

                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Choose a strong password for your ChitChat account.
                        </p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                New password
                            </Label>

                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    disabled={loading}
                                    className="pr-10"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {passwordStrength && (
                                <div className="space-y-2">
                                    <div className="flex gap-1">
                                        <div
                                            className={`h-1 flex-1 rounded-full ${passwordStrength === "weak" ||
                                                passwordStrength === "medium" ||
                                                passwordStrength === "strong"
                                                ? "bg-primary"
                                                : "bg-muted"
                                                }`}
                                        />

                                        <div
                                            className={`h-1 flex-1 rounded-full ${passwordStrength === "medium" ||
                                                passwordStrength === "strong"
                                                ? "bg-primary"
                                                : "bg-muted"
                                                }`}
                                        />

                                        <div
                                            className={`h-1 flex-1 rounded-full ${passwordStrength === "strong"
                                                ? "bg-primary"
                                                : "bg-muted"
                                                }`}
                                        />
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Password strength:{" "}
                                        <span className="font-medium capitalize">
                                            {passwordStrength}
                                        </span>
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                                Use at least 8 characters with a number and
                                uppercase letter.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirm password
                            </Label>

                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword ? "text" : "password"
                                    }
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    disabled={loading}
                                    className="pr-10"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
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
                                    Updating password...
                                </>
                            ) : (
                                "Reset password"
                            )}
                        </Button>

                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to login
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}