
"use client";

import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Camera,
    Check,
    ChevronRight,
    CircleUserRound,
    Clock3,
    Loader2,
    Mail,
    Pencil,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSignedURL, saveAvatar } from "@/app/actions/s3";

type Profile = {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string | null;
    emailVerified: boolean;
    createdAt?: string;
};

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [name, setName] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        let active = true;

        async function loadProfile() {
            try {
                const response = await fetch("/api/auth/me", {
                    cache: "no-store",
                });

                const data = await response.json();

                if (response.status === 401) {
                    router.replace("/login");
                    return;
                }

                if (!response.ok || !data.success || !data.user) {
                    throw new Error(data.message || "Unable to load your profile.");
                }

                if (!active) return;

                const user = data.user as Profile;
                setProfile(user);
                setName(user.name);
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error ? err.message : "Something went wrong."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadProfile();

        return () => {
            active = false;
        };
    }, [router]);

    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const initials = (profile?.name || "U")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    function cancelEditing() {
        setName(profile?.name ?? "");
        setPreview(null);
        setEditing(false);
        setError("");
        setSuccess("");
    }

    function choosePhoto(file?: File) {
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setError("Please select a JPG, PNG, or WebP image.");
            return;
        }

        if (file.size === 0 || file.size > 5 * 1024 * 1024) {
            setError("Your image must be smaller than 5 MB.");
            return;
        }

        setError("");
        setSuccess("");
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
    }

    async function saveProfile() {
        const trimmedName = name.trim();

        if (trimmedName.length < 2 || trimmedName.length > 60) {
            setError("Name must be between 2 and 60 characters.");
            return;
        }

        if (preview) {
            setError(
                "Your photo preview is ready, but photo uploads need to be connected to your storage service."
            );
            return;
        }

        if (trimmedName === profile?.name) {
            setEditing(false);
            setError("");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmedName }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not save your changes.");
            }

            setProfile((current) =>
                current ? { ...current, name: data.user.name } : current
            );
            setName(data.user.name);
            setEditing(false);
            setSuccess("Your profile has been updated.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background p-6">
                <Card className="w-full max-w-md rounded-2xl">
                    <CardContent className="p-6 text-center">
                        <CircleUserRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                        <h1 className="text-lg font-semibold">Profile unavailable</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {error || "We couldn't load your profile."}
                        </p>
                        <Button className="mt-5" onClick={() => window.location.reload()}>
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    async function updateAvatar() {
        if (!selectedFile) return;

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const signedData = await getSignedURL(
                selectedFile.type,
                selectedFile.size
            );

            if (!signedData.success || !signedData.url || !signedData.key) {
                throw new Error(signedData.message || "Could not prepare upload");
            }

            const uploadResponse = await fetch(signedData.url, {
                method: "PUT",
                headers: {
                    "Content-Type": selectedFile.type,
                },
                body: selectedFile,
            });

            if (!uploadResponse.ok) {
                throw new Error("S3 upload failed. Check bucket CORS.");
            }

            const saved = await saveAvatar(signedData.key);

            if (!saved.success) {
                throw new Error(saved.message || "Could not save avatar");
            }

            const response = await fetch("/api/auth/me", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error("Avatar saved, but refreshing the profile failed.");
            }

            setProfile(data.user);
            setPreview(null);
            setSelectedFile(null);
            setSuccess("Avatar updated successfully!");
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Upload failed"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-5xl">
                <header className="mb-8 flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl bg-background"
                        onClick={() => router.back()}
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div>
                        <p className="text-sm text-muted-foreground">Your account</p>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Profile
                        </h1>
                    </div>
                </header>

                <Card className="mb-6 overflow-hidden rounded-3xl border-border/70 bg-background shadow-sm">
                    <div className="relative h-36 overflow-hidden bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-400 sm:h-48 -mt-4">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.2),transparent_35%)]" />
                        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/20" />
                        <div className="absolute -right-2 -top-12 h-48 w-48 rounded-full border border-white/20" />
                    </div>

                    <CardContent className="relative px-5 pb-6 sm:px-8">
                        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex min-w-0 items-end gap-4 mt-3">
                                <div className="relative z-10 shrink-0">
                                    <Avatar className="h-24 w-24 border-4 border-background bg-background shadow-md sm:h-28 sm:w-28">
                                        <AvatarImage
                                            src={preview || profile.avatar || undefined}
                                            alt={profile.name}
                                        />
                                        <AvatarFallback className="bg-muted text-2xl font-semibold text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground transition hover:opacity-90"
                                        aria-label="Choose profile picture"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) => {
                                            choosePhoto(event.target.files?.[0]);
                                            event.currentTarget.value = "";
                                        }}
                                    />
                                </div>

                                <div className="min-w-0 pb-1">
                                    <h2 className="truncate text-xl font-bold sm:text-2xl">
                                        {profile.name}
                                    </h2>
                                    <p className="truncate text-sm text-muted-foreground">
                                        @{profile.username}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        ChitChat member
                                    </div>
                                </div>
                            </div>

                            {!editing && (
                                <Button
                                    className="rounded-xl sm:mb-1"
                                    onClick={() => {
                                        setEditing(true);
                                        setSuccess("");
                                        setError("");
                                    }}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit profile
                                </Button>
                            )}
                        </div>


                        {preview && (
                            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                                <Avatar className="h-16 w-16 shrink-0">
                                    <AvatarImage src={preview} alt="New profile photo preview" />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                    <p className="font-medium">New profile photo</p>
                                    <p className="text-sm text-muted-foreground">
                                        Preview your photo before updating your profile.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setPreview(null);
                                            setSelectedFile(null);
                                            setError("");
                                        }}
                                        disabled={saving}
                                    >
                                        Remove
                                    </Button>

                                    <Button
                                        onClick={updateAvatar}
                                        disabled={!selectedFile || saving}
                                    >
                                        {saving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Camera className="mr-2 h-4 w-4" />
                                        )}
                                        {saving ? "Uploading..." : "Update photo"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <Card className="rounded-3xl border-border/70 bg-background shadow-sm">
                        <CardContent className="p-5 sm:p-7">
                            <div className="mb-7 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <UserRound className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Personal information</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Manage the details associated with your account.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="profile-name">Full name</Label>
                                    <Input
                                        id="profile-name"
                                        value={name}
                                        disabled={!editing || saving}
                                        onChange={(event) => setName(event.target.value)}
                                        maxLength={60}
                                        className="h-11 rounded-xl"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="profile-username">Username</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                            @
                                        </span>
                                        <Input
                                            id="profile-username"
                                            value={profile.username}
                                            readOnly
                                            className="h-11 rounded-xl bg-muted/50 pl-8"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Your username is used by others to find you.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="profile-email">Email address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="profile-email"
                                            value={profile.email}
                                            readOnly
                                            className="h-11 rounded-xl bg-muted/50 pl-9"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <ShieldCheck
                                            className={`h-3.5 w-3.5 ${profile.emailVerified
                                                ? "text-emerald-600"
                                                : "text-amber-600"
                                                }`}
                                        />
                                        <span className="text-muted-foreground">
                                            {profile.emailVerified
                                                ? "Email verified"
                                                : "Email not verified"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p role="alert" className="mt-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </p>
                            )}

                            {success && (
                                <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                                    {success}
                                </p>
                            )}

                            {editing && (
                                <div className="mt-7 flex flex-wrap justify-end gap-3 border-t pt-5">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={cancelEditing}
                                        disabled={saving}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        className="rounded-xl"
                                        onClick={saveProfile}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="mr-2 h-4 w-4" />
                                        )}
                                        {saving ? "Saving..." : "Save changes"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="rounded-3xl border-border/70 bg-background shadow-sm">
                            <CardContent className="p-5 sm:p-6">
                                <h3 className="font-semibold">Account overview</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    A quick look at your account.
                                </p>

                                <div className="mt-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                            <CircleUserRound className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Username</p>
                                            <p className="truncate text-sm font-medium">
                                                @{profile.username}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Account security
                                            </p>
                                            <p className="text-sm font-medium">
                                                {profile.emailVerified ? "Email verified" : "Verification pending"}
                                            </p>
                                        </div>
                                    </div>

                                    {profile.createdAt && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                                                <Clock3 className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Member since
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {new Date(profile.createdAt).toLocaleDateString(
                                                        undefined,
                                                        { month: "long", year: "numeric" }
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/70 bg-background shadow-sm">
                            <CardContent className="p-5 sm:p-6">
                                <h3 className="font-semibold">Account settings</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Manage other parts of your account.
                                </p>

                                <Link
                                    href="/settings"
                                    className="mt-5 flex items-center justify-between rounded-xl border p-3 transition hover:bg-muted/50"
                                >
                                    <div>
                                        <p className="text-sm font-medium">Settings</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Preferences and security
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground">
                    Your profile information is managed securely by ChitChat.
                </p>
            </div>
        </main>
    );
}
