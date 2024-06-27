import {
  Button,
  FormControl,
  Input,
  InputLabel,
  Typography,
  Box,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { resendToken, getUserInformation } from "api/userService";
import useLoading from "hooks/useLoading";
import useSnackbar from "hooks/useSnackbar";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import "./style.scss";
import { useTranslation } from "react-i18next";
import { handleCheckValidEmail } from "utils/checkValidInput";
import _ from "lodash";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default function FindAccountPage(props) {
  const [email, setEmail] = useState("");

  const { setLoading } = useLoading();
  const { setSnackbarState, snackbarState } = useSnackbar();

  const [foundProfile, setFoundProfile] = useState({});

  const history = useHistory();
  const { t: trans } = useTranslation();

  const [stepValue, setStepValue] = useState(0);
  const [optionValue, setOptionValue] = useState("option-01");
  const [invalidMessage, setInvalidMessage] = useState({
    email: "",
  });
  let err = {
    email: "",
  };

  const checkTextField = () => {
    err = {
      email: email === "" ? "Email is required" : "",
    };
    setInvalidMessage(err);
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

  const canBeFindAnAccount = () => {
    let isAccepted = true;
    Object.values(err).map((value) => {
      if (value !== "") {
        isAccepted = false;
      }
    });
    return isAccepted;
  };

  const handleSubmitResetPassword = () => {
    setLoading(true);
    resendToken(email)
      .then((res) => {
        if (res.status === 200) {
          setSnackbarState({
            open: true,
            content: trans("findAccount.pleaseEnterCode"),
            type: "SUCCESS",
          });
          setTimeout(() => {
            history.push("/verify", {
              emailForgot: email,
              type: "ForgotPassword",
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
        }, 1000)
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1000)
      });
  };

  const handleSubmitStepOne = () => {
    checkTextField();
    checkEmail();
    if(canBeFindAnAccount()) {
      handleSubmitResetPassword();
    }
  };

  const handleGetProfile = () => {
    setLoading(true);
    getUserInformation(email, null)
      .then((res) => {
        if (res.status === 200) {
          setFoundProfile(res.data);
          handleNextStep();
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleNextStep = () => {
    setStepValue(stepValue + 1);
  };
  const handlePrevStep = () => {
    setEmail("");
    setStepValue(stepValue - 1);
  };

  const handleOptionChange = (event) => {
    setOptionValue(event.target.value);
  };

  const StepOne = () => {
    return (
      <Typography
        component="div"
        align="center"
        className="find-account-container"
      >
        <Typography className="title" align="left">
          {trans("findAccount.title")}
        </Typography>
        <Typography className="label" align="left">
          {trans("findAccount.pleaseEnterLabel")}
        </Typography>
        <FormControl sx={{ m: 1, width: "100%" }} className="email-input">
          <InputLabel htmlFor="email">Email</InputLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              err = {
                ...invalidMessage,
                email: "",
              };
              setInvalidMessage(err);
              setEmail(e.target.value);
            }}
          />
        </FormControl>{" "}
        {invalidMessage.email !== "" && (
          <Typography className="error-textfield">
            {invalidMessage.email}
          </Typography>
        )}
        <Typography component="div" align="center" className="action-btns">
          <Button className="cancel-btn" onClick={() => history.goBack()}>
            {trans("findAccount.cancel")}
          </Button>
          <Button className="search-btn" onClick={handleSubmitStepOne}>
            {trans("findAccount.search")}
          </Button>
        </Typography>
      </Typography>
    );
  };

  const StepTwo = () => {
    return (
      <Typography
        component="div"
        align="center"
        className="reset-password-container"
      >
        <Typography className="title" align="left">
          {trans("resetPassword.title")}
        </Typography>
        <Typography className="label" align="left">
          {trans("resetPassword.recievedCodeLabel")}
        </Typography>
        <Typography className="option-container" align="left">
          <FormControl align="left" className="option">
            <RadioGroup
              aria-labelledby="demo-controlled-radio-buttons-group"
              name="controlled-radio-buttons-group"
              value={optionValue}
              onChange={handleOptionChange}
            >
              <FormControlLabel
                value="option-01"
                control={<Radio />}
                label={
                  <>
                    <div className="option-primary-label">
                      {trans("resetPassword.optionViaEmail")}
                    </div>
                    <div className="option-foreign-label">{email}</div>
                  </>
                }
              />
              {/* <FormControlLabel value="option-02" control={<Radio />} label="Male" /> */}
            </RadioGroup>
          </FormControl>
          <Typography component="div" className="user-info-container">
            <Typography className="user-avatar">
              <img src={foundProfile.avatar} />
            </Typography>
            <Typography className="user-fullname">
              {foundProfile.fullName}
            </Typography>
          </Typography>
        </Typography>
        <Typography component="div" align="center" className="action-btns">
          <Button className="cancel-btn" onClick={handlePrevStep}>
            {trans("resetPassword.notYou")}
          </Button>
          <Button className="search-btn" onClick={handleSubmitResetPassword}>
            {trans("resetPassword.continue")}
          </Button>
        </Typography>
      </Typography>
    );
  };

  useEffect(() => {
    if (!props.location.state) {
      history.replace("/not-found");
    }
  }, []);
  return (
    <>
      {props.location.state?.type && (
        <Box sx={{ width: "100%" }}>
          <TabPanel value={stepValue} index={0}>
            {StepOne()}
          </TabPanel>
          <TabPanel value={stepValue} index={1}>
            {StepTwo()}
          </TabPanel>
        </Box>
      )}
    </>
  );
}
