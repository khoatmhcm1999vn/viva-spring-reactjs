package com.vivacon.common.data_generator;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class CommentGenerator extends DataGenerator {

    @Override
    public List<String> generateSQLStatements(int startPostIndex, int endPostIndex) {
        List<String> statements = new LinkedList<>();
        String insertStatement = "INSERT INTO \"comment\" (\"id\", \"created_at\", \"last_modified_at\", \"content\", \"parent_comment_id\", \"post_id\", \"created_by_account_id\", \"last_modified_by_account_id\", \"active\") \nVALUES ";
        statements.add(insertStatement);

        int counting = 1;
        for (int postId = startPostIndex; postId <= endPostIndex; postId++) {

            int firstLevelCommentCount = ThreadLocalRandom.current().nextInt(0, 30);
            for (int firstLevelCommentIndex = 0; firstLevelCommentIndex < firstLevelCommentCount; firstLevelCommentIndex++) {
                int firstLevelAccountId = RANDOM.nextInt(AMOUNT_OF_USER) + 1;
                int parentCommentId = counting;
                statements.add(generateCommentStatement(counting++, postId, firstLevelAccountId));

                int secondLevelCommentCount = ThreadLocalRandom.current().nextInt(0, 5);
                for (int secondLevelCommentIndex = 0; secondLevelCommentIndex < secondLevelCommentCount; secondLevelCommentIndex++) {
                    int secondLevelAccountId = RANDOM.nextInt(AMOUNT_OF_USER) + 1;
                    statements.add(generateCommentStatement(counting++, parentCommentId, postId, secondLevelAccountId));
                }
            }
        }
        return statements;
    }

    private String generateCommentStatement(int commentId, int postId, int createdById) {
        String value = "([[id]], '[[created_at]]', NULL, '[[content]]', NULL ,[[post_id]], [[created_by_account_id]], NULL, true),\n";

        String timestamp = getRandomTimestamp();
        String content = generateSentence(7, false);

        value = value.replace("[[id]]", String.valueOf(commentId));
        value = value.replace("[[created_at]]", timestamp);
        value = value.replace("[[content]]", content);
        value = value.replace("[[post_id]]", String.valueOf(postId));
        value = value.replace("[[created_by_account_id]]", String.valueOf(createdById));

        return value;
    }

    private String generateCommentStatement(int commentId, int parentCommentId, int postId, int createdById) {
        String value = "([[id]], '[[created_at]]', NULL, '[[content]]', [[parent_comment_id]], [[post_id]], [[created_by_account_id]], NULL, true),\n";

        String timestamp = getRandomTimestamp();
        String content = generateSentence(7, false);

        value = value.replace("[[id]]", String.valueOf(commentId));
        value = value.replace("[[created_at]]", timestamp);
        value = value.replace("[[content]]", content);
        value = value.replace("[[parent_comment_id]]", String.valueOf(parentCommentId));
        value = value.replace("[[post_id]]", String.valueOf(postId));
        value = value.replace("[[created_by_account_id]]", String.valueOf(createdById));

        return value;
    }
}
