FROM openjdk:11
MAINTAINER vivacon-author
COPY GeoLite2-City.mmdb GeoLite2-City.mmdb
COPY target/Vivacon-0.0.1-SNAPSHOT.jar vivacon.jar
ENTRYPOINT ["java", "-Xmx2024m" ,"-jar","vivacon.jar"]