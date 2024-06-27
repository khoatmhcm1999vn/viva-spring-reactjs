package com.vivacon.common.data_generator;

import com.vivacon.common.constant.MockData;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

public abstract class DataGenerator {

    public static final int AMOUNT_OF_USER = 50;

    protected static final String BASE_DIRECTORY_PATH = "./mock_data/sql/";

    protected static final Random RANDOM = new Random();

    protected static final long START_OFFSET = Timestamp.valueOf("2021-06-01 00:00:00").getTime();

    protected static final long END_OFFSET = Timestamp.valueOf("2022-06-30 00:00:00").getTime();

    protected static final long DIFF_OFFSET = END_OFFSET - START_OFFSET;

    protected static final Set<HashTagRelPost> hashTagRelPost = new HashSet<>();

    public static void main(String[] args) {

        DataGenerator generator = new AccountGenerator();
        generator.exportMockDataToSQLFile(1, AMOUNT_OF_USER, "account");

        generator = new FollowingGenerator();
        generator.exportMockDataToSQLFile(1, AMOUNT_OF_USER, "following");

        generator = new HashTagGenerator();
        generator.exportMockDataToSQLFile(0, 0, "hashtag");

        generator = new PostGenerator();
        int amountOfPost = generator.exportMockDataToSQLFile(1, AMOUNT_OF_USER, "post") - 2;

        generator = new HashTagRelPostGenerator();
        generator.exportMockDataToSQLFile(0, 0, "hashtag_rel_post");

        generator = new AttachmentGenerator();
        generator.exportMockDataToSQLFile(1, amountOfPost, "attachment");

        generator = new CommentGenerator();
        generator.exportMockDataToSQLFile(1, amountOfPost, "comment");

        generator = new LikingGenerator();
        generator.exportMockDataToSQLFile(1, amountOfPost, "liking");

        generator = new SettingGenerator();
        generator.exportMockDataToSQLFile(1, AMOUNT_OF_USER, "setting");

        generator = new DeviceMetadataGenerator();
        generator.exportMockDataToSQLFile(1, AMOUNT_OF_USER, "device_metadata");
    }

    public abstract List<String> generateSQLStatements(int startIndex, int endIndex);

    protected String generateSentence(int wordCount, boolean isHashTag) {

        int numberOfWords = MockData.WORDS.size() - 1;
        StringBuilder sentence = new StringBuilder();

        for (int i = 0; i < wordCount; i++) {
            sentence.append(MockData.WORDS.get(RANDOM.nextInt(numberOfWords)));
            sentence.append(" ");
        }
        return sentence.toString();
    }

    protected String getRandomTimestamp() {
        Timestamp rand = new Timestamp(START_OFFSET + (long) (Math.random() * DIFF_OFFSET));
        return rand.toString();
    }

    protected int exportMockDataToSQLFile(int startIndex, int endIndex, String domain) {
        File baseDirectory = new File(BASE_DIRECTORY_PATH);
        if (!baseDirectory.exists()) {
            baseDirectory.mkdirs();
        }
        File file = new File(BASE_DIRECTORY_PATH + domain + ".sql");

        List<String> sqlStatements = generateSQLStatements(startIndex, endIndex);

        int lastCommaIndex = sqlStatements.get(sqlStatements.size() - 1).lastIndexOf(",");
        sqlStatements.set(sqlStatements.size() - 1, sqlStatements.get(sqlStatements.size() - 1).substring(0, lastCommaIndex) + ";");

        String setSequenceIdStatement = "\nSELECT setval('" + domain + "_id_seq', (SELECT MAX(id) FROM " + domain + ") + 1);";
        sqlStatements.add(setSequenceIdStatement);

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file, false))) {
            for (String sqlStatement : sqlStatements) {
                writer.append(sqlStatement);
                writer.flush();
            }
            return sqlStatements.size();
        } catch (IOException e) {
            e.printStackTrace();
            return 0;
        }
    }
}
