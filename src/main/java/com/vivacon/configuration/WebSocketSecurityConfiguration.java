package com.vivacon.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketSecurityConfiguration extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    /**
     * This method is used to configured authorization manner for WebSocket requests.
     *
     * @param registry MessageSecurityMetadataSourceRegistry is used for configuration purpose
     */
    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry registry) {
        registry.anyMessage().permitAll();
    }

    /**
     * This override method is used for set the CORS mechanism for WebSocket requests
     *
     * @return boolean value
     */
    @Override
    protected boolean sameOriginDisabled() {
        return true;
    }
}