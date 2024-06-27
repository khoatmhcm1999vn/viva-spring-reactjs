package com.vivacon.mapper;

import com.vivacon.dto.response.EssentialAccount;
import com.vivacon.dto.response.OutlineConversation;
import com.vivacon.entity.Account;
import com.vivacon.entity.Conversation;
import com.vivacon.entity.Message;
import com.vivacon.repository.MessageRepository;
import com.vivacon.repository.ParticipantRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ConversationMapper {

    private ModelMapper mapper;
    private MessageMapper messageMapper;
    private AccountMapper accountMapper;
    private ParticipantRepository participantRepository;
    private MessageRepository messageRepository;

    public ConversationMapper(ModelMapper modelMapper,
                              MessageMapper messageMapper,
                              AccountMapper accountMapper,
                              MessageRepository messageRepository,
                              ParticipantRepository participantRepository) {
        this.mapper = modelMapper;
        this.accountMapper = accountMapper;
        this.messageMapper = messageMapper;
        this.messageRepository = messageRepository;
        this.participantRepository = participantRepository;
    }

    public OutlineConversation toOutlineConversation(Conversation conversation) {
        OutlineConversation outlineConversation = mapper.map(conversation, OutlineConversation.class);
        Optional<Message> latestMessage = messageRepository.findFirstByRecipientIdOrderByTimestampDesc(conversation.getId());
        if (latestMessage.isPresent()) {
            outlineConversation.setLatestMessage(messageMapper.toResponse(latestMessage.get()));
        }
        List<Account> accounts = participantRepository.getParticipantsByConversationId(conversation.getId());
        List<EssentialAccount> participants = accounts.stream()
                .map(account -> accountMapper.toEssentialAccount(account))
                .collect(Collectors.toList());
        outlineConversation.setParticipants(participants);
        return outlineConversation;
    }
}
