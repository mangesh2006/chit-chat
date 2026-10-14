
"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setError("Your new password must be different.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/settings/change-password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || "Unable to change password.");
                return;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess(data.message || "Password changed successfully.");
        } catch {
            setError("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <KeyRound className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-medium">Change password</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose a strong password for your account.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {[
                    {
                        label: "Current password",
                        value: currentPassword,
                        setter: setCurrentPassword,
                        name: "currentPassword",
                    },
                    {
                        label: "New password",
                        value: newPassword,
                        setter: setNewPassword,
                        name: "newPassword",
                    },
                    {
                        label: "Confirm new password",
                        value: confirmPassword,
                        setter: setConfirmPassword,
                        name: "confirmPassword",
                    },
                ].map((field) => (
                    <div key={field.name} className="space-y-2">
                        <label
                            htmlFor={field.name}
                            className="text-sm font-medium"
                        >
                            {field.label}
                        </label>

                        <div className="relative">
                            <input
                                id={field.name}
                                name={field.name}
                                type={showPasswords ? "text" : "password"}
                                autoComplete={
                                    field.name === "currentPassword"
                                        ? "current-password"
                                        : "new-password"
                                }
                                value={field.value}
                                onChange={(e) => field.setter(e.target.value)}
                                disabled={loading}
                                className="w-full rounded-lg border bg-background px-3 py-2.5 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPasswords((value) => !value)}
                                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}

                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}

                {success && (
                    <p role="status" className="text-sm text-green-600">
                        {success}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                    {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {loading ? "Updating password..." : "Update password"}
                </button>
            </form>
        </div>
    );
}
