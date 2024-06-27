import { Box, Typography } from "@mui/material";
import * as React from "react";
import "./style.scss";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import OverallDashboard from "../../components/OverallDashboard";
import { Icon } from "@iconify/react";
import UserActivity from "../UserActivity";

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
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const DashboardTabs = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const selectedStyle = {
    boxShadow:
      "rgba(14, 30, 37, 0.12) 0px 1px 1px 0px, rgba(14, 30, 37, 0.32) 0px 2px 8px 0px",
    color: "black",
    fontWeight: 900,
  };

  const unSelectedStyle = {
    backgroundColor: "rgb(237, 236, 236)",
  };

  const renderTabLabel = ({ icon: IconComponent, label }) => {
    return (
      <p className="tab-container">
        {IconComponent}
        <p className="tab-label">{label}</p>
      </p>
    );
  };

  return (
    <Typography component="div" className="dashboard-tabs">
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 0.25, borderColor: "rgb(237, 236, 236)" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab
              label={renderTabLabel({
                icon: (
                  <>
                    {value === 0 ? (
                      <Icon
                        icon="logos:google-analytics"
                        className="tab-icon"
                      />
                    ) : (
                      <Icon
                        icon="simple-icons:googleanalytics"
                        className="tab-icon"
                        style={{ opacity: 0.5 }}
                      />
                    )}
                  </>
                ),
                label: "General",
              })}
              {...a11yProps(0)}
            />
            <Tab
              label={renderTabLabel({
                icon: (
                  <Icon
                    icon="subway:location"
                    className="tab-icon"
                    style={value === 1 ? { color: "red" } : { opacity: 0.5 }}
                  />
                ),
                label: "User activity",
              })}
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0} className="tab-panel">
          <OverallDashboard />
        </TabPanel>
        <TabPanel value={value} index={1} className="tab-panel">
          <UserActivity />
        </TabPanel>
      </Box>
    </Typography>
  );
};

export default DashboardTabs;
