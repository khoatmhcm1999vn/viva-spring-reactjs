import { useContext, useState, useEffect } from "react";
import { UpdateProfile } from "App";
import { SOCKET_URL } from "api/constants";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { getJwtToken } from "utils/cookie";
import { getCurrentUser } from "utils/jwtToken";
import { getConversations, getListOfConversationId } from "api/chatService";
import { useStoreSocket, actions, SocketStoreContext } from "globalSocketState";
import {
  CLEAN_SOCKET_STATES,
  GET_ACTIVE_USERS,
  GET_NEW_CONVERSATION,
  GET_NEW_NOTIFICATION,
  GET_RECEIVE_MESSAGE,
  UPDATE_CONVERSATION_LIST,
} from "globalSocketState/actionTypes";

let stompClient = null;
const useSocket = () => {
  let rooms = [];
  const { setSocketState } = actions;
  const [state, dispatch] = useContext(SocketStoreContext);

  const onNewConversation = (payload) => {
    const newConv = JSON.parse(payload.body);
    // setNewConversation(newConv);
    dispatch(setSocketState(GET_NEW_CONVERSATION, newConv));
    stompClient.subscribe(
      `/conversation/${newConv.id}/message`,
      onMessageReceived,
      {
        "WS-Authorization": getJwtToken(),
      }
    );
  };

  const onNewNotification = (payload) => {
    dispatch(setSocketState(GET_NEW_NOTIFICATION, JSON.parse(payload.body)));
  };

  const onMessageReceived = (payload) => {
    dispatch(setSocketState(GET_RECEIVE_MESSAGE, JSON.parse(payload.body)));
  };

  const onActiveUser = (payload) => {
    dispatch(setSocketState(GET_ACTIVE_USERS, JSON.parse(payload.body)));
  };

  const onConnected = () => {
    stompClient.subscribe(`/topic/account/online`, onActiveUser, {
      "WS-Authorization": getJwtToken(),
    });
    stompClient.subscribe(
      `/user/${getCurrentUser().username}/conversation/new`,
      onNewConversation,
      {
        "WS-Authorization": getJwtToken(),
      }
    );
    stompClient.subscribe(
      `/user/${getCurrentUser().username}/notification`,
      onNewNotification,
      {
        "WS-Authorization": getJwtToken(),
      }
    );
    getListOfConversationId().then((res) => {
      if (res.status === 200) {
        rooms = res.data;
        rooms.forEach((room) => {
          stompClient.subscribe(
            `/conversation/${room}/message`,
            onMessageReceived,
            {
              "WS-Authorization": getJwtToken(),
            }
          );
        });
      }
    });
  };

  const onError = (err) => {
  };

  const connect = () => {
    const sock = new SockJS(SOCKET_URL);
    stompClient = Stomp.over(sock);
    stompClient.connect(
      { "WS-Authorization": getJwtToken() },
      onConnected,
      onError
    );
  };

  const chatInExistedConversation = (conversationId, content) => {
    stompClient.send(
      "/app/chat",
      { "WS-Authorization": getJwtToken() },
      JSON.stringify({
        conversationId,
        content,
      })
    );
  };

  const chatInVirtualConversation = (usernames, firstMessageContent) => {
    stompClient.send(
      "/app/conversation",
      {
        "WS-Authorization": getJwtToken(),
      },
      JSON.stringify({
        usernames,
        firstMessageContent,
      })
    );
  };

  const typing = (conversationId) => {
    stompClient.send(
      "/app/conversation/typing",
      { "WS-Authorization": getJwtToken() },
      JSON.stringify({
        conversationId,
        isTyping: true,
      })
    );
  };

  const untyping = (conversationId) => {
    stompClient.send(
      "/app/conversation/typing",
      { "WS-Authorization": getJwtToken() },
      JSON.stringify({
        conversationId,
        isTyping: false,
      })
    );
  };

  const cleanSocketState = () => {
    dispatch(setSocketState(CLEAN_SOCKET_STATES, []));
  };

  return {
    states: {
      ...state,
    },
    setStates: {
      setReceivedMessage: (data) =>
        dispatch(setSocketState(GET_RECEIVE_MESSAGE, data)),
      setNewConversation: (data) =>
        dispatch(setSocketState(GET_NEW_CONVERSATION, data)),
      setActiveUsers: (data) =>
        dispatch(setSocketState(GET_ACTIVE_USERS, data)),
      setConversationList: (data) =>
        dispatch(setSocketState(UPDATE_CONVERSATION_LIST, data)),
      setNewNotification: (data) =>
        dispatch(setSocketState(GET_NEW_NOTIFICATION, data)),
    },
    handlers: {
      cleanSocketState,
      chatInExistedConversation,
      chatInVirtualConversation,
      typing,
      untyping,
      connect,
    },
  };
};

export default useSocket;
