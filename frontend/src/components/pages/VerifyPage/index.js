import {
  resendToken,
  verifyChangePassword,
  activeNewAccount,
  login,
} from "api/userService";
import useLoading from "hooks/useLoading";
import useSnackbar from "hooks/useSnackbar";
import React, { useState, useEffect, useRef } from "react";
import { saveJwtToken, saveRefreshToken } from "utils/cookie";
import { useHistory } from "react-router-dom";
import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import "./style.scss";
import { parseJwt } from "utils/jwtToken";

export default function VerifyPage(props) {
  const [code, setCode] = useState([]);
  const codeRef = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const { setLoading } = useLoading();
  const { setSnackbarState, snackbarState } = useSnackbar();
  const history = useHistory();
  const { t: trans } = useTranslation();

  const [isButtonDisabled, setButtonDisabled] = useState(false);

  var token = "";

  const handleConfirmRegister = () => {
    token = code.reduce((prev, curr) => {
      return prev + curr;
    });

    setLoading(true);
    activeNewAccount(token)
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
            window.location.href = "/";
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

  const handleResendToken = () => {
    setButtonDisabled(true);

    const email = props.location.state.emailForgot;

    setLoading(true);
    resendToken(email)
      .then((res) => {
        if (res.status === 200) {
          setSnackbarState({
            open: true,
            content: trans("findAccount.pleaseEnterCode"),
            type: "SUCCESS",
          });
          setTimeout(() => setButtonDisabled(false), 5000);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleConfirmForgotPassword = () => {
    token = code.reduce((prev, curr) => {
      return prev + curr;
    });

    setLoading(true);
    verifyChangePassword(token)
      .then((res) => {
        if (res.status === 200) {
          setTimeout(() => {
            history.push("/forgot-password", token);
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

  const handleConfirmLoginNewDevice = () => {
    token = code.reduce((prev, curr) => {
      return prev + curr;
    });

    setLoading(true);
    verifyChangePassword(token)
      .then((res) => {
        if (res.status === 200) {
          if (props.location.state.type === "LoginNewDevice") {
            setTimeout(() => {
              const { username, password } = props.location.state;
              handleLogin(username, password);
            }, 1000);
          }
          if (props.location.state.type === "ForgotPassword") {
            setTimeout(() => {
              setSnackbarState({
                open: true,
                content: "Verify successfully",
                type: "SUCCESS",
              });
              history.push("/forgot-password", token);
            }, 1000);
          }
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleLogin = (username, password) => {
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
        throw err;
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      });
  };

  const handleSubmit = () => {
    if (props.location.state.type === "ForgotPassword") {
      handleConfirmForgotPassword();
    }
    if (props.location.state.type === "Register") {
      handleConfirmRegister();
    }
    if (props.location.state.type === "LoginNewDevice") {
      handleConfirmLoginNewDevice();
    }
  };

  useEffect(() => {
    if (code) {
      const currIndex = code.length - 1;
      if (
        currIndex >= 0 &&
        currIndex < codeRef.length - 1 &&
        code[currIndex].length === 1
      ) {
        codeRef[currIndex + 1].focus();
      }
    }
  }, [code]);

  useEffect(() => {
    if (!props.location.state?.type) {
      history.replace("/not-found");
    } else {
      codeRef[0].focus();
    }
  }, []);

  const setNewCode = (index, value) => {
    const currentCode = [...code];
    currentCode[index] = value;
    setCode([...currentCode]);
  };
  return (
    <>
      {props.location.state?.type && (
        <Typography component="div" align="center" className="verify-container">
          <Typography className="title" align="left">
            {trans("verify.title")}
          </Typography>
          <Typography className="label" align="left">
            {trans("verify.checkCodeLabel")}
          </Typography>
          <Typography
            component="div"
            align="center"
            className="verify-number-group"
          >
            {codeRef.map((item, index) => {
              return (
                <input
                  type="text"
                  className="form-control"
                  value={code[index]}
                  onChange={(e) => setNewCode(index, e.target.value)}
                  maxLength="1"
                  ref={(input) => {
                    codeRef[index] = input;
                  }}
                />
              );
            })}
          </Typography>
          <Typography component="div" className="action-btns">
            <Button
              className="resend-btn"
              disabled={isButtonDisabled}
              onClick={handleResendToken}
            >
              {trans("verify.resendCode")}
            </Button>
            <Typography>
              <Button onClick={() => history.goBack()} className="cancel-btn">
                {trans("verify.cancel")}
              </Button>
              <Button onClick={handleSubmit} className="submit-btn">
                {trans("verify.submit")}
              </Button>
            </Typography>
          </Typography>
        </Typography>
      )}
    </>
  );
}
