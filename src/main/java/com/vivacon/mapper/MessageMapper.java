package com.vivacon.mapper;

import com.vivacon.dto.request.NewParticipantMessage;
import com.vivacon.dto.request.UsualTextMessage;
import com.vivacon.dto.response.EssentialAccount;
import com.vivacon.dto.response.MessageResponse;
import com.vivacon.entity.Account;
import com.vivacon.entity.Conversation;
import com.vivacon.entity.Message;
import com.vivacon.entity.enum_type.MessageStatus;
import com.vivacon.entity.enum_type.MessageType;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.repository.ConversationRepository;
import com.vivacon.service.AccountService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class MessageMapper {
    private ModelMapper mapper;

    private AccountMapper accountMapper;

    private AccountService accountService;

    private ConversationRepository conversationRepository;

    public MessageMapper(ModelMapper modelMapper,
                         AccountMapper accountMapper,
                         AccountService accountService,
                         ConversationRepository conversationRepository) {
        this.mapper = modelMapper;
        this.accountService = accountService;
        this.accountMapper = accountMapper;
        this.conversationRepository = conversationRepository;
    }

    public MessageResponse toResponse(Message message) {
        MessageResponse messageResponse = mapper.map(message, MessageResponse.class);

        EssentialAccount sender = accountMapper.toEssentialAccount(message.getSender());
        messageResponse.setSender(sender);
        messageResponse.setConversationId(message.getRecipient().getId());
        return messageResponse;
    }

    public Message toEntity(UsualTextMessage messageRequest) {
        Account sender = accountService.getCurrentAccount();
        Conversation recipient = conversationRepository
                .findById(messageRequest.getConversationId())
                .orElseThrow(RecordNotFoundException::new);
        return new Message(sender, recipient, messageRequest.getContent(), LocalDateTime.now(), MessageStatus.SENT, MessageType.USUAL_TEXT);
    }

    public Message toEntity(NewParticipantMessage newParticipantMessage) {
        Account sender = accountService.getCurrentAccount();
        Conversation recipient = conversationRepository
                .findById(newParticipantMessage.getConversationId())
                .orElseThrow(RecordNotFoundException::new);
        Account newParticipant = accountService.getAccountByUsernameIgnoreCase(newParticipantMessage.getUsername());
        String messageContent = newParticipant.getFullName() + " (" + newParticipant.getUsername() + ") has joined to the conversation";
        return new Message(sender, recipient, messageContent, LocalDateTime.now(), MessageStatus.SENT, MessageType.NEW_PARTICIPANT);
    }
}
