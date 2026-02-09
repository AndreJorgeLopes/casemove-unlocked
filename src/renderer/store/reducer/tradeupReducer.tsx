import { TradeUpActions } from '../../../renderer/interfaces/states';
import { ItemRowStorage } from '../../../renderer/interfaces/items';
import { isTradeUpEligible } from '../../../renderer/functionsClasses/filters/tradeUpEligibility';

export function getEligibleTradeUpProducts(items: ItemRowStorage[]) {
  return items.filter(isTradeUpEligible);
}

const initialState: TradeUpActions = {
  tradeUpProducts: [],
  tradeUpProductsIDS: [],
  possibleOutcomes: [],
  searchInput: '',
  MinFloat: 0,
  MaxFloat: 1,
  collections: [],
  options: ['Hide equipped'],
};

function normalizeState(state: TradeUpActions = initialState): TradeUpActions {
  return {
    ...initialState,
    ...state,
    tradeUpProducts: Array.isArray(state?.tradeUpProducts)
      ? state.tradeUpProducts
      : initialState.tradeUpProducts,
    tradeUpProductsIDS: Array.isArray(state?.tradeUpProductsIDS)
      ? state.tradeUpProductsIDS
      : initialState.tradeUpProductsIDS,
    possibleOutcomes: Array.isArray(state?.possibleOutcomes)
      ? state.possibleOutcomes
      : initialState.possibleOutcomes,
    collections: Array.isArray(state?.collections)
      ? state.collections
      : initialState.collections,
    options: Array.isArray(state?.options)
      ? state.options
      : initialState.options,
  };
}

const tradeUpReducer = (state = initialState, action) => {
  const safeState = normalizeState(state);
  switch (action.type) {
    case 'TRADEUP_ADD_REMOVE':
      const toMoveAlreadyExists = safeState.tradeUpProducts.filter(
        (row) => row.item_id != action.payload.item_id,
      );
      if (toMoveAlreadyExists.length == safeState.tradeUpProducts.length) {
        toMoveAlreadyExists.push(action.payload);
      }
      const newTradeUpIDS = [] as any;
      toMoveAlreadyExists.forEach((element) => {
        newTradeUpIDS.push(element.item_id);
      });
      if (toMoveAlreadyExists.length != 10) {
        return {
          ...safeState,
          tradeUpProducts: toMoveAlreadyExists,
          tradeUpProductsIDS: newTradeUpIDS,
          possibleOutcomes: initialState.possibleOutcomes,
        };
      } else {
        return {
          ...safeState,
          tradeUpProducts: toMoveAlreadyExists,
          tradeUpProductsIDS: newTradeUpIDS,
        };
      }

    case 'TRADEUP_ADDREMOVE_COLLECTION':
      const collectionAlreadyExists = safeState.collections.filter(
        (row) => row != action.payload,
      );
      if (collectionAlreadyExists.length == safeState.collections.length) {
        collectionAlreadyExists.push(action.payload);
      }
      return {
        ...safeState,
        collections: collectionAlreadyExists,
      };

    case 'TRADEUP_ADDREMOVE_OPTION':
      const optionAlready = safeState.options.filter((row) => row != action.payload);
      if (optionAlready.length == safeState.options.length) {
        optionAlready.push(action.payload);
      }
      return {
        ...safeState,
        options: optionAlready,
      };
    case 'TRADEUP_SET_SEARCH':
      return {
        ...safeState,
        searchInput: action.payload.searchField,
      };
    case 'TRADEUP_SET_MIN':
      return {
        ...safeState,
        MinFloat: action.payload,
      };
    case 'TRADEUP_SET_MAX':
      return {
        ...safeState,
        MaxFloat: action.payload,
      };
    case 'TRADEUP_SET_POSSIBLE':
      return {
        ...safeState,
        possibleOutcomes: action.payload,
      };
    case 'TRADEUP_RESET':
      return {
        ...initialState,
        collections: safeState.collections,
      };

    case 'SIGN_OUT':
      return {
        ...initialState,
      };

    default:
      return { ...safeState };
  }
};

export default tradeUpReducer;
