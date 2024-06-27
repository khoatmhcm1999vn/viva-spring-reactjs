import { Typography } from "@mui/material";
import "./style.scss"

const NotFoundPage = () => {
  return (
    <Typography component="div" className="not-found-container" align="center">
      <Typography className="error-number" align="center">
        <img src={require('images/page-not-found.png')} alt=""/>
      </Typography>
      <Typography className="error-content" align="center">
        Page Not Found
      </Typography>
    </Typography>
  );
};

export default NotFoundPage;
