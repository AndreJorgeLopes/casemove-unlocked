import { CollectionIcon } from "@heroicons/react/solid";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReducerManager } from "../../../renderer/functionsClasses/reducerManager";
import { getAllStorages } from "../../../renderer/functionsClasses/storageUnits/storageUnitsFunctions";
import { LoadingButton } from "./shared/animations";
import { classNames } from "./shared/filters/inventoryFunctions";

export function LoadButton() {
    const ReducerClass = new ReducerManager(useSelector);
    const currentState = ReducerClass.getStorage('moveFromReducer');
    const dispatch = useDispatch();
    // Get all storage unit data
    async function getAllStor() {
        setLoadingButton(true)
        getAllStorages(dispatch,
            ReducerClass.getStorage('settingsReducer'),
            ReducerClass.getStorage('pricingReducer'),
            ReducerClass.getStorage('moveFromReducer'),
            ReducerClass.getStorage('inventoryReducer'),
            ReducerClass.getStorage('inventoryFiltersReducer')
        ).then(() => {
            setLoadingButton(false)
        })
    }

    const [getLoadingButton, setLoadingButton] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => getAllStor()}
                className={classNames(currentState.activeStorages.length == 0 || getLoadingButton ? 'bg-green-700' : 'bg-dark-level-three', "inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-dark-white hover:bg-dark-level-four")}
            >
                {' '}

                {getLoadingButton ? (
                    <LoadingButton
                        className="shrink-0 mr-1.5 h-5 w-5 text-dark-white"
                        aria-hidden="true"
                    />
                ) : (
                    <CollectionIcon
                        className="shrink-0 mr-1.5 h-5 w-5 text-dark-white"
                        aria-hidden="true"
                    />
                )}
                {currentState.activeStorages.length != 0 ? currentState.activeStorages.length + " Storage units loaded" : "Load storage units"}
            </button>
        </>
    );
}
