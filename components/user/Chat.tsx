"use client";

import {
    ArrowLeft,
    FileText,
    ImageIcon,
    Loader2,
    MessageCircle,
    MoreVertical,
    Paperclip,
    Send,
    Smile,
    X,
    Trash2,
    CircleMinus,
    Info,
    ExternalLink,
    Images,
    ChevronDown,
    Copy,
    MessageSquare,
    UserGroup,
    UserRoundPlus,
    LogOut,
    Camera,
    Plus,
    UsersRound,
    Search,
    CheckCircle2,
    Pencil
} from "lucide-react";

import React, { useEffect, useMemo, useState, useRef } from "react";

import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import { io } from "socket.io-client"
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Label } from "../ui/label";

type GroupMember = {
    id: string;
    name: string;
    username: string;
    role: string;
}

type Conversation = {
    id: string;
    name: string;
    isGroup: boolean;

    userId: string;
    username?: string;
    avatar?: string | null;

    lastMessage?: string;
    lastMessageTime?: string;
    online?: boolean;

    members?: GroupMember[];
};

type MessageAttachment = {
    id: string;
    type: "IMAGE" | "VIDEO" | "DOCUMENT";
    url: string;
    name: string | null;
    size: number | null;
    mimeType: string | null;
};

type Message = {
    id: string;
    senderId: string;
    content: string;
    time: string;
    attachments?: MessageAttachment[];
    sender?: {
        id: string;
        name: string;
        username: string;
        avatar: string | null;
    };
    type?: string
};

type User = {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
};

const EmojiPicker = dynamic(
    () => import("emoji-picker-react"),
    { ssr: false }
);

