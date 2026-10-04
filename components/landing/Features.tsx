import {
    FileText,
    Image,
    MessageCircle,
    Users,
    Video,
    Zap,
} from "lucide-react";

const features = [
    {
        icon: MessageCircle,
        title: "Personal Chats",
        description:
            "Have private one-to-one conversations with your friends anytime.",
    },
    {
        icon: Users,
        title: "Group Chats",
        description:
            "Create or join groups and stay connected with your communities.",
    },
    {
        icon: Image,
        title: "Share Images",
        description:
            "Send photos and memories instantly without leaving the conversation.",
    },
    {
        icon: Video,
        title: "Share Videos",
        description:
            "Share your favourite videos directly with friends and groups.",
    },
    {
        icon: FileText,
        title: "Share Documents",
        description:
            "Send PDFs, notes and other important documents with ease.",
    },
    {
        icon: Zap,
        title: "Real-time Messaging",
        description:
            "Messages arrive instantly so conversations stay natural and fast.",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24">
            <div className="mx-auto max-w-7xl px-5 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold text-blue-600">
                        EVERYTHING YOU NEED
                    </p>

                    <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                        Everything in one conversation.
                    </h2>

                    <p className="mt-4 text-muted-foreground">
                        Chat, share and connect without jumping between
                        different apps.
                    </p>
                </div>

                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => {
                        const Icon = feature.icon;

                        return (
                            <div
                                key={feature.title}
                                className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950">
                                    <Icon size={22} />
                                </div>

                                <h3 className="text-lg font-semibold">
                                    {feature.title}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}