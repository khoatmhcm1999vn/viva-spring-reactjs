package com.vivacon.dto.sorting_filtering;

import com.vivacon.entity.Post;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Expression;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;
import java.util.Locale;

public class PostSpecification implements Specification<Post> {

    private transient QueryCriteria criteria;

    public PostSpecification(QueryCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    public Predicate toPredicate(Root<Post> root, CriteriaQuery<?> criteriaQuery, CriteriaBuilder criteriaBuilder) {
        switch (criteria.getKey()) {
            case "content": {
                Expression<String> titleLowerCase = criteriaBuilder.lower(root.get("content"));
                return criteriaBuilder.like(titleLowerCase, "%" + criteria.getValue().toString().toLowerCase(Locale.ROOT) + "%");
            }
            case "privacy": {
                return criteriaBuilder.equal(root.get("privacy"), criteria.getValue());
            }
            case "account": {
                return criteriaBuilder.equal(root.get("createdBy").get("id"), criteria.getValue());
            }
            default: {
                throw new IllegalArgumentException();
            }
        }
    }
}
