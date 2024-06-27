package com.vivacon.service.recommendation;

import com.vivacon.dto.response.RecommendAccountResponse;

import java.util.Set;

public interface RecommendationService {
    Set<RecommendAccountResponse> getRecommendAccountToFollowByAccountId(long accountId);
}
