package com.vivacon.common.utility;

import com.vivacon.exception.NotValidSortingFieldName;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Optional;

public class PageableBuilder {

    private PageableBuilder() {
    }

    public static Pageable buildPage(Optional<String> order, Optional<String> sortField, Optional<Integer> pageSize, Optional<Integer> pageIndex, Class<?> clazz) {
        String actualSortField = sortField.orElse("id");
        if (!ReflectionUtils.checkValidField(actualSortField, clazz)) {
            throw new NotValidSortingFieldName();
        }
        return PageRequest.of(
                pageIndex.orElse(0),
                pageSize.orElse(12),
                Sort.by(order.orElse("asc").equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, actualSortField
                ));
    }
}
