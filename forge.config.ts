import type { ForgeConfig } from '@electron-forge/shared-types';
import { execSync } from 'child_process';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const portRangeStart = 9000;
const portRangeEnd = 9999;

const resolveLoggerPort = (): number => {
  const requestedPort = Number(process.env.PORT);
  const startPort =
    Number.isFinite(requestedPort) &&
    requestedPort >= portRangeStart &&
    requestedPort <= portRangeEnd
      ? requestedPort
      : portRangeStart;

  const probeScript = `
const net = require('net');
const start = ${startPort};
const end = ${portRangeEnd};
const tryPort = (port) => new Promise((resolve) => {
  const server = net.createServer().unref();
  server.once('error', () => resolve(false));
  server.listen(port, () => server.close(() => resolve(true)));
});
(async () => {
  for (let port = start; port <= end; port++) {
    if (await tryPort(port)) {
      process.stdout.write(String(port));
      return;
    }
  }
  process.stderr.write('No available port in range');
  process.exit(1);
})();
`;

  const output = execSync(`node -e ${JSON.stringify(probeScript)}`, {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .toString()
    .trim();
  const port = Number(output);
  if (!Number.isFinite(port)) {
    throw new Error(
      `Failed to resolve dev server port from probe output: "${output}"`,
    );
  }
  return port;
};

const loggerPort = resolveLoggerPort();

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      certificateFile: './cert.pfx',
      certificatePassword: process.env.CERTIFICATE_PASSWORD,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      loggerPort: 19000,
      port: 3001,
      mainConfig,
      loggerPort,
      renderer: {
        config: rendererConfig,
        nodeIntegration: true,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/main/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
