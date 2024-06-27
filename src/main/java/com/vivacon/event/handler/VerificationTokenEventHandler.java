package com.vivacon.event.handler;

import com.vivacon.entity.Account;
import com.vivacon.entity.Notification;
import com.vivacon.entity.Setting;
import com.vivacon.entity.enum_type.SettingType;
import com.vivacon.event.GeneratingVerificationTokenEvent;
import com.vivacon.event.NewDeviceLocationLoginEvent;
import com.vivacon.event.RegistrationCompleteEvent;
import com.vivacon.event.StillNotActiveAccountLoginEvent;
import com.vivacon.event.notification_provider.NotificationProvider;
import com.vivacon.repository.AccountRepository;
import com.vivacon.repository.SettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class VerificationTokenEventHandler {

    private Logger logger = LoggerFactory.getLogger(this.getClass());
    private Environment environment;

    @Qualifier("emailSender")
    private NotificationProvider emailSender;

    private AccountRepository accountRepository;

    private SettingRepository settingRepository;

    private int verifiedTokenExpirationInMiliseconds;

    private Random random = new Random();

    public VerificationTokenEventHandler(NotificationProvider emailSender,
                                         AccountRepository accountRepository,
                                         SettingRepository settingRepository,
                                         Environment environment) {
        this.emailSender = emailSender;
        this.accountRepository = accountRepository;
        this.settingRepository = settingRepository;
        this.environment = environment;
    }

    @PostConstruct
    private void operatePostConstruction() {
        this.verifiedTokenExpirationInMiliseconds = Integer.valueOf(environment.getProperty("vivacon.verification_token.expiration"));
    }

    @Async
    @EventListener
    public void handleUserRegistration(RegistrationCompleteEvent userRegistrationEvent) {
        Account account = userRegistrationEvent.getAccount();
        saveDefaultSettingsForNewAccount(account);
        sendEmailOnUserRegistrationComplete(account);
    }

    private List<Setting> saveDefaultSettingsForNewAccount(Account account) {
        List<Setting> settings = new ArrayList<>();
        SettingType[] settingTypes = SettingType.class.getEnumConstants();
        for (SettingType type : settingTypes) {
            settings.add(new Setting(account, type, type.getDefaultValue()));
        }
        return settingRepository.saveAllAndFlush(settings);
    }

    private void sendEmailOnUserRegistrationComplete(Account account) {
        String code = generateVerificationCodePerUsername(account);
        Integer expirationInMinutes = verifiedTokenExpirationInMiliseconds / 60000;

        String subject = "Vivacon - Please verify your registration";
        String content = "Dear [[name]],<br/>"
                + "Please use the code below to verify your registration and activate your account :<br/>"
                + "<h3>[[code]]</h3><br/>"
                + "Please notice that your code is unique and only take effect in <strong> [[expirationTime]] minutes</strong><br/>"
                + "Thank you,<br/>"
                + "Vivacon Service.";
        content = content.replace("[[name]]", account.getFullName());
        content = content.replace("[[code]]", code);
        content = content.replace("[[expirationTime]]", String.valueOf(expirationInMinutes));

        Notification notification = new Notification(subject, content, account);
        emailSender.sendNotification(notification);
    }

    @Async
    @EventListener
    public void handleGeneratingNewVerificationToken(GeneratingVerificationTokenEvent generatingVerificationTokenEvent) {
        Account account = generatingVerificationTokenEvent.getAccount();
        String code = generateVerificationCodePerUsername(account);
        Integer expirationInMinutes = verifiedTokenExpirationInMiliseconds / 60000;

        String subject = "Vivacon - Your verification token";
        String content = "Dear [[name]],<br/>"
                + "Please use the code below to verify your account:<br/>"
                + "<h3>[[code]]</h3><br/>"
                + "Please notice that your code is unique and only take effect in <strong> [[expirationTime]] minutes</strong><br/>"
                + "Thank you,<br/>"
                + "Vivacon Service.";
        content = content.replace("[[name]]", account.getFullName());
        content = content.replace("[[code]]", code);
        content = content.replace("[[expirationTime]]", String.valueOf(expirationInMinutes));

        Notification notification = new Notification(subject, content, account);
        emailSender.sendNotification(notification);
    }

    @Async
    @EventListener
    public void handleStillNotActiveAccountLoginEvent(StillNotActiveAccountLoginEvent stillNotActiveAccountLoginEvent) {
        Account account = stillNotActiveAccountLoginEvent.getAccount();
        String code = generateVerificationCodePerUsername(account);
        Integer expirationInMinutes = verifiedTokenExpirationInMiliseconds / 60000;

        String subject = "Vivacon - Your account still not be activated, please activate it to go further";
        String content = "Dear [[name]],<br/>"
                + "Please use the code below to verify and active your new account to continue the login process and explore Vivacon world with us:<br/>"
                + "<h3>[[code]]</h3><br/>"
                + "Please notice that your code is unique and only take effect in <strong> [[expirationTime]] minutes</strong><br/>"
                + "Thank you,<br/>"
                + "Vivacon Service.";
        content = content.replace("[[name]]", account.getFullName());
        content = content.replace("[[code]]", code);
        content = content.replace("[[expirationTime]]", String.valueOf(expirationInMinutes));

        Notification notification = new Notification(subject, content, account);
        emailSender.sendNotification(notification);
    }

    @Async
    @EventListener
    public void handleNewDeviceLocationLoginEvent(NewDeviceLocationLoginEvent event) {
        Account account = event.getAccount();
        String code = generateVerificationCodePerUsername(account);
        Integer expirationInMinutes = verifiedTokenExpirationInMiliseconds / 60000;

        String subject = "Vivacon - We found a abnormal login activity on your account !";
        String content = "Dear [[name]],<br/>"
                + "We found a abnormal login activity at :<br/>"
                + "IP address : [[ip]]<br/>"
                + "Device : [[device]]<br/>"
                + "Location : Country [[country]] - City [[city]]<br/>"
                + "Coordination : Latitude [[latitude]] - Longitude [[longitude]]<br/><br/>"
                + "We prevent this abnormal login activity to protect your account <br/>"
                + "Please take attention on this: "
                + "- If it is actually you, you can verify to go further on the login process via the below code <br/>"
                + "<h3>[[code]]</h3><br/>"
                + "Please notice that your code is unique and only take effect in <strong> [[expirationTime]] minutes</strong><br/><br/>"
                + "- If it not you. You still be safe, but not share this above verification code to anyone else. <br/>"
                + " We also suggest you should check on your Device - Location wizard tab on your settings in our platform to remove abnormal and unused device <br/>"
                + "Thanks you !";

//        String content = "Dear [[name]],<br/>"
//                + "- If it is actually you, you can verify to go further on the login process via the below code <br/>"
//                + "<h3>[[code]]</h3><br/>"
//                + "Please notice that your code is unique and only take effect in <strong> [[expirationTime]] minutes</strong><br/><br/>"
//                + "- If it not you. You still be safe, but not share this above verification code to anyone else. <br/>"
//                + " We also suggest you should check on your Device - Location wizard tab on your settings in our platform to remove abnormal and unused device <br/>"
//                + "Thanks you !";

        content = content.replace("[[name]]", account.getFullName());
        content = content.replace("[[ip]]", event.getIp());
        content = content.replace("[[device]]", event.getDevice());
        content = content.replace("[[country]]", event.getLocation().getCountry().getName());
        content = content.replace("[[city]]", event.getLocation().getLocation().getTimeZone());
        content = content.replace("[[latitude]]", event.getLocation().getLocation().getLatitude().toString());
        content = content.replace("[[longitude]]", event.getLocation().getLocation().getLongitude().toString());
        content = content.replace("[[code]]", code);
        content = content.replace("[[expirationTime]]", String.valueOf(expirationInMinutes));


//        content = content.replace("[[name]]", account.getFullName());
//        content = content.replace("[[code]]", code);
//        content = content.replace("[[expirationTime]]", String.valueOf(expirationInMinutes));

        Notification notification = new Notification(subject, content, account);
        logger.info(content);
        emailSender.sendNotification(notification);
    }


    private String generateVerificationCodePerUsername(Account account) {
        int number = random.nextInt(999999);
        String code = String.format("%06d", number);

        account.setVerificationToken(code);
        account.setVerificationExpiredDate(Instant.now().plusMillis(verifiedTokenExpirationInMiliseconds));
        accountRepository.saveAndFlush(account);
        return code;
    }
}
