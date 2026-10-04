# ============================================================================
# Giai doan 1: build jar
# ============================================================================
# Truoc day Dockerfile chi COPY target/Vivacon-0.0.1-SNAPSHOT.jar, nghia la phai
# chay mvnw clean package bang tay truoc moi lan docker build. Build nhieu buoc
# giup "docker build" tu lam tron viec tu source, khong phu thuoc may ai dang build.
FROM maven:3.9-eclipse-temurin-11 AS build

WORKDIR /build

# Copy rieng pom truoc de layer tai dependency duoc cache lai.
# Chi khi pom.xml doi thi layer nay moi phai chay lai, sua code Java thi khong.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Bo test o day: test cua du an can Postgres chay san nen khong chay duoc trong
# build context. Test van chay o CI/may dev bang "mvnw test".
RUN mvn -B -q clean package -DskipTests


# ============================================================================
# Giai doan 2: image chay
# ============================================================================
# Dung JRE thay vi JDK day du: nho hon dang ke va runtime khong can compiler.
FROM eclipse-temurin:11-jre

WORKDIR /app

# Khong chay bang root. Neu container bi chiem thi ke tan cong chi co quyen
# cua mot user thuong, khong phai root cua container.
RUN groupadd --system --gid 10001 vivacon \
    && useradd --system --uid 10001 --gid vivacon vivacon

# logback-spring.xml ghi file vao ./logs. WORKDIR thuoc root, con process chay bang
# user thuong, nen phai tao san thu muc va chuyen quyen - neu khong app chet ngay
# luc khoi dong voi "Failed to create parent directories".
RUN mkdir -p /app/logs && chown -R vivacon:vivacon /app

# GeolocationConfiguration doc file nay bang FileSystemResource("GeoLite2-City.mmdb"),
# tuc duong dan TUONG DOI theo working directory. Vi vay no phai nam ngay trong
# WORKDIR, khong phai cho khac.
COPY GeoLite2-City.mmdb ./GeoLite2-City.mmdb

COPY --from=build /build/target/Vivacon-0.0.1-SNAPSHOT.jar ./vivacon.jar

USER vivacon

# Mac dinh la prod, KHONG phai dev. Image la san pham dem di deploy, ma profile dev
# bat vivacon.verification.bypass=true - tuc bo qua xac thuc email. De dev lam mac
# dinh thi mot lan deploy nham la mo cua cho ai cung dang ky bang email nguoi khac.
# Chay thu o may thi ghi de: -e SPRING_PROFILES_ACTIVE=dev
ENV SPRING_PROFILES_ACTIVE=prod

# Cho JVM tu tinh heap theo memory limit cua container, thay vi dong cung -Xmx.
# Dong cung se tran khi container bi gioi han thap hon, va bo phi khi cao hon.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"

# Profile prod chay o 8080 (dev la 8090). EXPOSE chi mang tinh tai lieu,
# publish port that van phai lam luc docker run / trong compose.
EXPOSE 8080

# Dung "exec" de java thanh PID 1, nho vay nhan duoc SIGTERM khi docker stop
# va Spring Boot kip shutdown tu te thay vi bi giet cung.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/vivacon.jar"]
