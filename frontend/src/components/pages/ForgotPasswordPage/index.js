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
import { forgotPassword } from "api/userService";
import useLoading from "hooks/useLoading";
import useSnackbar from "hooks/useSnackbar";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import "./style.scss";

export default function ForgotPasswordPage(props) {
  const [verificationToken] = useState(props.location.state);
  const [matchingNewPassword, setMatchingNewPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showMatchingPassword, setShowMatchingPassword] = useState(false);

  const { setLoading } = useLoading();
  const { setSnackbarState, snackbarState } = useSnackbar();
  const history = useHistory();
  const { t: trans } = useTranslation();

  const handleChangeMatchingNewPassword = (event) => {
    setMatchingNewPassword(event.target.value);
  };

  const handleChangeNewPassword = (event) => {
    setNewPassword(event.target.value);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowMatchingPassword = () => {
    setShowMatchingPassword(!showMatchingPassword);
  };

  const handleForgotPassword = () => {
    setLoading(true);
    forgotPassword({
      verificationToken,
      newPassword,
      matchingNewPassword,
    })
      .then((res) => {
        if (res.status === 200) {
          setSnackbarState({
            open: true,
            content:
              trans('changePassword.changeSuccessfully'),
            type: "SUCCESS",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!props.location.state) {
      history.replace("/not-found");
    }
  }, []);

  return (
    <>
      {props.location.state && (
        <Typography component="div" className="forgot-password-container">
          <Typography className="title" align="left">
            {trans("changePassword.pleaseChangePassword")}
          </Typography>
          <Typography className="form-container">
            <Typography
              component="div"
              align="center"
              className="text-input"
            ></Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="newpassword">
                  {trans("changePassword.newPassword")}
                </InputLabel>
                <Input
                  id="newpassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={handleChangeNewPassword}
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
            </Typography>
            <Typography component="div" align="center" className="text-input">
              <FormControl sx={{ m: 1, width: "100%" }} variant="standard">
                <InputLabel htmlFor="matchingnewpassword">
                  {trans("changePassword.confirmPassword")}
                </InputLabel>
                <Input
                  id="matchingnewpassword"
                  type={showMatchingPassword ? "text" : "password"}
                  value={matchingNewPassword}
                  onChange={handleChangeMatchingNewPassword}
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
            </Typography>
          </Typography>

          <Typography component="div" align="right" className="action-btns">
            <Button
              onClick={() => history.push("/login")}
              className="cancel-btn"
            >
              {trans("changePassword.cancel")}
            </Button>
            <Button
              onClick={handleForgotPassword}
              className="forgot-password-btn"
            >
              {trans("changePassword.changePassword")}
            </Button>
          </Typography>
        </Typography>
      )}
    </>
  );
}
