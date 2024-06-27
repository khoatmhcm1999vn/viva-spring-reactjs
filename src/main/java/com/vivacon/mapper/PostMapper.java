package com.vivacon.mapper;

import com.vivacon.common.utility.AuditableHelper;
import com.vivacon.dto.AttachmentDTO;
import com.vivacon.dto.request.PostRequest;
import com.vivacon.dto.response.CommentResponse;
import com.vivacon.dto.response.DetailPost;
import com.vivacon.dto.response.NewsfeedPost;
import com.vivacon.dto.response.OutlinePost;
import com.vivacon.dto.response.PostInteraction;
import com.vivacon.dto.response.PostInteractionDTO;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.Attachment;
import com.vivacon.entity.AuditableEntity;
import com.vivacon.entity.Comment;
import com.vivacon.entity.Like;
import com.vivacon.entity.Post;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.repository.AccountRepository;
import com.vivacon.repository.AttachmentRepository;
import com.vivacon.repository.CommentRepository;
import com.vivacon.repository.LikeRepository;
import com.vivacon.repository.PostRepository;
import com.vivacon.security.UserDetailImpl;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class PostMapper {

    private AuditableHelper auditableHelper;

    private ModelMapper mapper;

    private CommentMapper commentMapper;

    private AttachmentRepository attachmentRepository;

    private CommentRepository commentRepository;

    private LikeRepository likeRepository;

    private AccountRepository accountRepository;

    private PostRepository postRepository;

    public PostMapper(ModelMapper mapper,
                      AuditableHelper auditableHelper,
                      AttachmentRepository attachmentRepository,
                      CommentRepository commentRepository,
                      LikeRepository likeRepository,
                      AccountRepository accountRepository,
                      PostRepository postRepository,
                      CommentMapper commentMapper) {
        this.mapper = mapper;
        this.auditableHelper = auditableHelper;
        this.attachmentRepository = attachmentRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
        this.accountRepository = accountRepository;
        this.postRepository = postRepository;
        this.commentMapper = commentMapper;
    }

    public Post toPost(PostRequest postResponse) {
        Post post = this.mapper.map(postResponse, Post.class);
        AuditableEntity auditableEntity = auditableHelper.updateAuditingCreatedFields(post, null);
        auditableEntity.setLastModifiedAt(LocalDateTime.now());
        return (Post) auditableEntity;
    }

    public NewsfeedPost toNewsfeedPost(Post post) {
        NewsfeedPost newsfeedPost = mapper.map(post, NewsfeedPost.class);
        List<AttachmentDTO> attachmentDTOS = attachmentRepository
                .findByPostId(post.getId())
                .stream().map(attachment -> new AttachmentDTO(attachment.getActualName(), attachment.getUniqueName(), attachment.getUrl()))
                .collect(Collectors.toList());
        newsfeedPost.setAttachments(attachmentDTOS);

        Long commentCount = commentRepository.getCountingCommentsByPost(post.getId());
        newsfeedPost.setCommentCount(commentCount);

        Long likeCount = likeRepository.getCountingLike(post.getId());
        newsfeedPost.setLikeCount(likeCount);

        UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Account currentAccount = accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(RecordNotFoundException::new);
        Optional<Like> like = likeRepository.findByIdComposition(currentAccount.getId(), post.getId());
        newsfeedPost.setLiked(like.isPresent());

        auditableHelper.setupDisplayAuditableFields(post, newsfeedPost);
        return newsfeedPost;
    }

    public OutlinePost toOutlinePost(Post post) {
        Attachment firstImage = attachmentRepository.findFirstByPostIdOrderByTimestampAsc(post.getId()).orElseThrow(RecordNotFoundException::new);
        boolean isMultipleImages = attachmentRepository.getAttachmentCountByPostId(post.getId()) > 1;
        Long likeCount = likeRepository.getCountingLike(post.getId());
        Long commentCount = commentRepository.getCountingCommentsByPost(post.getId());
        return new OutlinePost(post.getId(), firstImage.getUrl(), isMultipleImages, likeCount, commentCount, post.getPrivacy());
    }

    public DetailPost toDetailPost(Post post, Pageable commentPageable) {
        DetailPost detailPost = mapper.map(post, DetailPost.class);
        auditableHelper.setupDisplayAuditableFields(post, detailPost);

        List<AttachmentDTO> attachmentDTOS = attachmentRepository
                .findByPostId(post.getId())
                .stream().map(attachment -> new AttachmentDTO(attachment.getActualName(), attachment.getUniqueName(), attachment.getUrl()))
                .collect(Collectors.toList());
        detailPost.setAttachments(attachmentDTOS);

        Page<Comment> pageFirstLevelComments = commentRepository.findAllActiveFirstLevelComments(post.getId(), commentPageable);
        PageDTO<CommentResponse> commentResponsePage = PageMapper.toPageDTO(pageFirstLevelComments, commentMapper::toResponse);

        Long commentCount = commentRepository.getCountingCommentsByPost(post.getId());
        detailPost.setCommentCount(commentCount);
        detailPost.setComments(commentResponsePage);

        Long likeCount = likeRepository.getCountingLike(post.getId());
        UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Account currentAccount = accountRepository.findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(RecordNotFoundException::new);
        Optional<Like> like = likeRepository.findByIdComposition(currentAccount.getId(), post.getId());
        detailPost.setLiked(like.isPresent());
        detailPost.setLikeCount(likeCount);

        return detailPost;
    }

    public DetailPost toDetailPostAdminRole(Post post, Pageable commentPageable) {
        DetailPost detailPost = toDetailPost(post, commentPageable);
        Page<Comment> pageFirstLevelComments = commentRepository.findAllFirstLevelComments(post.getId(), commentPageable);
        PageDTO<CommentResponse> commentResponsePage = PageMapper.toPageDTO(pageFirstLevelComments, commentMapper::toResponse);
        detailPost.setComments(commentResponsePage);
        return detailPost;
    }

    public PostInteractionDTO toPostInteraction(PostInteraction post) {
        PostInteractionDTO postInteractionDTO = mapper.map(post, PostInteractionDTO.class);

        List<AttachmentDTO> attachmentDTOS = attachmentRepository
                .findByPostId(post.getPostId().longValue())
                .stream().map(attachment -> new AttachmentDTO(attachment.getActualName(), attachment.getUniqueName(), attachment.getUrl()))
                .collect(Collectors.toList());
        postInteractionDTO.setLstAttachmentDTO(attachmentDTOS);

        return postInteractionDTO;
    }

    public NewsfeedPost toNewsfeedPost(PostInteraction interactionPost) {
        Post post = postRepository.findByIdAndActive(interactionPost.getPostId().longValue(), true)
                .orElseThrow(RecordNotFoundException::new);
        NewsfeedPost newsfeedPost = mapper.map(post, NewsfeedPost.class);

        List<AttachmentDTO> attachmentDTOS = attachmentRepository
                .findByPostId(post.getId())
                .stream().map(attachment -> new AttachmentDTO(attachment.getActualName(), attachment.getUniqueName(), attachment.getUrl()))
                .collect(Collectors.toList());
        newsfeedPost.setAttachments(attachmentDTOS);

        Long commentCount = interactionPost.getTotalComment().longValue();
        newsfeedPost.setCommentCount(commentCount);

        Long likeCount = interactionPost.getTotalLike().longValue();
        newsfeedPost.setLikeCount(likeCount);

        UserDetailImpl principal = (UserDetailImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Account currentAccount = accountRepository
                .findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(RecordNotFoundException::new);
        Optional<Like> like = likeRepository.findByIdComposition(currentAccount.getId(), post.getId());
        newsfeedPost.setLiked(like.isPresent());

        auditableHelper.setupDisplayAuditableFields(post, newsfeedPost);
        return newsfeedPost;
    }
}


