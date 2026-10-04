package com.vivacon.event.notification_provider;

import com.vivacon.common.utility.MicrosoftOAuth2TokenProvider;
import com.vivacon.entity.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Gui email qua Microsoft Graph API thay vi SMTP.
 *
 * Vi sao khong dung SMTP: basic auth da bi Microsoft chan (test truc tiep tra ve
 * 535 5.7.3), con SMTP + XOAUTH2 thi co nhieu bao cao that bai voi tai khoan
 * consumer outlook.com. Huong dan hien tai cua Microsoft cho Outlook cung la dung
 * Graph thay cho SMTP.
 *
 * Graph /me/sendMail gui tu chinh mailbox da xac thuc bang access token, nen o day
 * KHONG set truong "from". Nho vay tranh han loi ErrorSendAsDenied khi dia chi From
 * khong trung alias cua mailbox.
 */
@Service
@Qualifier("emailSender")
public class EmailSender implements NotificationProvider {

    private static final String SEND_MAIL_ENDPOINT = "https://graph.microsoft.com/v1.0/me/sendMail";

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    private MicrosoftOAuth2TokenProvider tokenProvider;

    private RestTemplate restTemplate;

    public EmailSender(MicrosoftOAuth2TokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public void sendNotification(Notification notification) {
        this.send(notification.getReceiver().getEmail(),
                notification.getTitle(),
                notification.getContent());
    }

    /**
     * Tach rieng khoi sendNotification de goi duoc voi dia chi bat ky, khong can
     * dung den entity Notification. Dung cho muc dich kiem thu cau hinh.
     *
     * @return true neu Graph nhan request thanh cong.
     */
    public boolean send(String toAddress, String subject, String htmlContent) {
        if (!tokenProvider.isConfigured()) {
            logger.warn("Bo qua gui email: chua cau hinh vivacon.email.oauth2.*. "
                    + "Can client-id, client-secret va refresh-token de lay access token cho Graph.");
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(tokenProvider.getAccessToken());

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(buildSendMailPayload(toAddress, subject, htmlContent), headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(SEND_MAIL_ENDPOINT, request, String.class);

            // Graph tra 202 Accepted khi nhan mail de gui.
            logger.info("Graph sendMail toi {} tra ve {}", toAddress, response.getStatusCodeValue());
            return response.getStatusCode().is2xxSuccessful();

        } catch (HttpStatusCodeException e) {
            // Body cua Graph chua ma loi cu the (vi du ErrorAccessDenied,
            // ErrorSendAsDenied, MailboxNotEnabledForRESTAPI) nen phai log ra.
            logger.error("Graph sendMail that bai, status {} body {}",
                    e.getRawStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (RuntimeException e) {
            logger.error("Khong gui duoc email qua Graph", e);
            return false;
        }
    }

    /**
     * Dung payload bang Map thay vi tao 4 lop DTO long nhau, vi day la cau truc
     * cua API ben ngoai chu khong phai contract cua he thong nay.
     */
    private Map<String, Object> buildSendMailPayload(String toAddress, String subject, String htmlContent) {
        Map<String, Object> body = new HashMap<>();
        body.put("contentType", "HTML");
        body.put("content", htmlContent);

        Map<String, Object> emailAddress = new HashMap<>();
        emailAddress.put("address", toAddress);

        Map<String, Object> recipient = new HashMap<>();
        recipient.put("emailAddress", emailAddress);

        List<Map<String, Object>> toRecipients = new ArrayList<>();
        toRecipients.add(recipient);

        Map<String, Object> message = new HashMap<>();
        message.put("subject", subject);
        message.put("body", body);
        message.put("toRecipients", toRecipients);

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", message);
        payload.put("saveToSentItems", Boolean.TRUE);
        return Collections.unmodifiableMap(payload);
    }
}
