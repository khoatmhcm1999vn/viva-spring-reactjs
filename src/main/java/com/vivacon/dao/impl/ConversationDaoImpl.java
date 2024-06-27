package com.vivacon.dao.impl;

import com.vivacon.dao.ConversationDao;
import com.vivacon.entity.Conversation;
import org.springframework.stereotype.Component;

import javax.persistence.EntityManager;
import javax.persistence.ParameterMode;
import javax.persistence.StoredProcedureQuery;
import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class ConversationDaoImpl implements ConversationDao {
    private EntityManager entityManager;

    public ConversationDaoImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public List<Conversation> checkConversationBetweenTwoAccount(long principalId, long findingAccountId) {
        StoredProcedureQuery procedureQuery;
        procedureQuery = entityManager.createStoredProcedureQuery("checkConversationBetweenTwoAccount");

        procedureQuery.registerStoredProcedureParameter("first_participant_id", Long.class, ParameterMode.IN);
        procedureQuery.setParameter("first_participant_id", principalId);

        procedureQuery.registerStoredProcedureParameter("second_participant_id", Long.class, ParameterMode.IN);
        procedureQuery.setParameter("second_participant_id", findingAccountId);
        return this.getConversationFromResultSet(procedureQuery);
    }

    @Override
    public List<Conversation> searchConversationByName(long principalId, String keyword) {
        StoredProcedureQuery procedureQuery;
        procedureQuery = entityManager.createStoredProcedureQuery("searchConversationByName");

        procedureQuery.registerStoredProcedureParameter("principalId", Long.class, ParameterMode.IN);
        procedureQuery.setParameter("principalId", principalId);

        procedureQuery.registerStoredProcedureParameter("keyword", String.class, ParameterMode.IN);
        procedureQuery.setParameter("keyword", "%" + keyword.toLowerCase(Locale.ROOT) + "%");

        return this.getConversationFromResultSet(procedureQuery);
    }

    private List<Conversation> getConversationFromResultSet(StoredProcedureQuery procedureQuery) {
        List<Conversation> postsQuantityList = new ArrayList<>();
        if (procedureQuery.execute()) {
            List<Object[]> resultList = procedureQuery.getResultList();
            for (int currentIndex = 0; currentIndex < resultList.size(); currentIndex++) {
                Object[] result = resultList.get(currentIndex);
                BigInteger id = (BigInteger) result[0];
                String name = (String) result[1];
                LocalDateTime createdAt = ((Timestamp) result[2]).toLocalDateTime();
                postsQuantityList.add(new Conversation(id.longValue(), name, createdAt));
            }
            return postsQuantityList;
        } else {
            return new ArrayList<>();
        }
    }
}