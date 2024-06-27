package com.vivacon.service;

import com.vivacon.dto.ChangeSettingRequest;
import com.vivacon.dto.response.SettingResponse;
import com.vivacon.dto.response.UserGeoLocation;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.enum_type.SettingType;

import java.util.List;
import java.util.Optional;

public interface SettingService {

    Object evaluateSetting(long accountId, SettingType settingType);

    List<SettingResponse> getSettings();

    boolean changeSetting(ChangeSettingRequest changeSettingRequest);

    PageDTO<UserGeoLocation> getUserGeoLocations(Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex);

    boolean deleteUserGeoLocations(long deviceLocationId);
}
