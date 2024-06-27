package com.vivacon.common.data_generator;

import java.util.LinkedList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static com.vivacon.common.constant.MockImage.IMAGES;

public class AttachmentGenerator extends DataGenerator {

    @Override
    public List<String> generateSQLStatements(int startPostIndex, int endPostIndex) {

        List<String> statements = new LinkedList<>();
        String insertStatement = "INSERT INTO \"attachment\" (\"id\", \"actual_name\", \"unique_name\", \"url\", \"timestamp\", \"post_id\", \"profile_id\") \nVALUES ";
        statements.add(insertStatement);

        String statement;
        long counting = 1L;
        for (int postId = startPostIndex; postId < endPostIndex; postId++) {

            int attachmentCount = ThreadLocalRandom.current().nextInt(1, 3);
            for (int attachmentIndex = 0; attachmentIndex < attachmentCount; attachmentIndex++) {

                statement = "([[id]], '[[actual_name]]', '[[unique_name]]', '[[url]]', '[[timestamp]]', [[post_id]], NULL),\n";

                String timestamp = getRandomTimestamp();
                String actualName = UUID.randomUUID().toString();
                String uniqueName = actualName + timestamp;
                String url = IMAGES.get(RANDOM.nextInt(IMAGES.size()));

                statement = statement.replace("[[id]]", String.valueOf(counting++));
                statement = statement.replace("[[actual_name]]", actualName);
                statement = statement.replace("[[unique_name]]", uniqueName);
                statement = statement.replace("[[url]]", url);
                statement = statement.replace("[[timestamp]]", timestamp);
                statement = statement.replace("[[post_id]]", String.valueOf(postId));
                statements.add(statement);
            }
        }

        for (int accountId = 1; accountId <= AMOUNT_OF_USER; accountId++) {
            statement = "([[id]], '[[actual_name]]', '[[unique_name]]', '[[url]]', '[[timestamp]]', NULL, [[profile_id]]),\n";

            String timestamp = getRandomTimestamp();
            String actualName = UUID.randomUUID().toString();
            String uniqueName = actualName + timestamp;
            String url = IMAGES.get(RANDOM.nextInt(IMAGES.size()));

            statement = statement.replace("[[id]]", String.valueOf(counting++));
            statement = statement.replace("[[actual_name]]", actualName);
            statement = statement.replace("[[unique_name]]", uniqueName);
            statement = statement.replace("[[url]]", url);
            statement = statement.replace("[[timestamp]]", timestamp);
            statement = statement.replace("[[profile_id]]", String.valueOf(accountId));
            statements.add(statement);
        }

        return statements;
    }
}
