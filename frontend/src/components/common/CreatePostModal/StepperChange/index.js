import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { LinearProgress, StepConnector } from "@mui/material";
import "./style.scss";

let apprearedConnector = 0;
const StepperChange = (props) => {
  const { steps, activeStep } = props;
  React.useEffect(() => {
    apprearedConnector = 0;
  }, []);
  return (
    <Box sx={{ width: "100%" }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        connector={<Connector isStart={activeStep} />}
      >
        {steps.map((label, index) => {
          return (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

const Connector = (props) => {
  const [progress, setProgress] = React.useState(0);
  const [number, setNumber] = React.useState(0);
  const { isStart } = props;

  React.useEffect(() => {
    apprearedConnector += 1;
    setNumber(apprearedConnector);
  }, []);
  React.useEffect(() => {
    if (progress < 100 && isStart >= number) {
      const timer = setInterval(() => {
        setProgress(100);
      }, 50);
      return () => {
        clearInterval(timer);
      };
    }
    if ((progress === 100) & (isStart < number)) {
      const timer = setInterval(() => {
        setProgress(0);
      }, 50);
      return () => {
        clearInterval(timer);
      };
    }
  }, [number, isStart]);

  return (
    <LinearProgress
      className="connector"
      variant="determinate"
      value={progress}
    />
  );
};

export default StepperChange;
