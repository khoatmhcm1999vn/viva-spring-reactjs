import { useContext } from "react";
import { UpdateProfile } from "App";

const useUpdateProfile = () => {
  const { setIsUpdateProfile, isUpdateProfile } = useContext(UpdateProfile);
  return { setIsUpdateProfile, isUpdateProfile };
};

export default useUpdateProfile;
