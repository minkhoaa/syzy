# Authentication with Refresh Token

## Overview

The system uses **JWT access token** and **refresh token** to maintain user sessions:

- **Access Token**: Short-lived (15 minutes), used for all API requests
- **Refresh Token**: Long-lived (7 days), used to obtain a new access token

## Flow Diagram

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Frontend│         │  Backend │         │  Store  │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                     │
     │ 1. Login          │                     │
     ├──────────────────>│                     │
     │                   │                     │
     │ 2. Return tokens  │                     │
     │<──────────────────┤                     │
     │                   │                     │
     │ 3. Store tokens   │                     │
     ├───────────────────────────────────────> │
     │                   │                     │
     │ 4. API Request (with access token)      │
     ├──────────────────>│                     │
     │                   │                     │
     │ 5. 401 Unauthorized (token expired)     │
     │<──────────────────┤                     │
     │                   │                     │
     │ 6. Get refresh token                    │
     │<────────────────────────────────────────┤
     │                   │                     │
     │ 7. POST /auth/refresh                   │
     ├──────────────────>│                     │
     │                   │                     │
     │ 8. New tokens     │                     │
     │<──────────────────┤                     │
     │                   │                     │
     │ 9. Update tokens  │                     │
     ├───────────────────────────────────────> │
     │                   │                     │
     │ 10. Retry original request              │
     ├──────────────────>│                     │
     │                   │                     │
     │ 11. Success       │                     │
     │<──────────────────┤                     │
```

## Backend Implementation

### 1. Token Generation

```typescript
// Generate both tokens on login
const payload = { sub: user.id, walletAddress: user.walletAddress };
const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

return {
  access_token,
  refresh_token,
  user: { ... }
};
```

### 2. Refresh Endpoint

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token"
}
```

## Frontend Implementation

### 1. Auth Store (Zustand)

```typescript
// store/use-auth-store.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuthState: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'oyrade-auth-storage', // localStorage key
    },
  ),
);
```

### 2. API Client with Auto Refresh

```typescript
// lib/kubb.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      try {
        // Call refresh endpoint
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        
        // Update tokens
        setTokens(data.access_token, data.refresh_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 3. Usage in Components

```typescript
import { useAuthStore } from '@/store/use-auth-store'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

function MyComponent() {
  const { user, isAuthenticated, accessToken } = useAuthStore()
  const { login, logout } = useWalletAuth()
  
  // Login
  const handleLogin = async () => {
    await login() // Tokens automatically stored in Zustand
  }
  
  // Logout
  const handleLogout = () => {
    logout() // Clears tokens from Zustand
  }
  
  // Use in API calls (automatic via interceptor)
  const { data } = useGetMarkets() // Token auto-added to headers
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome {user?.walletAddress}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

## Token Lifecycle

### Access Token (15 minutes)

1. **Created**: On login/refresh
2. **Used**: Every API request (via Authorization header)
3. **Expired**: After 15 minutes
4. **Refreshed**: Automatically when 401 received

### Refresh Token (7 days)

1. **Created**: On login/refresh
2. **Used**: Only for `/auth/refresh` endpoint
3. **Expired**: After 7 days
4. **Renewed**: Each time it's used to refresh

## Security Features

### 1. Short-lived Access Tokens
- Minimize damage if token is stolen
- 15 minutes is enough for active sessions

### 2. Rotating Refresh Tokens
- New refresh token issued on each refresh
- Old refresh token becomes invalid
- Prevents token reuse attacks

### 3. Automatic Logout
- If refresh fails, user is logged out
- Prevents infinite retry loops
- Clears all stored tokens

### 4. Request Queuing
- Multiple 401s trigger single refresh
- Other requests wait for refresh to complete
- Prevents refresh token race conditions

## Testing

### Test Access Token Expiry

```typescript
// Manually expire token in store
const { setTokens } = useAuthStore.getState()
setTokens('expired_token', 'valid_refresh_token')

// Make API call - should auto-refresh
const { data } = await apiClient.get('/api/markets')
// ✅ Request succeeds with new token
```

### Test Refresh Token Expiry

```typescript
// Set both tokens as expired
const { setTokens } = useAuthStore.getState()
setTokens('expired_access', 'expired_refresh')

// Make API call - should logout
const { data } = await apiClient.get('/api/markets')
// ❌ User logged out, redirected to login
```

## Troubleshooting

### Issue: Token not refreshing

**Check:**
1. Refresh token is valid and not expired
2. `/api/auth/refresh` endpoint is working
3. Axios interceptor is properly configured
4. No circular dependency in imports

### Issue: Infinite refresh loop

**Check:**
1. `_retry` flag is set on request
2. Refresh endpoint doesn't require auth
3. Error handling in interceptor

### Issue: User logged out unexpectedly

**Check:**
1. Refresh token expiry (7 days)
2. Backend JWT secret changed
3. localStorage cleared
4. Network errors during refresh

## Best Practices

1. **Never expose refresh token in URLs** - Always in request body
2. **Store tokens securely** - Use Zustand persist with localStorage
3. **Handle refresh failures gracefully** - Logout and redirect
4. **Monitor token expiry** - Log refresh events for debugging
5. **Implement token rotation** - Issue new refresh token on each refresh
6. **Add rate limiting** - Prevent refresh token abuse
7. **Use HTTPS only** - Protect tokens in transit

## Migration from Old System

If you have old code using `localStorage` directly:

```typescript
// Old way ❌
localStorage.setItem('auth_token', token)
const token = localStorage.getItem('auth_token')

// New way ✅
const { setAuthState, accessToken } = useAuthStore()
setAuthState({ accessToken, refreshToken, user })
```

The system is backward compatible - old `setAuthToken()` helper still works but uses Zustand internally.
