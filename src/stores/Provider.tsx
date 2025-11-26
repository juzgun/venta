import { rootStore } from './RootStore';
import { StoreContext } from './StoreContext';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
);
