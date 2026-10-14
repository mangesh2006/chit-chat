
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogout = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || "Logout failed.");
            }

            router.replace("/login");
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not log out. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 border-t pt-5">
            <h3 className="font-medium">Log out</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Sign out of your ChitChat account on this device.
            </p>

            {error && (
                <p role="alert" className="mt-3 text-sm text-destructive">
                    {error}
                </p>
            )}

            <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
                {loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                    <LogOut className="h-4 w-4" />
                )}
                {loading ? "Logging out..." : "Log out"}
            </button>
        </div>
    );
}
