package com.vivacon.configuration;

import com.maxmind.db.CHMCache;
import com.maxmind.geoip2.DatabaseReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.ResourceLoader;
import ua_parser.Parser;

import javax.inject.Inject;
import java.io.IOException;

@Configuration
public class GeolocationConfiguration {

    private ResourceLoader resourceLoader;

    @Inject
    public GeolocationConfiguration(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Bean
    public Parser uaParser() throws IOException {
        return new Parser();
    }

    @Bean
    public DatabaseReader databaseReader() throws IOException {
//        Resource resource = resourceLoader.getResource("classpath:maxmind/GeoLite2-City.mmdb");
//        InputStream dbAsStream = resource.getInputStream();
//
//        // Initialize the reader
//        return new DatabaseReader
//                .Builder(dbAsStream)
//                .fileMode(Reader.FileMode.MEMORY_MAPPED)
//                .withCache(new CHMCache())
//                .build();

        FileSystemResource resource = new FileSystemResource("GeoLite2-City.mmdb");

        return new DatabaseReader.Builder(resource.getFile())
                .fileMode(com.maxmind.db.Reader.FileMode.MEMORY_MAPPED)
                .withCache(new CHMCache()).build();
    }
}
