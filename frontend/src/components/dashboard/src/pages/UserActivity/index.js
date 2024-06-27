import { Button, Typography } from "@mui/material";
import {
  getLatestLoginLocationOfAllUser,
  getLatLng,
  getLocationInformation,
} from "api/googleMapService";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  useZoomPan,
} from "react-simple-maps";
import ReactTooltip from "react-tooltip";
import "./style.scss";
import _ from "lodash";
import { scaleQuantize } from "d3-scale";

const geoUrl =
  "https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

const colorScale = scaleQuantize()
  .domain([1, 80])
  .range([
    "#ffedea",
    "#ffcec5",
    "#ffad9f",
    "#ff8a75",
    "#ff5533",
    "#e2492d",
    "#be3d26",
    "#9a311f",
    "#782618",
  ]);

const width = 800;
const height = 600;

const CustomZoomableGroup = ({ children, ...restProps }) => {
  const { mapRef, transformString, position } = useZoomPan(restProps);
  return (
    <g ref={mapRef}>
      <rect width={width} height={height} fill="transparent" />
      <g transform={transformString}>{children(position)}</g>
    </g>
  );
};

const UserActivity = () => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [group, setGroup] = useState({});
  const [totalUsersLocation, setTotalUsersLocation] = useState([]);
  const [chartConfig, setChartConfig] = useState({
    series: [
      {
        name: 'No. users',
        data: [],
      },
    ],
    options: {
      chart: {
        type: "bar",
        height: 350,
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        colors: "rgba(238, 133, 133)",
      },
      xaxis: {
        categories: [],
      },
    },
  });

  const handleGetLatestLoginLocationOfAllUsers = () => {
    getLatestLoginLocationOfAllUser()
      .then((res) => {
        if (res.status === 200) {
          setTotalUsersLocation(res.data);
          const dataGroup = _.groupBy(res.data, "country");
          const sortData = Object.entries(dataGroup).map((item) => {
            return {
              country: item[0],
              marksList: item[1],
              rate: Math.round((item[1].length / res.data.length) * 100, 4),
            };
          });
          setGroup(sortData);
        }
      })
      .catch((err) => {
        throw err;
      });
  };
  useEffect(async () => {
    handleGetLatestLoginLocationOfAllUsers();
    console.log("test scale:", colorScale(38));
  }, []);

  // const handleGroupMarkers = async () => {
  //   let resultsList = [];
  //   await Promise.all(
  //     markers.map((mark, markIndex) => {
  //       getLocationInformation({
  //         latitude: mark.coordinates[1],
  //         longitude: mark.coordinates[0],
  //       }).then(({ data: res }) => {
  //         console.log({ res: res.countryName });
  //         if (!resultsList.find((item) => item.country === res.countryName)) {
  //           resultsList.push({ country: res.countryName, marksList: [mark] });
  //         } else {
  //           const existedItem = resultsList.filter(
  //             (item) => item.country === res.countryName
  //           )[0];
  //           const index = resultsList.indexOf(existedItem);
  //           resultsList[index].marksList.push(mark);
  //         }
  //         if (markIndex === markers.length - 1) {
  //           setGroup(resultsList);
  //         }
  //       });
  //     })
  //   );
  // };

  useEffect(() => {
    if (group.length > 0) {
      console.log("Group", group);
    }
  }, [group]);

  useEffect(() => {
    if (group.length > 0) {
      const sortGroup = group
        .sort((a, b) => b.marksList.length - a.marksList.length)
        .slice(0, 5);
      const config = { ...chartConfig };
      config.series = [
        { data: sortGroup.map((item) => item.marksList.length) },
      ];
      config.options.xaxis.categories = sortGroup.map((item) => item.country);
      setChartConfig(config);
    }
  }, [group]);

  const areaChartConfig = {
    series: [
      {
        name: "minutes",
        data: [80, 100, 78, 68, 96, 104, 89],
      },
    ],
    options: {
      chart: {
        height: 350,
        type: "area",
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        colors: ["transparent"],
      },
      fill: {
        colors: ["rgba(96, 170, 255, 0.82)"],
        type: "gradient",
        gradient: {
          shade: "light",
          type: "horizontal",
          shadeIntensity: 0.25,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [30, 99, 100],
        },
      },
      xaxis: {
        type: "datetime",
        categories: [
          "2022-06-29",
          "2022-06-28",
          "2022-06-27",
          "2022-06-26",
          "2022-06-25",
          "2022-06-24",
          "2022-06-23",
        ],
      },
      tooltip: {
        x: {
          format: "dd/MM/yyyy",
        },
      },
    },
  };

  return (
    <Typography component="div" className="user-activity-container">
      <Typography component="div" className="user-activity-charts">
        <Typography component="div" className="user-activity-analysis">
          <Typography component="div" className="top-country chart">
            <Typography className="header">Top Popular country</Typography>
            <Typography className="chart-content">
              {chartConfig &&
                chartConfig.options.xaxis.categories.length > 0 && (
                  <ReactApexChart
                    options={chartConfig.options}
                    series={chartConfig.series}
                    type="bar"
                    height={250}
                  />
                )}{" "}
            </Typography>
          </Typography>

          <Typography component="div" className="user-logged-in-hours chart">
            <Typography className="header">User average logged-in minutes</Typography>
            <Typography className="chart-content">
              <ReactApexChart
                options={areaChartConfig.options}
                series={areaChartConfig.series}
                type="area"
                height={250}
              />
            </Typography>
          </Typography>
        </Typography>
        <Typography component="div" className="user-activity-map-container">
          <Typography component="div" className="user-activity-map chart">
            <Typography className="header">
              User density by Country{" "}
              <Typography componnent="div" className="legend-container">
                <Typography
                  componnent="div"
                  className="legend-dot"
                ></Typography>
                <Typography componnent="div" className="legend-name">
                  {totalUsersLocation.length} users
                </Typography>
              </Typography>
            </Typography>
            <Typography className="chart-content">
              <ComposableMap data-tip="" projection="geoMercator">
                <CustomZoomableGroup center={[0, 0]} zoom={0.65}>
                  {(position) => (
                    <>
                      <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            // console.log({group, geo: geo.properties})
                            const cur = group.find(
                              (s) => s.country === geo.properties.NAME
                            );
                            console.log({ cur });
                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill={cur ? colorScale(cur.rate) : "#EEE"}
                                // fill={"#EEE"}
                                stroke="#D6D6DA"
                                onMouseEnter={() => {
                                  console.log({ group });
                                  const { NAME, POP_EST } = geo.properties;
                                  setTooltipContent(
                                    `${NAME} — ${
                                      group.filter(
                                        (item) => item.country === NAME
                                      )[0]?.marksList.length || 0
                                    } user`
                                  );
                                }}
                                onMouseLeave={() => {
                                  setTooltipContent("");
                                }}
                                // style={{
                                //   default: {
                                //     fill: "#D6D6DA",
                                //     outline: "none",
                                //   },
                                //   hover: {
                                //     fill: "#F53",
                                //     outline: "none",
                                //   },
                                //   pressed: {
                                //     fill: "#E42",
                                //     outline: "none",
                                //   },
                                // }}
                              />
                            );
                          })
                        }
                      </Geographies>
                      {/*[long, lat]*/}
                      {/* {totalUsersLocation.map(({ id, latitude, longitude }) => (
                        <Marker key={id} coordinates={[longitude, latitude]}>
                          <circle
                            r={3 / position.k}
                            fill="#F00"
                            stroke="#fff"
                          />
                        </Marker>
                      ))}{" "} */}
                    </>
                  )}
                </CustomZoomableGroup>
              </ComposableMap>
            </Typography>
          </Typography>
          <ReactTooltip>{tooltipContent}</ReactTooltip>
        </Typography>{" "}
      </Typography>
    </Typography>
  );
};

export default UserActivity;
