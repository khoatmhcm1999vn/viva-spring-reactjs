package com.vivacon.dao;

import com.vivacon.entity.Conversation;

import java.util.List;

public interface ConversationDao {
    List<Conversation> checkConversationBetweenTwoAccount(long principalId, long findingAccountId);

    List<Conversation> searchConversationByName(long principalId, String keyword);
}
