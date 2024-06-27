package com.vivacon.common.data_generator;

import com.vivacon.common.constant.MockData;

import java.util.LinkedList;
import java.util.List;

public class HashTagGenerator extends DataGenerator {

    @Override
    public List<String> generateSQLStatements(int startIndex, int endIndex) {
        List<String> values = new LinkedList<>();

        String insertStatement = "INSERT INTO \"hashtag\" (\"id\", \"name\") \nVALUES ";
        values.add(insertStatement);

        String value;
        long counting = 1L;
        for (int i = 1; i <= MockData.HASH_TAG.size(); i++) {
            value = "([[id]], '[[name]]'),\n";

            value = value.replace("[[id]]", String.valueOf(counting++));
            value = value.replace("[[name]]", MockData.HASH_TAG.get(i - 1));
            values.add(value);
        }
        return values;
    }
}
