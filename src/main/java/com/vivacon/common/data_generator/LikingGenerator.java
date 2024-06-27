package com.vivacon.common.data_generator;

import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

public class LikingGenerator extends DataGenerator{

    @Override
    public List<String> generateSQLStatements(int startPostIndex, int endPostIndex) {
        List<String> statements = new LinkedList<>();

        String insertStatement = "INSERT INTO \"liking\" (\"id\", \"account_id\", \"post_id\") \nVALUES ";
        statements.add(insertStatement);

        String statement;
        long counting = 1L;
        for (int currentPostId = startPostIndex; currentPostId <= endPostIndex; currentPostId++) {

            int likeCount = ThreadLocalRandom.current().nextInt(0, 30);
            Set<Integer> uniqueAccountIdSet = new HashSet<>();
            for (int likeIndex = 0; likeIndex < likeCount; likeIndex++) {

                int randomAccountId = ThreadLocalRandom.current().nextInt(1, AMOUNT_OF_USER);
                if(uniqueAccountIdSet.contains(randomAccountId)){
                    continue;
                }
                else {
                    uniqueAccountIdSet.add(randomAccountId);
                }

                statement = "([[id]], [[account_id]], [[post_id]]),\n";
                statement = statement.replace("[[id]]", String.valueOf(counting++));
                statement = statement.replace("[[account_id]]", String.valueOf(randomAccountId));
                statement = statement.replace("[[post_id]]", String.valueOf(currentPostId));
                statements.add(statement);
            }
        }
        return statements;
    }
}
