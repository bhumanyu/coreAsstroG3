import type { HoroscopeEnvironment, HoroscopeProvider } from '../types';
import { FixtureProvider } from './fixtureProvider';
import { StarsApiProvider } from './starsApiProvider';

export function getProvider(env: HoroscopeEnvironment): HoroscopeProvider {
  return env.STARSAPI_KEY
    ? new StarsApiProvider(env.STARSAPI_KEY)
    : new FixtureProvider();
}
