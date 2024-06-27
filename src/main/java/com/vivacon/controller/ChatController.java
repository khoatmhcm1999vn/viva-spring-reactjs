package com.vivacon.controller;

import com.vivacon.dto.request.AddParticipantMessage;
import com.vivacon.dto.request.ConversationCreatingRequest;
import com.vivacon.dto.request.NewParticipantMessage;
import com.vivacon.dto.request.TypingMessage;
import com.vivacon.dto.request.UsualTextMessage;
import com.vivacon.dto.response.EssentialAccount;
import com.vivacon.dto.response.MessageResponse;
import com.vivacon.dto.response.OutlineConversation;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.AccountService;
import com.vivacon.service.ConversationService;
import com.vivacon.service.MessageService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;

import static com.vivacon.common.constant.Constants.API_V1;
import static com.vivacon.common.constant.Constants.PREFIX_CONVERSATION_QUEUE_DESTINATION;
import static com.vivacon.common.constant.Constants.PREFIX_USER_QUEUE_DESTINATION;
import static com.vivacon.common.constant.Constants.SUFFIX_CONVERSATION_QUEUE_DESTINATION;
import static com.vivacon.common.constant.Constants.SUFFIX_USER_QUEUE_NEW_CONVERSATION_DESTINATION;

@RestController
@Api(value = "Chatting endpoints")
@RequestMapping(API_V1)
public class ChatController {
    private SimpMessagingTemplate messagingTemplate;
    private MessageService messageService;
    private ConversationService conversationService;
    private AccountService accountService;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          MessageService messageService,
                          ConversationService conversationService,
                          AccountService accountService) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
        this.conversationService = conversationService;
        this.accountService = accountService;
    }

    /**
     * This function is used to process chat message from current user to a conversation which he has involved,
     * it will save that valid message to database and publish that message to right the conversation channel
     *
     * @param messageRequest ChatMessageRequestBody
     */
    @MessageMapping("/chat")
    public void processChatMessage(@Payload @Valid UsualTextMessage messageRequest) {
        MessageResponse messageResponse = messageService.save(messageRequest);
        String path = PREFIX_CONVERSATION_QUEUE_DESTINATION +
                messageRequest.getConversationId() +
                SUFFIX_CONVERSATION_QUEUE_DESTINATION;
        messagingTemplate.convertAndSend(path, messageResponse);
    }

    /**
     * This function is used to create a new conversation based on the request from client which includes list of participant
     * in this expected conversation
     *
     * @param conversationCreatingRequest Participants
     */
    @MessageMapping("/conversation")
    public void processCreatingConversation(@Payload @Valid ConversationCreatingRequest conversationCreatingRequest) {
        OutlineConversation outlineConversation = conversationService.create(conversationCreatingRequest);
        Set<String> participantUsernames = new TreeSet<>(conversationCreatingRequest.getUsernames());
        participantUsernames = conversationService.getAllParticipants(participantUsernames);
        for (String username : participantUsernames) {
            String path = PREFIX_USER_QUEUE_DESTINATION + username + SUFFIX_USER_QUEUE_NEW_CONVERSATION_DESTINATION;
            messagingTemplate.convertAndSend(path, outlineConversation);
        }
    }

    @MessageMapping("/conversation/account/add")
    public void processAddNewParticipant(@Payload @Valid AddParticipantMessage messageRequest) {
        OutlineConversation outlineConversation = conversationService.addParticipant(messageRequest.getConversationId(), messageRequest.getUsername());

        String newConversationPerUserPath = PREFIX_USER_QUEUE_DESTINATION + messageRequest.getUsername() +
                SUFFIX_USER_QUEUE_NEW_CONVERSATION_DESTINATION;
        messagingTemplate.convertAndSend(newConversationPerUserPath, outlineConversation);

        String newParticipantMessagePerConversationPath = PREFIX_CONVERSATION_QUEUE_DESTINATION + messageRequest.getConversationId() +
                SUFFIX_CONVERSATION_QUEUE_DESTINATION;
        NewParticipantMessage newParticipantMessage = new NewParticipantMessage();
        MessageResponse messageResponse = messageService.save(newParticipantMessage);
        messagingTemplate.convertAndSend(newParticipantMessagePerConversationPath, messageResponse);
    }

    @MessageMapping("/conversation/typing")
    public void processIdentifyWhoTyping(@Payload @Valid TypingMessage typingMessage) {
        MessageResponse messageResponse = messageService.processTypingMessage(typingMessage);
        String path = PREFIX_CONVERSATION_QUEUE_DESTINATION + typingMessage.getConversationId() +
                SUFFIX_CONVERSATION_QUEUE_DESTINATION;
        messagingTemplate.convertAndSend(path, messageResponse);
    }

    /**
     * This function is used to find all conversation of the current user
     *
     * @return PageDTO<ConversationResponse>
     */
    @ApiOperation(value = "Get all conversation of current user in each page")
    @GetMapping("/conversation")
    public PageDTO<OutlineConversation> findConversationsOfCurrentUser(
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return conversationService.findAllByCurrentAccount(Optional.empty(), Optional.empty(), pageSize, pageIndex);
    }

    /**
     * This function is used to find all conversation id of the current user
     *
     * @return PageDTO<ConversationResponse>
     */
    @ApiOperation(value = "Get all conversation id of current user")
    @GetMapping("/conversation/id")
    public List<Long> findConversationsOfCurrentUser() {
        return conversationService.findAllIdByCurrentAccount();
    }

    /**
     * This function is used to find all message in a specific conversation
     *
     * @param conversationId Long
     * @return PageDTO<MessageResponse>
     */
    @ApiOperation(value = "Get all messages in a specific conversation")
    @GetMapping("/conversation/{id}/message")
    public PageDTO<MessageResponse> findMessagesInAConversation(
            @PathVariable(value = "id") Long conversationId,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return messageService.findAllByConversationId(conversationId, order, sort, pageSize, pageIndex);
    }

    /**
     * This function is used for checking if a conversation is existed between the current user and the request recipient
     *
     * @param recipientId long
     * @return ConversationResponse
     */
    @ApiOperation(value = "Check the expected conversation between these two sender and recipient is exist or not")
    @GetMapping("/conversation/check/{recipientId}")
    public OutlineConversation findConversationBasedOnRecipientId(
            @PathVariable("recipientId") long recipientId) {
        return conversationService.findByRecipientId(recipientId);
    }

    @ApiOperation(value = "Search all conversations based on the keyword which will be compare with the conversation name, participant's username or participant's fullName")
    @GetMapping("/conversation/search")
    public List<OutlineConversation> searchConversationByKeyword(
            @RequestParam(value = "keyword") String keyword) {
        return conversationService.searchByKeyword(keyword);
    }

    /**
     * This function is used for searching account by username or full name
     *
     * @param name
     * @param order
     * @param sort
     * @param pageSize
     * @param pageIndex
     * @return
     */
    @ApiOperation(value = "Searching account by username or fullName")
    @GetMapping("/account/search")
    public PageDTO<EssentialAccount> findAccountBasedOnUsernameOrFullName(
            @RequestParam("keyword") String name,
            @RequestParam(value = "_order", required = false) Optional<String> order,
            @RequestParam(value = "_sort", required = false) Optional<String> sort,
            @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
            @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return accountService.findByName(name, order, sort, pageSize, pageIndex);
    }
}
