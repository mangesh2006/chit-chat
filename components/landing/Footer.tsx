import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";

export function Footer() {
    return (
        <footer className="border-t">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600 text-white">
                        <MessageCircle size={17} fill="currentColor" />
                    </div>

                    <span className="font-bold">ChitChat</span>
                </Link>

                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <Link href="#home" className="hover:text-foreground">
                        Home
                    </Link>

                    <Link href="#features" className="hover:text-foreground">
                        Features
                    </Link>

                    <Link href="#about" className="hover:text-foreground">
                        About
                    </Link>
                </div>

                <div className="flex items-center gap-4 text-muted-foreground">
                    <a
                        href="#"
                        aria-label="GitHub"
                        className="transition-colors hover:text-foreground"
                    >
                        <FaGithub size={18} />
                    </a>

                    <a
                        href="#"
                        aria-label="LinkedIn"
                        className="transition-colors hover:text-foreground"
                    >
                        <FaLinkedinIn size={18} />
                    </a>
                </div>
            </div>

            <div className="border-t py-5 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} ChitChat. All rights reserved.
            </div>
        </footer>
    );
}