package com.vivacon.repository;

import com.vivacon.entity.Account;
import com.vivacon.entity.Conversation;
import com.vivacon.entity.Participant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {

    @Query("select p.account from Participant p where p.conversation.id = :conversationId")
    List<Account> getParticipantsByConversationId(@Param("conversationId") long conversationId);

    @Query("select p.conversation from Participant p where p.conversation.id = :conversationId and p.account.id = :accountId")
    Optional<Conversation> findByConversationIdAndAccountId(@Param("conversationId") long conversationId, @Param("accountId") long accountId);

    @Query("SELECT p.conversation from Participant p WHERE p.account.username = :principalUsername order by p.conversation.lastModifiedAt desc")
    Page<Conversation> findAllConversationByPrincipalUsername(@Param("principalUsername") String principalUsername, Pageable pageable);

    @Query("SELECT p.conversation.id from Participant p WHERE p.account.username = :principalUsername order by p.conversation.lastModifiedAt desc")
    List<Long> findAllConversationIdByPrincipalUsername(@Param("principalUsername") String principalUsername);
}
