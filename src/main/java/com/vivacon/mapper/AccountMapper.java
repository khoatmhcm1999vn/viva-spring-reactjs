package com.vivacon.mapper;

import com.vivacon.dto.response.AccountInfo;
import com.vivacon.dto.response.AccountResponse;
import com.vivacon.dto.response.EssentialAccount;
import com.vivacon.dto.response.OutlineAccount;
import com.vivacon.dto.response.RecommendAccountResponse;
import com.vivacon.entity.Account;
import com.vivacon.entity.Attachment;
import com.vivacon.entity.Following;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.repository.AccountRepository;
import com.vivacon.repository.AttachmentRepository;
import com.vivacon.repository.FollowingRepository;
import com.vivacon.security.UserDetailImpl;
import com.vivacon.service.ActiveSessionManager;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.vivacon.common.constant.Constants.BLANK_AVATAR_URL;

@Component
public class AccountMapper {
    private ModelMapper mapper;

    private FollowingRepository followingRepository;

    private AttachmentRepository attachmentRepository;

    private AccountRepository accountRepository;
    private ActiveSessionManager activeSessionManager;

    public AccountMapper(ModelMapper mapper,
                         FollowingRepository followingRepository,
                         AttachmentRepository attachmentRepository,
                         AccountRepository accountRepository,
                         ActiveSessionManager activeSessionManager) {
        this.mapper = mapper;
        this.followingRepository = followingRepository;
        this.attachmentRepository = attachmentRepository;
        this.accountRepository = accountRepository;
        this.activeSessionManager = activeSessionManager;
    }

    public AccountResponse toResponse(Account principal, Account account) {
        AccountResponse responseAccount = this.mapper.map(account, AccountResponse.class);

        Optional<Attachment> avatar = attachmentRepository.findFirstByProfileIdOrderByTimestampDesc(account.getId());
        String avatarUrl = avatar.isPresent() ? avatar.get().getUrl() : BLANK_AVATAR_URL;
        responseAccount.setAvatar(avatarUrl);

        if (principal != null) {
            Optional<Following> following = followingRepository.findByIdComposition(principal.getId(), account.getId());
            responseAccount.setFollowing(following.isPresent());
        }

        return responseAccount;
    }

    public OutlineAccount toOutlineAccount(Account account) {
        OutlineAccount outlineAccountResponse = mapper.map(account, OutlineAccount.class);

        UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Account currentAccount = accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(RecordNotFoundException::new);

        Optional<Following> following = followingRepository.findByIdComposition(currentAccount.getId(), account.getId());
        Optional<Attachment> attachment = attachmentRepository.findFirstByProfileIdOrderByTimestampDesc(account.getId());

        String avatarUrl = attachment.isPresent() ? attachment.get().getUrl() : BLANK_AVATAR_URL;

        outlineAccountResponse.setIsFollowing(following.isPresent());
        outlineAccountResponse.setAvatar(avatarUrl);

        return outlineAccountResponse;
    }

    public EssentialAccount toEssentialAccount(Account account) {
        EssentialAccount essentialAccount = mapper.map(account, EssentialAccount.class);

        Optional<Attachment> attachment = attachmentRepository.findFirstByProfileIdOrderByTimestampDesc(account.getId());
        String avatarUrl = attachment.isPresent() ? attachment.get().getUrl() : BLANK_AVATAR_URL;
        essentialAccount.setAvatar(avatarUrl);
        essentialAccount.setIsOnline(activeSessionManager.getAll().contains(account.getUsername()));
        essentialAccount.setPublicKey(account.getPublicKey());

        return essentialAccount;
    }

    public RecommendAccountResponse toRecommendAccountResponse(Account account, List<Long> mutualFriend) {
        RecommendAccountResponse recommendAccountResponse = mapper.map(account, RecommendAccountResponse.class);

        UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Account currentAccount = accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(RecordNotFoundException::new);

        Optional<Attachment> attachment = attachmentRepository.findFirstByProfileIdOrderByTimestampDesc(account.getId());
        String avatarUrl = attachment.isPresent() ? attachment.get().getUrl() : BLANK_AVATAR_URL;
        recommendAccountResponse.setAvatar(avatarUrl);

        Optional<Following> following = followingRepository.findByIdComposition(currentAccount.getId(), account.getId());
        recommendAccountResponse.setIsFollowing(following.isPresent());

        List<EssentialAccount> mutualFriendAccounts = mutualFriend.stream()
                .map(accountId -> {
                    Account mutualFriendAccount = accountRepository.findById(accountId).orElseThrow(RecordNotFoundException::new);
                    return toEssentialAccount(mutualFriendAccount);
                }).collect(Collectors.toList());
        recommendAccountResponse.setMutualFriends(mutualFriendAccounts);

        return recommendAccountResponse;
    }

    public AccountInfo toAccountInfo(Account account) {
        return mapper.map(account, AccountInfo.class);
    }
}
