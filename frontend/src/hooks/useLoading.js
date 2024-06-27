import { useContext } from "react";
import { Loading } from "App";

const useLoading = () => {
  const { setLoading, loading } = useContext(Loading);
  return { loading, setLoading };
};

export default useLoading;
