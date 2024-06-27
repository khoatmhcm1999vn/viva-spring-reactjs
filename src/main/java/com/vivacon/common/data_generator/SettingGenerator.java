package com.vivacon.common.data_generator;

import com.vivacon.entity.enum_type.SettingType;

import java.util.LinkedList;
import java.util.List;

public class SettingGenerator extends DataGenerator {

    @Override
    public List<String> generateSQLStatements(int startAccountIndex, int endAccountIndex) {
        List<String> values = new LinkedList<>();

        String insertStatement = "INSERT INTO \"setting\" (\"id\", \"type\", \"value\", \"account_id\") \nVALUES ";
        values.add(insertStatement);

        SettingType[] settingTypes = SettingType.class.getEnumConstants();

        String value;
        long counting = 1L;
        for (int accountId = startAccountIndex; accountId <= endAccountIndex; accountId++) {

            for (int settingIndex = 0; settingIndex < settingTypes.length; settingIndex++) {
                value = "([[id]], '[[type]]', '[[value]]', [[account_id]]),\n";

                value = value.replace("[[id]]", String.valueOf(counting));
                value = value.replace("[[type]]", settingTypes[settingIndex].toString());
                value = value.replace("[[value]]", settingTypes[settingIndex].getDefaultValue());
                value = value.replace("[[account_id]]", String.valueOf(accountId));
                values.add(value);
                counting++;
            }
        }
        return values;
    }
}
