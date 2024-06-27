import "./style.scss";
import {
  getStatisticData,
  getTheTopAccountMostFollowerStatistic,
  getPostQuantityStatisticInMonths,
  getPostQuantityStatisticInQuarters,
  getPostQuantityStatisticInYears,
  getTheTopPostInteraction,
  getPostByNewestCreatedAt,
} from "api/statisticService";
import { PERIOD } from "constant/types";
import { useState, useEffect } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";
import moment from "moment";
import { getLocationByLongLat } from "api/googleMapService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SummaryChart = ({ statistics, period = PERIOD.MONTHS }) => {
  const options = {
    plugins: {
      datalabels: {
        display: false,
      },
    },
    responsive: true,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
      },
    },
  };

  if (statistics) {
    const labels = statistics.statisticByTime.map((item) => ({
      time: item.time,
      year: item.year,
    }));
    const quantity = statistics.statisticByTime.map((item) => item.quantity);
    const data = {
      labels: labels.map((item) =>
        period === PERIOD.MONTHS
          ? `${String(item.time).padStart(2, "0")}/${item.year}`
          : period === PERIOD.QUARTERS
          ? `${item.year}, Q${item.time}`
          : item.year
      ),
      datasets: [
        {
          label: "Post",
          backgroundColor: "rgba(245, 131, 44, 1)",
          data: quantity,
        },
      ],
    };
    return <Bar options={options} data={data} />;
  }

  return null;
};

