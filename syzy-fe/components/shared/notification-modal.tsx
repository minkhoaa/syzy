"use client";

import { Bell, Check, TrendingUp, MessageSquare, Tag, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationControllerGetNotifications, notificationControllerGetNotificationsQueryKey } from "@/lib/api-client/hooks/use-notification-controller-get-notifications";
import { useNotificationControllerMarkAsRead } from "@/lib/api-client/hooks/use-notification-controller-mark-as-read";
import { useNotificationControllerMarkAllAsRead } from "@/lib/api-client/hooks/use-notification-controller-mark-all-as-read";
import { notificationControllerGetUnreadCountQueryKey } from "@/lib/api-client/hooks/use-notification-controller-get-unread-count";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "MARKET_RESOLVED":
      return <TrendingUp className="h-4 w-4" />;
    case "NEW_MARKET_IN_CATEGORY":
      return <Tag className="h-4 w-4" />;
    case "COMMENT_REPLY":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "MARKET_RESOLVED":
      return "text-green-500";
    case "NEW_MARKET_IN_CATEGORY":
      return "text-blue-500";
    case "COMMENT_REPLY":
      return "text-purple-500";
    default:
      return "text-muted-foreground";
  }
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onNavigate: (link: string) => void;
}) {
  const iconColor = getNotificationColor(notification.type);

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      onNavigate(notification.link);
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-colors cursor-pointer group",
        notification.read
          ? "border-border/50 bg-card/30"
          : "border-primary/20 bg-primary/5 hover:bg-primary/10"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full bg-background/50", iconColor)}>
          <NotificationIcon type={notification.type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <div className="flex items-center gap-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(notification.createdAt)}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {notification.message}
          </p>
        </div>

        {!notification.read && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function NotificationModal({ open, onOpenChange }: NotificationModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;

  const { data, isLoading } = useNotificationControllerGetNotifications(
    { page: 1, limit: 20 },
    { query: { enabled: isAuthenticated && open } }
  );

  const markAsReadMutation = useNotificationControllerMarkAsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationControllerGetNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: notificationControllerGetUnreadCountQueryKey() });
      },
    },
  });

  const markAllAsReadMutation = useNotificationControllerMarkAllAsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationControllerGetNotificationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: notificationControllerGetUnreadCountQueryKey() });
      },
    },
  });

  const rawData = data?.data ?? data?.items ?? data;
  const notifications: Notification[] = Array.isArray(rawData) ? rawData : [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNavigate = (link: string) => {
    onOpenChange(false);
    router.push(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p>Loading notifications...</p>
              </div>
            ) : !isAuthenticated ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Connect your wallet to see notifications</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onNavigate={handleNavigate}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">
                  You&apos;ll see notifications here when they arrive.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">ESC</kbd> to close
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              router.push("/settings");
            }}
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Notification Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
