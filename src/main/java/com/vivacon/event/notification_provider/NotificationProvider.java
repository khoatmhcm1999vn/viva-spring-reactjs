package com.vivacon.event.notification_provider;

import com.vivacon.entity.Notification;

public interface NotificationProvider {

    void sendNotification(Notification notification);
}
