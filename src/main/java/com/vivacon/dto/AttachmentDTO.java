package com.vivacon.dto;

import com.vivacon.entity.Attachment;

public class AttachmentDTO {

    private String actualName;

    private String uniqueName;

    private String url;

    public AttachmentDTO() {
    }

    public AttachmentDTO(Attachment attachment) {
        this.actualName = attachment.getActualName();
        this.uniqueName = attachment.getUniqueName();
        this.url = attachment.getUrl();
    }

    public AttachmentDTO(String actualName, String uniqueName, String url) {
        this.actualName = actualName;
        this.uniqueName = uniqueName;
        this.url = url;
    }

    public String getActualName() {
        return actualName;
    }

    public void setActualName(String actualName) {
        this.actualName = actualName;
    }

    public String getUniqueName() {
        return uniqueName;
    }

    public void setUniqueName(String uniqueName) {
        this.uniqueName = uniqueName;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    @Override
    public int hashCode() {
        return this.uniqueName.hashCode() + this.actualName.hashCode() + this.url.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof AttachmentDTO) {
            AttachmentDTO attachment = (AttachmentDTO) obj;
            return (this.url.equals(attachment.getUrl())
                    && this.actualName.equals(attachment.getActualName())
                    && this.uniqueName.equals(attachment.getUniqueName()));
        }
        return false;
    }
}
