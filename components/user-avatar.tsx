"use client";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";

type UserAvatarProps = {
    src?: string | null;
    username?: string | null;
    name?: string | null;
    className?: string;
};

export default function UserAvatar({
    src,
    username,
    name,
    className,
}: UserAvatarProps) {
    const initial = name?.trim().charAt(0).toUpperCase() || "?";

    return (
        <Avatar className={className}>
            <AvatarImage
                src={src || undefined}
                alt={name || username || "User avatar"}
            />
            <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
    );
}