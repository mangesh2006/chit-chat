import {
    CheckCircle2,
    Lock,
    MessageCircle,
    Smartphone,
    Zap,
} from "lucide-react";

export function Showcase() {
    return (
        <section id="about" className="border-y bg-muted/30 py-24">
            <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-8">
                <div className="relative flex min-h-120 items-center justify-center">

                    <div className="absolute h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute left-[10%] top-12 hidden h-97.5 w-52.5 rotate-[-8deg] rounded-[2rem] border-4 bg-background shadow-xl sm:block">
                        <PhoneHeader />

                        <div className="space-y-3 p-3">
                            <PhoneChat name="Aarav Sharma" text="Hey! How are you?" />
                            <PhoneChat
                                name="College Friends"
                                text="You: Sent a photo"
                            />
                            <PhoneChat
                                name="Project Team"
                                text="Meeting at 5?"
                            />
                            <PhoneChat
                                name="Neha Verma"
                                text="See you!"
                            />
                        </div>
                    </div>

                    <div className="relative z-10 h-107.5 w-55 rotate-[4deg] rounded-[2rem] border-4 bg-background shadow-2xl">
                        <PhoneHeader />

                        <div className="flex h-87.5 flex-col justify-end gap-3 p-3">
                            <div className="rounded-xl bg-muted p-3 text-xs">
                                Hey! Check out this video 🎥
                            </div>

                            <div className="flex h-28 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-blue-600">
                                    <MessageCircle size={18} />
                                </div>
                            </div>

                            <div className="ml-auto rounded-xl bg-blue-600 px-3 py-2 text-xs text-white">
                                That's amazing! 🔥
                            </div>

                            <div className="rounded-xl border bg-background p-3 text-xs">
                                📄 Lecture_Notes.pdf
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Available everywhere
                    </div>

                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Stay in touch,
                        <br />

                        <span className="bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            wherever you are.
                        </span>
                    </h2>

                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                        Your conversations, groups, photos, videos and
                        documents — all together in one simple experience.
                    </p>

                    <div className="mt-8 space-y-5">
                        <Benefit
                            icon={<Lock size={18} />}
                            title="Private conversations"
                            text="Keep your conversations between you and the people you chat with."
                        />

                        <Benefit
                            icon={<Zap size={18} />}
                            title="Real-time messaging"
                            text="Send and receive messages instantly."
                        />

                        <Benefit
                            icon={<Smartphone size={18} />}
                            title="Works anywhere"
                            text="Use ChitChat from your desktop, tablet or phone."
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function Benefit({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950">
                {icon}
            </div>

            <div>
                <h3 className="font-semibold">{title}</h3>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {text}
                </p>
            </div>
        </div>
    );
}

function PhoneHeader() {
    return (
        <div className="flex h-12 items-center gap-2 border-b px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600 text-[10px] font-bold text-white">
                C
            </div>

            <span className="text-xs font-semibold">ChitChat</span>
        </div>
    );
}

function PhoneChat({
    name,
    text,
}: {
    name: string;
    text: string;
}) {
    return (
        <div className="flex gap-2 rounded-xl p-2">
            <div className="h-8 w-8 rounded-full bg-muted" />

            <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                    {text}
                </p>
            </div>
        </div>
    );
}