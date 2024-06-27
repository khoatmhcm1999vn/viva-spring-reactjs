package com.vivacon.service.impl;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.exception.GeoIp2Exception;
import com.maxmind.geoip2.model.CityResponse;
import com.vivacon.common.enum_type.VerifyDeviceContext;
import com.vivacon.entity.Account;
import com.vivacon.entity.DeviceMetadata;
import com.vivacon.event.NewDeviceLocationLoginEvent;
import com.vivacon.repository.DeviceMetadataRepository;
import com.vivacon.service.DeviceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import ua_parser.Client;
import ua_parser.Parser;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DeviceServiceImpl implements DeviceService {

    private Logger logger = LoggerFactory.getLogger(this.getClass());
    private DeviceMetadataRepository deviceMetadataRepository;
    private DatabaseReader databaseReader;
    private Parser parser;
    private ApplicationEventPublisher applicationEventPublisher;

    public DeviceServiceImpl(DeviceMetadataRepository deviceMetadataRepository,
                             DatabaseReader databaseReader,
                             Parser parser,
                             ApplicationEventPublisher applicationEventPublisher) {
        this.deviceMetadataRepository = deviceMetadataRepository;
        this.databaseReader = databaseReader;
        this.parser = parser;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public boolean verifyDevice(HttpServletRequest request, Account account, VerifyDeviceContext context) {

        String ip = extractIp(request);
        CityResponse location = getLocation(ip);
        String device = getDevice(request.getHeader("User-Agent"));

        logger.info(" ip : " + ip + "  location " + location + " device " + device);
        if (location != null) {
            String country = location.getCountry().getName();
            String city = location.getLocation().getTimeZone();
            Optional<DeviceMetadata> existingDevice = deviceMetadataRepository.find(account.getId(), country, city, device);

            if (existingDevice.isEmpty()) {
                switch (context) {
                    case VERIFY: {
                        DeviceMetadata deviceMetadata = new DeviceMetadata.DeviceMetadataBuilder()
                                .account(account)
                                .country(country)
                                .city(city)
                                .device(device)
                                .lastLoggedIn(LocalDateTime.now())
                                .latitude(location.getLocation().getLatitude())
                                .longitude(location.getLocation().getLongitude())
                                .build();
                        deviceMetadataRepository.save(deviceMetadata);
                        return true;
                    }
                    default: {
                        applicationEventPublisher.publishEvent(new NewDeviceLocationLoginEvent(this, account, device, location, ip));
                        return false;
                    }
                }
            } else {
                DeviceMetadata deviceMetadata = existingDevice.get();
                deviceMetadata.setLastLoggedIn(LocalDateTime.now());
                deviceMetadataRepository.save(deviceMetadata);
                return true;
            }
        }
        return true;
    }

    private String extractIp(HttpServletRequest request) {
        String clientIp;
        String clientXForwardedForIp = request.getHeader("x-forwarded-for");
        logger.info(" clientXForwarded : " + clientXForwardedForIp);
        if (clientXForwardedForIp != null) {
            clientIp = parseXForwardedHeader(clientXForwardedForIp);
        } else {
            clientIp = request.getRemoteAddr();
        }
        return clientIp;
    }

    private String parseXForwardedHeader(String header) {
        return header.split(" *, *")[0];
    }

    private String getDevice(String userAgent) {
        String deviceDetails = "UNKNOWN";
        Client client = parser.parse(userAgent);
        logger.info("User agent " + userAgent + " client user agent : " + client.userAgent + " client os " + client.os + " client device " + client.device);
        if (client.userAgent != null && client.os != null) {
            deviceDetails = client.userAgent.family + " " + client.userAgent.major + "." + client.userAgent.minor;
        }
        return deviceDetails;
    }

    private CityResponse getLocation(String ip) {
        CityResponse cityResponse;
        try {
            InetAddress ipAddress = InetAddress.getByName(ip);
            cityResponse = databaseReader.city(ipAddress);
        } catch (IOException | GeoIp2Exception e) {
            cityResponse = null;
        }
        return cityResponse;
    }
}
