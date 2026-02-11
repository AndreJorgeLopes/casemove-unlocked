import {
  ClipboardCheckIcon,
  ClipboardCopyIcon,
  ExternalLinkIcon,
  LockClosedIcon,
} from '@heroicons/react/solid';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingButton } from '../../../renderer/components/content/shared/animations';
import { classNames } from '../../../renderer/components/content/shared/filters/inventoryFunctions';
import NotificationElement from '../../../renderer/components/content/shared/modals & notifcations/notification';
import SteamLogo from '../../../renderer/components/content/shared/steamLogo';
import { ReducerManager } from '../../../renderer/functionsClasses/reducerManager';
import { State } from '../../../renderer/interfaces/states';
import {
  LoginCommand,
  LoginCommandReturnPackage,
  LoginNotificationObject,
  LoginOptions,
} from '../../../shared/Interfaces.tsx/store';
import { handleSuccess } from './HandleSuccess';
import SteamCloseModal from './closeSteamModal';
import LoginTabs from './components/LoginTabs';
import ConfirmModal from './confirmLoginModal';
import { LoginMethod } from './types/LoginMethod';

const loginResponseObject: LoginNotificationObject = {
  loggedIn: {
    success: true,
    title: 'Logged in successfully!',
    text: 'The app has successfully logged you in. Happy storaging.',
  },
  steamGuardError: {
    success: false,
    title: 'Steam Guard error!',
    text: 'Steam Guard might be required. Try again.',
  },
  steamGuardCodeIncorrect: {
    success: false,
    title: 'Wrong Steam Guard code',
    text: 'Got the wrong Steam Guard code. Try again.',
  },
  defaultError: {
    success: false,
    title: 'Unknown error',
    text: 'Could be wrong credentials, a network error, the account playing another game or something else.',
  },
  playingElsewhere: {
    success: false,
    title: 'Playing elsewhere',
    text: 'You were logged in but the account is currently playing elsewhere.',
  },
  wrongLoginToken: {
    success: false,
    title: 'Wrong login token',
    text: 'Got the wrong login token.',
  },
  webtokenNotJSON: {
    success: false,
    title: 'Not a JSON string',
    text: 'Did you copy the entire string? Try again.',
  },
  webtokenNotLoggedIn: {
    success: false,
    title: 'Not logged in',
    text: 'Please log in to the browser and try again.',
  },
};

function getStatusFromLoginKey(keyValue: keyof LoginOptions) {
  return loginResponseObject[keyValue] || loginResponseObject.defaultError;
}

