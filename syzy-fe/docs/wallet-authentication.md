# Wallet Authentication Flow

## Overview

The system uses **Solana wallet signatures** to authenticate users. This flow ensures that only the owner of the wallet's private key can log in.

## Authentication Flow

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│ Frontend│         │  Backend │         │ Wallet  │
└────┬────┘         └────┬─────┘         └────┬────┘
     │                   │                     │
     │ 1. Connect Wallet │                     │
     ├──────────────────────────────────────>  │
     │                   │                     │
     │ 2. POST /auth/nonce                     │
     ├──────────────────>│                     │
     │                   │                     │
     │ 3. Return nonce + message               │
     │<──────────────────┤                     │
     │                   │                     │
     │ 4. Sign message   │                     │
     ├──────────────────────────────────────>  │
     │                   │                     │
     │ 5. Return signature                     │
     │<──────────────────────────────────────  │
     │                   │                     │
     │ 6. POST /auth/verify                    │
     │    (address, signature, message)        │
     ├──────────────────>│                     │
     │                   │                     │
     │                   │ 7. Verify signature │
     │                   │     using nacl      │
     │                   │                     │
     │ 8. Return JWT token + user data         │
     │<──────────────────┤                     │
     │                   │                     │
```

## Backend Implementation

### 1. Get Nonce Endpoint

**Endpoint:** `POST /api/auth/nonce`

**Request:**
```json
{
  "walletAddress": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
}
```

**Response:**
```json
{
  "nonce": "abc-123-def-456",
  "message": "Sign this message to authenticate with Oyrade:\n\nNonce: abc-123-def-456"
}
```

**Logic:**
- Find user by wallet address
- If user doesn't exist, create one with a random nonce
- Return the nonce and the message to sign

### 2. Verify Signature Endpoint

**Endpoint:** `POST /api/auth/verify`

**Request:**
```json
{
  "walletAddress": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
  "signature": "3yZe7d...", // base58 encoded
  "message": "Sign this message to authenticate with Oyrade:\n\nNonce: abc-123-def-456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "walletAddress": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
    "username": null,
    "avatar": null
  }
}
```

**Logic:**
- Verify signature using `nacl.sign.detached.verify()`
- Generate a new nonce for the next login (prevent replay attacks)
- Generate JWT token
- Return token + user data

### 3. Dev Login Endpoint (Development Only)

**Endpoint:** `POST /api/auth/dev-login`

**Request:**
```json
{
  "walletAddress": "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
}
```

**Response:** Same as verify endpoint

**Note:** Bypasses signature verification — only use in development!

## Frontend Implementation

### 1. Hook: `useWalletAuth`

```typescript
import { useWalletAuth } from '@/hooks/use-wallet-auth'

function MyComponent() {
  const { login, devLogin, logout, getToken, getUser, isAuthenticating } = useWalletAuth()

  // Login with signature
  const handleLogin = async () => {
    try {
      const authData = await login()
      console.log('Logged in:', authData)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  // Dev login (no signature)
  const handleDevLogin = async () => {
    try {
      const authData = await devLogin()
      console.log('Dev logged in:', authData)
    } catch (error) {
      console.error('Dev login failed:', error)
    }
  }

  // Logout
  const handleLogout = () => {
    logout()
  }

  // Get current token
  const token = getToken()

  // Get current user
  const user = getUser()
}
```

### 2. Component: `WalletAuthButton`

Pre-built component with full authentication flow:

```typescript
import { WalletAuthButton } from '@/components/auth/wallet-auth-button'

function MyPage() {
  return (
    <div>
      <WalletAuthButton />
    </div>
  )
}
```

## API Client Integration

Tokens are automatically added to all API requests via an Axios interceptor in `lib/kubb.ts`:

```typescript
// Token is stored in localStorage with key 'auth_token'
// Every request automatically includes the header:
// Authorization: Bearer <token>
```

### Using with generated API hooks:

```typescript
import { useGetMarkets } from '@/lib/api-client/hooks'

function MarketList() {
  // This hook automatically sends the token in the header
  const { data, isLoading } = useGetMarkets()

  return (
    <div>
      {data?.markets.map(market => (
        <div key={market.id}>{market.name}</div>
      ))}
    </div>
  )
}
```

## Security Features

### 1. Nonce-based Authentication
- A new nonce is required for each login
- Nonce is regenerated after each successful verification
- Prevents replay attacks

### 2. Signature Verification
- Uses `tweetnacl` to verify Ed25519 signatures
- Ensures only the private key owner can sign the message

### 3. JWT Token
- Token has an expiration time
- Token is verified by the backend for all protected endpoints

## Testing

### Test Page

Visit `/test-auth` to test the authentication flow:

```bash
# Start frontend
cd oyrade-fe
pnpm dev

# Visit http://localhost:3000/test-auth
```

### Manual Testing Steps

1. Click "Connect Wallet"
2. Select a wallet and connect
3. Click "Sign & Login"
4. Approve the signature request in the wallet
5. Check the console for token and user data
6. Token is stored in localStorage
7. All subsequent API calls will automatically include the token

### Dev Login (No Signature)

For quick testing without signing a message:

1. Connect wallet
2. Click "Dev Login"
3. Token is created immediately

## Environment Variables

### Frontend (.env)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_HELIUS_RPC_URL=https://api.devnet.solana.com
```

### Backend (.env)

```bash
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Troubleshooting

### Error: "Failed to sign message"

- Check if the wallet is connected
- Check if the wallet provider supports `signMessage()`
- Try disconnecting and reconnecting

### Error: "Invalid signature"

- Check if the message has the correct format
- Check signature encoding (must be base58)
- Check if the wallet address is correct

### Error: "User not found"

- Backend hasn't created the user yet
- Call `/auth/nonce` first to create the user

## Best Practices

1. **Always check wallet connection** before calling login
2. **Handle errors gracefully** — show user-friendly messages
3. **Store token securely** — localStorage is fine for web apps
4. **Implement token refresh** for long-lived sessions
5. **Clear token on logout** — ensure security
6. **Use dev-login only in development** — never in production!

## Next Steps

- [ ] Implement token refresh mechanism
- [ ] Add session management
- [ ] Add user profile update endpoints
- [ ] Add role-based access control (RBAC)
- [ ] Add multi-wallet support
