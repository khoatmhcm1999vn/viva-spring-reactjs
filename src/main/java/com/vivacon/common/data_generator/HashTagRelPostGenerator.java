package com.vivacon.common.data_generator;

import java.util.LinkedList;
import java.util.List;

public class HashTagRelPostGenerator extends DataGenerator {

    @Override
    public List<String> generateSQLStatements(int startIndex, int endIndex) {
        List<String> values = new LinkedList<>();

        String insertStatement = "INSERT INTO \"hashtag_rel_post\" (\"id\", \"hashtag_id\", \"post_id\") \nVALUES ";
        values.add(insertStatement);

        String value;
        long counting = 1L;
        for (HashTagRelPost hashTagRelPost : this.hashTagRelPost) {
            value = "([[id]], [[hashtag_id]], [[post_id]]),\n";

            value = value.replace("[[id]]", String.valueOf(counting));
            value = value.replace("[[hashtag_id]]", String.valueOf(hashTagRelPost.getHashTagId()));
            value = value.replace("[[post_id]]", String.valueOf(hashTagRelPost.getPostId()));
            values.add(value);
            counting++;
        }

        return values;
    }
}
