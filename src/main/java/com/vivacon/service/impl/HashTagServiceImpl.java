package com.vivacon.service.impl;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.response.OutlinePost;
import com.vivacon.dto.response.TopHashTagResponse;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.HashTag;
import com.vivacon.entity.Post;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.PageMapper;
import com.vivacon.mapper.PostMapper;
import com.vivacon.repository.HashTagRelPostRepository;
import com.vivacon.repository.HashTagRepository;
import com.vivacon.service.HashTagService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class HashTagServiceImpl implements HashTagService {

    private HashTagRelPostRepository hashTagRelPostRepository;

    private HashTagRepository hashTagRepository;

    private PostMapper postMapper;

    public HashTagServiceImpl(HashTagRelPostRepository hashTagRelPostRepository,
                              HashTagRepository hashTagRepository,
                              PostMapper postMapper) {
        this.hashTagRelPostRepository = hashTagRelPostRepository;
        this.hashTagRepository = hashTagRepository;
        this.postMapper = postMapper;
    }

    @Override
    public PageDTO<TopHashTagResponse> findTopHashTag(Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageRequest.of(pageIndex.orElse(0), pageSize.orElse(10));
        Page<TopHashTagResponse> pageTopHashTagResponse = hashTagRelPostRepository.findTopHashTag(pageable);
        return PageMapper.toPageDTO(pageTopHashTagResponse, topHashTagResponses -> topHashTagResponses);
    }

    @Override
    public PageDTO<OutlinePost> getSpecificPostByHashTag(String name, Optional<String> sort, Optional<String> order, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, Post.class);
        HashTag hashTag = hashTagRepository.findByNameIgnoreCase(name)
                .orElseThrow(RecordNotFoundException::new);

        Page<Post> postPage = hashTagRelPostRepository.findByHashTagId(hashTag.getId(), pageable);
        return PageMapper.toPageDTO(postPage, post -> postMapper.toOutlinePost(post));
    }
}
