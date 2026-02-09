import { InventoryFilters } from '../../interfaces/states';

const initialState: InventoryFilters = {
  inventoryFilter: [
    {
      include: true,
      label: 'Storage moveable',
      valueToCheck: 'item_moveable',
      commandType: 'checkBooleanVariable',
    },
  ],
  storageFilter: [],
  sortValue: 'Default',
  inventoryFiltered: [],
  storageFiltered: [],
  searchInput: '',
  sortBack: false,
  categoryFilter: [],
  rarityFilter: [],
};

function normalizeState(state: InventoryFilters = initialState): InventoryFilters {
  return {
    ...initialState,
    ...state,
    inventoryFilter: Array.isArray(state?.inventoryFilter)
      ? state.inventoryFilter
      : initialState.inventoryFilter,
    storageFilter: Array.isArray(state?.storageFilter)
      ? state.storageFilter
      : initialState.storageFilter,
    inventoryFiltered: Array.isArray(state?.inventoryFiltered)
      ? state.inventoryFiltered
      : initialState.inventoryFiltered,
    storageFiltered: Array.isArray(state?.storageFiltered)
      ? state.storageFiltered
      : initialState.storageFiltered,
    categoryFilter: Array.isArray(state?.categoryFilter)
      ? state.categoryFilter
      : initialState.categoryFilter,
    rarityFilter: Array.isArray(state?.rarityFilter)
      ? state.rarityFilter
      : initialState.rarityFilter,
  };
}

const inventoryFiltersReducer = (state = initialState, action) => {
  const safeState = normalizeState(state);
  switch (action.type) {
    case 'SET_FILTERED':
      return {
        ...safeState,
        inventoryFilter: action.payload.inventoryFilter,
        sortValue: action.payload.sortValue,
        inventoryFiltered: action.payload.inventoryFiltered,
      };
    case 'SET_FILTERED_STORAGE':
      return {
        ...safeState,
        storageFiltered: action.payload.storageFiltered,
        storageFilter: action.payload.storageFilter,
      };
    case 'ALL_BUT_CLEAR':
      if (safeState.sortValue == action.payload.sortValue) {
        return {
          ...safeState,
          inventoryFilter: action.payload.inventoryFilter,
          sortValue: action.payload.sortValue,
          inventoryFiltered: action.payload.inventoryFiltered,
          sortBack: !safeState.sortBack,
        };
      } else {
        return {
          ...safeState,
          inventoryFilter: action.payload.inventoryFilter,
          sortValue: action.payload.sortValue,
          inventoryFiltered: action.payload.inventoryFiltered,
        };
      }
    case 'INVENTORY_STORAGES_CLEAR_CASKET':
      const AddToFiltered = safeState.storageFiltered.filter(
        (id) => id.storage_id != action.payload.casketID
      );

      return {
        ...safeState,
        storageFiltered: AddToFiltered
      };
    case 'INVENTORY_STORAGES_SET_SORT_STORAGES':
      return {
        ...safeState,
        storageFiltered: action.payload.storageFiltered,
      };
    case 'CLEAR_ALL':
      return {
        ...initialState,
        inventoryFilter: [],
      };
    case 'MOVE_FROM_CLEAR':
      return {
        ...safeState,
        categoryFilter: initialState.categoryFilter,
        storageFiltered: initialState.storageFiltered,
        storageFilter: initialState.storageFilter
      };

    case 'MOVE_FROM_CLEAR_ALL':
      return {
        ...safeState,
        categoryFilter: initialState.categoryFilter,
        storageFiltered: initialState.storageFiltered,
        storageFilter: initialState.storageFilter
      };
    case 'MOVE_TO_CLEAR_ALL':
      return {
        ...safeState,
        categoryFilter: initialState.categoryFilter,
        inventoryFilter: initialState.inventoryFilter
      };

    case 'INVENTORY_ADD_CATEGORY_FILTER':
      let newFilters = [...safeState.categoryFilter];
      if (newFilters.includes(action.payload)) {
        newFilters.splice(newFilters.indexOf(action.payload), 1);
      } else {
        newFilters = [...newFilters, action.payload];
      }
      return {
        ...safeState,
        categoryFilter: newFilters,
      };
    case 'INVENTORY_ADD_RARITY_FILTER':
      console.log(action.payload);
      let newRarity = [...safeState.rarityFilter];
      if (newRarity.includes(action.payload)) {
        newRarity.splice(newRarity.indexOf(action.payload), 1);
      } else {
        newRarity = [...newRarity, action.payload];
      }
      return {
        ...safeState,
        rarityFilter: newRarity,
      };
    case 'INVENTORY_FILTERS_SET_SEARCH':
      return {
        ...safeState,
        searchInput: action.payload.searchField,
      };
    case 'SET_SORT':
      if (safeState.sortValue == action.payload.sortValue) {
        return {
          ...safeState,
          sortBack: !safeState.sortBack,
        };
      } else {
        return {
          ...safeState,
          sortValue: action.payload.sortValue,
          sortBack: initialState.sortBack,
        };
      }
    case 'SIGN_OUT':
      return {
        ...initialState,
      };
    default:
      return { ...safeState };
  }
};

export default inventoryFiltersReducer;
