package com.vivacon.service.impl;

import com.vivacon.common.utility.PageableBuilder;
import com.vivacon.dto.ChangeSettingRequest;
import com.vivacon.dto.response.SettingResponse;
import com.vivacon.dto.response.UserGeoLocation;
import com.vivacon.dto.sorting_filtering.PageDTO;
import com.vivacon.entity.Account;
import com.vivacon.entity.DeviceMetadata;
import com.vivacon.entity.enum_type.SettingType;
import com.vivacon.exception.RecordNotFoundException;
import com.vivacon.mapper.PageMapper;
import com.vivacon.repository.DeviceMetadataRepository;
import com.vivacon.repository.SettingRepository;
import com.vivacon.service.AccountService;
import com.vivacon.service.ActiveSessionManager;
import com.vivacon.service.SettingService;
import org.modelmapper.ModelMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.NonTransientDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SettingServiceImpl implements SettingService {

    private ModelMapper mapper;
    private SettingRepository settingRepository;

    private AccountService accountService;

    private ActiveSessionManager activeSessionManager;

    private DeviceMetadataRepository deviceMetadataRepository;

    public SettingServiceImpl(ModelMapper mapper,
                              SettingRepository settingRepository,
                              DeviceMetadataRepository deviceMetadataRepository,
                              AccountService accountService,
                              ActiveSessionManager activeSessionManager) {
        this.mapper = mapper;
        this.settingRepository = settingRepository;
        this.deviceMetadataRepository = deviceMetadataRepository;
        this.accountService = accountService;
        this.activeSessionManager = activeSessionManager;
    }

    @Override
    public List<SettingResponse> getSettings() {
        Long accountId = accountService.getCurrentAccount().getId();
        return settingRepository.findAllByAccountId(accountId)
                .stream().map(setting -> new SettingResponse(setting))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = {DataIntegrityViolationException.class, NonTransientDataAccessException.class, SQLException.class, Exception.class})
    public boolean changeSetting(ChangeSettingRequest changeSettingRequest) {
        Account principal = accountService.getCurrentAccount();
        Long accountId = principal.getId();
        String username = principal.getUsername();

        SettingType type = changeSettingRequest.getSettingType();
        if (type.isValidValue(changeSettingRequest.getValue())) {
            if (type == SettingType.PRIVACY_ON_ACTIVE_STATUS) {
                if (Boolean.FALSE == Boolean.valueOf(changeSettingRequest.getValue())) {
                    activeSessionManager.removeSessionByUsername(username);
                } else {
                    if (Boolean.TRUE == Boolean.valueOf(changeSettingRequest.getValue())) {
                        activeSessionManager.addSession(UUID.randomUUID().toString(), username);
                    }
                }
            }
            String value = type.serialize(changeSettingRequest.getValue());
            return settingRepository.updateValueBySettingTypeAndAccountId(accountId, type, value) > 0;
        } else {
            throw new RuntimeException("Providing invalid value to change setting");
        }
    }

    @Override
    public PageDTO<UserGeoLocation> getUserGeoLocations(Optional<String> order, Optional<String> sort, Optional<Integer> pageSize, Optional<Integer> pageIndex) {
        Account principal = accountService.getCurrentAccount();
        Long accountId = principal.getId();
        Pageable pageable = PageableBuilder.buildPage(order, sort, pageSize, pageIndex, DeviceMetadata.class);
        Page<DeviceMetadata> pageDeviceMetadata = deviceMetadataRepository.findAll(accountId, pageable);

        return PageMapper.toPageDTO(pageDeviceMetadata, deviceMetadata -> {
            UserGeoLocation userGeoLocation = mapper.map(deviceMetadata, UserGeoLocation.class);
            userGeoLocation.setAccountId(deviceMetadata.getAccount().getId());
            return userGeoLocation;
        });
    }

    @Override
    public boolean deleteUserGeoLocations(long deviceLocationId) {
        deviceMetadataRepository.findById(deviceLocationId).orElseThrow(RecordNotFoundException::new);
        deviceMetadataRepository.deleteById(deviceLocationId);
        return true;
    }

    @Override
    public Object evaluateSetting(long accountId, SettingType settingType) {
        String currentSettingValue = settingRepository
                .findValueByAccountIdAndSettingType(accountId, settingType)
                .orElseThrow(RecordNotFoundException::new);
        return settingType.deserialize(currentSettingValue);
    }
}
