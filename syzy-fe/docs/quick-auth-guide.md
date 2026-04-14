# Quick Authentication Guide

## 🚀 Quick Start

### 1. Connect & Login

```typescript
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { useReownWallet } from '@/hooks/use-reown-wallet'

function LoginButton() {
  const { connected, connect } = useReownWallet()
  const { login, isAuthenticating } = useWalletAuth()
  
  const handleClick = async () => {
    if (!connected) {
      connect()
      return
    }
    
    await login() // This will prompt wallet to sign message
  }
  
  return (
    <button onClick={handleClick} disabled={isAuthenticating}>
      {!connected ? 'Connect Wallet' : 'Sign & Login'}
    </button>
  )
}
```

### 2. Use Pre-built Component

```typescript
import { WalletAuthButton } from '@/components/auth/wallet-auth-button'

function MyPage() {
  return <WalletAuthButton />
}
```

## 📝 API Endpoints

```bash
# 1. Get nonce
POST /api/auth/nonce
Body: { "walletAddress": "..." }

# 2. Verify signature
POST /api/auth/verify
Body: { 
  "walletAddress": "...",
  "signature": "...",
  "message": "..."
}

# 3. Dev login (no signature)
POST /api/auth/dev-login
Body: { "walletAddress": "..." }
```

## 🔑 Access Token

Token is automatically added to all API requests:

```typescript
// Token stored in localStorage as 'auth_token'
// All API calls automatically include:
// Authorization: Bearer <token>

// Manual access:
import { getAuthToken, setAuthToken } from '@/lib/kubb'

const token = getAuthToken()
setAuthToken('new-token')
```

## 🧪 Testing

Visit: `http://localhost:3000/test-auth`

## 🔒 Security Flow

```
1. Frontend requests nonce from backend
2. Backend generates unique nonce
3. Frontend asks wallet to sign message with nonce
4. Wallet signs and returns signature
5. Frontend sends signature to backend
6. Backend verifies signature using nacl
7. Backend returns JWT token
8. Token stored and used for all API calls
```

## 💡 Tips

- Use `devLogin()` for quick testing (no signature required)
- Token persists in localStorage across page refreshes
- Call `logout()` to clear token and user data
- Check `isAuthenticating` to show loading states