export default function Dashboard() {
  const [summaryPeriod, setSummaryPeriod] = useState(PERIOD.MONTHS);
  const [statisticByTime, setStatisticByTime] = useState([]);
  const [statisticData, setStatisticData] = useState([]);
  const [newestPostData, setNewestPostData] = useState([]);
  const [postInteractionData, setPostInteractionData] = useState([]);
  const [userAccountMostFollowerData, setUserAccountMostFollowerData] =
    useState([]);

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
    getStatisticData().then((res) => setStatisticData(res.data));
    getTheTopPostInteraction({ limit: 5 }).then((res) =>
      setPostInteractionData(res.data)
    );
    getPostByNewestCreatedAt({ limit: 4 }).then((res) =>
      setNewestPostData(res.data)
    );
    getTheTopAccountMostFollowerStatistic({ limit: 5 }).then((res) =>
      setUserAccountMostFollowerData(res.data)
    );
  }, []);

  const renderHomePage = () => {
    return (
      <main className="homepage container">
        <div className="homepage-bg">
          <img
            src={require("../../../assets/img/wave-bg.svg")}
            alt="background"
          />
        </div>

        <div className="homepage__hero">
          <div className="homepage__info-cards">
            <div className="homepage__info-card card-innovation">
              <div className="homepage__info-card-title">
                <h1>{statisticData.totalPostCount}</h1>
                <span>Posts</span>
              </div>
              <div className="homepage__info-card-icon">
                <img
                  src={require("../../../assets/img/innovation_icon.png")}
                  alt="idea"
                />
              </div>
            </div>
            <div className="homepage__info-card card-idea">
              <div className="homepage__info-card-title">
                <h1>{statisticData.totalAccountCount}</h1>
                <span>Accounts</span>
              </div>
              <div className="homepage__info-card-icon">
                <img
                  src={require("../../../assets/img/idea_icon.png")}
                  alt="Idea"
                />
              </div>
            </div>
          </div>

          <div className="homepage__top-cards slide-container">
            <Slide
              duration={5000}
              prevArrow={
                <div className="card__btn card__btn-prev">
                  <i className="bx bx-chevron-left" />
                </div>
              }
              nextArrow={
                <div className="card__btn card__btn-next">
                  <i className="bx bx-chevron-right" />
                </div>
              }
            >
              {postInteractionData.map((item, index) => (
                <div
                  className="homepage__top-card each-slide"
                  key={index}
                  onClick={() => {
                    // navigate(`/innovation/${item.id}`);
                  }}
                >
                  <div className="homepage__top-card-header">
                    <div className="homepage__top-card-avatar-box">
                      <div className="homepage__top-card-avatar-bg">
                        <div className="homepage__top-card-avatar-bg">
                          <div className="homepage__top-card-avatar-bg">
                            <img
                              //src={require("../../../assets/img/user.png")}
                              src={item.url}
                              alt="user"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="homepage__top-card-user-box">
                      <h3>{item.caption}</h3>
                      <span>{item.userName}</span>
                    </div>
                  </div>
                  <div className="homepage__top-card-body">
                    <h3>{item.url}</h3>
                    <span>
                      <i className="bx bxs-time-five" />
                      {moment(item.createdAt).format("DD/MM/YYYY")}
                    </span>
                  </div>
                  <div className="homepage__top-card-footer">
                    <div className="homepage__top-card-chip comment">
                      <span>Total comment: {item.totalComment}</span>
                    </div>
                    <div className="homepage__top-card-chip like">
                      <span>Total like: {item.totalLike}</span>
                    </div>
                    <div className="homepage__top-card-chip interaction">
                      <span>Total interaction: {item.totalInteraction}</span>
                    </div>
                  </div>
                  <div className="homepage__top-card-img">
                    <img
                      src={require("../../../assets/img/card_innovation_img.png")}
                      alt="innovation card"
                    />
                  </div>
                </div>
              ))}
            </Slide>
          </div>

          <div className="homepage__top-contributor-box">
            <div className="homepage__top-contributor-title">
              <h3>Top Accounts Most Follower</h3>
            </div>
            <div className="homepage__top-contributor-list">
              {userAccountMostFollowerData.map((item, index) => (
                <div key={index} className="homepage__top-contributor-row">
                  <img
                    //src={require("../../../assets/img/user.png")}
                    src={item.url}
                    alt="user"
                  />
                  <div className="homepage__top-contributor-content">
                    <h5 data-toggle="tooltip" title={`${item.name}`}>
                      {item.name}
                    </h5>
                    <span>Total: {item.accountQuantity} followers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="homepage__summary-submission">
          <div className="homepage__summary-box">
            <div className="homepage__summary-section">
              <div className="homepage__summary-header">
                <h3>System Statistics</h3>
              </div>
            </div>

            <div className="homepage__summary-chart-section">
              <div className="homepage__summary-chart-header">
                <h4>Statistic Data Chart</h4>

                <div className="homepage__summary-filter-wrapper">
                  <div
                    //  className={`${classes['homepage__summary-filter-option']} ${summaryPeriod === PERIOD.MONTHS ? classes['selected'] : ''}`}
                    onClick={() => {
                      setSummaryPeriod(PERIOD.MONTHS);
                    }}
                  >
                    <span>Month</span>
                  </div>
                  <div
                    //  className={`${classes['homepage__summary-filter-option']} ${summaryPeriod === PERIOD.QUARTERS ? classes['selected'] : ''}`}
                    onClick={() => {
                      setSummaryPeriod(PERIOD.QUARTERS);
                    }}
                  >
                    <span>Quarter</span>
                  </div>
                  <div
                    //  className={`${classes['homepage__summary-filter-option']} ${summaryPeriod === PERIOD.YEARS ? classes['selected'] : ''}`}
                    onClick={() => {
                      setSummaryPeriod(PERIOD.YEARS);
                    }}
                  >
                    <span>Year</span>
                  </div>
                </div>

                <div className="homepage__summary-chart-box">
                  {renderSummaryChart()}
                </div>
              </div>
            </div>
          </div>

          <div className="homepage__submission-box">
            <div className="homepage__submission-header">
              <h3>My Latest Post</h3>
              <button
                className="homepage__submission-btn"
                onClick={() => {
                  // navigate('/innovations/');
                }}
              >
                View all <i className="bx bx-right-arrow-alt" />
              </button>
            </div>
            <div className="homepage__submission-list">
              {newestPostData.length === 0
                ? "No data available!!!"
                : newestPostData.map((item, index) => (
                    <div
                      key={index}
                      className="homepage__submission-card"
                      onClick={() => {
                        // navigate(`/innovation/${item.id}`);
                      }}
                    >
                      <img
                        className="homepage__submission-card-img"
                        // src={require(`../../../assets/img/${item.name.toLowerCase()}_icon.png`)}
                        src={item.url}
                        alt="Idea"
                      />
                      <div className="homepage__submission-card-info">
                        <h4>{item.caption}</h4>
                        <div className="homepage__submission-card-info-footer">
                          <span>
                            <i className="bx bxs-time-five" />
                            {moment(item.createdAt).format("DD/MM/YYYY")}
                          </span>
                          <div
                          // className={`${classes['homepage__submission-chip']} ${classes[`chip-${item.name.toLowerCase()}`]}`}
                          >
                            <span>{item.userName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </main>
    );
  };

  const renderSummaryChart = () => {
    const obj = {
      statisticByTime,
      postInteractionData,
      userAccountMostFollowerData,
    };
    if (statisticByTime) {
      return <SummaryChart statistics={obj} period={summaryPeriod} />;
    }

    return null;
  };

  return <div>{renderHomePage()}</div>;
}
