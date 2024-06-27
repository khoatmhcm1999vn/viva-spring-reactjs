package com.vivacon.dto.request;

import com.vivacon.entity.Attachment;
import com.vivacon.entity.enum_type.Privacy;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import java.util.List;

public class PostRequest {

    @NotBlank
    private String caption;

    @NotEmpty
    private List<Attachment> attachments;

    private Privacy privacy;

    public PostRequest() {
    }

    public PostRequest(List<Attachment> lstAttachments, String caption, Privacy privacyType) {
        this.attachments = lstAttachments;
        this.caption = caption;
        this.privacy = privacyType;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public Privacy getPrivacy() {
        return privacy;
    }

    public void setPrivacy(Privacy privacy) {
        this.privacy = privacy;
    }
}
