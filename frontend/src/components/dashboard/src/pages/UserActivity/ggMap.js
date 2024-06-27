// import { Typography } from "@mui/material";
// import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
// import React, { useState, useEffect, useCallback } from "react";
// const containerStyle = {
//   width: "800px",
//   height: "800px",
// };

// const center = {
//   lat: -3.745,
//   lng: -38.523,
// };
// const UserActivity = () => {
//   const { isLoaded } = useJsApiLoader({
//     id: "google-map-script",
//     googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAP_KEY,
//   });

//   const [map, setMap] = useState(null);

//   const onLoad = useCallback(function callback(map) {
//     const bounds = new window.google.maps.LatLngBounds(center);
//     map.fitBounds(bounds);
//     setMap(map);
//   }, []);

//   const onUnmount = useCallback(function callback(map) {
//     setMap(null);
//   }, []);

//   return isLoaded ? (
//     <Typography component="div" className="user-activity-container">
//       <GoogleMap
//         mapContainerStyle={containerStyle}
//         center={center}
//         zoom={6}
//         onLoad={onLoad}
//         onUnmount={onUnmount}
//       >
//         {/* Child components, such as markers, info windows, etc. */}
//         <></>
//       </GoogleMap>
//     </Typography>
//   ) : (
//     <></>
//   );
// };

// export default React.memo(UserActivity);
