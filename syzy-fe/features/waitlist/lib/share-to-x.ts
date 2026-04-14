// Share helpers for the waitlist referral system

export function buildReferralUrl(
  referralCode: string | null | undefined,
  baseUrl?: string,
): string | null {
  if (!referralCode) return null;
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/waitlist?ref=${encodeURIComponent(referralCode)}`;
}

export function buildXShareText(referralUrl: string): string {
  return `I just joined the Syzy waitlist 🚀\nPredict Invisible. Win Visible.\n\nUse my referral link to climb the queue: ${referralUrl}`;
}

export function openXShare(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank", "noopener,noreferrer");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without clipboard API
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}
