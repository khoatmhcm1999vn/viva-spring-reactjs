package com.vivacon.service;

import com.vivacon.dto.request.NewParticipantMessage;
import com.vivacon.dto.request.TypingMessage;
import com.vivacon.dto.response.MessageResponse;
import com.vivacon.dto.request.UsualTextMessage;
import com.vivacon.dto.sorting_filtering.PageDTO;

import java.util.Optional;

public interface MessageService {

    PageDTO<MessageResponse> findAllByConversationId(Long conversationId, Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);
    MessageResponse save(UsualTextMessage messageRequest);
    MessageResponse save(NewParticipantMessage newParticipantMessage);
    MessageResponse processTypingMessage(TypingMessage typingMessage);
}
