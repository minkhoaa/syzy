/**
 * Mock waitlist client — handles waitlist-specific endpoints in mock mode.
 * Handles: /auth/*, /me, /me/contact, /admin/*
 */

interface MockRequest {
  url: string;
  method: string;
  params?: unknown;
  data?: unknown;
}

const WAITLIST_MOCK_DELAY = 200;
function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── In-memory mock state ────────────────────────────────────────

const mockState = {
  accessToken: "mock-member-access-token",
  refreshToken: "mock-member-refresh",
  member: {
    walletAddress: "SolMock1111111111111111111111111111111",
    referralCode: "MOCK123",
    email: null as string | null,
    isContactable: false,
    validReferralCount: 0,
    queueScore: 10,
    currentRank: 42,
    currentPercentile: 15,
    totalMembers: 240,
    joinedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  admin: {
    walletAddress: "SolMock1111111111111111111111111111111",
    role: "owner" as const,
  },
};

function makeMember(data: Partial<typeof mockState.member> = {}) {
  return { ...mockState.member, ...data };
}

// ── Handler ─────────────────────────────────────────────────────

export async function mockWaitlistClient(req: MockRequest) {
  await delay(WAITLIST_MOCK_DELAY);
  const { url, method } = req;

  // POST /auth/challenge → returns challenge string
  if (url === "/auth/challenge" && method === "POST") {
    return {
      data: { challenge: "mock-challenge-" + Date.now(), nonce: "mock-nonce-456" },
      status: 200, statusText: "OK", headers: {},
    };
  }

  // POST /auth/register → returns tokens + member
  if (url === "/auth/register" && method === "POST") {
    // Simulate storing member with referral code
    const body = req.data as Record<string, string> | undefined;
    if (body?.referredByCode) {
      mockState.member = makeMember({ validReferralCount: 1, queueScore: 20 });
    } else {
      mockState.member = makeMember();
    }
    mockState.accessToken = "mock-member-access-token-" + Date.now();
    mockState.refreshToken = "mock-member-refresh-" + Date.now();
    return {
      data: {
        accessToken: mockState.accessToken,
        refreshToken: mockState.refreshToken,
        member: mockState.member,
      },
      status: 200, statusText: "OK", headers: {},
    };
  }

  // GET /auth/me → returns member
  if (url === "/auth/me" && method === "GET") {
    return {
      data: mockState.member,
      status: 200, statusText: "OK", headers: {},
    };
  }

  // POST /auth/refresh → returns new tokens
  if (url === "/auth/refresh" && method === "POST") {
    return {
      data: {
        accessToken: "mock-member-access-token-refreshed-" + Date.now(),
        refreshToken: "mock-member-refresh-" + Date.now(),
      },
      status: 200, statusText: "OK", headers: {},
    };
  }

  // POST /auth/admin/login → admin tokens
  if (url === "/auth/admin/login" && method === "POST") {
    return {
      data: {
        accessToken: "mock-admin-access-token",
        refreshToken: "mock-admin-refresh",
        admin: mockState.admin,
      },
      status: 200, statusText: "OK", headers: {},
    };
  }

  // GET /me → member status
  if (url === "/me" && method === "GET") {
    return {
      data: mockState.member,
      status: 200, statusText: "OK", headers: {},
    };
  }

  // POST /me/contact → attach email
  if (url === "/me/contact" && method === "POST") {
    const body = req.data as Record<string, string> | undefined;
    const email = body?.email ?? "";
    mockState.member = makeMember({ email, isContactable: true });
    return {
      data: { email, isContactable: true },
      status: 200, statusText: "OK", headers: {},
    };
  }

  // GET /admin/summary
  if (url === "/admin/summary" && method === "GET") {
    return {
      data: {
        allTime: mockState.member.totalMembers,
        contactable: 180,
        topReferrers: [
          { walletAddress: mockState.member.walletAddress, validReferralCount: mockState.member.validReferralCount, currentRank: 1 },
        ],
      },
      status: 200, statusText: "OK", headers: {},
    };
  }

  // GET /admin/entries
  if (url === "/admin/entries" && method === "GET") {
    return {
      data: {
        entries: [
          { id: "1", walletAddress: mockState.member.walletAddress, referralCode: mockState.member.referralCode, email: mockState.member.email, isContactable: mockState.member.isContactable, validReferralCount: mockState.member.validReferralCount, queueScore: mockState.member.queueScore, currentRank: mockState.member.currentRank, currentPercentile: mockState.member.currentPercentile, joinedAt: mockState.member.joinedAt, referredByCode: null },
          { id: "2", walletAddress: "SolMock2222222222222222222222222222222", referralCode: "REF002", email: null, isContactable: false, validReferralCount: 3, queueScore: 15, currentRank: 8, currentPercentile: 25, joinedAt: new Date(Date.now() - 86400000).toISOString(), referredByCode: mockState.member.referralCode },
        ],
        total: mockState.member.totalMembers,
        page: 1,
        pageSize: 50,
      },
      status: 200, statusText: "OK", headers: {},
    };
  }

  // POST /admin/exports
  if (url === "/admin/exports" && method === "POST") {
    return {
      data: { downloadUrl: "/api/admin/waitlist/exports/entries.csv" },
      status: 200, statusText: "OK", headers: {},
    };
  }

  return {
    data: { statusCode: 404, message: "Not found" },
    status: 404, statusText: "Not Found", headers: {},
  };
}
