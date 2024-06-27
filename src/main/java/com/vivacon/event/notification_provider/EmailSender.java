package com.vivacon.event.notification_provider;

import com.vivacon.entity.Notification;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;

@Service
@Qualifier("emailSender")
public class EmailSender implements NotificationProvider {

    private Environment environment;
    private JavaMailSender mailSender;

    public EmailSender(Environment environment,
                       JavaMailSender javaMailSender) {
        this.environment = environment;
        this.mailSender = javaMailSender;
    }

    @Override
    public void sendNotification(Notification notification) {
        String toAddress = notification.getReceiver().getEmail();
        String fromAddress = environment.getProperty("vivacon.email.address");
        String senderName = "Vivacon Social Media Company";

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message);
        try {
            helper.setFrom(fromAddress, senderName);
            helper.setTo(toAddress);
            helper.setSubject(notification.getTitle());
            helper.setText(notification.getContent(), true);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException e) {
            e.printStackTrace();
        }
    }
}
