import { useContext } from "react";
import Context from "./context";

export const useStore = () => {
  const [state, dispatch] = useContext(Context);

  return [state, dispatch];
};
