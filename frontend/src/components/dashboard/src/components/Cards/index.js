import React from "react";
import "./style.scss";

import Card from "../Card";

// Analytics Cards imports
import { UilUsdSquare } from "@iconscout/react-unicons";
import { PERIOD } from "../../../../../constant/types";

const Cards = ({
  statisticData,
  statisticByTime,
  summaryPeriod,
  setSummaryPeriod,
  statisticUserByTime,
  setSummaryUserPeriod,

  topTrendingHashTag,
  setLimit,
  setTimeSection,
}) => {
  const labels = statisticByTime.map((item) => ({
    time: item.time,
    year: item.year,
  }));

  const label = labels.map((item) =>
    summaryPeriod === PERIOD.MONTHS
      ? `${String(item.time).padStart(2, "0")}/${item.year}`
      : summaryPeriod === PERIOD.QUARTERS
      ? `${item.year}, Q${item.time}`
      : item.year
  );

  const cardsData = [
    {
      title: "Post",
      color: {
        backGround: "linear-gradient(180deg, #bb67ff 0%, #c484f3 100%)",
        boxShadow: "0px 10px 20px 0px #e0c6f5",
        chartColor: "#c484f3",
      },
      value: statisticData.totalPostCount,
      png: UilUsdSquare,
      series: [
        {
          name: "Post",
          data: statisticByTime.map((item) => item.quantity),
        },
      ],
      time: label,
      type: "bar",
      isPieChart: false,
    },
    {
      title: "User Account",
      color: {
        backGround: "linear-gradient(180deg, #FF919D 0%, #FC929D 100%)",
        boxShadow: "0px 10px 20px 0px #FDC0C7",
        chartColor: "#FC929D",
      },
      value: statisticData.totalAccountCount,
      png: UilUsdSquare,
      series: [
        {
          name: "User Account",
          data: statisticUserByTime.map((item) => item.quantity),
        },
      ],
      time: label,
      type: "bar",
      isPieChart: false,
    },
    {
      title: "Hashtag",
      color: {
        backGround:
          "linear-gradient(180deg, rgba(249, 205, 5, 0.76) 0%,rgba(249, 205, 5, 0.76) 100%)",
        boxShadow: "0px 10px 20px 0px rgba(249, 205, 5, 0.4)",
        chartColor: "rgba(249, 205, 5, 0.76)",
      },
      value: statisticData.totalHashTagCount,
      png: UilUsdSquare,
      series: [
        {
          name: "Hashtag",
          data: statisticUserByTime.map((item) => item.quantity),
        },
      ],
      //time: label,
      type: "pie",
      isPieChart: true,
    },
  ];

  return (
    <div className="Cards">
      {cardsData.map((card, id) => {
        return (
          <div className="parentContainer" key={id}>
            <Card
              title={card.title}
              color={card.color}
              value={card.value}
              png={card.png}
              series={card.series}
              setSummaryPeriod={setSummaryPeriod}
              time={card.time}
              setSummaryUserPeriod={setSummaryUserPeriod}
              type={card.type}
              isPieChart={card.isPieChart}
              topTrendingHashTag={topTrendingHashTag}
              setLimit={setLimit}
              setTimeSection={setTimeSection}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Cards;