export default function LoginForm({
  isLock,
  replaceLock,
  runDeleteUser,
  isAuthPending,
  setIsAuthPending,
  authStatus,
  setAuthStatus,
}) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [open, setOpen] = useState(false);
  const [sharedSecret, setSharedSecret] = useState('');
  const [clientjstoken, setClientjstoken] = useState('');
  const [doShow, setDoShow] = useState(false);
  const [wasSuccess, setWasSuccess] = useState(false);
  const [titleToDisplay, setTitleToDisplay] = useState('test');
  const [textToDisplay, setTextToDisplay] = useState('test');
  const [storeRefreshToken, setStoreRefreshToken] = useState(false);
  const [secretEnabled, setSecretEnabled] = useState(false);
  const [closeSteamOpen, setCloseSteamOpen] = useState(false);
  const [hasAskedCloseSteam, setHasAskedCloseSteam] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('REGULAR');
  const [qrURL, setQrURL] = useState('');

  const reducerClass = new ReducerManager(useSelector);
  const currentState: State = reducerClass.getStorage();
  const dispatch = useDispatch();

  const selectedLock = Array.isArray(isLock) ? isLock[0] : '';
  const hasChosenAccountLoginKey =
    Array.isArray(isLock) && isLock.length === 2 && isLock[1] != undefined;

  const canSubmit = useMemo(() => {
    if (isAuthPending || loginMethod === 'QR') {
      return false;
    }
    return true;
  }, [isAuthPending, loginMethod]);

  async function openNotification(keyValue: keyof LoginOptions) {
    const uiStatus = getStatusFromLoginKey(keyValue);
    setWasSuccess(uiStatus.success);
    setTitleToDisplay(uiStatus.title);
    setTextToDisplay(uiStatus.text);
    setDoShow(true);
  }

  function setPendingStatus(title: string, message: string) {
    setIsAuthPending(true);
    setAuthStatus({
      state: 'pending',
      title,
      message,
    });
  }

  function setErrorStatus(keyValue: keyof LoginOptions) {
    const uiStatus = getStatusFromLoginKey(keyValue);
    setIsAuthPending(false);
    setAuthStatus({
      state: 'error',
      title: uiStatus.title,
      message: uiStatus.text,
    });
  }

  function setSuccessStatus() {
    const uiStatus = getStatusFromLoginKey('loggedIn');
    setIsAuthPending(false);
    setAuthStatus({
      state: 'success',
      title: uiStatus.title,
      message: uiStatus.text,
    });
  }

  async function validateWebToken() {
    let clientjstokenToSend = clientjstoken as any;

    if (loginMethod === 'WEBTOKEN') {
      try {
        clientjstokenToSend = JSON.parse(clientjstoken);
      } catch {
        openNotification('webtokenNotJSON');
        setClientjstoken('');
        setErrorStatus('webtokenNotJSON');
        return null;
      }

      if (!clientjstokenToSend.logged_in) {
        openNotification('webtokenNotLoggedIn');
        setClientjstoken('');
        setErrorStatus('webtokenNotLoggedIn');
        return null;
      }
    } else {
      clientjstokenToSend = '';
    }

    return clientjstokenToSend;
  }

  async function applyLoginResponse(responseStatus: LoginCommand, successRoute = '/stats') {
    const resultKey = responseStatus.responseStatus;

    if (resultKey === 'wrongLoginToken') {
      replaceLock();
      if (selectedLock) {
        runDeleteUser(selectedLock);
      } else {
        runDeleteUser(username);
      }
    }

    if (resultKey === 'playingElsewhere') {
      setOpen(true);
    }

    if (resultKey === 'loggedIn') {
      openNotification('loggedIn');
      window.electron.ipcRenderer.refreshInventory();
      await handleSuccess(
        responseStatus.returnPackage as LoginCommandReturnPackage,
        dispatch,
        currentState,
      );
      setSuccessStatus();
      navigate(successRoute);
      return;
    }

    openNotification(resultKey);
    setErrorStatus(resultKey);
    setAuthCode('');
    if (resultKey === 'defaultError') {
      setUsername('');
      setPassword('');
    }
  }

  async function onSubmit() {
    if (!canSubmit) {
      return;
    }

    setPendingStatus('Connecting account', 'Signing in to Steam and establishing the game connection.');

    if (!hasAskedCloseSteam && currentState.settingsReducer.steamLoginShow) {
      setHasAskedCloseSteam(true);
      const steamRunning = await window.electron.ipcRenderer.checkSteam();
      if (steamRunning) {
        setIsAuthPending(false);
        setAuthStatus({
          state: 'idle',
          title: '',
          message: '',
        });
        setCloseSteamOpen(true);
        return;
      }
    }

    const clientjstokenToSend = await validateWebToken();
    if (clientjstokenToSend === null) {
      return;
    }

    let usernameToSend = username as any;
    let passwordToSend = password as any;
    let storePasswordToSend = storeRefreshToken as any;

    if (selectedLock !== '') {
      usernameToSend = selectedLock;
      passwordToSend = null;
      storePasswordToSend = true;
    }

    try {
      const responseStatus: LoginCommand =
        await window.electron.ipcRenderer.loginUser(
          usernameToSend,
          passwordToSend,
          clientjstokenToSend !== '' ? false : storePasswordToSend,
          authCode,
          sharedSecret,
          clientjstokenToSend,
        );

      await applyLoginResponse(responseStatus, '/overview');
    } catch {
      openNotification('defaultError');
      setErrorStatus('defaultError');
      setAuthCode('');
    }
  }

  async function confirmForceLogin() {
    if (isAuthPending) {
      return;
    }

    setPendingStatus('Reconnecting account', 'Forcing account login and reconnecting game coordinator session.');
    setOpen(false);

    try {
      window.electron.ipcRenderer.forceLogin();
      const responseStatus: LoginCommand =
        await window.electron.ipcRenderer.forceLoginReply();
      await applyLoginResponse(responseStatus, '/stats');
    } catch {
      openNotification('defaultError');
      setErrorStatus('defaultError');
    }
  }

  async function updateUsername(value) {
    if (isAuthPending) {
      return;
    }
    setUsername(value);
    if (selectedLock !== '') {
      replaceLock();
    }
  }

  async function updatePassword(value) {
    if (isAuthPending) {
      return;
    }
    setPassword(value);
    if (selectedLock !== '') {
      replaceLock();
    }
  }

  useEffect(() => {
    const onKeyUp = ({ key }) => {
      if (key === 'Enter' && canSubmit) {
        onSubmit();
      }
    };

    document.addEventListener('keyup', onKeyUp);
    return () => document.removeEventListener('keyup', onKeyUp);
  }, [canSubmit, username, password, authCode, sharedSecret, clientjstoken, storeRefreshToken, selectedLock, loginMethod]);

  useEffect(() => {
    if (loginMethod !== 'QR') {
      return;
    }

    let cancelled = false;
    setPendingStatus('Waiting for QR confirmation', 'Approve the sign-in from your Steam mobile app.');

    window.electron.ipcRenderer.once('qrLogin:show', (pack) => {
      if (!cancelled) {
        setQrURL(pack);
      }
    });

    window.electron.ipcRenderer
      .startQRLogin(storeRefreshToken)
      .then(async (responseStatus) => {
        if (cancelled) {
          return;
        }
        await applyLoginResponse(responseStatus, '/stats');
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        openNotification('defaultError');
        setErrorStatus('defaultError');
      });

    return () => {
      cancelled = true;
      setIsAuthPending(false);
      setAuthStatus({
        state: 'idle',
        title: '',
        message: '',
      });
      window.electron.ipcRenderer.cancelQRLogin();
    };
  }, [loginMethod, storeRefreshToken]);

  return (
    <>
      <SteamCloseModal
        open={closeSteamOpen}
        setOpen={setCloseSteamOpen}
        loginWithouClosingSteam={() => onSubmit()}
        setLoadingButton={(value) => {
          setIsAuthPending(value);
        }}
      />
      <ConfirmModal
        open={open}
        setOpen={setOpen}
        onConfirm={confirmForceLogin}
        isPending={isAuthPending}
      />
      <div className="min-h-full flex items-center pt-32 justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div>
            <SteamLogo />
            <LoginTabs
              selectedTab={loginMethod}
              setSelectedTab={setLoginMethod}
              disabled={isAuthPending}
            />
            <h2 className="mt-6 text-center dark:text-dark-white text-3xl font-extrabold text-gray-900">
              {loginMethod === 'REGULAR'
                ? 'Connect to Steam'
                : loginMethod === 'QR'
                  ? 'Scan QR Code'
                  : 'Connect from browser'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {loginMethod === 'REGULAR'
                ? 'The application needs to have an active Steam connection to manage your CSGO items. You should not have any games open on the Steam account.'
                : loginMethod === 'QR'
                  ? 'Scan the QR code with your Steam mobile app. You should be logged into the account you wish to connect Casemove with.'
                  : 'Open the URL by clicking on the button, or by copying it to the clipboard. You should be logged into the account you wish to connect Casemove with. Paste the entire string below.'}
            </p>
            {authStatus?.state && authStatus.state !== 'idle' ? (
              <div
                className={classNames(
                  authStatus.state === 'success'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : authStatus.state === 'error'
                      ? 'border-red-500 bg-red-50 text-red-800'
                      : 'border-blue-500 bg-blue-50 text-blue-800',
                  'mt-4 rounded-md border px-3 py-2 text-sm',
                )}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {authStatus.state === 'pending' ? <LoadingButton /> : null}
                  <span>{authStatus.title}</span>
                </div>
                <div className="mt-1">{authStatus.message}</div>
              </div>
            ) : null}
          </div>

          <form className="mt-8 mb-6" onSubmit={(e) => e.preventDefault()}>
            <input type="hidden" name="remember" defaultValue="true" />
            {loginMethod === 'REGULAR' ? (
              <div className="rounded-md mb-6">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    onChange={(e) => updateUsername(e.target.value)}
                    spellCheck={false}
                    required
                    disabled={isAuthPending}
                    value={selectedLock === '' ? username : selectedLock}
                    className="appearance-none dark:bg-dark-level-one dark:text-dark-white dark:bg-dark-level-one dark:border-opacity-50 rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-60"
                    placeholder="Username"
                  />
                </div>
                {!hasChosenAccountLoginKey ? (
                  <div>
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <input
                      id="password"
                      spellCheck={false}
                      name="password"
                      type="password"
                      onChange={(e) => updatePassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={isAuthPending}
                      value={selectedLock === '' ? password : '~{nA?HJjb]7hB7-'}
                      className="appearance-none dark:text-dark-white rounded-none dark:bg-dark-level-one dark:border-opacity-50 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-60"
                      placeholder="Password"
                    />
                  </div>
                ) : (
                  ''
                )}
                {!hasChosenAccountLoginKey ? (
                  <div>
                    <label htmlFor="authcode" className="sr-only">
                      Steam Guard
                    </label>
                    <input
                      id="authcode"
                      name="authcode"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      spellCheck={false}
                      required
                      disabled={isAuthPending}
                      className="appearance-none rounded-none dark:bg-dark-level-one dark:text-dark-white dark:border-opacity-50 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-60"
                      placeholder="Authcode (optional)"
                    />
                  </div>
                ) : (
                  <div className="pt-1 flex items-center">
                    <LockClosedIcon className="h-4 mr-1 w-4 dark:text-gray-500" />
                    <span className="dark:text-gray-500 sm:text-sm mt-0.5 ">
                      Password and Steam Guard code not required
                    </span>
                  </div>
                )}

                {!hasChosenAccountLoginKey ? (
                  <div className={classNames(secretEnabled ? '' : 'hidden')}>
                    <label htmlFor="secret" className="sr-only">
                      SharedSecret
                    </label>
                    <input
                      id="secret"
                      name="secret"
                      value={sharedSecret}
                      onChange={(e) => setSharedSecret(e.target.value)}
                      spellCheck={false}
                      required
                      disabled={isAuthPending}
                      className="appearance-none rounded-none dark:bg-dark-level-one dark:text-dark-white dark:border-opacity-50 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:opacity-60"
                      placeholder="Shared Secret (If you don't know what this is, leave it empty.)"
                    />
                  </div>
                ) : (
                  ''
                )}
              </div>
            ) : loginMethod === 'WEBTOKEN' ? (
              <div className="rounded-md mb-6">
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch grow focus-within:z-10">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClipboardCheckIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      spellCheck={false}
                      type="text"
                      name="clientjs"
                      id="clientjs"
                      value={clientjstoken}
                      disabled={isAuthPending}
                      onChange={(e) => setClientjstoken(e.target.value)}
                      className="bg-dark-level-one focus:border-green-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border border-gray-300 border-opacity-50 focus:outline-none text-dark-white disabled:opacity-60"
                      placeholder="Paste data"
                    />
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        'https://steamcommunity.com/chat/clientjstoken',
                      )
                    }
                    type="button"
                    disabled={isAuthPending}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 border-opacity-50 text-sm font-medium text-gray-700 bg-dark-level-two hover:bg-dark-level-three focus:outline-none focus:border-green-500 disabled:opacity-60"
                  >
                    <ClipboardCopyIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </button>
                  {isAuthPending ? (
                    <span className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 border-opacity-50 text-sm font-medium rounded-r-md text-gray-500 bg-dark-level-two opacity-70">
                      <ExternalLinkIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  ) : (
                    <a
                      href="https://steamcommunity.com/chat/clientjstoken"
                      target="_blank"
                      className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 border-opacity-50 text-sm font-medium rounded-r-md text-gray-700 bg-dark-level-two hover:bg-dark-level-three focus:outline-none focus:border-green-500"
                    >
                      <ExternalLinkIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center bg-white py-4">
                  <QRCode size={235} value={qrURL} viewBox={`0 0 235 235`} />
                </div>
                <div className="flex pt-2 items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={storeRefreshToken}
                    disabled={isAuthPending}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    onChange={() => setStoreRefreshToken(!storeRefreshToken)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block pl-1 text-sm text-gray-900 dark:text-dark-white"
                  >
                    Remember for later
                  </label>
                </div>
              </>
            )}

            {!hasChosenAccountLoginKey ? (
              <div
                className={classNames(
                  loginMethod === 'REGULAR' ? '' : 'hidden',
                  'flex items-center justify-between',
                )}
              >
                <div className="flex items-center">
                  {selectedLock === '' ? (
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={storeRefreshToken}
                      disabled={isAuthPending}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      onChange={() => setStoreRefreshToken(!storeRefreshToken)}
                    />
                  ) : !hasChosenAccountLoginKey ? (
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={true}
                      disabled
                      className="pointer-events-none h-4 w-4 text-indigo-600 focus:ring-indigo-500 dark:text-opacity-50 border-gray-300 rounded"
                      onChange={() => setStoreRefreshToken(!storeRefreshToken)}
                    />
                  ) : (
                    ''
                  )}

                  {selectedLock === '' ? (
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-900 dark:text-dark-white"
                    >
                      Remember for later
                    </label>
                  ) : !hasChosenAccountLoginKey ? (
                    <label
                      htmlFor="remember-me"
                      className="ml-2 pointer-events-none block text-sm text-gray-900 dark:text-opacity-50 dark:text-dark-white"
                    >
                      Remember for later
                    </label>
                  ) : (
                    ''
                  )}
                </div>
                {!hasChosenAccountLoginKey ? (
                  <div className="flex items-center">
                    <label
                      htmlFor="sharedSecret"
                      className="mr-2 block text-sm text-gray-900 dark:text-dark-white"
                    >
                      Show secret field
                    </label>
                    <input
                      id="sharedSecret"
                      name="sharedSecret"
                      type="checkbox"
                      disabled={isAuthPending}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      onChange={() => setSecretEnabled(!secretEnabled)}
                    />
                  </div>
                ) : (
                  ''
                )}
              </div>
            ) : (
              ''
            )}
            {loginMethod !== 'QR' ? (
              <div className="flex justify-between mt-6">
                <button
                  disabled={!canSubmit}
                  className="focus:bg-indigo-700 group relative w-full flex justify-center py-2 px-4 ml-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => onSubmit()}
                  type="button"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {isAuthPending ? (
                      <LoadingButton />
                    ) : (
                      <LockClosedIcon
                        className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  {isAuthPending ? 'Connecting...' : 'Sign in'}
                </button>
              </div>
            ) : null}
          </form>
        </div>
      </div>
      <NotificationElement
        success={wasSuccess}
        titleToDisplay={titleToDisplay}
        textToDisplay={textToDisplay}
        doShow={doShow}
        setShow={() => {
          setDoShow(false);
        }}
      />
    </>
  );
}
