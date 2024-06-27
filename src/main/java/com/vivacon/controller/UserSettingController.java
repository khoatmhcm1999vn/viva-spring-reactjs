package com.vivacon.controller;

import com.vivacon.dto.ChangeSettingRequest;
import com.vivacon.dto.response.SettingResponse;
import com.vivacon.dto.response.UserGeoLocation;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.service.SettingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

import static com.vivacon.common.constant.Constants.API_V1;

@RestController
@RequestMapping(API_V1 + "/setting")
public class UserSettingController {

    private SettingService settingService;

    public UserSettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @PostMapping
    public ResponseEntity<Object> changeSetting(@Valid @RequestBody ChangeSettingRequest changeSettingRequest) {
        if (settingService.changeSetting(changeSettingRequest)) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.badRequest().body(null);
    }

    @GetMapping
    public List<SettingResponse> getSettings() {
        return settingService.getSettings();
    }

    @GetMapping("/location")
    public PageDTO<UserGeoLocation> getUserGeoLocations(@RequestParam(value = "_order", required = false) Optional<String> order,
                                                        @RequestParam(value = "_sort", required = false) Optional<String> sort,
                                                        @RequestParam(value = "limit", required = false) Optional<Integer> pageSize,
                                                        @RequestParam(value = "page", required = false) Optional<Integer> pageIndex) {
        return settingService.getUserGeoLocations(order, sort, pageSize, pageIndex);
    }

    @DeleteMapping("/location/{id}")
    public ResponseEntity<?> getUserGeoLocations(@PathVariable(value = "id") long deviceLocationId) {
        settingService.deleteUserGeoLocations(deviceLocationId);
        return ResponseEntity.ok(null);
    }
}
