/**
 * Global transaction lock.
 *
 * Prevents auto-login from firing a `signMessage` request while the wallet
 * is already signing a transaction (ZK trades, swaps, etc.).  Without this,
 * a JWT expiry during proof generation causes a conflicting signing popup
 * that the wallet silently rejects → "User rejected the request".
 */

let _locked = false;
let _onUnlock: (() => void) | null = null;

export function acquireTxLock(): void {
  _locked = true;
}

export function releaseTxLock(): void {
  _locked = false;
  if (_onUnlock) {
    const cb = _onUnlock;
    _onUnlock = null;
    cb();
  }
}

export function isTxLocked(): boolean {
  return _locked;
}

/**
 * Register a one-shot callback that fires when the lock is released.
 * If the lock is already free the callback fires immediately.
 */
export function onTxUnlock(cb: () => void): void {
  if (!_locked) {
    cb();
    return;
  }
  _onUnlock = cb;
}
