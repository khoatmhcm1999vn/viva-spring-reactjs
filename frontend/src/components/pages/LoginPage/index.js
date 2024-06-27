import { useContext, useState } from "react";
import {
  Typography,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { getUserInformation, login } from "api/userService";
import "./style.scss";
import { saveJwtToken, saveRefreshToken } from "utils/cookie";
import useLoading from "hooks/useLoading";
import useSnackbar from "hooks/useSnackbar";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { parseJwt } from "utils/jwtToken";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setLoading } = useLoading();
  const { setSnackbarState, snackbarState } = useSnackbar();
  const [invalidMessage, setInvalidMessage] = useState({
    username: "",
    password: "",
  });
  let err = {
    username: "",
    password: "",
  };

  const history = useHistory();

  const { t: trans } = useTranslation();

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

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const checkTextField = () => {
    err = {
      username: username === "" ? "Username is required" : "",
      password: password === "" ? "Password is required" : "",
    };
    setInvalidMessage(err);
  };

  const canBeLogined = () => {
    let isAccepted = true;
    if (err.password !== "" || err.username !== "") {
      isAccepted = false;
    }
    return isAccepted;
  };

  const handleSubmitLogin = () => {
    checkTextField();
    if (canBeLogined()) {
      handleLogin();
    }
  };

  const handleSubmitLoginByEnter = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkTextField();
      if (canBeLogined()) {
        handleLogin();
      }
    }
  };

  const handleLogin = () => {
    setLoading(true);
    login({ username, password })
      .then((res) => {
        if (res.status === 200) {
          saveJwtToken(res.data.accessToken);
          saveRefreshToken(res.data.refreshToken);
          setSnackbarState({
            open: true,
            content: trans("signIn.loginSuccessful"),
            type: "SUCCESS",
          });
          setTimeout(() => {
            if (
              parseJwt(res.data.accessToken).roles.includes("ADMIN") ||
              parseJwt(res.data.accessToken).roles.includes("SUPER_ADMIN")
            ) {
              window.location.href = "/dashboard";
            } else {
              window.location.href = "/";
            }
          }, 1000);
        }
      })
      .catch((err) => {
        if (err.response.data === 1003 || err.response.data === 1002) {
          const condition = err.response.data;
          getUserInformation(null, username).then((res) => {
            setTimeout(() => {
              setSnackbarState({
                open: true,
                content:
                  condition === 1003
                    ? "This account is logged in on new deivce, please verify it."
                    : "This account is not active, please verify it.",
                type: "SUCCESS",
              });
              history.push("/verify", {
                email: res.data.email,
                username,
                password,
                type: condition === 1003 ? "LoginNewDevice" : "Register",
              });
            }, 1000);
          });
        }
        if (err.response.data === 1001) {
          setInvalidMessage({
            ...invalidMessage,
            username: "This account was banned.",
          });
        } else {
          setTimeout(() => {
            setSnackbarState({
              open: true,
              content: err.response.data.message,
              type: "FAIL",
            });
          }, 1000);
        }
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      });
  };

  return (
    <Typography
      component="div"
      className="login-page"
      onKeyDown={handleSubmitLoginByEnter}
    >
      <Typography component="div" className="intro-image">
        <img src={require("images/introduce3.png")} width="700" height="400" />
      </Typography>
      <Card className="login-container">
        <CardContent>
          <Typography component="div" align="center" className="logo">
            <img src={require("images/LOGO4.png")} width="200" />
          </Typography>

          <Typography className="form-container">
            <Typography align="left" className="title">
              {trans("signIn.login")}
            </Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="username">
                  {trans("signIn.userName")}
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
                  {trans("signIn.password")}
                </InputLabel>
                <Input
                  error={invalidMessage.password !== ""}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleChangePassword}
                  endAdornment={
                    <InputAdornment position="end">
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
              {invalidMessage.password !== "" && (
                <Typography className="error-textfield">
                  {invalidMessage.password}
                </Typography>
              )}
            </Typography>
            <Typography
              className="forgot-password-link"
              onClick={() =>
                history.push("/find-account", { type: "FindAccount" })
              }
            >
              {trans("signIn.forgotPassword")}
            </Typography>{" "}
          </Typography>

          <Typography component="div" align="center">
            <Button className="login-btn" onClick={handleSubmitLogin}>
              {trans("signIn.login")}
            </Button>
          </Typography>

          <Typography
            component="div"
            align="center"
            className="or"
          ></Typography>

          <Typography
            component="div"
            align="center"
            className="register-link-container"
          >
            <Typography className="dont-have-account">
              {trans("signIn.haveNoAccount")}
            </Typography>
            <Typography
              className="register-link"
              onClick={() => history.push("/register")}
            >
              {trans("signIn.register")}
            </Typography>{" "}
          </Typography>
        </CardContent>
      </Card>
    </Typography>
  );
};

export default LoginPage;
