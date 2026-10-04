import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPreview } from "./ChatPreview";
import Link from "next/link";

export function Hero() {
    return (
        <section id="home" className="relative">
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-125 w-200 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
                <div>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Connect with people, everywhere
                    </div>

                    <h1 className="max-w-2xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                        Chat.
                        <br />
                        Share.
                        <br />

                        <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            Stay Connected.
                        </span>
                    </h1>

                    <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
                        A simple and modern place to chat with friends,
                        create groups, and share photos, videos, and
                        documents — all in one place.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Button
                            size="lg"
                            className="rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-10 text-base hover:from-blue-700 hover:to-violet-700"
                        >
                            <Link href="/register" className="flex items-center">
                                Get Started
                                <ArrowRight className="ml-2" size={18} />
                            </Link>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-xl px-7 text-base"
                        >
                            <Link href="#features">
                                Learn More
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            Real-time messaging
                        </div>

                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            Media sharing
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <ChatPreview />
                </div>
            </div>
        </section>
    );
}