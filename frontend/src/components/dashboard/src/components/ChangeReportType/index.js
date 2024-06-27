import { Icon } from "@iconify/react";
import { Button, Typography } from "@mui/material";
import classNames from "classnames";
import "./style.scss";

const ChangeReportType = ({ handleChangeReportType, reportType }) => {
  const getStyle = (type) => {
    if (reportType === type) {
      return "active";
    }
  };
  return (
    <Typography component="div" className="change-reports-type">
      <Button
        component="div"
        className={`request-type ${getStyle("request")}`}
        onClick={() => handleChangeReportType("request")}
      >
        {" "}
        <Icon icon="carbon:report" className="icon" />
        Request
      </Button>
      <Button
        component="div"
        className={`done-type ${getStyle("done")}`}
        onClick={() => handleChangeReportType("done")}
      >
        <Icon icon="material-symbols:done" className="icon" />
        Done
      </Button>
    </Typography>
  );
};

export default ChangeReportType;
