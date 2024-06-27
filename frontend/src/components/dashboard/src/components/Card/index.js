import React, { useState } from "react";
import "./style.scss";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimateSharedLayout } from "framer-motion";
import { UilTimes } from "@iconscout/react-unicons";
import Chart from "react-apexcharts";
import { limitPerPage, PERIOD } from "../../../../../constant/types";
import classNames from "classnames";
import { ClickAwayListener, Typography } from "@mui/material";
import ReactApexChart from "react-apexcharts";

// parent Card
const Card = (props) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <AnimateSharedLayout>
      {expanded ? (
        <ExpandedCard
          param={props}
          setExpanded={() => setExpanded(false)}
          setSummaryPeriod={props.setSummaryPeriod}
          setSummaryUserPeriod={props.setSummaryUserPeriod}
          setLimit={props.setLimit}
          setTimeSection={props.setTimeSection}
        />
      ) : (
        <CompactCard param={props} setExpanded={() => setExpanded(true)} />
      )}
    </AnimateSharedLayout>
  );
};

// Compact Card
function CompactCard({ param, setExpanded }) {
  return (
    <motion.div
      className="CompactCard"
      style={{
        background: param.color.backGround,
        boxShadow: param.color.boxShadow,
      }}
      layoutId="expandableCard"
      onClick={setExpanded}
    >
      <div className="radialBar">
        <span>{param.title}</span>
        <span>
          {param.value} {param.title}
        </span>
      </div>
    </motion.div>
  );
}

// Expanded Card
function ExpandedCard({
  param,
  setExpanded,
  setSummaryPeriod,
  setSummaryUserPeriod,
  setLimit,
  setTimeSection,
}) {
  const [currentPeriod, setCurrentPeroid] = useState(PERIOD.MONTHS);

  let data = {};

  if (param.isPieChart) {
    data = {
      series: param.topTrendingHashTag?.map(function (item) {
        if (item?.quantity == null) {
          item["quantity"] = 0;
        }
        return item["quantity"];
      }),
      options: {
        chart: {
          width: 600,
          type: "pie",
        },
        labels: param.topTrendingHashTag.map(function (item) {
          return item["name"].trim();
        }),
        responsive: [
          {
            breakpoint: 600,
            options: {
              chart: {
                width: 600,
              },
              legend: {
                position: "bottom",
                fontSize: '16px',
                width: '50px',
                height: '30px',
              },
            },
          },
        ],
      },
    };
  } else {
    data = {
      options: {
        chart: {
          id: param.type,
        },
        xaxis: {
          categories: param.time,
          labels: {
            style: {
              fontSize: "12px",
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              fontSize: "14px !important",
            },
          },
        },
        tooltip: {
          enabled: true,
        },
        fill: {
          colors: [param.color.chartColor],
          type: "gradient",
          gradient: {
            shade: "light",
            type: "horizontal",
            shadeIntensity: 0.25,
            gradientToColors: undefined,
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [20, 40, 100],
          },
        },
        legend: {
          position: "bottom",
          offsetX: 0,
          offsetY: 50,
        },
      },
    };
  }

  const handleClickPeriod = (type) => {
    setSummaryPeriod(type);
    setSummaryUserPeriod(type);
    setCurrentPeroid(type);

    if (param.isPieChart) {
      setTimeSection(type.toUpperCase());
    }
  };

  const peroidClassName = (type) =>
    classNames({
      active: currentPeriod === type,
    });

  return (
    <motion.div
      className="ExpandedCard"
      style={{
        background: "white",
        boxShadow: param.color.boxShadow,
        "--chartColor": param.color.chartColor,
      }}
      layoutId="expandableCard"
    >
      <ClickAwayListener onClickAway={setExpanded}>
        <div style={{ flex: 1, width: "100%" }}>
          <div className="ChartHeader">
            <span className="Title">{param.title}</span>
            {param.isPieChart ? (
              <select onChange={(event) => setLimit(+event.target.value)}>
                {limitPerPage.map((item, index) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            ) : null}

            <div className="homepage__summary-filter-wrapper">
              <div
                onClick={() => {
                  handleClickPeriod(PERIOD.MONTHS);
                }}
                className={peroidClassName(PERIOD.MONTHS)}
              >
                <span>Month</span>
              </div>
              <div
                onClick={() => {
                  handleClickPeriod(PERIOD.QUARTERS);
                }}
                className={peroidClassName(PERIOD.QUARTERS)}
              >
                <span>Quarter</span>
              </div>
              <div
                onClick={() => {
                  handleClickPeriod(PERIOD.YEARS);
                }}
                className={peroidClassName(PERIOD.YEARS)}
              >
                <span>Year</span>
              </div>
            </div>
            <div className="CloseCardIcon">
              <UilTimes onClick={setExpanded} />
            </div>
          </div>
          <div className="chartContainer">
            {!param.isPieChart ? (
              <Chart
                options={data.options}
                series={param.series}
                type={param.type}
                width="700"
                style={{ marginTop: "20px" }}
              />
            ) : (
              <ReactApexChart
                options={data.options}
                series={data.series}
                type={param.type}
                width={600}
              />
            )}
          </div>
        </div>
      </ClickAwayListener>
    </motion.div>
  );
}

export default Card;
