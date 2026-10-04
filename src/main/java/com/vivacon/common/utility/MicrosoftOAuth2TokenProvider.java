package com.vivacon.common.utility;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Doi refresh_token thanh access_token tren Microsoft identity platform, dung lam
 * Bearer token khi goi Microsoft Graph sendMail.
 *
 * Lop nay khong phu thuoc vao cach gui mail: truoc day cung chinh no cap token cho
 * SASL XOAUTH2 qua SMTP, chi can doi scope la dung duoc cho Graph.
 *
 * Vi sao phai dung refresh_token chu khong phai client_credentials:
 * tai khoan gui mail la personal Microsoft account (@outlook.com), khong nam trong
 * Exchange Online tenant. Microsoft chi cho phep luong app-only (client_credentials)
 * voi mailbox thuoc tenant, nen voi personal account bat buoc dung delegated flow.
 *
 * Access token song khoang 1 gio nen o day cache lai va chi goi lai endpoint khi
 * gan het han.
 */
@Component
public class MicrosoftOAuth2TokenProvider {

    private static final String TOKEN_ENDPOINT = "https://login.microsoftonline.com/%s/oauth2/v2.0/token";

    /**
     * Lay token moi som hon han thuc te mot chut de tranh truong hop token het han
     * ngay giua luc dang bat tay voi SMTP server.
     */
    private static final Duration EXPIRY_SAFETY_MARGIN = Duration.ofMinutes(5);

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    @Value("${vivacon.email.oauth2.client-id:}")
    private String clientId;

    @Value("${vivacon.email.oauth2.client-secret:}")
    private String clientSecret;

    @Value("${vivacon.email.oauth2.refresh-token:}")
    private String refreshToken;

    /**
     * 'consumers' cho personal Microsoft account. Neu sau nay chuyen sang mailbox
     * cua tenant thi doi thanh tenant id hoac 'organizations'.
     */
    @Value("${vivacon.email.oauth2.tenant:consumers}")
    private String tenant;

    /**
     * Scope cho Microsoft Graph sendMail. Truoc day dung
     * https://outlook.office.com/SMTP.Send cho SMTP + XOAUTH2, nhung da chuyen sang
     * Graph nen scope phai doi theo. offline_access la bat buoc de nhan refresh token.
     */
    @Value("${vivacon.email.oauth2.scope:https://graph.microsoft.com/Mail.Send offline_access}")
    private String scope;

    private RestTemplate restTemplate;

    private String cachedAccessToken;

    private Instant cachedTokenExpiresAt = Instant.EPOCH;

    public MicrosoftOAuth2TokenProvider() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * @return true khi da cau hinh du 3 gia tri bat buoc. Dung de EmailSender biet
     * co nen thu gui mail hay bo qua cho khoi nem exception moi lan co notification.
     */
    public boolean isConfigured() {
        return StringUtils.hasText(clientId)
                && StringUtils.hasText(clientSecret)
                && StringUtils.hasText(refreshToken);
    }

    public synchronized String getAccessToken() {
        if (StringUtils.hasText(cachedAccessToken) && Instant.now().isBefore(cachedTokenExpiresAt)) {
            return cachedAccessToken;
        }
        if (!isConfigured()) {
            throw new IllegalStateException("Chua cau hinh vivacon.email.oauth2.{client-id,client-secret,refresh-token}");
        }
        return requestNewAccessToken();
    }

    private String requestNewAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("refresh_token", refreshToken);
        form.add("grant_type", "refresh_token");
        form.add("scope", scope);

        String url = String.format(TOKEN_ENDPOINT, tenant);
        Map<String, Object> response = restTemplate
                .postForObject(url, new HttpEntity<>(form, headers), Map.class);

        if (response == null || response.get("access_token") == null) {
            throw new IllegalStateException("Microsoft khong tra ve access_token");
        }

        this.cachedAccessToken = (String) response.get("access_token");

        long expiresInSeconds = response.get("expires_in") == null
                ? 3600L
                : Long.parseLong(String.valueOf(response.get("expires_in")));
        this.cachedTokenExpiresAt = Instant.now()
                .plusSeconds(expiresInSeconds)
                .minus(EXPIRY_SAFETY_MARGIN);

        logger.info("Da lay access token moi cho SMTP, het han sau {} giay", expiresInSeconds);
        return this.cachedAccessToken;
    }
}
