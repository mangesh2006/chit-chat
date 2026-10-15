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
    Images
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

type Conversation = {
    id: string;
    name: string;
    userId: string;
    username: string;
    avatar?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    online?: boolean;
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

    const socket = useMemo(() => io(process.env.NEXT_PUBLIC_BACKEND_URL!, { autoConnect: false }), [])

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
                    id: msg.id,
                    senderId: msg.senderId,
                    content: msg.content ?? "",
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
                id: data.message.id,
                senderId: data.message.senderId,
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

    return (
        <main className="h-screen overflow-hidden bg-background">
            <div className="flex h-full">
                <aside
                    className={`w-full shrink-0 border-r md:w-85 lg:w-160 ${selectedConversation
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

                        <div className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1 runded-lg" onClick={() => router.push("/profile")}>
                            <UserAvatar
                                src={userAvatar}
                                username={Username}
                                name={Name}
                                className="h-9 w-9"
                            />

                            <span>{Name}</span>
                        </div>
                    </div>

                    <div className="border-b p-3">
                        <div className="relative">
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="rounded-full py-5"
                            />

                            {searchQuery.trim() && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-background shadow-lg">
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
                                                className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted"
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

                    <div className="flex-1 overflow-y-auto">
                        {Loading ?
                            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                <Loader2 className="animate-spin" />

                                <p className="mt-2 text-sm text-muted-foreground">
                                    Loading your conversations...
                                </p>
                            </div> : conversations.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                        <MessageCircle className="h-7 w-7 text-primary" />
                                    </div>

                                    <h2 className="font-semibold">
                                        No conversations yet
                                    </h2>

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Search for a user to start your
                                        first conversation.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {conversations.map((conversation) => (
                                        <button
                                            key={conversation.id}
                                            type="button"
                                            onClick={() => selectConversation(conversation)}
                                            className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selectedConversation?.id ===
                                                conversation.id
                                                ? "bg-muted"
                                                : ""
                                                }`}
                                        >
                                            <div className="relative shrink-0">
                                                <UserAvatar
                                                    src={conversation.avatar}
                                                    username={conversation.username}
                                                    name={conversation.name}
                                                    className="h-12 w-12"
                                                />

                                                {conversation.online && (
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
                            <header className="flex h-16 shrink-0 items-center border-b bg-background px-3 sm:px-5 gap-4">
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
                                    <UserAvatar
                                        src={selectedConversation.avatar}
                                        username={selectedConversation.username}
                                        name={selectedConversation.name}
                                        className="h-10 w-10"
                                    />

                                    <div className="ml-3 min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {selectedConversation.name}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {selectedConversation.online
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
                                    className="pointer-events-none absolute inset-0 bg-repeat opacity-15"
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
                                                            className={`flex ${isMine ? "justify-end" : "justify-start"
                                                                }`}
                                                        >
                                                            <div className="max-w-[80%] sm:max-w-[65%] mb-2">
                                                                <div
                                                                    className={`rounded-2xl px-4 py-2.5 text-md ${isMine
                                                                        ? "rounded-br-md bg-blue-600 text-white"
                                                                        : "rounded-bl-md bg-white text-gray-900 shadow-sm"
                                                                        }`}
                                                                >

                                                                    {msg.attachments?.map((attachment) => (
                                                                        <div key={attachment.id} className="mt-2">
                                                                            {attachment.type === "IMAGE" && (
                                                                                <a
                                                                                    href={attachment.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                >
                                                                                    <img
                                                                                        src={attachment.url}
                                                                                        alt={attachment.name || "Image attachment"}
                                                                                        className="max-h-72 max-w-full rounded-lg object-contain"
                                                                                    />
                                                                                </a>
                                                                            )}

                                                                            {attachment.type === "VIDEO" && (
                                                                                <video
                                                                                    src={attachment.url}
                                                                                    controls
                                                                                    preload="metadata"
                                                                                    className="max-h-72 max-w-full rounded-lg"
                                                                                />
                                                                            )}

                                                                            {attachment.type === "DOCUMENT" && (
                                                                                <a
                                                                                    href={attachment.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="flex items-center gap-2 rounded-lg border p-3"
                                                                                >
                                                                                    <FileText className="h-5 w-5 shrink-0" />
                                                                                    <span className="break-all text-sm">
                                                                                        {attachment.name || "Open document"}
                                                                                    </span>
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    ))}

                                                                    <p className="whitespace-pre-wrap wrap-break-word">
                                                                        {msg.content}
                                                                    </p>

                                                                    <p className="mt-1 text-end text-[12px] opacity-70">
                                                                        {msg.time}
                                                                    </p>
                                                                </div>
                                                            </div>
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
                                    <div className="mx-auto flex w-full items-end rounded-3xl gap-2 border bg-background px-3 py-2 shadow-sm">
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
                                            className="min-h-10 max-h-24 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2.5 leading-5 shadow-none focus-visible:ring-0"
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
                        <div className="hidden h-full flex-1 flex-col items-center justify-center md:flex">
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