import axios from 'axios';
import { GithubResponse } from '../../main/interfaces/mainInterfaces';


export async function getGithubVersion(platform: string): Promise<GithubResponse> {
  const fallbackVersion: GithubResponse = {
    version: 0,
    downloadLink: '',
  };
  const releasesURL = 'https://api.github.com/repos/AaronTaga/casemove/releases';

  try {
    const response = await axios.get(releasesURL);
    const responseData: JSON = response.data;

    for (const [_key, value] of Object.entries(responseData)) {
      if (value.prerelease == false) {
        console.log('githubVersion', value.tag_name.replaceAll('.', ''));
        let downloadLink: string = value['html_url'];
        console.log('Platform: ', platform);

        // Find the relevant download link
        switch (platform) {
          case 'win32':
            value.assets.forEach((element) => {
              if (
                element.name.includes('.exe') &&
                !element.name?.toLowerCase()?.includes('blockmap')
              ) {
                downloadLink = element.browser_download_url;
              }
            });
            break;

          case 'linux':
            value.assets.forEach((element) => {
              if (element.name.includes('.dmg')) {
                downloadLink = element.browser_download_url;
              }
            });
            break;

          default:
            break;
        }

        return {
          version: parseInt(
            value.tag_name.replaceAll('.', '').replaceAll('v', ''),
          ),
          downloadLink: downloadLink,
        };
      }
    }

    console.warn(
      '[optional-fetch] GitHub release lookup returned no stable release; using fallback',
      { releasesURL },
    );
    return fallbackVersion;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      if (statusCode === 404) {
        console.warn(
          '[optional-fetch] GitHub release lookup returned 404; using fallback',
          { releasesURL, statusCode },
        );
      } else {
        console.error('[optional-fetch] GitHub release lookup failed', {
          releasesURL,
          statusCode,
          message: error.message,
        });
      }
    } else {
      console.error('[optional-fetch] GitHub release lookup failed', {
        releasesURL,
        error,
      });
    }

    return fallbackVersion;
  }
}
