import { createContext, useContext } from 'react';
import { RootStore, rootStore } from './RootStore';

export const StoreContext = createContext<RootStore>(rootStore);

export const useStores = () => useContext(StoreContext);
