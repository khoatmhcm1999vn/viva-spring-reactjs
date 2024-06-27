import * as React from "react";
import { CircularProgress, Typography } from "@mui/material";
import ReactLoading from "react-loading";
import "./style.scss";

export const InitLoading = () => {
  return (
    <Typography className="init-loading-container" component="div">
      <Typography className="progress" component="div">
        <Typography className="logo" component="div">
          <img
            src={require("images/LOGO_Frag01.png")}
            width="250"
            className="frag01"
            alt=""
          />
          <img
            src={require("images/LOGO_Frag02.png")}
            width="50"
            height="50"
            className="frag02"
            alt=""
          />
          <Typography className="shadow"></Typography>
        </Typography>
      </Typography>
    </Typography>
  );
};

export const ProgressLoading = () => {
  return (
    <Typography component="div" className="loading-container">
      {" "}
      <ReactLoading
        className="spinner-icon"
        type="spokes"
        color="#FFFFFF"
        height={100}
        width={36}
      />
    </Typography>
  );
};
