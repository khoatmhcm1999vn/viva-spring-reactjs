import { useContext } from "react";
import { Snackbar } from "App";

const useSnackbar = () => {
  const { setSnackbarState, snackbarState } = useContext(Snackbar);
  return { setSnackbarState, snackbarState };
};

export default useSnackbar;
