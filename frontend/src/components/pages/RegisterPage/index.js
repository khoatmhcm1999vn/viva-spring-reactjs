import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  Typography,
} from "@mui/material";
import { register } from "api/userService";
import useLoading from "hooks/useLoading";
import useSnackbar from "hooks/useSnackbar";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  checkAllCondition,
  getStrongScore,
  handleCheckValidEmail,
} from "utils/checkValidInput";
import ValidConditionTextField from "components/common/ValidConditionTextField";
import "./style.scss";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [matchingPassword, setMatchingPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMatchingPassword, setShowMatchingPassword] = useState(false);
  const [openCondition, setOpenCondition] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState({
    email: "",
    fullName: "",
    username: "",
    password: "",
    matchingPassword: "",
  });
  let err = {
    email: "",
    fullName: "",
    username: "",
    password: "",
    matchingPassword: "",
  };

  const { setLoading } = useLoading();
  const { setSnackbarState, snackbarState } = useSnackbar();
  const history = useHistory();
  const { t: trans } = useTranslation();

  const handleChangeEmail = (event) => {
    err = {
      ...invalidMessage,
      email: "",
    };
    setInvalidMessage(err);
    setEmail(event.target.value);
  };

  const handleChangeFullName = (event) => {
    err = {
      ...invalidMessage,
      fullName: "",
    };
    setInvalidMessage(err);
    setFullName(event.target.value);
  };

  const handleChangeUsername = (event) => {
    err = {
      ...invalidMessage,
      username: "",
    };
    setInvalidMessage(err);
    setUsername(event.target.value);
  };

  const handleChangePassword = (event) => {
    err = {
      ...invalidMessage,
      password: "",
    };
    setInvalidMessage(err);
    setPassword(event.target.value);
  };

  const handleChangeMatchingPassword = (event) => {
    err = {
      ...invalidMessage,
      matchingPassword: "",
    };
    setInvalidMessage(err);
    setMatchingPassword(event.target.value);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowMatchingPassword = () => {
    setShowMatchingPassword(!showMatchingPassword);
  };

  const checkTextField = () => {
    err = {
      email: email === "" ? "Email is required" : "",
      fullName: fullName === "" ? "Full name is required" : "",
      matchingPassword:
        matchingPassword === "" ? "Confirm password is required" : "",
      username: username === "" ? "Username is required" : "",
      password: password === "" ? "Password is required" : "",
    };
    setInvalidMessage(err);
  };

  const checkConfirmPassword = () => {
    if (matchingPassword !== "" && password !== "") {
      if (matchingPassword !== password) {
        err = {
          ...err,
          matchingPassword: "Confirm password is different from password.",
        };
        setInvalidMessage(err);
      } else {
        err = {
          ...err,
          matchingPassword: "",
        };
        setInvalidMessage(err);
        handleCheckStrongPassword();
      }
    }
  };

  const handleSubmitResgister = () => {
    checkTextField();
    checkEmail();
    checkConfirmPassword();
    if (canBeRegistered()) {
      handleRegister();
    }
  };

  const canBeRegistered = () => {
    let isAccepted = true;
    Object.values(err).map((value) => {
      if (value !== "") {
        isAccepted = false;
      }
    });
    return isAccepted;
  };

  const handleCheckStrongPassword = () => {
    if (!checkAllCondition(password)) {
      err = {
        ...err,
        password: "Password must be strong.",
      };
      setInvalidMessage(err);
    }
  };

  const checkEmail = () => {
    if (!handleCheckValidEmail(email) && email !== "") {
      err = {
        ...err,
        email: "Email is unavailable.",
      };
      setInvalidMessage(err);
    }
  };

  const handleToggleCondtion = (field) => {
    if (field === "password") {
      setOpenCondition(!openCondition);
    }
  };

  const handleRegister = () => {
    setLoading(true);
    register({ username, fullName, email, password, matchingPassword })
      .then((res) => {
        if (res.status === 200) {
          setTimeout(() => {
            setSnackbarState({
              open: true,
              content: "Please verify code to use this web",
              type: "SUCCESS",
            });
            history.push("/verify", { email, type: "Register" });
          }, 1000);
        }
      })
      .catch((err) => {
        const errMessage = err.response.data.message.split(', ');
        setTimeout(() => {
          setSnackbarState({
            open: true,
            content: `${errMessage.reduce((prev, next) => {
              if(prev) return prev.split(":")[1] + "\n" + next.split(":")[1]
            })}`,
            type: "FAIL",
          })
        }, 1000);
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      });
  };

  return (
    <Typography component="div" className="register-page">
      <Typography component="div" className="intro-image">
        <img src={require("images/introduce3.png")} width="700" height="400" />
      </Typography>
      <Card className="register-container">
        <CardContent>
          <Typography component="div" align="center" className="logo">
            <img src={require("images/LOGO4.png")} width="200" />
          </Typography>

          <Typography className="form-container">
            <Typography align="left" className="title">
              {trans("register.register")}
            </Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="email">Email</InputLabel>
                <Input
                  error={invalidMessage.email !== ""}
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleChangeEmail}
                />
              </FormControl>{" "}
              {invalidMessage.email !== "" && (
                <Typography className="error-textfield">
                  {invalidMessage.email}
                </Typography>
              )}
            </Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="fullname">
                  {trans("register.fullName")}
                </InputLabel>
                <Input
                  error={invalidMessage.fullName !== ""}
                  id="fullname"
                  type="text"
                  value={fullName}
                  onChange={handleChangeFullName}
                />
              </FormControl>{" "}
              {invalidMessage.fullName !== "" && (
                <Typography className="error-textfield">
                  {invalidMessage.fullName}
                </Typography>
              )}
            </Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="username">
                  {trans("register.username")}
                </InputLabel>
                <Input
                  error={invalidMessage.username !== ""}
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleChangeUsername}
                />
              </FormControl>{" "}
              {invalidMessage.username !== "" && (
                <Typography className="error-textfield">
                  {invalidMessage.username}
                </Typography>
              )}
            </Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="password">
                  {trans("register.password")}
                </InputLabel>
                <Input
                  error={invalidMessage.password !== ""}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleChangePassword}
                  onFocus={() => handleToggleCondtion("password")}
                  onBlur={() => handleToggleCondtion("password")}
                  endAdornment={
                    <InputAdornment position="end">
                      {password !== "" && (
                        <Typography className="password-score">
                          {getStrongScore(password)}
                        </Typography>
                      )}
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              {openCondition && (
                <ValidConditionTextField textInput={password} />
              )}
              {invalidMessage.password !== "" && (
                <Typography className="error-textfield">
                  {invalidMessage.password}
                </Typography>
              )}
            </Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="matchingpassword">
                  {trans("register.confirmPassword")}
                </InputLabel>
                <Input
                  error={invalidMessage.matchingPassword !== ""}
                  id="matchingpassword"
                  type={showMatchingPassword ? "text" : "password"}
                  value={matchingPassword}
                  onChange={handleChangeMatchingPassword}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowMatchingPassword}
                      >
                        {showMatchingPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              {invalidMessage.matchingPassword !== "" && (
                <Typography className="error-textfield">
                  {invalidMessage.matchingPassword}
                </Typography>
              )}
            </Typography>
          </Typography>

          <Typography component="div" align="center">
            <Button className="register-btn" onClick={handleSubmitResgister}>
              {trans("register.register")}
            </Button>
          </Typography>
        </CardContent>
      </Card>
    </Typography>
  );
};

export default RegisterPage;
