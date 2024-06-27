import { Typography } from "@mui/material";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  MarkerClusterer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { getPositionOfCurrentUser } from "api/googleMapService";
import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { calculateFromNow, convertUTCtoLocalDate } from "utils/calcDateTime";
import CloseIcon from "@mui/icons-material/Close";
import ConfirmDialog from "components/common/ConfirmDialog";
import useSnackbar from "hooks/useSnackbar";
import useLoading from "hooks/useLoading";
import { deleteUserLocationItem } from "api/googleMapService";
import "./style.scss";

const containerStyle = {
  width: "600px",
  height: "300px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};
const LoginActivityPage = () => {
  const [locationList, setLocationList] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState({
    open: false,
    location: null,
  });

  const { setSnackbarState } = useSnackbar();
  const { isLoading, setLoading } = useLoading();

  const handleGetCurrentUserLocation = () => {
    getPositionOfCurrentUser()
      .then((res) => {
        if (res.status === 200) {
          setLocationList(res.data.content);
          const {
            latitude: lat,
            longitude: lng,
            country,
            device,
          } = res.data.content[0];
          setCurrentLocation({
            position: { lng, lat },
            country,
            device,
            zoom: 1,
          });
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  const handleDeleteLocation = () => {
    setLoading(true);
    deleteUserLocationItem(openConfirmDialog.location?.id)
      .then((res) => {
        if (res.status === 200) {
          setTimeout(() => {
            setSnackbarState({
              open: true,
              content: "Delete location successfully",
              type: "SUCCESS",
            });
            handleGetCurrentUserLocation();
            handleCloseDeleteLocationDialog()
          }, 1000);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleChangeCurrentLocation = (data) => {
    const { latitude: lat, longitude: lng, country, device } = data;
    setCurrentLocation({
      position: { lng, lat },
      country,
      device,
      zoom: 1,
    });
  };
  const handleOpenDeleteLocationDialog = (userLocation) => {
    setOpenConfirmDialog({
      open: true,
      location: userLocation,
    });
  };

  const handleCloseDeleteLocationDialog = () => {
    setOpenConfirmDialog({
      ...openConfirmDialog,
      open: false,
    });
  };
  useEffect(() => {
    handleGetCurrentUserLocation();
  }, []);

  return currentLocation ? (
    <>
      <Typography component="div" className="login-activity-container">
        <Typography component="div" className="login-activity-map">
          <GoogleMapExample currentLocation={currentLocation} />
        </Typography>
        <Typography component="div" className="login-activity-list">
          {locationList.length > 0 &&
            locationList.map((act, index) => {
              return (
                <Typography component="div" className="login-activity-item">
                  <Icon
                    icon="fluent:location-28-regular"
                    width="30"
                    height="30"
                  />
                  <Typography
                    component="div"
                    className="login-activity-info"
                    onClick={() => handleChangeCurrentLocation(act)}
                  >
                    <Typography className="location">{act.country}</Typography>
                    <Typography className="login-act">
                      <Typography className="status-previous">
                        {calculateFromNow(
                          convertUTCtoLocalDate(act.lastLoggedIn)
                        )}
                      </Typography>
                      .<Typography className="device">{act.device}</Typography>
                    </Typography>
                  </Typography>
                  <CloseIcon
                    className="remove-icon"
                    onClick={() => handleOpenDeleteLocationDialog(act)}
                  />
                </Typography>
              );
            })}
        </Typography>
      </Typography>
      <ConfirmDialog
        handleClose={handleCloseDeleteLocationDialog}
        handleConfirm={handleDeleteLocation}
        open={openConfirmDialog.open}
        title={"Confirm"}
        description={`This action can not be undo. Are you sure to delete ${openConfirmDialog.location?.country}-${openConfirmDialog.location?.device}location?`}
      />
    </>
  ) : (
    <></>
  );
};

const GoogleMapExample = ({ currentLocation }) => {
  console.log({ currentLocation });
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAP_KEY,
  });

  const [map, setMap] = useState(null);

  const onLoad = (map) => {
    const bounds = new window.google.maps.LatLngBounds(
      currentLocation.position
    );
    map.fitBounds(bounds);
    setMap(map);
  };

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleChange = (e) => {
    console.log("map", e);
  };

  useEffect(() => {
    if (map) {
      map.setZoom(10);
    }
  }, [map]);
  return (
    isLoaded && (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation.position}
        zoom={1}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onChange={(e) => handleChange(e)}
      >
        {/* Child components, such as markers, info windows, etc. */}
        <Marker position={currentLocation.position}>
          {" "}
          <InfoWindow>
            <div>
              {currentLocation.country}, {currentLocation.device}
            </div>
          </InfoWindow>
        </Marker>
      </GoogleMap>
    )
  );
};

export default LoginActivityPage;
