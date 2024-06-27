package com.vivacon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.annotation.PostConstruct;
import java.util.TimeZone;

@EnableTransactionManagement
@EnableScheduling
@SpringBootApplication
public class VivaconApplication {

    public static void main(String[] args) {
        SpringApplication.run(VivaconApplication.class, args);
    }

    @PostConstruct
    public void setTheDefaultTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }
}
