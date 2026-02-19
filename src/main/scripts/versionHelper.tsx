import axios, { isAxiosError } from 'axios';
import packageJSON from '../../../package.json';
import { GithubResponse } from '../interfaces/mainInterfaces';

const DEFAULT_GITHUB_REPOSITORY = 'AndreJorgeLopes/casemove-unlocked';

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  prerelease: boolean;
  tag_name: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
}

function extractGithubRepository(repositoryURL?: string): string | null {
  if (!repositoryURL) {
    return null;
  }

  const normalizedURL = repositoryURL
    .trim()
    .replace(/^git\+/, '')
    .replace(/\.git$/, '');

  const sshMatch = normalizedURL.match(/^git@github\.com:(.+\/.+)$/i);
  if (sshMatch?.[1]) {
    return sshMatch[1];
  }

  try {
    const parsedURL = new URL(normalizedURL);
    if (parsedURL.hostname !== 'github.com') {
      return null;
    }

    const pathSegments = parsedURL.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/');

    if (pathSegments.length < 2) {
      return null;
    }

    return `${pathSegments[0]}/${pathSegments[1]}`;
  } catch {
    return null;
  }
}

function getRepositoryURLFromPackage(): string | undefined {
  if (typeof packageJSON.repository === 'string') {
    return packageJSON.repository;
  }

  return packageJSON.repository?.url || packageJSON.author?.url;
}

export function getGithubRepository(): string {
  const envRepository = process.env.CASEMOVE_GITHUB_REPOSITORY;
  if (envRepository?.includes('/')) {
    return envRepository.trim().replace(/\.git$/, '');
  }

  const repositoryFromPackage = extractGithubRepository(
    getRepositoryURLFromPackage(),
  );

  return repositoryFromPackage || DEFAULT_GITHUB_REPOSITORY;
}

export function normalizeVersionTag(tagOrVersion: string): number {
  const cleanVersion = tagOrVersion.trim().replace(/^v/i, '');
  const versionParts = cleanVersion.split('.');

  const major = Number(versionParts[0]) || 0;
  const minor = Number(versionParts[1]) || 0;
  const patch = Number(versionParts[2]) || 0;

  return major * 1000000 + minor * 1000 + patch;
}

function selectDownloadLink(release: GitHubRelease, platform: string): string {
  const defaultLink = release.html_url;

  if (!Array.isArray(release.assets) || release.assets.length === 0) {
    return defaultLink;
  }

  const windowsAsset = release.assets.find(
    (asset) =>
      asset.name?.toLowerCase().includes('.exe') &&
      !asset.name?.toLowerCase().includes('blockmap'),
  );

  const linuxAsset = release.assets.find((asset) => {
    const normalizedName = asset.name?.toLowerCase();
    return (
      normalizedName.includes('.deb') ||
      normalizedName.includes('.rpm') ||
      normalizedName.includes('.appimage') ||
      normalizedName.includes('.tar.gz')
    );
  });

  if (platform === 'win32' && windowsAsset) {
    return windowsAsset.browser_download_url;
  }

  if (platform === 'linux' && linuxAsset) {
    return linuxAsset.browser_download_url;
  }

  return defaultLink;
}

export async function getGithubVersion(platform: string): Promise<GithubResponse> {
  const fallbackVersion: GithubResponse = {
    version: 0,
    downloadLink: '',
  };
  const githubRepository = getGithubRepository();
  const releasesURL = `https://api.github.com/repos/${githubRepository}/releases`;

  try {
    const response = await axios.get<GitHubRelease[]>(releasesURL);
    const latestStableRelease = response.data.find(
      (release) => release.prerelease === false,
    );

    if (!latestStableRelease) {
      console.warn(
        '[optional-fetch] GitHub release lookup returned no stable release; using fallback',
        { releasesURL, githubRepository },
      );
      return fallbackVersion;
    }

    return {
      version: normalizeVersionTag(latestStableRelease.tag_name),
      downloadLink: selectDownloadLink(latestStableRelease, platform),
    };
  } catch (error) {
    if (isAxiosError(error)) {
      const statusCode = error.response?.status;
      if (statusCode === 404) {
        console.warn(
          '[optional-fetch] GitHub release lookup returned 404; using fallback',
          { releasesURL, githubRepository, statusCode },
        );
      } else {
        console.error('[optional-fetch] GitHub release lookup failed', {
          releasesURL,
          githubRepository,
          statusCode,
          message: error.message,
        });
      }
    } else {
      console.error('[optional-fetch] GitHub release lookup failed', {
        releasesURL,
        githubRepository,
        error,
      });
    }

    return fallbackVersion;
  }
}
