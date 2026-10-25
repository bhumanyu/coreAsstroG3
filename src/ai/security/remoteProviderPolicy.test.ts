import { describe, expect, it } from 'vitest';
import {
  assertRemoteProviderAllowed,
  evaluateRemoteProviderPolicy
} from './remoteProviderPolicy';

describe('remote provider policy', () => {
  it('denies browser runtime before considering enabled/configured flags', () => {
    expect(evaluateRemoteProviderPolicy({
      runtime: 'BROWSER',
      remoteAiEnabled: true,
      proxyConfigured: true
    })).toEqual({ allowed: false, reason: 'BROWSER_RUNTIME' });
  });

  it('denies remote AI when it is disabled', () => {
    expect(evaluateRemoteProviderPolicy({
      runtime: 'SERVER',
      remoteAiEnabled: false,
      proxyConfigured: true
    })).toEqual({ allowed: false, reason: 'REMOTE_AI_DISABLED' });
  });

  it('denies remote AI when the proxy is not configured', () => {
    expect(evaluateRemoteProviderPolicy({
      runtime: 'SERVER',
      remoteAiEnabled: true,
      proxyConfigured: false
    })).toEqual({ allowed: false, reason: 'PROXY_NOT_CONFIGURED' });
  });

  it('allows server runtime only when enabled and configured', () => {
    expect(evaluateRemoteProviderPolicy({
      runtime: 'SERVER',
      remoteAiEnabled: true,
      proxyConfigured: true
    })).toEqual({ allowed: true });
  });

  it('asserts that browser execution is denied', () => {
    expect(() => assertRemoteProviderAllowed({
      runtime: 'BROWSER',
      remoteAiEnabled: true,
      proxyConfigured: true
    })).toThrow('Remote AI provider denied: BROWSER_RUNTIME');
  });
});
