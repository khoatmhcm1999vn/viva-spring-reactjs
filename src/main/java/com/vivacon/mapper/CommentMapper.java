package com.vivacon.mapper;

import com.vivacon.common.utility.AuditableHelper;
import com.vivacon.dto.request.CommentRequest;
import com.vivacon.dto.response.CommentResponse;
import com.vivacon.entity.AuditableEntity;
import com.vivacon.entity.Comment;
import com.vivacon.repository.CommentRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class CommentMapper {
    private ModelMapper mapper;

    private AuditableHelper auditableHelper;

    private CommentRepository commentRepository;

    public CommentMapper(ModelMapper mapper,
                         AuditableHelper auditableHelper,
                         CommentRepository commentRepository) {
        this.mapper = mapper;
        this.auditableHelper = auditableHelper;
        this.commentRepository = commentRepository;
    }

    public Comment toComment(CommentRequest commentResponse) {
        Comment comment = this.mapper.map(commentResponse, Comment.class);
        AuditableEntity auditableEntity = auditableHelper.updateAuditingCreatedFields(comment, null);
        auditableEntity.setLastModifiedAt(LocalDateTime.now());
        return (Comment) auditableEntity;
    }

    public CommentResponse toResponse(Comment comment) {
        CommentResponse commentResponse = mapper.map(comment, CommentResponse.class);
        auditableHelper.setupDisplayAuditableFields(comment, commentResponse);

        Long postId = comment.getPost().getId();
        long totalCountComment = commentRepository.getCountingChildComments(comment.getId(), postId);
        commentResponse.setTotalChildComments(totalCountComment);
        
        return commentResponse;
    }
}
