export function shouldInstallDevtoolsExtension(
  isDevelopment: boolean,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (!isDevelopment) {
    return false;
  }

  // Keep extension opt-in to avoid startup/runtime instability across
  // Electron versions.
  return env.CASEMOVE_ENABLE_REACT_DEVTOOLS == 'true';
}

