import { createContext, useContext } from "react";
import type { Branch } from "./billing";

export interface BranchCtx {
  isAdmin: boolean;
  branch: Branch | null;
  branches: Branch[];
  setBranchId: (id: string) => void;
}

export const BranchContext = createContext<BranchCtx>({
  isAdmin: false,
  branch: null,
  branches: [],
  setBranchId: () => {},
});

export const useBranch = () => useContext(BranchContext);
