package com.vivacon.dto.sorting_filtering;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class PageDTO<T> {

    @JsonProperty("content")
    List<T> content;

    @JsonProperty("limit")
    private int size;

    @JsonProperty("page")
    private int currentPage;

    @JsonProperty("totalPages")
    private int totalPages;

    @JsonProperty("totalElements")
    private long totalElements;

    private int numberOfElement;

    private boolean isFirst;

    private boolean isLast;

    private boolean isEmpty;

    public static <T> PageDTO<T> getEmptyPageInstance() {
        PageDTO<T> pageDTO = new PageDTO<>();
        pageDTO.setContent(new ArrayList<>());
        pageDTO.setCurrentPage(0);
        pageDTO.setTotalPages(0);
        pageDTO.setEmpty(true);
        pageDTO.setFirst(true);
        pageDTO.setLast(true);
        pageDTO.setNumberOfElement(0);
        pageDTO.setSize(0);
        pageDTO.setTotalElements(0);
        return pageDTO;
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getNumberOfElement() {
        return numberOfElement;
    }

    public void setNumberOfElement(int numberOfElement) {
        this.numberOfElement = numberOfElement;
    }

    public boolean isFirst() {
        return isFirst;
    }

    public void setFirst(boolean first) {
        isFirst = first;
    }

    public boolean isLast() {
        return isLast;
    }

    public void setLast(boolean last) {
        isLast = last;
    }

    public boolean isEmpty() {
        return isEmpty;
    }

    public void setEmpty(boolean empty) {
        isEmpty = empty;
    }
}