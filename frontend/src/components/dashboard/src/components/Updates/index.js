import React from "react";
import "./style.scss";

const Updates = ({ userAccountMostFollowerData }) => {
  return (
    <div className="Updates">
      {userAccountMostFollowerData.map((update) => {
        return (
          <div className="update">
            <img src={update.url || require('images/no-avatar.png')} alt="profile" />
            <div className="noti">
              <div style={{ marginBottom: "0.5rem" }}>
                <span> {update.userName}</span>
              </div>
              <span>Total: {update.accountQuantity} followers</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Updates;
