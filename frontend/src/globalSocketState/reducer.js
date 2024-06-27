import * as types from "./actionTypes";

type SocketStateType = {
  receivedMessage: any,
  newConversation: any,
  activeUsers: any,
  conversationList: any,
  newNotification: any,
};

const initialState: SocketStateType = {
  receivedMessage: null,
  newConversation: {},
  activeUsers: [],
  conversationList: { content: [] },
  newNotification: {},
};

const socketReducer = (state: SocketStateType = initialState, action) => {
  switch (action.type) {
    case types.GET_RECEIVE_MESSAGE:
      return {
        ...state,
        receivedMessage: action.payload,
      };
    case types.GET_NEW_CONVERSATION:
      return {
        ...state,
        newConversation: action.payload,
      };
    case types.GET_ACTIVE_USERS:
      return {
        ...state,
        activeUsers: action.payload,
      };
    case types.UPDATE_CONVERSATION_LIST:
      return {
        ...state,
        conversationList: action.payload,
      };
    case types.GET_NEW_NOTIFICATION:
      return {
        ...state,
        newNotification: action.payload,
      };
    case types.CLEAN_SOCKET_STATES:
      return {
        receivedMessage: null,
        newConversation: {},
        activeUsers: [],
        conversationList: { content: [] },
        newNotification: {},
      };
    default:
      return state;
  }
};
export { initialState };
export default socketReducer;
