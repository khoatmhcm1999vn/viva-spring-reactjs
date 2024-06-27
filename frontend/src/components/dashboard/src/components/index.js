import React, { useContext, useEffect, useState } from "react";
import "./style.scss";
import Logo from "../imgs/logo.png";
import { UilSignOutAlt } from "@iconscout/react-unicons";
import { SidebarData } from "../data/Data";
import { UilBars } from "@iconscout/react-unicons";
import { motion } from "framer-motion";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import MainDash from "./OverallDashboard";
import { getCurrentUser } from "utils/jwtToken";
import { AuthUser } from "App";
import { getLatLng, getLocationInformation } from "api/googleMapService";
import { useHistory } from "react-router-dom";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import {
  removeJwtToken,
  removeLocalStorageField,
  removeRefreshToken,
} from "utils/cookie";

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

const Sidebar = ({ setSelected, selected }) => {
  const [expanded, setExpaned] = useState(true);

  const [value, setValue] = useState(0);
  const [adminInfo, setAdminInfo] = useState(getCurrentUser());

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const history = useHistory();

  const Auth = useContext(AuthUser);

  const sidebarVariants = {
    true: {
      left: "0",
    },
    false: {
      left: "-60%",
    },
  };

  return (
    <div className="sidebar-container">
      <div
        className="bars"
        style={expanded ? { left: "60%" } : { left: "5%" }}
        onClick={() => setExpaned(!expanded)}
      >
        <UilBars />
      </div>
      <Typography
        className="app-logo"
        align="center"
        onClick={() => history.push("/dashboard")}
      >
        VivaCon
      </Typography>
      <Typography component="div" className="admin-info">
        <Typography component="div" className="admin-info-line1">
          <img src={adminInfo.avatar} width="50px" height="50px" />
          <Typography component="div" className="admin-name">
            <p className="username">{adminInfo.username}</p>
            <p className="fullname">{adminInfo.fullName}</p>
          </Typography>
          <Typography
            component="div"
            className="admin-logout"
            onClick={() => {
              removeJwtToken();
              removeRefreshToken();
              removeLocalStorageField("suggested_users");
              removeLocalStorageField("recent_search");
              window.location.href = "/login";
            }}
          >
            <LogoutOutlinedIcon />
          </Typography>
        </Typography>
        <Typography component="div" className="admin-info-line2">
          <Typography className="admin-role">
            Role: {adminInfo.roles}
          </Typography>
        </Typography>
      </Typography>
      <motion.div
        className="sidebar"
        variants={sidebarVariants}
        animate={window.innerWidth <= 768 ? `${expanded}` : ""}
      >
        <div className="menu">
          <Box sx={{ width: "100%" }}>
            <Box>
              {SidebarData.map((item, index) => {
                return (
                  <>
                    {item.isSuperAdmin === false ? (
                      <div
                        className={
                          selected === index ? "menuItem active" : "menuItem"
                        }
                        key={index}
                        onClick={() => setSelected(index)}
                      >
                        <item.icon />
                        <span>{item.heading}</span>
                      </div>
                    ) : (
                      Auth.auth.isSuperAdmin && (
                        <div
                          className={
                            selected === index ? "menuItem active" : "menuItem"
                          }
                          key={index}
                          onClick={() => setSelected(index)}
                        >
                          <item.icon />
                          <span>{item.heading}</span>
                        </div>
                      )
                    )}
                  </>
                );
              })}
            </Box>
            {/* <TabPanel value={selected} index={0}>
              <MainDash />
            </TabPanel>
            <TabPanel value={selected} index={1}>
              Item Two
            </TabPanel>
            <TabPanel value={selected} index={2}>
              Item Three
            </TabPanel> */}
          </Box>

          {/* signoutIcon */}
          {/* <div className="menuItem">
            <UilSignOutAlt />
          </div> */}
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;
