package com.vivacon.common.data_generator;

import com.vivacon.common.constant.MockData;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class PostGenerator extends DataGenerator {

    private int postId = 1;

    @Override
    public List<String> generateSQLStatements(int startAccountIndex, int endAccountIndex) {
        List<String> values = new LinkedList<>();

        String insertStatement = "INSERT INTO \"post\" (\"id\", \"created_at\", \"last_modified_at\", \"caption\", \"privacy\", \"created_by_account_id\", \"last_modified_by_account_id\", \"active\") \nVALUES ";
        values.add(insertStatement);

        String value;
        long counting = 1L;
        for (int accountId = startAccountIndex; accountId <= endAccountIndex; accountId++) {

            int postCount = ThreadLocalRandom.current().nextInt(10, 20);
            for (int postIndex = 1; postIndex <= postCount; postIndex++) {

                value = "([[id]], '[[created_at]]', '[[last_modified_at]]', '[[caption]]', [[privacy]], [[created_by_account_id]], NULL, true),\n";

                String createdAt = getRandomTimestamp();
                String lastModifiedAt = getRandomTimestamp();
                String caption = generateSentence(10, true);
                int privacy = ThreadLocalRandom.current().nextInt(1, 3);

                value = value.replace("[[id]]", String.valueOf(counting++));
                value = value.replace("[[created_at]]", createdAt);
                value = value.replace("[[last_modified_at]]", lastModifiedAt);
                value = value.replace("[[caption]]", caption);
                value = value.replace("[[privacy]]", String.valueOf(privacy));
                value = value.replace("[[created_by_account_id]]", String.valueOf(accountId));
                values.add(value);
                this.postId = postIndex;
            }
        }
        return values;
    }

    @Override
    protected String generateSentence(int wordCount, boolean isHashTag) {

        int numberOfWords = MockData.WORDS.size() - 1;
        StringBuilder sentence = new StringBuilder();
        if (isHashTag) {
            generateHashTag(sentence, this.postId);
        }
        for (int i = 0; i < wordCount; i++) {
            sentence.append(MockData.WORDS.get(RANDOM.nextInt(numberOfWords)));
            sentence.append(" ");
        }
        return sentence.toString();
    }

    protected void generateHashTag(StringBuilder wordCount, int postId) {
        int randomHashTagId = ThreadLocalRandom.current().nextInt(1, 15);
        wordCount.append(MockData.HASH_TAG.get(randomHashTagId));
        wordCount.append(" ");
        hashTagRelPost.add(new HashTagRelPost(this.postId, randomHashTagId));
    }
}
