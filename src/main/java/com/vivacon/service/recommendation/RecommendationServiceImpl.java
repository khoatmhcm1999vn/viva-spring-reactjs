package com.vivacon.service.recommendation;

import com.vivacon.dao.UserDAO;
import com.vivacon.dto.response.RecommendAccountResponse;
import com.vivacon.entity.Account;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.AccountMapper;
import com.vivacon.repository.AccountRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedMap;
import java.util.StringTokenizer;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RecommendationServiceImpl implements RecommendationService {

    private UserDAO userDAO;
    private AccountRepository accountRepository;
    private AccountMapper accountMapper;
    private List<AccountRelationship> accountRelationships = new LinkedList<>();
    private static Map<Long, List<RecommendAccount>> recommendAccountsPerAccount = new ConcurrentHashMap<>();

    public RecommendationServiceImpl(UserDAO userDAO,
                                     AccountMapper accountMapper,
                                     AccountRepository accountRepository) {
        this.userDAO = userDAO;
        this.accountRepository = accountRepository;
        this.accountMapper = accountMapper;
    }

    @Override
    public Set<RecommendAccountResponse> getRecommendAccountToFollowByAccountId(long accountId) {

        if (recommendAccountsPerAccount == null || recommendAccountsPerAccount.isEmpty()) {
            performRecommendationProcessing();
        }

        List<RecommendAccount> recommendAccounts = RecommendationServiceImpl.recommendAccountsPerAccount.get(accountId);
        Set<RecommendAccountResponse> recommendAccountResponses = recommendAccounts.stream()
                .map(recommendAccount -> {
                    Account account = accountRepository.findById(recommendAccount.accountId).orElseThrow(RecordNotFoundException::new);
                    return accountMapper.toRecommendAccountResponse(account, recommendAccount.mutualFriends);
                })
                .filter(recommendAccountResponse -> recommendAccountResponse.getIsFollowing() == false)
                .collect(Collectors.toSet());

        if (recommendAccounts.size() < 6) {
            int accountsAmountNeedToFill = 6 - recommendAccounts.size();
            Set<RecommendAccountResponse> recommendMostFollowerAccounts = userDAO.getTheTopAccountMostFollowerStatistic(accountsAmountNeedToFill)
                    .stream().map(userAccountMostFollower -> {
                        Account account = accountRepository.findById(userAccountMostFollower.getId().longValue())
                                .orElseThrow(RecordNotFoundException::new);
                        return accountMapper.toRecommendAccountResponse(account, new ArrayList<>());
                    })
                    .filter(recommendAccountResponse -> recommendAccountResponse.getIsFollowing() == false)
                    .collect(Collectors.toSet());
            recommendAccountResponses.addAll(recommendMostFollowerAccounts);
        }

        return recommendAccountResponses;
    }

    @Scheduled(fixedDelay = 1000 * 60 * 5, initialDelay = 1000 * 60 * 0)
    public void performRecommendationProcessing() {
        String value = userDAO.getFollowersPerAccount();
        String lines[] = value.split("\t");
        for (String line : lines) {
            map(line);
        }

        HashMap<Long, List<MutualFriendPerAccount>> hashMap = new HashMap<>();
        for (AccountRelationship accountRelationship : accountRelationships) {
            if (!hashMap.containsKey(accountRelationship.account)) {
                List<MutualFriendPerAccount> list = new ArrayList<>();
                list.add(accountRelationship.mutualFriendPerAccount);
                hashMap.put(accountRelationship.account, list);
            } else {
                hashMap.get(accountRelationship.account).add(accountRelationship.mutualFriendPerAccount);
            }
        }

        recommendAccountsPerAccount.clear();
        for (Map.Entry<Long, List<MutualFriendPerAccount>> entry : hashMap.entrySet()) {
            List<RecommendAccount> recommendAccount = reduce(entry.getValue());
            recommendAccountsPerAccount.put(entry.getKey(), recommendAccount);
        }
    }

    private void map(String eachLine) {
        String[] line = eachLine.split(" ");
        Long fromUser = Long.parseLong(line[0]);
        List<Long> toUsers = new ArrayList<>();

        if (line.length == 2) {
            StringTokenizer tokenizer = new StringTokenizer(line[1], ",");
            while (tokenizer.hasMoreTokens()) {
                Long toUser = Long.parseLong(tokenizer.nextToken());
                toUsers.add(toUser);
                accountRelationships.add(new AccountRelationship(fromUser, new MutualFriendPerAccount(toUser, -1L)));
            }

            for (int i = 0; i < toUsers.size(); i++) {
                for (int j = i + 1; j < toUsers.size(); j++) {
                    accountRelationships.add(new AccountRelationship(toUsers.get(i), new MutualFriendPerAccount(toUsers.get(j), fromUser)));
                    accountRelationships.add(new AccountRelationship(toUsers.get(j), new MutualFriendPerAccount(toUsers.get(i), fromUser)));
                }
            }
        }
    }

    private List<RecommendAccount> reduce(List<MutualFriendPerAccount> values) {

        final java.util.Map<Long, List<Long>> mutualFriends = new HashMap<>();

        for (MutualFriendPerAccount val : values) {

            final Boolean isAlreadyFriend = (val.mutualFriend == -1);
            final Long toUser = val.user;
            final Long mutualFriend = val.mutualFriend;

            if (mutualFriends.containsKey(toUser)) {
                if (isAlreadyFriend) {
                    mutualFriends.put(toUser, null);
                } else if (mutualFriends.get(toUser) != null) {
                    mutualFriends.get(toUser).add(mutualFriend);
                }
            } else {
                if (!isAlreadyFriend) {
                    mutualFriends.put(toUser, new ArrayList<>() {
                        {
                            add(mutualFriend);
                        }
                    });
                } else {
                    mutualFriends.put(toUser, null);
                }
            }
        }

        SortedMap<Long, List<Long>> sortedMutualFriends = new TreeMap<>(new Comparator<Long>() {
            @Override
            public int compare(Long key1, Long key2) {
                Integer v1 = mutualFriends.get(key1).size();
                Integer v2 = mutualFriends.get(key2).size();
                if (v1 > v2) {
                    return -1;
                } else if (v1.equals(v2) && key1 < key2) {
                    return -1;
                } else {
                    return 1;
                }
            }
        });

        for (Map.Entry<Long, List<Long>> entry : mutualFriends.entrySet()) {
            if (entry.getValue() != null) {
                sortedMutualFriends.put(entry.getKey(), entry.getValue());
            }
        }

        List<RecommendAccount> recommendAccounts = new ArrayList<>();
        for (java.util.Map.Entry<Long, List<Long>> entry : sortedMutualFriends.entrySet()) {
            long accountId = entry.getKey();
            int mutualFriendCount = entry.getValue().size();
            List<Long> mutualFriendsList = entry.getValue();
            RecommendAccount recommendAccount = new RecommendAccount(accountId, mutualFriendCount, mutualFriendsList);
            recommendAccounts.add(recommendAccount);
        }
        return recommendAccounts;
    }
}
