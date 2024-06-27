import classNames from "classnames";
import React from "react";
import "./style.scss";

const ThreeDotsAnimation = ({ animation = true }) => {
  const animationClassName = classNames({
    "bouncing-loader": animation === true,
    "fixed-loader": animation === false,
  });
  return (
    <div className={animationClassName}>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default ThreeDotsAnimation;
