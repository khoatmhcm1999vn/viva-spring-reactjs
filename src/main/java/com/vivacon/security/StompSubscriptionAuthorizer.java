package com.vivacon.security;

import com.vivacon.exception.UnauthorizedWebSocketException;
import com.vivacon.repository.ParticipantRepository;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.vivacon.common.constant.Constants.PREFIX_CONVERSATION_QUEUE_DESTINATION;
import static com.vivacon.common.constant.Constants.PREFIX_USER_QUEUE_DESTINATION;

/**
 * Kiem quyen khi client STOMP SUBSCRIBE mot destination.
 *
 * Truoc day WebSocketSecurityConfiguration cho moi message qua (permitAll) va khong
 * ai kiem tra SUBSCRIBE, trong khi tin nhan chat duoc phat len topic chung
 * /conversation/{id}/message voi id tang dan. Nghia la ket noi nao cung dang ky duoc
 * hoi thoai cua nguoi khac va nhan tin nhan rieng cua ho.
 *
 * Danh sach TRANG: chi cho cac dang ma frontend thuc su dung (hooks/useSocket.js),
 * moi destination khac deu bi tu choi.
 */
@Component
public class StompSubscriptionAuthorizer {

    private static final Pattern CONVERSATION_DESTINATION =
            Pattern.compile("^" + Pattern.quote(PREFIX_CONVERSATION_QUEUE_DESTINATION) + "(\\d{1,18})(/.*)?$");

    private static final Pattern USER_DESTINATION =
            Pattern.compile("^" + Pattern.quote(PREFIX_USER_QUEUE_DESTINATION) + "([^/]+)(/.*)?$");

    private static final String ONLINE_ACCOUNT_DESTINATION = "/topic/account/online";

    private ParticipantRepository participantRepository;

    public StompSubscriptionAuthorizer(ParticipantRepository participantRepository) {
        this.participantRepository = participantRepository;
    }

    /**
     * Nem UnauthorizedWebSocketException neu user khong duoc dang ky destination nay.
     *
     * @param user        user da xac thuc cua session STOMP
     * @param destination destination trong frame SUBSCRIBE
     */
    public void checkSubscription(UserDetailImpl user, String destination) {
        if (user == null || destination == null) {
            throw new UnauthorizedWebSocketException();
        }

        Matcher conversation = CONVERSATION_DESTINATION.matcher(destination);
        if (conversation.matches()) {
            long conversationId = Long.parseLong(conversation.group(1));
            participantRepository.findByConversationIdAndAccountId(conversationId, user.getAccountId())
                    .orElseThrow(UnauthorizedWebSocketException::new);
            return;
        }

        Matcher userDestination = USER_DESTINATION.matcher(destination);
        if (userDestination.matches()) {
            if (!userDestination.group(1).equalsIgnoreCase(user.getUsername())) {
                throw new UnauthorizedWebSocketException();
            }
            return;
        }

        if (ONLINE_ACCOUNT_DESTINATION.equals(destination)) {
            return;
        }

        throw new UnauthorizedWebSocketException();
    }
}
