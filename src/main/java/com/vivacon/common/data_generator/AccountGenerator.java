package com.vivacon.common.data_generator;

import com.vivacon.common.constant.MockData;
import com.vivacon.entity.enum_type.AccountStatus;

import java.util.LinkedList;
import java.util.List;
import java.util.Locale;

import static com.vivacon.common.constant.MockData.FIRST_NAME;

public class AccountGenerator extends DataGenerator {

    @Override
    public List<String> generateSQLStatements(int startAccountIndex, int endAccountIndex) {
        List<String> statements = new LinkedList<>();
        int firstNameLength = FIRST_NAME.size() - 1;
        int lastNameLength = MockData.LAST_NAME.size() - 1;
        String insertStatement = "INSERT INTO \"account\" (\"id\", \"full_name\", \"password\", \"refresh_token\", \"token_expired_date\", \"username\", \"role_id\", \"created_at\", \"created_by_account_id\", \"last_modified_at\", \"last_modified_by_account_id\", \"bio\", \"email\", \"verification_token\", verification_expired_date, \"active\", \"account_status\") \nVALUES ";
        statements.add(insertStatement);

        int totalAccount = startAccountIndex;
        String statement;
        for (int accountId = startAccountIndex; accountId <= endAccountIndex; accountId++) {
            statement = "([[id]], '[[full_name]]', '$2a$10$9y6WAausHYtvwMUOHj9qQuLQTgaZn.Bz04w2EG6pSAn1w9wvUtPXi', NULL, NULL, '[[username]]', 2, '[[created_at]]', NULL, NULL, NULL, '[[bio]]', '[[email]]', NULL, NULL, true, '[[account_status]]'),\n";

            String fullName = FIRST_NAME.get(RANDOM.nextInt(firstNameLength)) + " " + MockData.LAST_NAME.get(RANDOM.nextInt(lastNameLength));
            String username = fullName.replace(" ", "") + accountId;
            String bio = generateSentence(10, false);
            String email = username + "@gmail.com";
            String createdAt = getRandomTimestamp();

            statement = statement.replace("[[id]]", String.valueOf(accountId));
            statement = statement.replace("[[full_name]]", fullName);
            statement = statement.replace("[[username]]", username.toLowerCase(Locale.ROOT));
            statement = statement.replace("[[created_at]]", createdAt);
            statement = statement.replace("[[bio]]", bio);
            statement = statement.replace("[[email]]", email);
            statement = statement.replace("[[account_status]]", AccountStatus.ACTIVE.toString());
            statements.add(statement);
            totalAccount++;
        }

        statements = appendAdminAccounts(statements, totalAccount);
        return statements;
    }

    private List<String> appendAdminAccounts(List<String> statements, int accountId) {

        String[] usernames = {"thanhthuy", "hanpham", "xuanthuy"};
        String[] fullnames = {"Thanh Thuy", "Han Pham", "Xuan Thuy"};

        for (int i = 0; i < 3; i++) {
            String statement = "([[id]], '[[full_name]]', '$2a$10$9y6WAausHYtvwMUOHj9qQuLQTgaZn.Bz04w2EG6pSAn1w9wvUtPXi', NULL, NULL, '[[username]]', 1, '[[created_at]]', NULL, NULL, NULL, '[[bio]]', '[[email]]', NULL, NULL, true, 'ACTIVE'),\n";

            String createdAt = getRandomTimestamp();

            statement = statement.replace("[[id]]", String.valueOf(accountId));
            statement = statement.replace("[[full_name]]", fullnames[i]);
            statement = statement.replace("[[username]]", usernames[i].toLowerCase(Locale.ROOT));
            statement = statement.replace("[[created_at]]", createdAt);
            statement = statement.replace("[[bio]]", "");
            statement = statement.replace("[[email]]", usernames[i].toLowerCase(Locale.ROOT) + "@gmail.com");
            statements.add(statement);

            accountId++;
        }

        // super admin section
        String statement = "([[id]], '[[full_name]]', '$2a$10$9y6WAausHYtvwMUOHj9qQuLQTgaZn.Bz04w2EG6pSAn1w9wvUtPXi', NULL, NULL, '[[username]]', 3, '[[created_at]]', NULL, NULL, NULL, '[[bio]]', '[[email]]', NULL, NULL, true, 'ACTIVE'),\n";
        String createdAt = getRandomTimestamp();

        statement = statement.replace("[[id]]", String.valueOf(accountId));
        statement = statement.replace("[[full_name]]", "Super Amin");
        statement = statement.replace("[[username]]", "admin");
        statement = statement.replace("[[created_at]]", createdAt);
        statement = statement.replace("[[bio]]", "");
        statement = statement.replace("[[email]]", "admin@gmail.com");
        statements.add(statement);
        accountId++;

        return statements;
    }
}
