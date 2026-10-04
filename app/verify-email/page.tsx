"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    CheckCircle2,
    Mail,
    Loader2,
    AlertCircle,
    ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [status, setStatus] = useState<
        "waiting" | "verifying" | "success" | "error"
    >("waiting");

    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) return;

        const verifyEmail = async () => {
            try {
                setStatus("verifying");

                const response = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setStatus("error");
                    setMessage(data.message || "Verification failed.");
                    return;
                }

                setStatus("success");
                setMessage(
                    data.message || "Your email has been verified successfully."
                );
            } catch (error) {
                console.error("EMAIL_VERIFICATION_ERROR:", error);

                setStatus("error");
                setMessage("Something went wrong. Please try again.");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
            <Card className="w-full max-w-md border-border/60 shadow-lg">
                <CardContent className="p-8 text-center">
                    {!token && status === "waiting" && (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                <Mail className="h-8 w-8 text-primary" />
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight">
                                Check your email
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                We&apos;ve sent a verification link to
                            </p>

                            {email && (
                                <p className="mt-1 font-medium">
                                    {email}
                                </p>
                            )}

                            <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                Open the email and click the verification
                                button to activate your ChitChat account.
                            </p>

                            <div className="mt-6 rounded-xl bg-muted/50 p-4 text-left">
                                <p className="text-sm font-medium">
                                    Didn&apos;t receive the email?
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Check your spam folder or request another
                                    verification email.
                                </p>
                            </div>

                            <Button
                                className="mt-6 w-full"
                                variant="outline"
                                onClick={() => router.push("/login")}
                            >
                                Back to login
                            </Button>
                        </>
                    )}

                    {status === "verifying" && (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>

                            <h1 className="text-2xl font-bold">
                                Verifying your email
                            </h1>

                            <p className="mt-3 text-sm text-muted-foreground">
                                Please wait while we verify your email address.
                            </p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                                <CheckCircle2 className="h-9 w-9 text-green-500" />
                            </div>

                            <h1 className="text-2xl font-bold">
                                Email verified!
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Your ChitChat account has been successfully
                                verified. You can now sign in.
                            </p>

                            <Button
                                className="mt-6 w-full"
                                onClick={() => router.push("/login")}
                            >
                                Continue to login
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                            </div>

                            <h1 className="text-2xl font-bold">
                                Verification failed
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                {message}
                            </p>

                            <div className="mt-6 flex flex-col gap-3">
                                <Button
                                    className="w-full"
                                    onClick={() => router.push("/login")}
                                >
                                    Go to login
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push("/register")}
                                >
                                    Create another account
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
