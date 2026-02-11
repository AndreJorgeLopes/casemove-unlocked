import { shouldInstallDevtoolsExtension } from '../main/helpers/devtools';

describe('shouldInstallDevtoolsExtension', () => {
  it('returns false outside development', () => {
    expect(
      shouldInstallDevtoolsExtension(false, {
        CASEMOVE_ENABLE_REACT_DEVTOOLS: 'true',
      } as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it('returns false in development by default', () => {
    expect(
      shouldInstallDevtoolsExtension(true, {} as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it('returns true in development when explicitly enabled', () => {
    expect(
      shouldInstallDevtoolsExtension(true, {
        CASEMOVE_ENABLE_REACT_DEVTOOLS: 'true',
      } as NodeJS.ProcessEnv),
    ).toBe(true);
  });
});

