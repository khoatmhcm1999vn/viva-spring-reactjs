package com.vivacon.service.impl;

import com.vivacon.event.handler.ActiveSessionChangingListener;
import com.vivacon.service.ActiveSessionManager;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class ActiveSessionManagerImpl implements ActiveSessionManager {

    private List<ActiveSessionChangingListener> listeners = new ArrayList<>();

    private Map<String, String> map = new ConcurrentHashMap<>();

    /**
     * This method is used to add a new entry to our current online user map
     * and publish this change to event handlers
     *
     * @param sessionId String
     * @param username  String
     */
    @Override
    public void addSession(String sessionId, String username) {
        map.put(sessionId, username);
        notifyListeners();
    }

    /**
     * This method is used to add a new entry to our current online user map
     * and publish this change to event handlers
     *
     * @param sessionId String
     */
    @Override
    public boolean removeSessionBySessionId(String sessionId) {
        if (map.remove(sessionId) != null) {
            notifyListeners();
            return true;
        }
        return false;
    }

    @Override
    public boolean removeSessionByUsername(String username) {
        boolean result = false;
        for (Map.Entry<String, String> entry : map.entrySet()) {
            if (username.equals(entry.getValue())) {
                map.remove(entry.getKey());
                notifyListeners();
                result = true;
            }
        }
        return result;
    }

    /**
     * This method simply return all current online user
     *
     * @return
     */
    @Override
    public Set<String> getAll() {
        return map.entrySet().parallelStream().map(Map.Entry::getValue).collect(Collectors.toSet());
    }

    /**
     * This method simply register a new handler for any session changing event
     *
     * @param listener
     */
    @Override
    public void registerListener(ActiveSessionChangingListener listener) {
        listeners.add(listener);
    }

    /**
     * This method simply remove an existing handler from list handler for session changing events
     *
     * @param listener
     */
    @Override
    public void removeListener(ActiveSessionChangingListener listener) {
        listeners.remove(listener);
    }

    /**
     * This method is used for notify handle an session changing event has been occur, so handlers should perform some action
     */
    @Override
    public void notifyListeners() {
        listeners.forEach(ActiveSessionChangingListener::notifyActiveSessionChanging);
    }
}
