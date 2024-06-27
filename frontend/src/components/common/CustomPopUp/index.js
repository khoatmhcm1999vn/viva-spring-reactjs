import {useState, useEffect} from "react";
import Box from "@mui/material/Box";
import Popper from "@mui/material/Popper";
import Fade from "@mui/material/Fade";
import { Card, Typography, CardContent, Button } from "@mui/material";

import "./style.scss";

const CustomPopUp = (props) => {
  const { children, width, height, positionRef, hightZIndex } = props;

  const { left, bottom, top, right } = positionRef;
  const [positionState, setPositionState] = useState({
    left,
    bottom,
    top,
    right,
  });

  return (
    <>
      <Card
        className="pop-up-container"
        style={{
          "--popUpWidth": `${width || 300}px`,
          "--popUpHeight": `${height || 300}px`,
          "--positionLeft": `${positionState.left || 0}px`,
          "--positionTop": `${positionState.top + 20 || 0}px`,
          "--popUpZIndex": hightZIndex ? 1302 : 1300
        }}
      >
        <CardContent>{children}</CardContent>
      </Card>
    </>
  );
};

export default CustomPopUp;
