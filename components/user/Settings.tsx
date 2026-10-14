"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    Palette,
    ShieldCheck,
    MessageSquare,
    LockKeyhole,
    ChevronRight,
    ArrowLeft,
    Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import ChangePasswordForm from "./ChangePassword";
import LogoutButton from "./LogoutButton";

const settingsSections = [
    {
        id: "general",
        title: "General",
        description: "Appearance and notifications",
        icon: Palette,
    },
    {
        id: "privacy",
        title: "Privacy",
        description: "Control your visibility",
        icon: LockKeyhole,
    },
    {
        id: "security",
        title: "Security",
        description: "Manage account security",
        icon: ShieldCheck,
    },
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState("general");
    const { theme, setTheme } = useTheme();
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [savingPrivacy, setSavingPrivacy] = useState(false);

    const active = settingsSections.find(
        (section) => section.id === activeSection
    )!;

    const ActiveIcon = active.icon;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const loadPrivacy = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();

                if (data.success) {
                    setShowOnlineStatus(data.user.showOnlineStatus ?? true);
                }
            } catch (error) {
                console.error("LOAD_PRIVACY_ERROR:", error);
            }
        };

        loadPrivacy();
    }, []);

    return (
        <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8 sm:py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Settings
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Customize your ChitChat experience.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
                    <aside
                        className={`h-fit overflow-hidden rounded-xl border bg-card p-2 ${mobileDetailOpen ? "hidden md:block" : "block"
                            }`}
                    >
                        {settingsSections.map((section) => {
                            const Icon = section.icon;
                            const selected = activeSection === section.id;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        setActiveSection(section.id);
                                        setMobileDetailOpen(true);
                                    }}
                                    className={`mb-1 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors last:mb-0 ${selected
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-muted"
                                        }`}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />

                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium">
                                            {section.title}
                                        </span>
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                            {section.description}
                                        </span>
                                    </span>

                                    <ChevronRight className="h-4 w-4 shrink-0 md:hidden" />
                                </button>
                            );
                        })}
                    </aside>

                    <section className="min-w-0">
                        <div className="overflow-hidden rounded-xl border bg-card">
                            <div className="flex items-center gap-3 border-b p-5">
                                <button
                                    onClick={() => setMobileDetailOpen(false)}
                                    className="rounded-md p-2 hover:bg-muted md:hidden"
                                    aria-label="Back to settings"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>

                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <ActiveIcon className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="font-semibold">{active.title}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {active.description}
                                    </p>
                                </div>
                            </div>

                            {activeSection === "general" && (
                                <div className="divide-y">
                                    <div className="p-5">
                                        <h3 className="font-medium">Appearance</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Choose how ChitChat looks on this device.
                                        </p>

                                        <div className="mt-4 grid grid-cols-3 gap-3">
                                            {[
                                                { value: "light", label: "Light" },
                                                { value: "dark", label: "Dark" },
                                                { value: "system", label: "System" },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setTheme(option.value)}
                                                    className={`rounded-lg border p-3 text-sm transition-colors ${mounted && theme === option.value
                                                        ? "border-primary bg-accent font-medium"
                                                        : "hover:bg-muted"
                                                        }`}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        {mounted && theme === option.value && (
                                                            <Check className="h-4 w-4" />
                                                        )}
                                                        {option.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 p-5">
                                        <div>
                                            <h3 className="font-medium">Language</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Choose your preferred app language.
                                            </p>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            English
                                        </span>
                                    </div>
                                </div>
                            )}

                            {activeSection === "privacy" && (
                                <div className="divide-y">
                                    <div className="flex items-center justify-between gap-4 p-5">
                                        <div>
                                            <h3 className="font-medium">Show my online status</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Allow other users to see when you're online.
                                            </p>
                                        </div>

                                        <Switch
                                            checked={showOnlineStatus}
                                            disabled={savingPrivacy}
                                            onCheckedChange={async (checked) => {
                                                setSavingPrivacy(true);

                                                try {
                                                    const res = await fetch("/api/settings/privacy", {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ showOnlineStatus: checked }),
                                                    });

                                                    const data = await res.json();

                                                    if (!res.ok || !data.success) {
                                                        throw new Error(data.message || "Failed to update privacy");
                                                    }

                                                    setShowOnlineStatus(checked);

                                                    window.dispatchEvent(
                                                        new CustomEvent("online-status-preference-changed", {
                                                            detail: { showOnlineStatus: checked },
                                                        })
                                                    );
                                                } catch (error) {
                                                    console.error("UPDATE_PRIVACY_ERROR:", error);
                                                    alert("Could not update online status preference.");
                                                } finally {
                                                    setSavingPrivacy(false);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeSection === "security" && (
                                <div>
                                    <ChangePasswordForm />
                                    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                                        <LogoutButton />
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="mt-6 text-center text-xs text-muted-foreground">
                            Your ChitChat experience, your way.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

function SettingsPlaceholder({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="p-6 sm:p-8">
            <h3 className="font-medium">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
            </p>
            <div className="mt-5 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                These settings will be available when their functionality is
                implemented.
            </div>
        </div>
    );
}