package com.vivacon.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vivacon.common.utility.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.converter.DefaultContentTypeResolver;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.MimeTypeUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

import static com.vivacon.common.constant.Constants.FE_URL;
import static com.vivacon.common.constant.Constants.STOMP_AUTHORIZATION_HEADER;

@Configuration
@EnableWebSocketMessageBroker
public class STOMPMessageBrokerConfiguration implements WebSocketMessageBrokerConfigurer {

    private UserDetailsService userDetailService;

    private JwtUtils jwtUtils;

    @Autowired
    public STOMPMessageBrokerConfiguration(UserDetailsService userDetailService, JwtUtils jwtUtils) {
        this.userDetailService = userDetailService;
        this.jwtUtils = jwtUtils;
    }

    /**
     * This method is used for register brokers endpoints
     *
     * @param registry MessageBrokerRegistry is used for configuration purpose.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/conversation", "/user", "/topic");
        registry.setUserDestinationPrefix("/user");
        registry.setApplicationDestinationPrefixes("/app");
    }

    /**
     * This method is used for register connection endpoint for STOMP
     *
     * @param registry StompEndpointRegistry is used for configuration purpose.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(FE_URL)
                .withSockJS();
    }

    /**
     * This method is used for configure a message converter to convert a java object and can be used when we publish objects to broker endpoints
     *
     * @param messageConverters List<MessageConverter> list of converter which has been configured
     * @return boolean value - stand for is used message converter or not
     */
    @Override
    public boolean configureMessageConverters(List<MessageConverter> messageConverters) {
        DefaultContentTypeResolver resolver = new DefaultContentTypeResolver();
        resolver.setDefaultMimeType(MimeTypeUtils.APPLICATION_JSON);
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        converter.setObjectMapper(mapper);
        converter.setContentTypeResolver(resolver);
        messageConverters.add(converter);
        return true;
    }

    /**
     * This method is used for configure a message converter to convert a java object and can be used when we publish objects to broker endpoints
     *
     * @param registration ChannelRegistration
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        ChannelInterceptor channelInterceptor = new CustomInterceptor();
        registration.interceptors(channelInterceptor);
    }

    /**
     * This nested class which is used only for declaring a custom interceptor when communicating using STOMP protocol
     */
    @Order(Ordered.HIGHEST_PRECEDENCE)
    private class CustomInterceptor implements ChannelInterceptor {

        /**
         * This method is used for handle what happen before we receive a request by STOMP protocol
         *
         * @param message Message
         * @param channel MessageChannel
         * @return a Message
         */
        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (!ObjectUtils.isEmpty(accessor)) {
                List<String> tokenList = accessor.getNativeHeader(STOMP_AUTHORIZATION_HEADER);
                if (tokenList != null && !tokenList.isEmpty()) {
                    String token = tokenList.get(0);
                    UserDetails userDetails = userDetailService.loadUserByUsername(jwtUtils.getUsername(token));
                    UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    accessor.setUser(usernamePasswordAuthenticationToken);
                    SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                }
            }
            return message;
        }
    }
}

