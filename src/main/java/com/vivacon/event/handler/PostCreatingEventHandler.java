package com.vivacon.event.handler;

import com.vivacon.entity.HashTag;
import com.vivacon.entity.HashTagRelPost;
import com.vivacon.entity.Post;
import com.vivacon.event.PostCreatingEvent;
import com.vivacon.repository.HashTagRelPostRepository;
import com.vivacon.repository.HashTagRepository;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PostCreatingEventHandler {

    private HashTagRepository hashTagRepository;

    private HashTagRelPostRepository hashTagRelPostRepository;

    public PostCreatingEventHandler(HashTagRepository hashTagRepository,
                                    HashTagRelPostRepository hashTagRelPostRepository) {
        this.hashTagRepository = hashTagRepository;
        this.hashTagRelPostRepository = hashTagRelPostRepository;
    }

    @EventListener
    @Async
    public void onApplicationEvent(PostCreatingEvent postCreatingEvent) {
        Post savedPost = postCreatingEvent.getPost();
        String caption = savedPost.getCaption();
        Pattern regex = Pattern.compile("(#\\w+\\s?)");
        Matcher regexMatcher = regex.matcher(caption);
        Set<String> setHashTag = new HashSet<>();

        while (regexMatcher.find()) {
            int startIndex = regexMatcher.start();
            int endIndex = regexMatcher.end();
            String nameHashTag = caption.substring(startIndex, endIndex).trim();
            setHashTag.add(nameHashTag);
        }

        for (String nameHashTag : setHashTag) {
            Optional<HashTag> existingHashTag = hashTagRepository.findByNameIgnoreCase(nameHashTag);
            HashTag hashTag = existingHashTag.isEmpty()
                    ? hashTagRepository.saveAndFlush(new HashTag(nameHashTag))
                    : existingHashTag.get();
            HashTagRelPost hashTagRelPost = new HashTagRelPost(hashTag, savedPost);
            hashTagRelPostRepository.save(hashTagRelPost);
        }
    }
}
