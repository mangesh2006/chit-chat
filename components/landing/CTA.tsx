import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

export function CTA() {
    return (
        <section className="px-5 py-24 lg:px-8">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 to-violet-600 px-6 py-14 text-white sm:px-12">
                <div className="flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
                    <div className="flex items-center gap-5">
                        <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:flex">
                            <MessageCircle size={30} />
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold">
                                Ready to start chatting?
                            </h2>

                            <p className="mt-2 text-sm text-white/80 sm:text-base">
                                Join ChitChat and connect with your friends,
                                groups and communities.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/register"
                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-white px-7 text-sm font-medium text-blue-600 transition hover:bg-white/90"
                    >
                        Get Started
                        <ArrowRight className="ml-2" size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
}