export default function ChatPage() {
    const [selectedConversation, setSelectedConversation] =
        useState<Conversation | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    const [message, setMessage] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);

    const socket = useMemo(() => io("https://server.chitchat-backend.publicvm.com", { autoConnect: false }), [])

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [Username, setUsername] = useState<string | null>(null)
    const [Name, setName] = useState("")
    const [Loading, setLoading] = useState(false)
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
    const [ChatLoading, setChatLoading] = useState(false)
    const [userAvatar, setUserAvatar] = useState("")

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);

    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [isClearingChat, setIsClearingChat] = useState(false);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeletingChat, setIsDeletingChat] = useState(false);

    const [infoOpen, setInfoOpen] = useState(false);

    const [showOnlineStatus, setShowOnlineStatus] = useState(true);

    const showOnlineStatusRef = useRef(true);

    const [Logoutloading, setLogoutLoading] = useState(false);
    const [AddGroupOpen, setAddGroupOpen] = useState(false);

    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const GroupfileInputRef = useRef<HTMLInputElement>(null);
    const [groupAvatarFile, setGroupAvatarFile] =
        useState<File | null>(null);

    const [GroupName, setGroupName] = useState("")

    const [UserssearchQuery, setUsersSearchQuery] = useState("");
    const [allUsers, setAllUsers] = useState<typeof searchResults>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const [creatingGroup, setCreatingGroup] = useState(false);

    const [activeSidebarTab, setActiveSidebarTab] = useState<
        "chats" | "groups"
    >("chats");

    const filteredConversations = conversations.filter((conversation) =>
        activeSidebarTab === "chats"
            ? !conversation.isGroup
            : conversation.isGroup
    );

    useEffect(() => {
        if (!AddGroupOpen) return;

        const controller = new AbortController();

        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);

                const response = await fetch("/api/users", {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }

                const data = await response.json();

                setAllUsers(Array.isArray(data) ? data : data.users);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name !== "AbortError"
                ) {
                    console.error("Error fetching users:", error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingUsers(false);
                }
            }
        };

        fetchUsers();

        return () => controller.abort();
    }, [AddGroupOpen]);

    useEffect(() => {
        showOnlineStatusRef.current = showOnlineStatus;
    }, [showOnlineStatus]);

    const router = useRouter()

    const selectedConversationRef = useRef<Conversation | null>(null);

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    const handleOnlineUsers = (userIds: string[]) => {
        console.log("CURRENTLY ONLINE:", userIds);
        setOnlineUserIds(userIds);
    };

    const handleUserStatus = ({
        userId,
        online,
    }: {
        userId: string;
        online: boolean;
    }) => {
        console.log("USER STATUS:", userId, online);

        setOnlineUserIds((prev) => {
            if (online) {
                return prev.includes(userId) ? prev : [...prev, userId];
            }

            return prev.filter((id) => id !== userId);
        });
    };

    useEffect(() => {
        setConversations((prev) =>
            prev.map((conversation) => ({
                ...conversation,
                online: onlineUserIds.includes(conversation.userId),
            }))
        );

        setSelectedConversation((prev) =>
            prev
                ? {
                    ...prev,
                    online: onlineUserIds.includes(prev.userId),
                }
                : prev
        );
    }, [onlineUserIds]);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const res = await fetch("/api/auth/me");

                const data = await res.json();

                if (data.success) {
                    setCurrentUserId(data.user.id);
                    setUsername(data.user.username)
                    setName(data.user.name)
                    setUserAvatar(data.user.avatar)
                    setShowOnlineStatus(data.user.showOnlineStatus ?? true);
                }
            } catch (error) {
                console.error("FETCH_CURRENT_USER_ERROR:", error);
            }
        };

        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        const handleConnect = () => {
            console.log("Socket connected:", socket.id);

            socket.emit("user-online", {
                userId: currentUserId,
                showOnlineStatus: showOnlineStatusRef.current,
            });
        };

        const handleNewMessage = (incomingMessage: any) => {
            const activeConversationId = selectedConversationRef.current?.id;

            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation.id === incomingMessage.conversationId
                        ? {
                            ...conversation,
                            lastMessage: incomingMessage.content ?? "",
                            lastMessageTime: new Date(
                                incomingMessage.createdAt
                            ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                        }
                        : conversation
                )
            );

            if (incomingMessage.conversationId !== activeConversationId) {
                return;
            }

            setMessages((prev) => {
                if (prev.some((msg) => msg.id === incomingMessage.id)) {
                    return prev;
                }

                return [
                    ...prev,
                    {
                        id: incomingMessage.id,
                        senderId: incomingMessage.senderId,
                        content: incomingMessage.content ?? "",
                        time: new Date(incomingMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        attachments: incomingMessage.attachments ?? [],
                    },
                ];
            });
        };

        socket.on("connect", handleConnect);
        socket.on("new-message", handleNewMessage);

        socket.on("user-status", handleUserStatus);
        socket.on("online-users", handleOnlineUsers);

        socket.connect();

        return () => {
            socket.off("connect", handleConnect);
            socket.off("new-message", handleNewMessage);
            socket.off("user-status", handleUserStatus);
            socket.off("online-users", handleOnlineUsers);

            socket.disconnect();
        };
    }, [socket, currentUserId]);

    useEffect(() => {
        const handlePreferenceChange = (event: Event) => {
            const customEvent = event as CustomEvent<{
                showOnlineStatus: boolean;
            }>;

            const visible = customEvent.detail.showOnlineStatus;

            setShowOnlineStatus(visible);

            if (currentUserId && socket.connected) {
                socket.emit("update-online-visibility", {
                    userId: currentUserId,
                    visible,
                });
            }
        };

        window.addEventListener(
            "online-status-preference-changed",
            handlePreferenceChange
        );

        return () => {
            window.removeEventListener(
                "online-status-preference-changed",
                handlePreferenceChange
            );
        };
    }, [currentUserId, socket]);

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true)
            try {
                const res = await fetch("/api/conversations");

                const data = await res.json();

                if (data.success) {
                    setConversations(
                        data.conversations.map((conversation: Conversation) => ({
                            ...conversation,
                            online: onlineUserIds.includes(conversation.userId),
                        }))
                    );
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false)
            }
        };

        fetchConversations();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const searchUsers = async () => {
            try {
                setSearching(true);

                console.log("Searching for:", JSON.stringify(searchQuery));

                const res = await fetch(
                    `/api/users/search?q=${encodeURIComponent(searchQuery)}`
                );

                const data = await res.json();

                console.log("Search response:", data);

                if (data.success) {
                    setSearchResults(data.users);
                }
            } catch (error) {
                console.error("SEARCH_ERROR:", error);
            } finally {
                setSearching(false);
            }
        };

        searchUsers();
    }, [searchQuery]);

    const selectConversation = async (conversation: Conversation) => {
        setSelectedConversation(conversation);

        socket.emit("join-conversation", conversation.id);

        try {
            setChatLoading(true)
            const res = await fetch(
                `/api/conversations/${conversation.id}/messages`
            );

            const data = await res.json();

            if (data.success) {
                const formattedMessages: Message[] = data.messages.map((msg: any) => ({
                    ...msg,
                    time: new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    attachments: msg.attachments ?? [],
                }));

                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setChatLoading(false)
        }
    };


    const sendMessage = async () => {
        if (
            isUploading ||
            (!message.trim() && !selectedFile) ||
            !selectedConversation ||
            !currentUserId
        ) {
            return;
        }

        setIsUploading(true);

        const content = message.trim();
        const sendingFile = selectedFile;
        const currentPreviewUrl = previewUrl;
        const conversationId = selectedConversation.id;

        const tempId = `temp-${crypto.randomUUID()}`;

        const tempMessage: Message = {
            id: tempId,
            senderId: currentUserId,
            sender: {
                id: currentUserId,
                name: "You",
                username: "",
                avatar: null,
            },
            content,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            attachments: [],
        };

        if (!sendingFile) {
            setMessages((prev) => [...prev, tempMessage]);
            setMessage("");
        }

        try {
            const formData = new FormData();

            formData.append("content", content);

            if (sendingFile) {
                formData.append("file", sendingFile);
            }

            const response = await fetch(
                `/api/conversations/${conversationId}/messages`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to send message");
            }

            const savedMessage: Message = {
                ...data.message,
                id: data.message.id,
                senderId: data.message.senderId,
                sender: data.message.sender,
                content: data.message.content ?? "",
                time: new Date(data.message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                attachments: data.message.attachments ?? [],
            };

            if (sendingFile) {
                setMessages((prev) => [...prev, savedMessage]);
            } else {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === tempId ? savedMessage : msg
                    )
                );
            }

            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation.id === conversationId
                        ? {
                            ...conversation,
                            lastMessage:
                                content ||
                                (sendingFile
                                    ? `📎 ${sendingFile.name}`
                                    : ""),
                            lastMessageTime: savedMessage.time,
                        }
                        : conversation
                )
            );

            setMessage("");

            if (sendingFile) {
                setSelectedFile(null);

                if (currentPreviewUrl) {
                    URL.revokeObjectURL(currentPreviewUrl);
                    setPreviewUrl(null);
                }
            }

            socket.emit("send-message", {
                message: {
                    ...data.message,
                    conversationId,
                },
                conversationId,
            });
        } catch (error) {
            console.error("SEND_MESSAGE_ERROR:", error);

            if (!sendingFile) {
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== tempId)
                );
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleUserClick = async (user: User) => {
        const res = await fetch("/api/conversations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: user.id,
            }),
        });

        const data = await res.json();

        if (!data.success) return;

        setSearchQuery("");
        setSearchResults([]);

        await selectConversation(data.conversation);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()

        const file = e.target.files?.[0];

        if (!file) return;

        setSelectedFile(file);

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }

        e.target.value = "";
    }

    const handleClearChat = async () => {
        if (!selectedConversation || isClearingChat) return;

        setIsClearingChat(true);

        try {
            const response = await fetch(
                `/api/conversations/${selectedConversation.id}/clear`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to clear chat");
            }

            setMessages([]);

            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation.id === selectedConversation.id
                        ? {
                            ...conversation,
                            lastMessage: "",
                            lastMessageTime: "",
                        }
                        : conversation
                )
            );

            setClearDialogOpen(false);
        } catch (error) {
            console.error("CLEAR_CHAT_ERROR:", error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to clear chat"
            );
        } finally {
            setIsClearingChat(false);
        }
    };

    const handleDeleteChat = async () => {
        if (!selectedConversation || isDeletingChat) return;

        const conversationId = selectedConversation.id;
        setIsDeletingChat(true);

        try {
            const response = await fetch(
                `/api/conversations/${conversationId}/delete`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to delete chat");
            }

            setConversations((prev) =>
                prev.filter((conversation) => conversation.id !== conversationId)
            );

            setSelectedConversation(null);
            setMessages([]);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("DELETE_CHAT_ERROR:", error);
            alert(error instanceof Error ? error.message : "Failed to delete chat");
        } finally {
            setIsDeletingChat(false);
        }
    };

    const handleCopyMessage = async (content: string) => {
        if (!content.trim()) {
            alert("This message has no text to copy.");
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
        } catch (error) {
            console.error("COPY_MESSAGE_ERROR:", error);
            alert("Unable to copy message.");
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);

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
            console.log(err)
        } finally {
            setLogoutLoading(false);
        }
    };

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

    const filteredUsers = allUsers.filter((user) => {
        const query = UserssearchQuery.trim().toLowerCase();

        if (!query) return true;

        return (
            user.name?.toLowerCase().includes(query) ||
            user.username?.toLowerCase().includes(query)
        );
    });

    const handleUsersSelection = (user: User) => {
        setSelectedUsers((prev) => {
            if (prev.some((selected) => selected.id === user.id)) {
                return prev;
            }

            return [...prev, user];
        });

        setUsersSearchQuery("");
    }

    const handleCreateGroup = async () => {
        const name = GroupName.trim();

        if (!name || selectedUsers.length === 0 || creatingGroup) {
            return;
        }

        try {
            setCreatingGroup(true);

            const formData = new FormData();

            formData.append("name", GroupName.trim());
            formData.append(
                "memberIds",
                JSON.stringify(selectedUsers.map((user) => user.id))
            );

            if (groupAvatarFile) {
                formData.append("avatar", groupAvatarFile);
            }

            const response = await fetch("/api/group", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create group");
            }

            const newConversation: Conversation = {
                id: data.conversation.id,
                name: data.conversation.name || name,
                isGroup: true,
                userId: "",
                username: "",
                avatar: data.avatarUrl ?? null,
                lastMessage: "",
                lastMessageTime: "",
                online: false,

                members: data.conversation.participants.map(
                    (participant: {
                        user: {
                            id: string;
                            name: string;
                            username: string;
                            avatar: string | null;
                        };
                        role: string;
                    }) => ({
                        id: participant.user.id,
                        name: participant.user.name,
                        username: participant.user.username,
                        avatar: participant.user.avatar,
                        role: participant.role,
                    })
                ),
            };

            setConversations((prev) => [
                newConversation,
                ...prev.filter((item) => item.id !== newConversation.id),
            ]);

            setSelectedConversation(newConversation);
            setAddGroupOpen(false);
            setGroupName("");
            setUsersSearchQuery("");
            setSelectedUsers([]);
            setPreview(null);

            await selectConversation(newConversation);
        } catch (error) {
            console.error("CREATE_GROUP_ERROR:", error);
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleEditMessage = async () => {

    }

    const handleDeleteMessage = async () => {

    }

    return (
        <main className="h-screen overflow-hidden bg-background">
            <div className="flex h-full">
                <header className="h-full flex flex-col items-center justify-between p-2 border-r bg-accent/60">

                    <div className="flex flex-col gap-5">
                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    onClick={() => {
                                        setActiveSidebarTab("chats");
                                        setSelectedConversation(null);
                                    }}
                                    aria-label="Chats"
                                    aria-pressed={activeSidebarTab === "chats"}
                                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${activeSidebarTab === "chats"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent"
                                        }`}
                                >
                                    <MessageSquare size={21} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">Chats</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    onClick={() => {
                                        setActiveSidebarTab("groups");
                                        setSelectedConversation(null);
                                    }}
                                    aria-label="Groups"
                                    aria-pressed={activeSidebarTab === "groups"}
                                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${activeSidebarTab === "groups"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent"
                                        }`}
                                >
                                    <UsersRound size={21} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">Groups</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    onClick={() => setAddGroupOpen(true)}
                                    aria-label="Create new group"
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
                                >
                                    <UserRoundPlus size={21} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">New Group</TooltipContent>
                        </Tooltip>
                    </div>


                    <Sheet open={AddGroupOpen} onOpenChange={setAddGroupOpen}>
                        <SheetContent
                            side="right"
                            className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
                        >
                            <SheetHeader className="border-b px-6 py-5 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <UsersRound className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <SheetTitle className="text-lg font-semibold">
                                            Create new group
                                        </SheetTitle>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Bring people together in one place.
                                        </p>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-24 w-24 border-4 border-background shadow-md ring-1 ring-border sm:h-28 sm:w-28">
                                            <AvatarImage
                                                src={preview || undefined}
                                                alt={GroupName || "Group photo"}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-primary/10 text-3xl font-semibold text-primary">
                                                {GroupName.trim().charAt(0).toUpperCase() || (
                                                    <UsersRound className="h-9 w-9" />
                                                )}
                                            </AvatarFallback>
                                        </Avatar>

                                        <input type="file" ref={GroupfileInputRef} hidden onChange={(event) => {
                                            const file = event.target.files?.[0];

                                            if (!file) return;

                                            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                                                alert("Choose a JPG, PNG, or WebP image.");
                                                event.target.value = "";
                                                return;
                                            }

                                            if (file.size > 5 * 1024 * 1024) {
                                                alert("Image must be smaller than 5 MB.");
                                                event.target.value = "";
                                                return;
                                            }

                                            setGroupAvatarFile(file);
                                            setPreview(URL.createObjectURL(file));
                                        }} />

                                        <button
                                            type="button"
                                            onClick={() => GroupfileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background transition hover:scale-105 hover:bg-primary/90"
                                            aria-label="Choose group photo"
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

                                    <div className="text-center">
                                        <p className="text-sm font-medium">Group photo</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Add a photo to make your group recognizable.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="group-name" className="text-sm font-medium">
                                        Group name
                                    </Label>

                                    <Input
                                        id="group-name"
                                        value={GroupName}
                                        onChange={(event) => setGroupName(event.target.value)}
                                        maxLength={60}
                                        className="h-11 rounded-xl"
                                        placeholder="e.g. Weekend Friends"
                                    />

                                    <p className="text-right text-xs text-muted-foreground">
                                        {GroupName.length}/60
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <h3 className="text-sm font-semibold">Add members</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Select people to add to your group.
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                        <Input
                                            placeholder="Search by name or username..."
                                            value={UserssearchQuery}
                                            onChange={(event) =>
                                                setUsersSearchQuery(event.target.value)
                                            }
                                            className="h-11 rounded-xl pl-9"
                                        />
                                    </div>

                                    <div className="overflow-hidden rounded-xl border">
                                        <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {UserssearchQuery.trim()
                                                    ? "Search results"
                                                    : "All users"}
                                            </span>

                                            {!loadingUsers && (
                                                <span className="text-xs text-muted-foreground">
                                                    {filteredUsers.length} users
                                                </span>
                                            )}
                                        </div>

                                        {selectedUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-2 p-2">
                                                {selectedUsers.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedUsers((prev) =>
                                                                prev.filter((item) => item.id !== user.id)
                                                            )
                                                        }
                                                        className="flex items-center gap-2 rounded-full border bg-primary/5 py-1 pl-1 pr-3 text-sm hover:bg-accent"
                                                    >
                                                        <UserAvatar
                                                            src={user.avatar}
                                                            username={user.username}
                                                            name={user.name}
                                                            className="h-7 w-7"
                                                        />

                                                        <span>{user.name}</span>
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="max-h-64 overflow-y-auto">
                                            {loadingUsers ? (
                                                <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading users...
                                                </div>
                                            ) : filteredUsers.length === 0 ? (
                                                <div className="flex flex-col items-center gap-2 p-7 text-center">
                                                    <UsersRound className="h-8 w-8 text-muted-foreground/50" />

                                                    <p className="text-sm font-medium">
                                                        {UserssearchQuery.trim()
                                                            ? "No users found"
                                                            : "No users available"}
                                                    </p>

                                                    <p className="text-xs text-muted-foreground">
                                                        {UserssearchQuery.trim()
                                                            ? "Try another name or username."
                                                            : "Users will appear here when available."}
                                                    </p>
                                                </div>
                                            ) : (
                                                filteredUsers.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        type="button"
                                                        onClick={() => handleUsersSelection(user)}
                                                        className="flex w-full items-center gap-3 border-b p-3 text-left transition hover:bg-accent"
                                                    >
                                                        <UserAvatar
                                                            src={user.avatar}
                                                            username={user.username}
                                                            name={user.name}
                                                            className="h-10 w-10"
                                                        />

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{user.name}</p>
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                @{user.username}
                                                            </p>
                                                        </div>

                                                        {selectedUsers.some((selected) => selected.id === user.id) ? (
                                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 px-6 py-4 mb-2">
                                <Button
                                    type="button"
                                    className="h-11 w-full rounded-xl"
                                    disabled={
                                        !GroupName.trim() ||
                                        selectedUsers.length === 0 ||
                                        creatingGroup
                                    }
                                    onClick={handleCreateGroup}
                                >
                                    {creatingGroup ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating group...
                                        </>
                                    ) : (
                                        <>
                                            <UsersRound className="mr-2 h-4 w-4" />
                                            Create Group
                                            <span className="ml-2">
                                                ({selectedUsers.length})
                                            </span>
                                        </>
                                    )}
                                </Button>

                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                    {selectedUsers.length === 0
                                        ? "Select at least one member to continue."
                                        : `${selectedUsers.length} member${selectedUsers.length === 1 ? "" : "s"
                                        } selected`}
                                </p>
                            </div>

                            <div className="border-t bg-background px-6 py-4">
                                <p className="text-xs text-muted-foreground">
                                    Review your group details before creating it.
                                </p>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="flex items-center flex-col gap-4">
                        <Tooltip>
                            <TooltipTrigger className={"text-center"}>
                                {Logoutloading ? <Loader2 className="animate-spin" /> : <LogOut className="text-red-600 cursor-pointer rounded-full p-2 hover:bg-accent" size={40} onClick={handleLogout} />}
                            </TooltipTrigger>

                            <TooltipContent side="right" className={"text-red-600"}>
                                Logout
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger className={"hover:bg-accent rounded-full p-1"}>
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/profile")}>
                                    <UserAvatar
                                        src={userAvatar}
                                        username={Username}
                                        name={Name}
                                        className="h-9 w-9"
                                    />
                                </div>
                            </TooltipTrigger>

                            <TooltipContent side="right">
                                You
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </header>

                <aside
                    className={`w-full shrink-0 border-r md:w-85 lg:w-160 bg-accent/40 ${selectedConversation
                        ? "hidden md:flex"
                        : "flex"
                        } flex-col`}
                >
                    <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-white shadow-sm">
                                <MessageCircle size={20} fill="currentColor" />
                            </div>
                            <h1 className="text-xl font-bold">
                                ChitChat
                            </h1>
                        </div>
                    </div>

                    {activeSidebarTab === "chats" && (
                        <div className="border-b p-3">
                            <div className="relative">
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="rounded-full py-5"
                                />

                                {searchQuery.trim() && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-background shadow-lg overflow-hidden">
                                        {searching ? (
                                            <div className="p-4 text-sm text-muted-foreground">
                                                Searching...
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="p-4 text-sm text-muted-foreground">
                                                No users found
                                            </div>
                                        ) : (
                                            searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleUserClick(user)}
                                                    className="flex w-full items-center gap-3 p-3 text-left bg-accent/40 hover:bg-accent transition duration-200 cursor-pointer"
                                                >
                                                    <UserAvatar
                                                        src={user.avatar}
                                                        username={user.username}
                                                        name={user.name}
                                                        className="h-10 w-10"
                                                    />

                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            @{user.username}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-2">
                        {Loading ?
                            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                <Loader2 className="animate-spin" />

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Loading your conversations...
                                </p>
                            </div> : filteredConversations.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                        <MessageCircle className="h-7 w-7 text-primary" />
                                    </div>

                                    <h2 className="font-semibold">
                                        {activeSidebarTab === "chats"
                                            ? "No chats yet"
                                            : "No groups yet"}
                                    </h2>

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {activeSidebarTab === "chats"
                                            ? "Search for a user to start your first conversation."
                                            : "Groups you belong to will appear here."}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {filteredConversations.map((conversation) => (
                                        <button
                                            key={conversation.id}
                                            type="button"
                                            onClick={() => selectConversation(conversation)}
                                            className={`flex cursor-pointer hover:rounded-xl w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 mb-2 ${selectedConversation?.id ===
                                                conversation.id
                                                ? "bg-muted rounded-xl"
                                                : ""
                                                }`}
                                        >
                                            <div className="relative shrink-0">
                                                {conversation.isGroup ? (
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage
                                                            src={conversation.avatar ?? undefined}
                                                            alt={conversation.name}
                                                            className="object-cover"
                                                        />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            <UsersRound className="h-6 w-6" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <UserAvatar
                                                        src={conversation.avatar}
                                                        username={conversation.username}
                                                        name={conversation.name}
                                                        className="h-12 w-12"
                                                    />
                                                )}

                                                {!conversation.isGroup && conversation.online && (
                                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="truncate text-sm font-semibold">
                                                        {conversation.name}
                                                    </p>

                                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                                        {
                                                            conversation.lastMessageTime
                                                        }
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {
                                                            conversation.lastMessage
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                    </div>
                </aside>

                <section
                    className={`min-w-0 flex-1 ${selectedConversation
                        ? "flex"
                        : "hidden md:flex"
                        } flex-col`}
                >
                    {selectedConversation ? (
                        <>
                            <header className="flex h-16 shrink-0 items-center border-b bg-accent/40 px-3 sm:px-5 gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 md:hidden"
                                    onClick={() =>
                                        setSelectedConversation(null)
                                    }
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>

                                <div className="flex items-center w-full cursor-pointer" onClick={() => setInfoOpen(true)}>
                                    {selectedConversation.isGroup ? (
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage
                                                src={selectedConversation.avatar ?? undefined}
                                                alt={selectedConversation.name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                <UsersRound className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <UserAvatar
                                            src={selectedConversation.avatar}
                                            username={selectedConversation.username}
                                            name={selectedConversation.name}
                                            className="h-10 w-10"
                                        />
                                    )}

                                    <div className="ml-3 min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {selectedConversation.name}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {selectedConversation.isGroup
                                                ? "Group conversation"
                                                : selectedConversation.online
                                                    ? "Online"
                                                    : `@${selectedConversation.username}`}
                                        </p>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                                        aria-label="Open conversation menu"
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-36 p-3 text-lg">
                                        <DropdownMenuItem
                                            disabled={!selectedConversation || isClearingChat}
                                            className="cursor-pointer"
                                            onClick={() => setInfoOpen(true)}
                                            aria-label="Conversation information"
                                            title="Contact info"
                                        >
                                            <Info className="mr-2 h-4 w-4" />
                                            Contact Info
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            disabled={isDeletingChat}
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                            onClick={() => setDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete chat
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled={!selectedConversation || isClearingChat}
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                            onClick={() => setClearDialogOpen(true)}
                                        >
                                            <CircleMinus className="mr-2 h-4 w-4" />
                                            Clear chat
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <AlertDialog
                                    open={clearDialogOpen}
                                    onOpenChange={(open) => {
                                        if (!isClearingChat) {
                                            setClearDialogOpen(open);
                                        }
                                    }}
                                >
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Clear this chat?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Do you want to clear chat ?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isClearingChat}>
                                                Cancel
                                            </AlertDialogCancel>

                                            <AlertDialogAction
                                                disabled={isClearingChat}
                                                className="bg-red-600 text-white hover:bg-red-700"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    void handleClearChat();
                                                }}
                                            >
                                                {isClearingChat ? "Clearing..." : "Clear chat"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog
                                    open={deleteDialogOpen}
                                    onOpenChange={(open) => {
                                        if (!isDeletingChat) setDeleteDialogOpen(open);
                                    }}
                                >
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Do you want to delete this chat ?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isDeletingChat}>
                                                Cancel
                                            </AlertDialogCancel>

                                            <AlertDialogAction
                                                disabled={isDeletingChat}
                                                className="bg-red-600 text-white hover:bg-red-700"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    void handleDeleteChat();
                                                }}
                                            >
                                                {isDeletingChat ? "Deleting..." : "Delete chat"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </header>

                            <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
                                <SheetContent
                                    side="right"
                                    className="w-full overflow-y-auto sm:max-w-md p-4"
                                >
                                    <SheetHeader>
                                        <SheetTitle>Contact info</SheetTitle>
                                        <SheetDescription>
                                            Contact details and shared files in this conversation.
                                        </SheetDescription>
                                    </SheetHeader>

                                    {selectedConversation && (
                                        <div className="mt-6 space-y-6">
                                            {selectedConversation.isGroup ? (
                                                <div className="rounded-xl border p-6 text-center">
                                                    <Avatar className="mx-auto h-20 w-20">
                                                        <AvatarImage
                                                            src={selectedConversation.avatar ?? undefined}
                                                            alt={selectedConversation.name}
                                                            className="object-cover"
                                                        />
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            <UsersRound className="h-10 w-10" />
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <h3 className="mt-4 text-xl font-semibold">
                                                        {selectedConversation.name}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {selectedConversation.members?.length ?? 0} members
                                                    </p>

                                                    <p className="mt-3 text-sm text-muted-foreground">
                                                        Group conversation
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center rounded-xl border p-6 text-center">
                                                    <UserAvatar
                                                        src={selectedConversation.avatar}
                                                        username={selectedConversation.username}
                                                        name={selectedConversation.name}
                                                        className="h-24 w-24"
                                                    />

                                                    <h3 className="mt-4 text-xl font-semibold">
                                                        {selectedConversation.name}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        @{selectedConversation.username}
                                                    </p>

                                                    <p className="mt-3 flex items-center gap-2 text-sm">
                                                        <span
                                                            className={`h-2 w-2 rounded-full ${selectedConversation.online
                                                                ? "bg-green-500"
                                                                : "bg-muted-foreground"
                                                                }`}
                                                        />
                                                        {selectedConversation.online ? "Online" : "Offline"}
                                                    </p>
                                                </div>
                                            )}

                                            <section className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold">Media and documents</h3>
                                                    <span className="text-sm text-muted-foreground">
                                                        {messages.reduce(
                                                            (count, message) =>
                                                                count + (message.attachments?.length ?? 0),
                                                            0
                                                        )}
                                                    </span>
                                                </div>

                                                {(() => {
                                                    const attachments = messages.flatMap((message) =>
                                                        (message.attachments ?? []).map((attachment) => ({
                                                            ...attachment,
                                                            messageId: message.id,
                                                        }))
                                                    );

                                                    if (attachments.length === 0) {
                                                        return (
                                                            <div className="rounded-xl border p-6 text-center">
                                                                <Paperclip className="mx-auto h-8 w-8 text-muted-foreground" />
                                                                <p className="mt-3 text-sm font-medium">
                                                                    No shared files yet
                                                                </p>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    Photos, videos and documents will appear here.
                                                                </p>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="space-y-2">
                                                            {attachments.map((attachment) => (
                                                                <a
                                                                    key={`${attachment.messageId}-${attachment.id}`}
                                                                    href={attachment.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                                                                >
                                                                    {attachment.type === "IMAGE" ? (
                                                                        <ImageIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                                                                    ) : attachment.type === "VIDEO" ? (
                                                                        <Images className="h-5 w-5 shrink-0 text-muted-foreground" />
                                                                    ) : (
                                                                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                                                    )}

                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-sm font-medium">
                                                                            {attachment.name || "Shared attachment"}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {attachment.type}
                                                                            {attachment.size != null
                                                                                ? ` · ${(attachment.size / 1024).toFixed(1)} KB`
                                                                                : ""}
                                                                        </p>
                                                                    </div>

                                                                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </section>

                                            {selectedConversation.isGroup && (
                                                <section className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold">Group members</h3>

                                                        <span className="text-sm text-muted-foreground">
                                                            {selectedConversation.members?.length ?? 0}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1">
                                                        {selectedConversation.members?.map((member) => {
                                                            const isMe = member.id === currentUserId;
                                                            const isAdmin = member.role === "ADMIN";

                                                            return (
                                                                <div
                                                                    key={member.id}
                                                                    className="flex items-center justify-between gap-3 py-3"
                                                                >
                                                                    <div className="min-w-0">
                                                                        <p className="truncate font-medium">
                                                                            {isMe ? "You" : member.name}
                                                                        </p>

                                                                        <p className="truncate text-sm text-muted-foreground">
                                                                            @{member.username}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex shrink-0 items-center gap-2">
                                                                        {isAdmin && (
                                                                            <span className="rounded-full bg-green-600/10 px-2 py-1 text-xs font-bold text-green-600">
                                                                                Admin
                                                                            </span>
                                                                        )}

                                                                        {!isAdmin && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Member
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {(!selectedConversation.members ||
                                                            selectedConversation.members.length === 0) && (
                                                                <p className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                                                                    No group members found.
                                                                </p>
                                                            )}
                                                    </div>
                                                </section>
                                            )}

                                            <section className="space-y-3">
                                                <h3 className="font-semibold">Chat settings</h3>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-start text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setInfoOpen(false);
                                                        setClearDialogOpen(true);
                                                    }}
                                                >
                                                    <CircleMinus className="mr-2 h-4 w-4" />
                                                    Clear chat
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-start text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setInfoOpen(false);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete chat
                                                </Button>
                                            </section>
                                        </div>
                                    )}
                                </SheetContent>
                            </Sheet>

                            <div className="relative flex min-h-0 flex-1 flex-col">
                                <div
                                    className="pointer-events-none absolute inset-0 bg-repeat opacity-10"
                                    style={{
                                        backgroundImage:
                                            "url('/istockphoto-1403848173-612x612.jpg')",
                                        backgroundSize: "400px",
                                    }}
                                />

                                <div className="relative min-h-0 flex-1 overflow-y-auto">
                                    <div className="mx-auto flex w-full flex-col gap-2 px-3 py-5 sm:px-5">
                                        {ChatLoading ? (
                                            <div className="flex h-full items-center justify-center gap-2">
                                                <Loader2 className="animate-spin" />
                                                <p>Loading your chats...</p>
                                            </div>
                                        ) :
                                            (
                                                messages.map((msg) => {
                                                    const isMine = msg.senderId === currentUserId;

                                                    return (
                                                        <div
                                                            key={msg.id}
                                                            className={`flex items-center gap-3 ${isMine ? "justify-end" : "justify-start"
                                                                }`}
                                                        >
                                                            {msg.type === "SYSTEM" ? (
                                                                <div className="my-4 flex justify-center mx-auto">
                                                                    <div className="rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground mx-auto">
                                                                        {msg.senderId === currentUserId
                                                                            ? `You ${msg.content}`
                                                                            : `${msg.sender?.name ?? msg.sender?.username ?? "Someone"} ${msg.content}`}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className={`w-fit group ${msg.attachments?.some((a) => a.type === "IMAGE")
                                                                    ? "max-w-[50%] sm:max-w-[40%]"
                                                                    : "max-w-[80%] sm:max-w-[65%] sm:w-[12%]"
                                                                    }`}>
                                                                    <div
                                                                        className={`px-3.5 py-1 shadow-sm ${isMine
                                                                            ? "bg-blue-600 text-white rounded-bl-2xl rounded-tl-2xl rounded-tr-2xl "
                                                                            : "bg-white text-gray-900 rounded-br-2xl rounded-tl-2xl rounded-tr-2xl "
                                                                            }`}
                                                                    >
                                                                        {selectedConversation.isGroup && (
                                                                            <p
                                                                                className={`mb-2 text-xs font-semibold ${isMine ? "text-blue-100" : "text-violet-600"
                                                                                    }`}
                                                                            >
                                                                                {msg.senderId === currentUserId
                                                                                    ? "You"
                                                                                    : msg.sender?.name ?? msg.sender?.username ?? "Unknown"}
                                                                            </p>
                                                                        )}

                                                                        {msg.attachments?.map((attachment) => (
                                                                            <div key={attachment.id} className="mb-2">
                                                                                {attachment.type === "IMAGE" && (
                                                                                    <a
                                                                                        href={attachment.url}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="block"
                                                                                    >
                                                                                        <img
                                                                                            src={attachment.url}
                                                                                            alt={attachment.name || "Image attachment"}
                                                                                            className="block h-auto max-h-110 w-full rounded-xl object-cover"
                                                                                        />
                                                                                    </a>
                                                                                )}

                                                                                {attachment.type === "VIDEO" && (
                                                                                    <video
                                                                                        src={attachment.url}
                                                                                        controls
                                                                                        preload="metadata"
                                                                                        className="max-h-72 max-w-full w-60 rounded-xl"
                                                                                    />
                                                                                )}

                                                                                {attachment.type === "DOCUMENT" && (
                                                                                    <a
                                                                                        href={attachment.url}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className={`flex items-center gap-3 rounded-xl border p-3 ${isMine
                                                                                            ? "border-blue-400/40 bg-blue-700/40"
                                                                                            : "border-gray-200 bg-gray-50"
                                                                                            }`}
                                                                                    >
                                                                                        <FileText className="h-5 w-5 shrink-0" />
                                                                                        <span className="break-all text-sm">
                                                                                            {attachment.name || "Open document"}
                                                                                        </span>
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        ))}

                                                                        {msg.content && (
                                                                            <p className="whitespace-pre-wrap wrap-break-words text-sm leading-relaxed">
                                                                                {msg.content}
                                                                            </p>
                                                                        )}

                                                                        <div
                                                                            className={`mt-2 flex items-center justify-end gap-2 border-t pt-1.5 ${isMine
                                                                                ? "border-blue-400/40 text-blue-100"
                                                                                : "border-gray-100 text-gray-400"
                                                                                }`}
                                                                        >
                                                                            <span className={`text-[10px] leading-none ${isMine
                                                                                ? "text-blue-100"
                                                                                : "text-violet-600"
                                                                                }`}>
                                                                                {msg.time}
                                                                            </span>

                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger className={`rounded-full p-1 transition hover:bg-black/5 hover:opacity-100 focus:opacity-100 opacity-0 group-hover:opacity-100 ${isMine
                                                                                    ? "text-blue-100"
                                                                                    : "text-violet-600"
                                                                                    }`}>

                                                                                    <ChevronDown className="h-4 w-4" />
                                                                                </DropdownMenuTrigger>

                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem
                                                                                        className="flex items-center gap-2"
                                                                                        onClick={() =>
                                                                                            handleCopyMessage(msg.content)
                                                                                        }
                                                                                        disabled={!msg.content}
                                                                                    >
                                                                                        <Copy className="h-4 w-4" />
                                                                                        Copy
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        className="flex items-center gap-2"
                                                                                        onClick={() =>
                                                                                            handleEditMessage
                                                                                        }
                                                                                    >
                                                                                        <Pencil className="h-4 w-4" />
                                                                                        Edit
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuItem
                                                                                        className="flex items-center gap-2 text-red-600 transition duration-200 hover:bg-red-400"
                                                                                        onClick={() =>
                                                                                            handleDeleteMessage
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                        Delete
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                        </div>
                                                    );
                                                })
                                            )}
                                    </div>
                                </div>

                                {selectedFile && (
                                    <div
                                        className="relative z-20 m-3 flex items-center gap-3 rounded-xl border border-gray-200 p-3 shadow-sm"
                                        style={{ backgroundColor: "#ffffff", opacity: 1 }}
                                    >
                                        {previewUrl && selectedFile.type.startsWith("image/") && (
                                            <img
                                                src={previewUrl}
                                                alt="Selected attachment"
                                                className="h-26 w-26 rounded-lg object-cover shadow"
                                            />
                                        )}

                                        {previewUrl && selectedFile.type.startsWith("video/") && (
                                            <video
                                                src={previewUrl}
                                                className="h-16 w-16 rounded-lg object-cover"
                                                controls
                                            />
                                        )}

                                        {!previewUrl && (
                                            <FileText className="h-10 w-10 shrink-0 text-muted-foreground" />
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>

                                        {isUploading && (
                                            <p className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Uploading file...
                                            </p>
                                        )}

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={isUploading}
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                setPreviewUrl(null);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                <div className="relative shrink-0 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
                                    <div className="mx-auto flex w-full items-end rounded-3xl gap-2 border bg-accent px-3 py-2 shadow-sm">
                                        <div className="relative">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-lg"
                                                onClick={() => setShowAttachmentMenu((prev) => !prev)}
                                            >
                                                <Paperclip className="h-5 w-5" />
                                            </Button>

                                            {showAttachmentMenu && (
                                                <div className="absolute bottom-14 left-0 z-50 w-52 rounded-xl border bg-background p-2 shadow-lg">
                                                    <button
                                                        type="button"
                                                        className="flex w-full items-center gap-3 rounded-lg p-3 text-sm hover:bg-muted"
                                                        onClick={() => {
                                                            fileInputRef.current?.click();
                                                            setShowAttachmentMenu(false);
                                                        }}
                                                    >
                                                        <ImageIcon className="h-5 w-5" />
                                                        Photos & Videos
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="flex w-full items-center gap-3 rounded-lg p-3 text-sm hover:bg-muted"
                                                        onClick={() => {
                                                            fileInputRef.current?.click();
                                                            setShowAttachmentMenu(false);
                                                        }}
                                                    >
                                                        <FileText className="h-5 w-5" />
                                                        Document
                                                    </button>
                                                </div>
                                            )}

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                        </div>

                                        <div className="relative">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-lg"
                                                className="hidden h-10 w-10 shrink-0 rounded-full sm:inline-flex"
                                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                            >
                                                <Smile className="h-6 w-6" />
                                            </Button>

                                            {showEmojiPicker && (
                                                <div className="absolute bottom-14 right-0 z-50">
                                                    <EmojiPicker
                                                        onEmojiClick={(emojiData) => {
                                                            setMessage((prev) => prev + emojiData.emoji);
                                                        }}
                                                        width={320}
                                                        height={400}
                                                        previewConfig={{ showPreview: false }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <Textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            className="min-h-10 max-h-24 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2.5 leading-5 shadow-none focus-visible:ring-0 dark:bg-accent"
                                        />

                                        <Button
                                            type="button"
                                            size="icon"
                                            className="h-10 w-10 shrink-0 rounded-full"
                                            disabled={
                                                isUploading ||
                                                (!message.trim() && !selectedFile)
                                            }
                                            onClick={sendMessage}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="hidden h-full flex-1 flex-col items-center justify-center md:flex bg-accent/40">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                <MessageCircle className="h-8 w-8 text-primary" />
                            </div>

                            <h2 className="mt-5 text-xl font-semibold">
                                Welcome to ChitChat
                            </h2>

                            <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                                Select a conversation from the
                                sidebar to start chatting.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}