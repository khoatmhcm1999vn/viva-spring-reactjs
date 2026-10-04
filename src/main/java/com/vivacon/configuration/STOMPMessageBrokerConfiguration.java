package com.vivacon.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.vivacon.common.utility.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

import static com.vivacon.common.constant.Constants.STOMP_AUTHORIZATION_HEADER;

@Configuration
@EnableWebSocketMessageBroker
public class STOMPMessageBrokerConfiguration implements WebSocketMessageBrokerConfigurer {

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    private UserDetailsService userDetailService;

    private JwtUtils jwtUtils;

    /**
     * Cac origin duoc phep bat tay SockJS, phan cach bang dau phay.
     *
     * Truoc day gia tri nay lay tu Constants.FE_URL dong cung "http://localhost:3000",
     * nen phuc vu frontend tu bat ky origin khac deu bi tu choi. Da do thuc te:
     * goi /ws/info voi Origin la localhost:3000 tra 200, con localhost:8081 hay mot
     * domain that tra 403. Hau qua la chat va notification chet IM LANG - trang van
     * tai binh thuong, chi rieng socket khong bao gio ket noi.
     */
    private String[] allowedOrigins;

    @Autowired
    public STOMPMessageBrokerConfiguration(UserDetailsService userDetailService,
                                           JwtUtils jwtUtils,
                                           @Value("${vivacon.frontend.allowed-origins:}") String[] allowedOrigins) {
        this.userDetailService = userDetailService;
        this.jwtUtils = jwtUtils;
        this.allowedOrigins = allowedOrigins;
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
        if (allowedOrigins == null || allowedOrigins.length == 0) {
            // Khong nem exception vi nhu vay app khong boot duoc, nhung phai noi to:
            // de trong thi moi bat tay SockJS deu bi tu choi, va kieu loi nay rat kho
            // doan vi trang web van chay, chi rieng realtime la im.
            logger.warn("vivacon.frontend.allowed-origins dang TRONG: moi ket noi "
                    + "WebSocket se bi tu choi, chat va notification se khong hoat dong.");
        } else {
            logger.info("WebSocket chap nhan origin: {}", String.join(", ", allowedOrigins));
        }

        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins)
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

