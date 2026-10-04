import {
  Download,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Smile,
  Users,
  Video,
} from "lucide-react";

export function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-linear-to-r from-blue-500/20 to-violet-500/20 blur-3xl" />
      <div className="overflow-hidden rounded-3xl border bg-background shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 text-white">
              <span className="text-sm font-bold">C</span>
            </div>

            <div>
              <p className="text-sm font-semibold">ChitChat</p>
              <p className="text-xs text-muted-foreground">
                Your conversations
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Search size={18} className="text-muted-foreground" />
            <MoreVertical size={18} className="text-muted-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-[190px_1fr]">
          <div className="hidden border-r p-3 sm:block">
            <div className="mb-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Search chats...
            </div>

            <div className="space-y-1">
              <SidebarItem
                active
                icon={<Users size={15} />}
                text="All Chats"
              />

              <SidebarItem
                icon={<Users size={15} />}
                text="Groups"
              />
            </div>

            <p className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent
            </p>

            <Conversation
              name="Aarav Sharma"
              message="Hey! How are you?"
              avatar="AS"
            />

            <Conversation
              name="College Friends"
              message="You: Sent a photo"
              avatar="CF"
            />

            <Conversation
              name="Project Team"
              message="Meeting at 5?"
              avatar="PT"
            />

            <Conversation
              name="Neha Verma"
              message="See you!"
              avatar="NV"
            />
          </div>

          <div className="flex min-h-107.5 flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                  CF
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    College Friends
                  </p>

                  <p className="text-xs text-muted-foreground">
                    12 members
                  </p>
                </div>
              </div>

              <Users size={18} className="text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-4 bg-muted/20 p-4">
              <Message
                name="Rohan"
                avatar="R"
                text="Hey everyone! Here are the photos from today's trip 📸"
              />

              <div className="ml-9 grid max-w-xs grid-cols-3 gap-1 overflow-hidden rounded-xl">
                <div className="aspect-square bg-linear-to-br from-blue-300 to-blue-500" />
                <div className="aspect-square bg-linear-to-br from-cyan-300 to-blue-500" />
                <div className="aspect-square bg-linear-to-br from-green-300 to-emerald-500" />
              </div>

              <div className="ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-linear-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm text-white">
                That looks amazing! 🔥
              </div>

              <Message
                name="Neha"
                avatar="N"
                text="I've also uploaded the trip plan."
              />

              <div className="ml-9 flex max-w-xs items-center gap-3 rounded-xl border bg-background p-3 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-500">
                  <FileText size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">
                    Trip_Plan.pdf
                  </p>

                  <p className="text-[11px] text-muted-foreground">
                    2.4 MB
                  </p>
                </div>

                <Download size={16} className="text-muted-foreground" />
              </div>

              <div className="ml-auto h-28 w-48 overflow-hidden rounded-xl bg-linear-to-br from-slate-700 to-slate-900">
                <div className="flex h-full items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800">
                    <Video size={17} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-3">
              <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
                <Paperclip
                  size={18}
                  className="text-muted-foreground"
                />

                <span className="flex-1 text-sm text-muted-foreground">
                  Type a message...
                </span>

                <Smile
                  size={18}
                  className="text-muted-foreground"
                />

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Send size={15} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  text,
  active = false,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${active
        ? "bg-blue-50 text-blue-600 dark:bg-blue-950"
        : "text-muted-foreground"
        }`}
    >
      {icon}
      {text}
    </div>
  );
}

function Conversation({
  name,
  message,
  avatar,
}: {
  name: string;
  message: string;
  avatar: string;
}) {
  return (
    <div className="flex gap-2 rounded-lg p-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
        {avatar}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{name}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}

function Message({
  name,
  avatar,
  text,
}: {
  name: string;
  avatar: string;
  text: string;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
        {avatar}
      </div>

      <div className="max-w-[75%]">
        <p className="mb-1 text-[10px] font-medium text-muted-foreground">
          {name}
        </p>

        <div className="rounded-2xl rounded-tl-sm border bg-background px-3 py-2 text-xs shadow-sm">
          {text}
        </div>
      </div>
    </div>
  );
}