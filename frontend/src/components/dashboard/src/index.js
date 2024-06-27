import { useState, useEffect } from "react";
import "./style.scss";
import OverallDashboard from "./components/OverallDashboard";
import RightSide from "./components/RigtSide";
import Sidebar from "./components";
import PostReportPage from "./pages/PostReportPage";
import CommentReportPage from "components/dashboard/src/pages/CommentReportPage";
import AccountReportPage from "components/dashboard/src/pages/AccountReportPage";
import AdminManagement from "./pages/AdminManagement";
import UserActivity from "./pages/UserActivity";
import * as React from "react";
import DashboardTabs from "./pages/DashboardTabs";

const Dashboard = () => {
  const [selected, setSelected] = useState(0);

  return (
    <div className="Dashboard">
      <div className="AppGlass">
        <Sidebar setSelected={setSelected} selected={selected} />
        {selected === 0 && <DashboardTabs />}
        {selected === 1 && <PostReportPage />}
        {selected === 2 && <CommentReportPage />}
        {selected === 3 && <AccountReportPage />}
        {selected === 4 && <AdminManagement />}
      </div>
    </div>
  );
};

export default Dashboard;
