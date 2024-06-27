package com.vivacon.event.handler;

import com.vivacon.common.enum_type.RoleType;
import com.vivacon.common.utility.JwtUtils;
import com.vivacon.entity.enum_type.SettingType;
import com.vivacon.service.ActiveSessionManager;
import com.vivacon.service.SettingService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.Set;

import static com.vivacon.common.constant.Constants.STOMP_AUTHORIZATION_HEADER;

@Component
public class WebSocketSessionEventHandler implements ActiveSessionChangingListener {

    private SettingService settingService;
    private SimpMessagingTemplate messagingTemplate;
    private ActiveSessionManager activeSessionManager;
    private JwtUtils jwtUtils;

    public WebSocketSessionEventHandler(SimpMessagingTemplate messagingTemplate,
                                        SettingService settingService,
                                        ActiveSessionManager activeSessionManager,
                                        JwtUtils jwtUtils) {
        this.messagingTemplate = messagingTemplate;
        this.settingService = settingService;
        this.activeSessionManager = activeSessionManager;
        this.jwtUtils = jwtUtils;
    }

    /**
     * This method is used for registering this bean as a handler for ActiveSessionChanging event
     * after it has been created
     */
    @PostConstruct
    public void postConstructBean() {
        activeSessionManager.registerListener(this);
    }

    /**
     * This method is used for removing this bean whose role as a handler for ActiveSessionChanging event
     * before it is almost destroyed
     */
    @PreDestroy
    public void beforeDestroyBean() {
        activeSessionManager.removeListener(this);
    }

    /**
     * This method select username and ip address when a client try to establish a STOMP connection
     * to keep knowing who is currently online in our system via an IActiveSessionManager implementation
     *
     * @param event SessionConnectEvent
     */
    @EventListener
    public void handleSessionConnected(SessionConnectEvent event) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String token = accessor.getFirstNativeHeader(STOMP_AUTHORIZATION_HEADER);
        String username = jwtUtils.getUsername(token);

        if (jwtUtils.getRole(token).equals(RoleType.USER.toString())) {
            Long loggedAccountId = jwtUtils.getAccountId(token);
            Boolean isSetActiveStatus = (Boolean) settingService.evaluateSetting(loggedAccountId, SettingType.PRIVACY_ON_ACTIVE_STATUS);
            if (isSetActiveStatus) {
                String sessionId = accessor.getSessionId();
                activeSessionManager.addSession(sessionId, username);
            }
        }
    }

    /**
     * This method select username and ip address when a client try to establish a STOMP connection
     * to keep knowing who is currently online in our system via an IActiveSessionManager implementation
     *
     * @param event SessionDisconnectEvent
     */
    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        activeSessionManager.removeSessionBySessionId(sessionId);
    }

    /**
     * This method is used to handle any ActiveSessionChanging event which in more detail will send a set of online usernames to the public channel named /topic/active
     * for every client can consume.
     */
    @Override
    public void notifyActiveSessionChanging() {
        Set<String> activeUsers = activeSessionManager.getAll();
        messagingTemplate.convertAndSend("/topic/account/online", activeUsers);
    }
}
