package com.vivacon.service.impl;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dao.ConversationDao;
import com.vivacon.dto.request.ConversationCreatingRequest;
import com.vivacon.dto.request.UsualTextMessage;
import com.vivacon.dto.response.OutlineConversation;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.Conversation;
import com.vivacon.entity.Participant;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.exception.UnauthorizedWebSocketException;
import com.vivacon.mapper.ConversationMapper;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.AccountRepository;
import com.vivacon.repository.ConversationRepository;
import com.vivacon.repository.ParticipantRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.ConversationService;
import com.vivacon.service.MessageService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static com.vivacon.common.constant.Constants.CONNECTED_NAME_TOKEN;

@Service
public class ConversationServiceImpl implements ConversationService {
    private ConversationRepository conversationRepository;
    private AccountRepository accountRepository;
    private ParticipantRepository participantRepository;
    private MessageService messageService;
    private ConversationDao conversationDao;
    private AccountService accountService;
    private ConversationMapper conversationMapper;

    public ConversationServiceImpl(ConversationRepository conversationRepository,
                                   AccountRepository accountRepository,
                                   ParticipantRepository participantRepository,
                                   MessageService messageService,
                                   AccountService accountService,
                                   ConversationDao conversationDao,
                                   ConversationMapper conversationMapper) {
        this.conversationRepository = conversationRepository;
        this.accountService = accountService;
        this.conversationMapper = conversationMapper;
        this.accountRepository = accountRepository;
        this.conversationDao = conversationDao;
        this.participantRepository = participantRepository;
        this.messageService = messageService;
    }

    @Override
    public OutlineConversation findById(long id) {
        Conversation conversation = conversationRepository.findById(id).orElseThrow(RecordNotFoundException::new);
        return conversationMapper.toOutlineConversation(conversation);
    }

    @Override
    public OutlineConversation addParticipant(long conversationId, String participantName) {
        checkAuthorizedConversation(conversationId);
        Conversation conversation = conversationRepository.findById(conversationId).orElseThrow(RecordNotFoundException::new);
        Account account = accountRepository.findByUsernameIgnoreCase(participantName).orElseThrow(RecordNotFoundException::new);
        Participant participant = participantRepository.save(new Participant(conversation, account));
        return conversationMapper.toOutlineConversation(conversation);
    }

    private boolean checkAuthorizedConversation(long conversationId){
        Account principal = accountService.getCurrentAccount();
        participantRepository.findByConversationIdAndAccountId(conversationId, principal.getId()).orElseThrow(UnauthorizedWebSocketException::new);
        return true;
    }

    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class,
            SQLException.class, RecordNotFoundException.class, Exception.class})
    @Override
    public OutlineConversation create(ConversationCreatingRequest conversationCreatingRequest) {
        Set<String> usernames = new TreeSet<>(conversationCreatingRequest.getUsernames());
        usernames = this.getAllParticipants(usernames);

        Set<Account> accounts = usernames.stream().map(
                        username -> accountRepository
                                .findByUsernameIgnoreCase(username)
                                .orElseThrow(RecordNotFoundException::new))
                .collect(Collectors.toSet());
        Set<String> fullnames = accounts.stream().map(account -> account.getFullName()).collect(Collectors.toSet());

        String conversationName = this.getConversationName(fullnames);
        Conversation savedConversation = conversationRepository.save(new Conversation(conversationName));
        accounts.forEach(account -> participantRepository.save(new Participant(savedConversation, account)));
        UsualTextMessage firstMessage = new UsualTextMessage(savedConversation.getId(), conversationCreatingRequest.getFirstMessageContent());
        messageService.save(firstMessage);

        return conversationMapper.toOutlineConversation(savedConversation);
    }

    /**
     * This function is used for creating a concrete name for the conversation based on the set of participant's names
     *
     * @param participants Set<String>
     * @return
     */
    private String getConversationName(Set<String> participants) {
        StringBuilder namingBuilder = new StringBuilder();
        participants.forEach(username -> namingBuilder.append(username).append(CONNECTED_NAME_TOKEN));
        namingBuilder.delete(namingBuilder.length() - CONNECTED_NAME_TOKEN.length(), namingBuilder.length());
        return namingBuilder.toString();
    }

    @Override
    public Set<String> getAllParticipants(Set<String> participantUsernames) {
        String principalUsername = accountService.getCurrentAccount().getUsername();
        if (!participantUsernames.contains(principalUsername)) {
            participantUsernames.add(principalUsername);
        }
        return participantUsernames;
    }

    @Override
    public PageDTO<OutlineConversation> findAllByCurrentAccount(Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Participant.class);
        Page<Conversation> conversations = participantRepository.findAllConversationByPrincipalUsername(accountService.getCurrentAccount().getUsername(), pageable);
        return PageMapper.toPageDTO(conversations, conversation -> conversationMapper.toOutlineConversation(conversation));
    }

    @Override
    public List<Long> findAllIdByCurrentAccount() {
        return participantRepository.findAllConversationIdByPrincipalUsername(accountService.getCurrentAccount().getUsername());
    }

    @Override
    public List<OutlineConversation> searchByKeyword(String keyword) {
        Long principalId = accountService.getCurrentAccount().getId();
        List<Conversation> conversations = conversationDao.searchConversationByName(principalId, keyword);
        return conversations.stream().map(conversation ->  conversationMapper.toOutlineConversation(conversation))
                .collect(Collectors.toList());
    }

    @Override
    public OutlineConversation findByRecipientId(long id) {
        List<Conversation> conversations = conversationDao.checkConversationBetweenTwoAccount(accountService.getCurrentAccount().getId(), id);
        if (conversations != null && conversations.size() == 1){
            return conversationMapper.toOutlineConversation(conversations.get(0));
        }
        throw new RecordNotFoundException("The request recipient id is not matched with any conversation between this recipient and the principal");
    }
}
