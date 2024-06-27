import { useReducer } from "react";
import Context from "./context";
import socketReducer, { initialState } from "./reducer";

const SocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);

  return (
    <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>
  );
};

export default SocketProvider;
