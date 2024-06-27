package com.vivacon.service;

import com.vivacon.dto.request.ConversationCreatingRequest;
import com.vivacon.dto.response.OutlineConversation;
import com.vivacon.dto.sorting_filtering.PageDTO;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ConversationService {
    OutlineConversation findById(long id);

    OutlineConversation addParticipant(long conversationId, String participantName);

    OutlineConversation create(ConversationCreatingRequest participants);

    Set<String> getAllParticipants(Set<String> participantUsernames);

    PageDTO<OutlineConversation> findAllByCurrentAccount(Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    List<Long> findAllIdByCurrentAccount();

    List<OutlineConversation> searchByKeyword(String keyword);

    OutlineConversation findByRecipientId(long id);
}
