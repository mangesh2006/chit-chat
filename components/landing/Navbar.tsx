"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Home,
    Info,
    Menu,
    MessageCircle,
    Sparkles,
} from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState("home");

    const handleNavigation = (section: string) => {
        setActive(section);
        setOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-white shadow-sm">
                        <MessageCircle size={20} fill="currentColor" />
                    </div>

                    <span className="text-xl font-bold tracking-tight">
                        ChitChat
                    </span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    <Link
                        href="#home"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Home
                    </Link>

                    <Link
                        href="#features"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Features
                    </Link>

                    <Link
                        href="#about"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        About
                    </Link>
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        href="/login"
                        className="inline-flex h-10 items-center justify-center rounded-xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        Sign In
                    </Link>

                    <Link
                        href="/register"
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-5 text-sm font-medium text-white transition hover:from-blue-700 hover:to-violet-700"
                    >
                        Get Started
                    </Link>
                </div>

                <div className="md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger>
                            <Menu size={20} />
                            <span className="sr-only">
                                Open menu
                            </span>
                        </SheetTrigger>

                        <SheetContent
                            side="right"
                            className="w-[85%] max-w-90 p-0"
                        >
                            <div className="flex h-full flex-col">
                                <div className="border-b px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-white shadow-sm">
                                            <MessageCircle
                                                size={21}
                                                fill="currentColor"
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-bold tracking-tight">
                                                ChitChat
                                            </h2>

                                            <p className="text-xs text-muted-foreground">
                                                Chat. Share. Stay Connected.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <nav className="flex-1 px-4 py-6">
                                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Navigation
                                    </p>

                                    <div className="space-y-1">
                                        <Link
                                            href="#home"
                                            onClick={() =>
                                                handleNavigation("home")
                                            }
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${active === "home"
                                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            <Home size={18} />
                                            Home
                                        </Link>

                                        <Link
                                            href="#features"
                                            onClick={() =>
                                                handleNavigation("features")
                                            }
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${active === "features"
                                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            <Sparkles size={18} />
                                            Features
                                        </Link>

                                        <Link
                                            href="#about"
                                            onClick={() =>
                                                handleNavigation("about")
                                            }
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${active === "about"
                                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            <Info size={18} />
                                            About
                                        </Link>
                                    </div>
                                </nav>

                                <div className="border-t p-5">
                                    <div className="mb-4 rounded-xl bg-muted/60 p-4">
                                        <p className="text-sm font-medium">
                                            Start chatting today
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            Connect with friends, create groups
                                            and share anything you want.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href="/login"
                                            onClick={() => setOpen(false)}
                                            className="inline-flex h-11 w-full items-center justify-center rounded-xl border bg-background text-sm font-medium transition hover:bg-muted"
                                        >
                                            Sign In
                                        </Link>

                                        <Link
                                            href="/register"
                                            onClick={() => setOpen(false)}
                                            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-blue-600 to-violet-600 text-sm font-medium text-white shadow-sm transition hover:from-blue-700 hover:to-violet-700"
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}