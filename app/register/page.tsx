"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name: form.name,
                        username: form.username,
                        email: form.email,
                        password: form.password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                return;
            }

            router.push(
                `/verify-email?email=${encodeURIComponent(form.email)}`
            );
            router.refresh();
        } catch {
            setError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-10">
            <div className="w-full max-w-md">
                <Link
                    href="/"
                    className="mb-8 flex justify-center items-center gap-2"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-white">
                        <MessageCircle
                            size={21}
                            fill="currentColor"
                        />
                    </div>

                    <span className="text-xl font-bold">
                        ChitChat
                    </span>
                </Link>

                <div className="rounded-3xl border bg-background p-6 shadow-sm sm:p-8">
                    <div className="mb-7">
                        <h1 className="text-2xl font-bold">
                            Create your account
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Start chatting with your friends and groups.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <Input
                            label="Full name"
                            type="text"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={(value) =>
                                setForm({
                                    ...form,
                                    name: value,
                                })
                            }
                        />

                        <Input
                            label="Username"
                            type="text"
                            placeholder="john_doe"
                            value={form.username}
                            onChange={(value) =>
                                setForm({
                                    ...form,
                                    username: value,
                                })
                            }
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(value) =>
                                setForm({
                                    ...form,
                                    email: value,
                                })
                            }
                        />

                        <PasswordInput
                            label="Password"
                            placeholder="At least 8 characters"
                            value={form.password}
                            show={showPassword}
                            onToggle={() =>
                                setShowPassword(!showPassword)
                            }
                            onChange={(value) =>
                                setForm({
                                    ...form,
                                    password: value,
                                })
                            }
                        />

                        <PasswordInput
                            label="Confirm password"
                            placeholder="Enter your password again"
                            value={form.confirmPassword}
                            show={showConfirmPassword}
                            onToggle={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                            onChange={(value) =>
                                setForm({
                                    ...form,
                                    confirmPassword: value,
                                })
                            }
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-violet-600 font-medium text-white transition hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2
                                        className="mr-2 animate-spin"
                                        size={18}
                                    />
                                    Creating account...
                                </>
                            ) : (
                                "Create account"
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-blue-600 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    By creating an account, you agree to our Terms
                    and Privacy Policy.
                </p>
            </div>
        </main>
    );
}

function Input({
    label,
    type,
    placeholder,
    value,
    onChange,
}: {
    label: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                {label}
            </label>

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
        </div>
    );
}

function PasswordInput({
    label,
    placeholder,
    value,
    show,
    onToggle,
    onChange,
}: {
    label: string;
    placeholder: string;
    value: string;
    show: boolean;
    onToggle: () => void;
    onChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                {label}
            </label>

            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border bg-background px-3 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    {show ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                </button>
            </div>
        </div>
    );
}