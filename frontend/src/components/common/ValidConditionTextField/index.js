import { Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import classNames from "classnames";
import "./style.scss";
import {
  handleCheckNumberOfCharacters,
  handleCheckAtleastOneNormal,
  handleCheckAtleastOneCapital,
  handleCheckAtleastNumber,
  hanldeCheckAtleastSymbol,
} from "utils/checkValidInput";

const ValidConditionTextField = ({ textInput }) => {
  return (
    <Typography component="div" className="valid-condition">
      <ConditionText
        text="6 or more characters"
        condition={handleCheckNumberOfCharacters(textInput)}
      />
      <ConditionText
        text="At least one normal letter"
        condition={handleCheckAtleastOneNormal(textInput)}
      />
      <ConditionText
        text="At least one capitial letter"
        condition={handleCheckAtleastOneCapital(textInput)}
      />
      <ConditionText
        text="At least one number"
        condition={handleCheckAtleastNumber(textInput)}
      />
      <ConditionText
        text="At least one symbol"
        condition={hanldeCheckAtleastSymbol(textInput)}
      />
    </Typography>
  );
};

const ConditionText = ({ condition, text }) => {
  const conditionStyle = classNames("condition-text", {
    right: condition,
    wrong: !condition,
  });
  return (
    <div className={conditionStyle}>
      <div className="icon">
        {condition ? (
          <CheckIcon />
        ) : (
          <FiberManualRecordIcon style={{ fontSize: "6px" }} />
        )}{" "}
      </div>
      <p>{text}</p>
    </div>
  );
};

export default ValidConditionTextField;
