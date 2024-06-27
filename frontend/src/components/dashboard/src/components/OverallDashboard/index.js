import React, { useState, useEffect } from "react";
import Cards from "../Cards";
import Table from "../Table";
import moment from "moment";
import "./style.scss";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import Carousel from "react-material-ui-carousel";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import { convertUTCtoLocalDate } from "utils/calcDateTime";
import {
  getStatisticData,
  getTheTopAccountMostFollowerStatistic,
  getPostQuantityStatisticInMonths,
  getPostQuantityStatisticInQuarters,
  getPostQuantityStatisticInYears,
  getTheTopPostInteraction,
  getPostByNewestCreatedAt,
  getUserQuantityStatisticInMonths,
  getUserQuantityStatisticInQuarters,
  getUserQuantityStatisticInYears,
  getTopHashTagQuantityInTime,
} from "api/statisticService";
import {
  limitPerPage,
  PERIOD,
  timeSection,
  timeSectionList,
} from "constant/types";
import RightSide from "../RigtSide";
import ReactApexChart from "react-apexcharts";

const OverallDashboard = () => {
  const [summaryPeriod, setSummaryPeriod] = useState(PERIOD.MONTHS);
  const [summaryUserPeriod, setSummaryUserPeriod] = useState(PERIOD.MONTHS);
  const [statisticByTime, setStatisticByTime] = useState([]);
  const [statisticUserByTime, setStatisticUserByTime] = useState([]);
  const [statisticData, setStatisticData] = useState([]);
  const [newestPostData, setNewestPostData] = useState([]);
  const [postInteractionData, setPostInteractionData] = useState([]);
  const [userAccountMostFollowerData, setUserAccountMostFollowerData] =
    useState([]);

  const [topTrendingHashTag, setTopTrendingHashTag] = useState([]);
  const [limit, setLimit] = useState(5);
  const [timeSection, setTimeSection] = useState("YEAR");

  useEffect(() => {
    if (summaryPeriod === PERIOD.MONTHS) {
      getPostQuantityStatisticInMonths().then((res) =>
        setStatisticByTime(res.data)
      );
    } else if (summaryPeriod === PERIOD.QUARTERS) {
      getPostQuantityStatisticInQuarters().then((res) =>
        setStatisticByTime(res.data)
      );
    } else if (summaryPeriod === PERIOD.YEARS) {
      getPostQuantityStatisticInYears().then((res) =>
        setStatisticByTime(res.data)
      );
    }
  }, [summaryPeriod]);

  useEffect(() => {
    if (summaryUserPeriod === PERIOD.MONTHS) {
      getUserQuantityStatisticInMonths().then((res) =>
        setStatisticUserByTime(res.data)
      );
    } else if (summaryUserPeriod === PERIOD.QUARTERS) {
      getUserQuantityStatisticInQuarters().then((res) =>
        setStatisticUserByTime(res.data)
      );
    } else if (summaryUserPeriod === PERIOD.YEARS) {
      getUserQuantityStatisticInYears().then((res) =>
        setStatisticUserByTime(res.data)
      );
    }
  }, [summaryUserPeriod]);

  useEffect(() => {
    getStatisticData().then((res) => setStatisticData(res.data));
    getPostByNewestCreatedAt({ limit: 5 }).then((res) =>
      setNewestPostData(res.data)
    );
    getTheTopPostInteraction({ limit: 4 }).then((res) =>
      setPostInteractionData(res.data)
    );
    getTheTopAccountMostFollowerStatistic({ limit: 5 }).then((res) =>
      setUserAccountMostFollowerData(res.data)
    );
    getTopHashTagQuantityInTime({ timeSection: "MONTHS", limit: 5 }).then(
      (res) => setTopTrendingHashTag(res.data)
    );
  }, []);

  useEffect(() => {
    getTopHashTagQuantityInTime({ timeSection, limit }).then((res) =>
      setTopTrendingHashTag(res.data)
    );
  }, [limit, timeSection]);

  console.log(topTrendingHashTag);

  return (
    <div className="dashboard-general-container">
      <div className="MainDash">
        <div className="homepage-bg">
          {/* <img
          src={require("../../../../../assets/img/wave-bg.svg")}
          alt="background"
        /> */}
        </div>

        <div className="homepage__hero">
          <Cards
            statisticData={statisticData}
            statisticByTime={statisticByTime}
            summaryPeriod={summaryPeriod}
            setSummaryPeriod={setSummaryPeriod}
            statisticUserByTime={statisticUserByTime}
            setSummaryUserPeriod={setSummaryUserPeriod}
            topTrendingHashTag={topTrendingHashTag}
            setLimit={setLimit}
            setTimeSection={setTimeSection}
          />

          {/* {topTrendingHashTag && topTrendingHashTag.length > 0 ? (
            <div id="chart">
              <ReactApexChart
                options={mapDataToPieChart(topTrendingHashTag)?.options}
                series={mapDataToPieChart(topTrendingHashTag)?.series}
                type="pie"
                width={380}
              />
              <select onChange={(event) => setLimit(+event.target.value)}>
                {limitPerPage.map((item, index) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select onChange={(event) => setTimeSection(event.target.value)}>
                {timeSectionList.map((item, index) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          ) : null} */}
          <div>
            <h3 className="trending-post-title">Trending posts</h3>
            <div className="homepage__top-cards slide-container">
              <Carousel duration={1000} autoPlay={true} animation="slide">
                {postInteractionData.map((item, index) => (
                  <div
                    className="homepage__top-card each-slide"
                    key={index}
                    onClick={() => {
                      // navigate(`/innovation/${item.id}`);
                    }}
                  >
                    <div className="homepage__top-card-left-content">
                      <div className="homepage__top-card-header">
                        <div className="homepage__top-card-avatar-box">
                          <div className="homepage__top-card-avatar-bg">
                            <img
                              src={item.url || require("images/no-avatar.png")}
                              alt="user"
                            />
                          </div>
                        </div>
                        <div className="homepage__top-card-user-box">
                          <span className="username">{item.userName}</span>
                          <span className="date-post">
                            <i className="bx bxs-time-five" />
                            {convertUTCtoLocalDate(
                              item.createdAt,
                              "YYYY-MM-DD HH:mm:ss"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="homepage__top-card-body">
                        <div className="caption">"{item.caption}"</div>
                      </div>
                      <div className="homepage__top-card-footer">
                        <div className="homepage__top-card-chip comment">
                          <span>
                            <ChatBubbleIcon className="icon" />{" "}
                            {item.totalComment}
                          </span>
                        </div>
                        <div className="homepage__top-card-chip like">
                          <span>
                            <FavoriteIcon className="icon" /> {item.totalLike}
                          </span>
                        </div>
                        <div className="homepage__top-card-chip interaction">
                          <span>
                            Total interaction: {item.totalInteraction}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="homepage__top-card-right-content">
                      <div className="homepage__top-card-img">
                        <Carousel
                          autoPlay={false}
                          className="details-carousel"
                          indicators={item.lstAttachmentDTO?.length > 1}
                          cycleNavigation={item.lstAttachmentDTO?.length > 1}
                        >
                          {item.lstAttachmentDTO?.map((item, i) => (
                            <img
                              key={i}
                              src={item.url}
                              alt=""
                              width="300"
                              height="300"
                            />
                          ))}
                        </Carousel>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </div>

        <Table newestPostData={newestPostData} />
      </div>
      <RightSide userAccountMostFollowerData={userAccountMostFollowerData} />{" "}
    </div>
  );
};

export default OverallDashboard;
