import React from "react";
import Updates from "../Updates";
import "./style.scss";

const RightSide = ({ userAccountMostFollowerData }) => {
  return (
    <div className="RightSide">
      <div>
        <h4>Top Accounts Most Follower</h4>
        <Updates userAccountMostFollowerData={userAccountMostFollowerData} />
      </div>
    </div>
  );
};

export default RightSide;
