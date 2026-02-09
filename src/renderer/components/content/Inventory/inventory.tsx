import { Route, Routes } from 'react-router-dom';
import InventoryFilters from './filterHeader';
import InventoryRowsComponent from './inventoryRows';
import { useEffect, useRef, useState } from 'react';
import { LoadingButton } from '../shared/animations';
import { RefreshIcon } from '@heroicons/react/solid';

function Content() {
  const [getLoadingButton, setLoadingButton] = useState(false);
  const didInitialRefresh = useRef(false);
  const refreshButtonTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  async function refreshInventory() {
    setLoadingButton(true);
    window.electron.ipcRenderer.refreshInventory();

    // IPC command is fire-and-forget; clear local spinner shortly after dispatch.
    if (refreshButtonTimeout.current) {
      clearTimeout(refreshButtonTimeout.current);
    }
    refreshButtonTimeout.current = setTimeout(() => setLoadingButton(false), 300);
  }

  useEffect(() => {
    if (didInitialRefresh.current) {
      return;
    }

    didInitialRefresh.current = true;
    refreshInventory();
  }, []);

  useEffect(() => {
    return () => {
      if (refreshButtonTimeout.current) {
        clearTimeout(refreshButtonTimeout.current);
      }
    };
  }, []);

  return (
    <>
      {/* Page title & actions */}
      <div className="border-b border-gray-200 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:border-opacity-50">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium leading-6 text-gray-900 dark:text-dark-white  sm:truncate">
            Inventory
          </h1>
        </div>
        <div className="mt-4 flex sm:mt-0 sm:ml-4">
          <button
            type="button"
            onClick={() => refreshInventory()}
            className="focus:outline-none focus:bg-dark-level-four order-1 ml-3 inline-flex items-center px-4 py-2 hover:border hover:shadow-sm dark:hover:bg-dark-level-four text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 sm:order-0 sm:ml-0"
          >
            {getLoadingButton ? (
              <LoadingButton />
            ) : (
              <RefreshIcon
                className="h-4 w-4 text-gray-500 dark:text-dark-white"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
      {/* Pinned projects */}
      <InventoryFilters />

      {/* Projects list (only on smallest breakpoint) */}
      <div className="mt-10 sm:hidden">
        <div className="px-4 sm:px-6">
          <h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide">
            Storages
          </h2>
        </div>
      </div>

      {/* Projects table (small breakpoint and up) */}
      <div className="hidden sm:block">
        <div className="align-middle inline-block min-w-full border-b border-gray-200 dark:border-opacity-50">
          <InventoryRowsComponent />
        </div>
      </div>
    </>
  );
}

export default function inventoryContent() {
  return (
    <Routes>
      <Route path="*" element={<Content />} />
    </Routes>
  );
}
