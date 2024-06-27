package com.vivacon.event.handler;

@FunctionalInterface
public interface ActiveSessionChangingListener {

    void notifyActiveSessionChanging();
}
