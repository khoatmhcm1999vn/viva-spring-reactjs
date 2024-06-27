package com.vivacon.dao;

import com.vivacon.dto.response.PostsQuantityInCertainTime;

import javax.persistence.StoredProcedureQuery;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

public abstract class StatisticDAO {

    /**
     * This method is used to fetch the quantity post in each
     * time period (recent months or quarter or years)
     * to see more about the output of database query, let's go to the script.sql descriptions
     *
     * @param procedureQuery
     * @return List<PostsQuantityInCertainTime>
     */
    protected List<PostsQuantityInCertainTime> fetchingTheQuantityPostStatisticData(StoredProcedureQuery procedureQuery) {
        List<PostsQuantityInCertainTime> postsQuantityList = new ArrayList<>();
        if (procedureQuery.execute()) {
            List<Object[]> resultList = procedureQuery.getResultList();
            for (int currentIndex = 0; currentIndex < resultList.size(); currentIndex++) {
                Integer time = (Integer) resultList.get(currentIndex)[0];
                Integer year = (Integer) resultList.get(currentIndex)[1];
                BigInteger quantity = (BigInteger) resultList.get(currentIndex)[2];
                postsQuantityList.add(new PostsQuantityInCertainTime(time, year, quantity));
            }
            return postsQuantityList;
        } else {
            return new ArrayList<>();
        }
    }
}
