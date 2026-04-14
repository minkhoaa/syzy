"use client";

import { useState } from "react";
import { Mail, Bell, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/use-auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { useUserControllerGetCurrentUser, userControllerGetCurrentUserQueryKey } from "@/lib/api-client/hooks/use-user-controller-get-current-user";
import { useNotificationControllerGetPreferences, notificationControllerGetPreferencesQueryKey } from "@/lib/api-client/hooks/use-notification-controller-get-preferences";
import { useNotificationControllerSetEmail } from "@/lib/api-client/hooks/use-notification-controller-set-email";
import { useNotificationControllerRemoveEmail } from "@/lib/api-client/hooks/use-notification-controller-remove-email";
import { useNotificationControllerUpdatePreferences } from "@/lib/api-client/hooks/use-notification-controller-update-preferences";

export default function SettingsPage() {
  const { accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;

  const { data: currentUser, isLoading: userLoading } = useUserControllerGetCurrentUser({
    query: { enabled: isAuthenticated },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h1 className="text-xl font-bold mb-2">Settings</h1>
        <p>Connect your wallet to manage notification settings.</p>
      </div>
    );
  }

  if (userLoading || !currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
        <p>Loading settings...</p>
      </div>
    );
  }

  const emailVerified = !!currentUser.emailVerified;
  const hasEmail = !!currentUser.email;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your email and notification preferences
        </p>
      </div>

      {/* key forces remount when server email changes, resetting local state */}
      <EmailSection
        key={currentUser.email ?? "none"}
        initialEmail={currentUser.email ?? ""}
        hasEmail={hasEmail}
        emailVerified={emailVerified}
      />

      {emailVerified && (
        <PreferencesSection key={emailVerified ? "verified" : "unverified"} />
      )}
    </div>
  );
}

/* ── Email Section ─────────────────────────────────────────────── */

function EmailSection({
  initialEmail,
  hasEmail,
  emailVerified,
}: {
  initialEmail: string;
  hasEmail: boolean;
  emailVerified: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const queryClient = useQueryClient();

  const setEmailMutation = useNotificationControllerSetEmail({
    mutation: {
      onSuccess: () => {
        toast.success("Verification email sent! Check your inbox.");
        queryClient.invalidateQueries({ queryKey: userControllerGetCurrentUserQueryKey() });
      },
      onError: (error: { response?: { data?: { message?: string } } }) => {
        toast.error(error?.response?.data?.message || "Failed to set email");
      },
    },
  });

  const removeEmailMutation = useNotificationControllerRemoveEmail({
    mutation: {
      onSuccess: () => {
        toast.success("Email removed successfully");
        setEmail("");
        queryClient.invalidateQueries({ queryKey: userControllerGetCurrentUserQueryKey() });
        queryClient.invalidateQueries({ queryKey: notificationControllerGetPreferencesQueryKey() });
      },
      onError: () => {
        toast.error("Failed to remove email");
      },
    },
  });

  const handleSetEmail = () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setEmailMutation.mutate({ data: { email } });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Email Configuration</h2>
      </div>

      <div className="rounded-lg border border-border/50 p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSetEmail}
              disabled={setEmailMutation.isPending || !email}
            >
              {setEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasEmail ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>

        {hasEmail && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {emailVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">Email verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-500">Verification pending</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleSetEmail}
                    disabled={setEmailMutation.isPending}
                  >
                    Resend
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => removeEmailMutation.mutate()}
              disabled={removeEmailMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Preferences Section ───────────────────────────────────────── */

function PreferencesSection() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const { data: preferences, isLoading } = useNotificationControllerGetPreferences({
    query: { enabled: !!accessToken },
  });

  const updatePrefsMutation = useNotificationControllerUpdatePreferences({
    mutation: {
      onSuccess: () => {
        toast.success("Preferences saved");
        queryClient.invalidateQueries({ queryKey: notificationControllerGetPreferencesQueryKey() });
      },
      onError: () => {
        toast.error("Failed to update preferences");
      },
    },
  });

  // Derive display values from server data
  const prefs = {
    marketResolved: preferences?.marketResolved ?? true,
    newMarketInCategory: preferences?.newMarketInCategory ?? false,
    commentReply: preferences?.commentReply ?? false,
    weeklyDigest: preferences?.weeklyDigest ?? false,
    followedCategories: (preferences?.followedCategories ?? []) as string[],
  };

  const handleToggle = (key: keyof Omit<typeof prefs, "followedCategories">) => {
    updatePrefsMutation.mutate({ data: { ...prefs, [key]: !prefs[key] } });
  };

  if (isLoading) {
    return (
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>
        <div className="text-center py-4 text-muted-foreground">
          <Loader2 className="h-6 w-6 mx-auto animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
      </div>

      <div className="rounded-lg border border-border/50 divide-y divide-border/50">
        <PreferenceRow
          label="Market Resolved"
          description="Get notified when a market you participated in resolves"
          checked={prefs.marketResolved}
          onToggle={() => handleToggle("marketResolved")}
          disabled={updatePrefsMutation.isPending}
        />
        <PreferenceRow
          label="New Market in Category"
          description="Get notified when a new market is created in a category you follow"
          checked={prefs.newMarketInCategory}
          onToggle={() => handleToggle("newMarketInCategory")}
          disabled={updatePrefsMutation.isPending}
        />
        <PreferenceRow
          label="Comment Reply"
          description="Get notified when someone replies to your comment"
          checked={prefs.commentReply}
          onToggle={() => handleToggle("commentReply")}
          disabled={updatePrefsMutation.isPending}
        />
        <PreferenceRow
          label="Weekly Digest"
          description="Receive a weekly summary email of market activity"
          checked={prefs.weeklyDigest}
          onToggle={() => handleToggle("weeklyDigest")}
          disabled={updatePrefsMutation.isPending}
        />
      </div>

      {prefs.newMarketInCategory && (
        <CategoryPicker
          categories={prefs.followedCategories}
          allPrefs={prefs}
        />
      )}
    </section>
  );
}

/* ── Category Picker ───────────────────────────────────────────── */

function CategoryPicker({
  categories,
  allPrefs,
}: {
  categories: string[];
  allPrefs: Record<string, unknown>;
}) {
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();

  const updatePrefsMutation = useNotificationControllerUpdatePreferences({
    mutation: {
      onSuccess: () => {
        toast.success("Categories updated");
        queryClient.invalidateQueries({ queryKey: notificationControllerGetPreferencesQueryKey() });
      },
      onError: () => {
        toast.error("Failed to update categories");
      },
    },
  });

  const handleAdd = () => {
    const cat = input.trim();
    if (!cat) return;
    if (categories.includes(cat)) {
      toast.error("Category already added");
      return;
    }
    setInput("");
    updatePrefsMutation.mutate({
      data: { ...allPrefs, followedCategories: [...categories, cat] },
    });
  };

  const handleRemove = (cat: string) => {
    updatePrefsMutation.mutate({
      data: {
        ...allPrefs,
        followedCategories: categories.filter((c) => c !== cat),
      },
    });
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <label className="text-sm font-medium">Followed Categories</label>
      <div className="flex gap-2">
        <Input
          placeholder="e.g. Crypto, Politics..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={!input.trim() || updatePrefsMutation.isPending}
        >
          Add
        </Button>
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => handleRemove(cat)}
            >
              {cat}
              <span className="ml-1 text-muted-foreground">&times;</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Preference Row ────────────────────────────────────────────── */

function PreferenceRow({
  label,
  description,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="space-y-0.5 pr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  );
}
