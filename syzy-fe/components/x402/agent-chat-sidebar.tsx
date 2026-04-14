"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import {
  MessageSquare,
  PanelLeft,
  Plus,
  MoreHorizontal,
  Share2,
  Pin,
  Pencil,
  Trash2,
  Copy,
  Check,
} from "lucide-react"
import {
  useChatHistory,
  pinConversation,
  renameConversation,
  deleteConversation,
  shareConversation,
  type Conversation,
} from "@/hooks/use-chat-history"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface AgentChatSidebarProps {
  activeConversationId: string | null
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onToggle: () => void
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "now"
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

interface DateGroup {
  label: string
  conversations: Conversation[]
}

function groupByDate(conversations: Conversation[]): DateGroup[] {
  const now = new Date()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const yesterdayStart = todayStart - 86400000
  const weekStart = todayStart - 7 * 86400000

  const pinned: Conversation[] = []
  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  }

  for (const conv of conversations) {
    if (conv.isPinned) {
      pinned.push(conv)
      continue
    }
    const ts = new Date(conv.createdAt).getTime()
    if (ts >= todayStart) groups.Today.push(conv)
    else if (ts >= yesterdayStart) groups.Yesterday.push(conv)
    else if (ts >= weekStart) groups["Previous 7 days"].push(conv)
    else groups.Older.push(conv)
  }

  const result: DateGroup[] = []

  if (pinned.length > 0) {
    result.push({ label: "Pinned", conversations: pinned })
  }

  for (const [label, convs] of Object.entries(groups)) {
    if (convs.length > 0) {
      result.push({ label, conversations: convs })
    }
  }

  return result
}

export function AgentChatSidebar({
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onToggle,
}: AgentChatSidebarProps) {
  const { conversations, isLoading, refetch } = useChatHistory()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const walletAddress = user?.walletAddress ?? ""
  const groups = useMemo(() => groupByDate(conversations), [conversations])

  // Local state for actions
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renamingValue, setRenamingValue] = useState("")
  const [shareDialog, setShareDialog] = useState<{
    id: string
    url: string
  } | null>(null)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["chat-conversations"] })

  // --- Action handlers ---

  const handlePin = async (conv: Conversation) => {
    try {
      await pinConversation(conv.id, walletAddress, !conv.isPinned)
      await invalidate()
    } catch {
      toast.error("Failed to update pin")
    }
  }

  const handleRenameStart = (conv: Conversation) => {
    setRenamingId(conv.id)
    setRenamingValue(conv.title || "")
  }

  const handleRenameSubmit = async () => {
    if (!renamingId || !renamingValue.trim()) {
      setRenamingId(null)
      return
    }
    try {
      await renameConversation(renamingId, walletAddress, renamingValue.trim())
      await invalidate()
    } catch {
      toast.error("Failed to rename conversation")
    }
    setRenamingId(null)
  }

  const handleShare = async (conv: Conversation) => {
    try {
      const url = await shareConversation(conv.id, walletAddress)
      setShareDialog({ id: conv.id, url })
    } catch {
      toast.error("Failed to generate share link")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialogId) return
    try {
      await deleteConversation(deleteDialogId, walletAddress)
      await invalidate()
      toast.success("Conversation deleted")
    } catch {
      toast.error("Failed to delete conversation")
    }
    setDeleteDialogId(null)
  }

  const handleCopy = async () => {
    if (!shareDialog) return
    await navigator.clipboard.writeText(shareDialog.url)
    setCopied(true)
    toast.success("Link copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border h-[49px]">
        <h2 className="text-sm font-semibold flex-1 min-w-0">Chat History</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onNewChat}
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggle}
          title="Close sidebar (Ctrl+Shift+S)"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="space-y-2 px-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 bg-muted/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="px-2 py-6 text-xs text-muted-foreground text-center">
            No conversations yet
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeConversationId}
                    isRenaming={renamingId === conv.id}
                    renamingValue={renamingValue}
                    onSelect={() => onSelectConversation(conv.id)}
                    onRenamingValueChange={setRenamingValue}
                    onRenameSubmit={handleRenameSubmit}
                    onRenameCancel={() => setRenamingId(null)}
                    onShare={() => handleShare(conv)}
                    onPin={() => handlePin(conv)}
                    onRenameStart={() => handleRenameStart(conv)}
                    onDelete={() => setDeleteDialogId(conv.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Share dialog */}
      <Dialog
        open={shareDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShareDialog(null)
            setCopied(false)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Share conversation</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              tabIndex={-1}
              value={shareDialog?.url ?? ""}
              className="flex-1 text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialogId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its
              messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- Conversation item with dropdown menu ---

interface ConversationItemProps {
  conv: Conversation
  isActive: boolean
  isRenaming: boolean
  renamingValue: string
  onSelect: () => void
  onRenamingValueChange: (value: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  onShare: () => void
  onPin: () => void
  onRenameStart: () => void
  onDelete: () => void
}

function ConversationItem({
  conv,
  isActive,
  isRenaming,
  renamingValue,
  onSelect,
  onRenamingValueChange,
  onRenameSubmit,
  onRenameCancel,
  onShare,
  onPin,
  onRenameStart,
  onDelete,
}: ConversationItemProps) {
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (isRenaming) {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }
  }, [isRenaming])

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 w-full px-2 py-2 text-xs rounded-lg transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
      )}
    >
      <button
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renamingValue}
            onChange={(e) => onRenamingValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onRenameSubmit()
              } else if (e.key === "Escape") {
                onRenameCancel()
              }
            }}
            onBlur={onRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent border-b border-foreground/30 outline-none text-xs py-0"
          />
        ) : (
          <span className="truncate flex-1">
            {conv.title || "New conversation"}
          </span>
        )}
      </button>

      {/* Timestamp — hidden on hover or when menu is open */}
      {!isRenaming && (
        <span
          className={cn(
            "text-[10px] shrink-0 opacity-60 transition-opacity",
            menuOpen ? "opacity-0" : "group-hover:opacity-0"
          )}
        >
          {formatRelativeTime(conv.createdAt)}
        </span>
      )}

      {/* 3-dot menu — shown on hover or when open */}
      {!isRenaming && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "absolute right-1 transition-opacity p-1 rounded hover:bg-accent",
                menuOpen
                  ? "opacity-100 bg-accent"
                  : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={8}>
            <DropdownMenuItem onSelect={onShare}>
              <Share2 className="h-3.5 w-3.5 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onPin}>
              <Pin className="h-3.5 w-3.5 mr-2" />
              {conv.isPinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRenameStart}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
