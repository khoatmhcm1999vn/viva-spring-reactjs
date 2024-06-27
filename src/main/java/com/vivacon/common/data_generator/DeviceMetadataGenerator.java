package com.vivacon.common.data_generator;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class DeviceMetadataGenerator extends DataGenerator {

    @Override
    public List<String> generateSQLStatements(int startIndex, int endIndex) {
        List<String> values = new LinkedList<>();
        String[] devices = {"Chrome", "Samsung Phone", "Apple Phone", "Firefox", "Opera"};
        GeoLocation[] geoLocations = {
                new GeoLocation("Vietnam", 9, 15, 104, 109),
                new GeoLocation("Thailand", 12, 14, 99, 102),
                new GeoLocation("China", 35, 45, 112, 120),
        };

        String insertStatement = "INSERT INTO \"device_metadata\" (\"id\", \"account_id\", \"device\", \"country\", \"city\", \"latitude\", \"longitude\", \"last_logged_in\") \nVALUES ";
        values.add(insertStatement);

        long counting = 1L;
        for (int accountId = startIndex; accountId <= endIndex; accountId++) {

            int randomDeviceAmount = ThreadLocalRandom.current().nextInt(1, 3);
            for (int deviceAmount = 0; deviceAmount < randomDeviceAmount; deviceAmount++) {

                int randomDeviceId = ThreadLocalRandom.current().nextInt(0, devices.length);
                int randomGeoLocationId = ThreadLocalRandom.current().nextInt(0, geoLocations.length);
                GeoLocation geoLocation = geoLocations[randomGeoLocationId];

                String value = "([[id]], [[account_id]], '[[device]]', '[[country]]', '[[city]]', [[latitude]], [[longitude]], '[[last_logged_in]]'),\n";
                value = value.replace("[[id]]", String.valueOf(counting));
                value = value.replace("[[account_id]]", String.valueOf(accountId));
                value = value.replace("[[device]]", devices[randomDeviceId]);

                value = value.replace("[[country]]", geoLocation.country);
                value = value.replace("[[city]]", "UNKNOWN");

                double latitude = ThreadLocalRandom.current().nextDouble(geoLocation.fromLatitude, geoLocation.toLatitude);
                value = value.replace("[[latitude]]", String.valueOf(latitude));

                double longitude = ThreadLocalRandom.current().nextDouble(geoLocation.fromLongitude, geoLocation.toLongitude);
                value = value.replace("[[longitude]]", String.valueOf(longitude));

                value = value.replace("[[last_logged_in]]", getRandomTimestamp());
                values.add(value);
                counting++;
            }
        }
        return values;
    }

    private class GeoLocation {

        String country;

        double fromLatitude;

        double toLatitude;

        double fromLongitude;

        double toLongitude;

        public GeoLocation(String country, double fromLatitude, double toLatitude, double fromLongitude, double toLongitude) {
            this.country = country;
            this.fromLatitude = fromLatitude;
            this.toLatitude = toLatitude;
            this.fromLongitude = fromLongitude;
            this.toLongitude = toLongitude;
        }
    }
}
