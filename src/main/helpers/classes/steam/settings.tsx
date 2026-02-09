import Store from 'electron-store';
import { safeStorage } from 'electron';
import axios from 'axios';

import { DOMParser } from 'xmldom';
import { WithImplicitCoercion } from 'buffer';
function logOptionalFetchError(context: string, resourceURL: string, error: unknown) {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    if (statusCode === 404) {
      console.warn(
        `[optional-fetch] ${context} returned 404; using fallback`,
        { resourceURL, statusCode },
      );
      return;
    }

    console.error(`[optional-fetch] ${context} request failed`, {
      resourceURL,
      statusCode,
      message: error.message,
    });
    return;
  }

  console.error(`[optional-fetch] ${context} request failed`, {
    resourceURL,
    error,
  });
}

async function getURL(steamID): Promise<string | null> {
  const profileURL = `https://steamcommunity.com/profiles/${steamID}/?xml=1`;
  try {
    const response = await axios.get(profileURL);
    const parser = new DOMParser();
    return (
      parser
        .parseFromString(response.data, 'text/xml')
        .getElementsByTagName('profile')[0]
        .getElementsByTagName('avatarMedium')[0]?.childNodes[0]?.nodeValue ??
      null
    );
  } catch (error) {
    logOptionalFetchError('Steam profile avatar fetch', profileURL, error);
    return null;
  }
}
// Define store
const store = new Store({
  name: 'casemoveEnc',
  watch: true,
  encryptionKey: 'this_only_obfuscates',
});

function canUseSafeStorage() {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function encryptStringOrFallback(value: string) {
  if (canUseSafeStorage()) {
    const buffer = safeStorage.encryptString(value);
    return buffer.toString('latin1');
  }

  return value;
}

function decryptStringOrFallback(value?: WithImplicitCoercion<string> | null) {
  if (!value) {
    return null;
  }

  if (canUseSafeStorage()) {
    try {
      return safeStorage.decryptString(Buffer.from(value, 'latin1'));
    } catch {
      return value.toString();
    }
  }

  return value.toString();
}

// Store user data
export async function storeRefreshToken(username: string, loginKey?: string) {
  // Get account details
  let accountDetails = store.get('account');
  if (!accountDetails) {
    accountDetails = {};
  }

  if (!accountDetails[username]) {
    accountDetails[username] = {};
  }

  if (loginKey) {
    // Encrypt sensitive data (fallback to plain when unavailable)
    accountDetails[username]['refreshToken'] =
      encryptStringOrFallback(loginKey);
  } else {
    if (accountDetails[username]['refreshToken']) {
      delete accountDetails[username]['refreshToken'];
    }
  }

  // Set store
  console.log('saving refreshToken');
  store.set({
    account: accountDetails,
  });
}

// Store user data
export async function storeUserAccount(
  username,
  displayName,
  steamID,
  secretKey: string | null,
) {
  // Get the profile picture
  const imageURL = await getURL(steamID);

  // Get account details
  let accountDetails = store.get('account');
  if (accountDetails == undefined) {
    accountDetails = {};
  }

  if (accountDetails[username] == undefined) {
    accountDetails[username] = {};
  }

  // Add to account details
  accountDetails[username]['displayName'] = displayName;
  accountDetails[username]['imageURL'] = imageURL;
  // Encrypt sensitive data
  if (secretKey) {
    const dictToWrite = {
      secretKey: secretKey,
    };
    accountDetails[username]['safeData'] = encryptStringOrFallback(
      JSON.stringify(dictToWrite),
    );
  }

  // Set store
  console.log('Saving regular');
  store.set({
    account: accountDetails,
  });
}

export async function setAccountPosition(username, newPosition) {
  let accountDetails = store.get('account');
  if (accountDetails == undefined) {
    accountDetails = {};
  }

  // Add to account details
  accountDetails[username]['position'] = newPosition;

  // Set store
  store.set({
    account: accountDetails,
  });
}

// Delete user data
export async function deleteUserData(username) {
  let statusCode = 0;

  // Get account details
  const accountDetails = store.get('account');
  if (
    typeof accountDetails === 'object' &&
    Object.keys(accountDetails).includes(username)
  ) {
    delete accountDetails[username];

    store.set('account', accountDetails);
    statusCode = 1;
  }
  return statusCode;
}

// Get login details
export async function getLoginDetails(username) {
  const secretData = decryptStringOrFallback(
    store.get('account.' + username + '.safeData') as
      | WithImplicitCoercion<string>
      | undefined,
  );

  if (!secretData) {
    return {};
  }

  try {
    return JSON.parse(secretData);
  } catch {
    return {};
  }
}
// Get login details
export async function getRefreshToken(username) {
  const secretData = decryptStringOrFallback(
    store.get('account.' + username + '.refreshToken') as
      | WithImplicitCoercion<string>
      | undefined,
  );

  return secretData;
}
// Get all account details
export async function getAllAccountDetails() {
  return store.get('account');
}

export async function setValue(stringToSet, valueToSet) {
  store.set(stringToSet, valueToSet);
}

export async function getValue(stringToGet) {
  return store.get(stringToGet);
}
