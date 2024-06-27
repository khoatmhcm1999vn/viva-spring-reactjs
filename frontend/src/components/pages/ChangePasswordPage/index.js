import {
  InputBase,
  Typography,
  FormControl,
  InputLabel,
  Input,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Popover,
  InputAdornment,
  FilledInput,
  OutlinedInput,
} from "@mui/material";
import { changePasswordFields, editProfileTextFields } from "constant/data";
import { useState, useEffect } from "react";
import { getCurrentUser } from "utils/jwtToken";
import { changePassword } from "api/userService";
import "./style.scss";
import ValidConditionTextField from "components/common/ValidConditionTextField";
import { checkAllCondition, getStrongScore } from "utils/checkValidInput";
import { AccountCircle } from "@mui/icons-material";
import useSnackbar from "hooks/useSnackbar";
import ReactLoading from "react-loading";

const ChangePasswordPage = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [inputData, setInputData] = useState({
    confirmNewPassword: "",
    newPassword: "",
    oldPassword: "",
  });
  let err = {
    confirmNewPassword: "",
    newPassword: "",
    oldPassword: "",
  };
  const [invalidMessage, setInvalidMessage] = useState({
    confirmNewPassword: "",
    newPassword: "",
    oldPassword: "",
  });
  const [openCondition, setOpenCondition] = useState(false);
  const { setSnackbarState } = useSnackbar();
  const [isLoading, setLoading] = useState(false);

  const resetInvalidMessage = (field) => {
    err = {
      ...invalidMessage,
      [field]: "",
    };
    setInvalidMessage(err);
  };

  const handleChangeTextField = (field, textInput) => {
    setInputData({ ...inputData, [field]: textInput.target.value });
    if (invalidMessage[field] !== "") {
      resetInvalidMessage(field);
    }
  };

  const checkTextField = () => {
    let invaliObject = { ...err };
    Object.keys(inputData).map((key, value) => {
      if (inputData[key] === "") {
        const displayName = changePasswordFields.filter(
          (item) => item.field === key
        )[0].title;
        invaliObject = {
          ...invaliObject,
          [key]: `${displayName} is required`,
        };
      }
    });
    err = {...invaliObject};
    setInvalidMessage(invaliObject);
  };

  const checkConfirmPassword = () => {
    const { confirmNewPassword, newPassword } = inputData;
    if (confirmNewPassword !== "" && newPassword !== "") {
      if (confirmNewPassword !== newPassword) {
        err = {
          ...err,
          confirmNewPassword: "Confirm password is different from password.",
        };
        setInvalidMessage(err);
      } else {
        err = {
          ...err,
          confirmNewPassword: "",
        };
        setInvalidMessage(err);
        handleCheckStrongPassword();
      }
    }
  };

  const checkNewPassword = () => {
    const { oldPassword, newPassword } = inputData;
    if (oldPassword !== "" && newPassword !== "") {
      if (oldPassword === newPassword) {
        err = {
          ...err,
          newPassword: "New password must be different from old password.",
        };
        setInvalidMessage(err);
      } else {
        err = {
          ...err,
          newPassword: "",
        };
        setInvalidMessage(err);
      }
    }
  };

  const handleCheckStrongPassword = () => {
    if (!checkAllCondition(inputData.newPassword)) {
      err = {
        ...err,
        newPassword: "Password must be strong.",
      };
      setInvalidMessage(err);
    }
  };

  const handleCheck = () => {
    checkTextField();
    checkNewPassword();
    checkConfirmPassword();
    if (canBeChangePassword()) {
      handleChangePassword();
    }
  };

  const canBeChangePassword = () => {
    let isAccepted = true;
    Object.values(err).map((value) => {
      if (value !== "") {
        isAccepted = false;
      }
    });
    return isAccepted;
  };

  const handleChangePassword = () => {
    setLoading(true);
    changePassword(inputData)
      .then((res) => {
        if (res.status === 200) {
          setTimeout(() => {
            setSnackbarState({
              open: true,
              content: "Change password successfully",
              type: "SUCCESS",
            });
            setInputData({
              confirmNewPassword: "",
              newPassword: "",
              oldPassword: "",
            });
          }, 1000);
        }
      })
      .catch((err) => {
        setTimeout(() => {
          setSnackbarState({
            open: true,
            content: err.response.data.message,
            type: "FAIL",
          });
        }, 1000);
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      });
  };

  const handleToggleCondtion = (field) => {
    if (field === "newPassword") {
      setOpenCondition(!openCondition);
    }
  };

  return (
    <Typography
      component="div"
      align="center"
      className="change-password-container"
    >
      <Typography component="div" align="center" className="user-mini-info">
        <Typography className="avatar">
          {" "}
          <img src={currentUser.avatar} />
        </Typography>
        <Typography className="right-action">
          <Typography className="username">{currentUser.username}</Typography>
        </Typography>
      </Typography>

      {changePasswordFields.map((item, index) => {
        return (
          <Typography component="div" className="field-container">
            <Typography className="field-title">{item.title}</Typography>

            <Typography component="div" className="field-content">
              {item.type === "textField" ? (
                <>
                  <Typography id={item.field} className="field-item">
                    <OutlinedInput
                      error={invalidMessage[item.field] !== ""}
                      id={item.field}
                      type={"password"}
                      className="field-input-text"
                      value={inputData[item.field]}
                      onChange={(e) => handleChangeTextField(item.field, e)}
                      onFocus={() => handleToggleCondtion(item.field)}
                      onBlur={() => handleToggleCondtion(item.field)}
                      endAdornment={
                        <InputAdornment position="start">
                          {item.field === "newPassword" &&
                            inputData[item.field] !== "" && (
                              <Typography className="password-score">
                                {getStrongScore(inputData[item.field])}
                              </Typography>
                            )}
                        </InputAdornment>
                      }
                    />
                    {openCondition && item.field === "newPassword" && (
                      <ValidConditionTextField
                        textInput={inputData[item.field]}
                      />
                    )}
                  </Typography>
                  {invalidMessage[item.field] !== "" && (
                    <Typography className="error-textfield">
                      {invalidMessage[item.field]}
                    </Typography>
                  )}
                </>
              ) : (
                <FormControlLabel
                  control={<Checkbox className="field-input-checkbox" />}
                  label={item.checkBoxText}
                />
              )}
            </Typography>
          </Typography>
        );
      })}
      <Button className="submit-btn" onClick={handleCheck}>
        {isLoading ? (
          <ReactLoading
            className="loading-icon"
            type="spokes"
            color="#00000"
            height={16}
            width={16}
          />
        ) : (
          "Change password"
        )}
      </Button>
      <Typography className="forgot-password-link">Forgot password</Typography>
    </Typography>
  );
};

export default ChangePasswordPage;
