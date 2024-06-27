import { useState } from "react";
import { Button } from "@mui/material";
import ReactLoading from "react-loading";

const DynamicLoadingButton = (props) => {
  const {
    condition,
    handleTrueCond,
    handleFalseCond,
    titleTrueCond,
    titleFalseCond,
    classNameByCond,
  } = props;
  const [localLoading, setLocalLoading] = useState(false);

  const handleTrue = async () => {
    setLocalLoading(true);
    await handleTrueCond();
    setLocalLoading(false);
  };

  const handleFalse = async () => {
    setLocalLoading(true);
    await handleFalseCond();
    setLocalLoading(false);
  };

  return (
    <Button
      className={`${classNameByCond}`}
      onClick={condition ? handleTrue : handleFalse}
    >
      {localLoading ? (
        <ReactLoading type="spokes" color="#00000" height={18} width={18} />
      ) : condition ? (
        titleTrueCond
      ) : (
        titleFalseCond
      )}
    </Button>
  );
};

export default DynamicLoadingButton;
