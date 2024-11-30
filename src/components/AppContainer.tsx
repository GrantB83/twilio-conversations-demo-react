import React, { useState, useEffect, useMemo, useRef } from "react";
import { bindActionCreators } from "redux";
import { useDispatch, useSelector } from "react-redux";

import {
  Message,
  Conversation,
  Participant,
  Client,
  ConnectionState,
} from "@twilio/conversations";
import { Box } from "@twilio-paste/core";

import { actionCreators, AppState } from "../store";
import ConversationContainer from "./conversations/ConversationContainer";
import ConversationsContainer from "./conversations/ConversationsContainer";
import {
  AddMessagesType,
  SetParticipantsType,
  SetUnreadMessagesType,
} from "../types";
import { getToken } from "../api";
import useAppAlert from "../hooks/useAppAlerts";
import Notifications from "./Notifications";
import stylesheet from "../styles";
import { handlePromiseRejection } from "../helpers";
import AppHeader from "./AppHeader";

import {
  initFcmServiceWorker,
  subscribeFcmNotifications,
  showNotification,
} from "../firebase-support";

interface TokenData {
  token: string;
}

async function loadUnreadMessagesCount(
  convo: Conversation,
  updateUnreadMessages: SetUnreadMessagesType
) {
  let count = 0;

  try {
    count =
      (await convo.getUnreadMessagesCount()) ??
      (await convo.getMessagesCount());
  } catch (e) {
    console.error("getUnreadMessagesCount threw an error", e);
  }

  updateUnreadMessages(convo.sid, count);
}

async function handleParticipantsUpdate(
  participant: Participant,
  updateParticipants: SetParticipantsType
) {
  const result = await participant.conversation.getParticipants();
  updateParticipants(result, participant.conversation.sid);
}

const AppContainer: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>();
  const [client, setClient] = useState<Client>();
  const [clientIteration, setClientIteration] = useState(0);
  const tokenData = useSelector((state: AppState) => state.token) as
    | string
    | TokenData;
  const conversations = useSelector((state: AppState) => state.convos);
  const sid = useSelector((state: AppState) => state.sid);
  const sidRef = useRef("");
  const [alertsExist, AlertsView] = useAppAlert();
  sidRef.current = sid;

  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");

  const dispatch = useDispatch();
  const {
    upsertMessages,
    updateLoadingState,
    updateParticipants,
    updateUser,
    updateUnreadMessages,
    startTyping,
    endTyping,
    upsertConversation,
    login,
    removeMessages,
    removeConversation,
    updateCurrentConversation,
    addNotifications,
    logout,
    clearAttachments,
    updateTimeFormat,
    updateLocal,
  } = bindActionCreators(actionCreators, dispatch);

  const updateTypingIndicator = (
    participant: Participant,
    sid: string,
    callback: (sid: string, user: string) => void
  ) => {
    const {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      attributes: { friendlyName },
      identity,
    } = participant;
    if (identity === localStorage.getItem("username")) {
      return;
    }
    callback(sid, identity || friendlyName || "");
  };

  useEffect(() => {
    initFcmServiceWorker().catch(() => {
      console.error(
        "FCM initialization failed: no push notifications will be available"
      );
    });
  }, []);

  useEffect(() => {
    const token =
      typeof tokenData === "string"
        ? tokenData
        : (tokenData as TokenData)?.token || "";

    if (!token) {
      console.error(
        "Token is not available or improperly formatted:",
        tokenData
      );
      return;
    }

    console.log("Using token:", token); // Debug log for the token

    const client = new Client(token);
    setClient(client);

    const fcmInit = async () => {
      await subscribeFcmNotifications(client);
    };

    fcmInit().catch(() => {
      console.error(
        "FCM initialization failed: no push notifications will be available"
      );
    });

    client.on("conversationJoined", (conversation) => {
      upsertConversation(conversation);

      conversation.on("typingStarted", (participant) => {
        handlePromiseRejection(
          () =>
            updateTypingIndicator(participant, conversation.sid, startTyping),
          addNotifications
        );
      });

      conversation.on("typingEnded", async (participant) => {
        await handlePromiseRejection(
          async () =>
            updateTypingIndicator(participant, conversation.sid, endTyping),
          addNotifications
        );
      });

      handlePromiseRejection(async () => {
        if (conversation.status === "joined") {
          const result = await conversation.getParticipants();
          updateParticipants(result, conversation.sid);

          const messages = await conversation.getMessages();
          upsertMessages(conversation.sid, messages.items);
          await loadUnreadMessagesCount(conversation, updateUnreadMessages);
        }
      }, addNotifications);
    });

    client.on("tokenAboutToExpire", async () => {
      if (username && password) {
        const tokenResponse = await getToken(username, password);
        const newToken =
          typeof tokenResponse === "string"
            ? tokenResponse
            : (tokenResponse as TokenData)?.token || "";
        await client.updateToken(newToken);
        login(newToken);
      }
    });

    client.on("tokenExpired", async () => {
      if (username && password) {
        const tokenResponse = await getToken(username, password);
        const newToken =
          typeof tokenResponse === "string"
            ? tokenResponse
            : (tokenResponse as TokenData)?.token || "";
        login(newToken);
        setClientIteration((x) => x + 1);
      }
    });

    client.on("connectionStateChanged", (state) => {
      setConnectionState(state);
    });

    updateLoadingState(false);

    return () => {
      client?.removeAllListeners();
    };
  }, [clientIteration]);

  useEffect(() => {
    const abortController = new AbortController();
    const use24hTimeFormat = localStorage.getItem("use24hTimeFormat");
    if (use24hTimeFormat !== null) {
      updateTimeFormat(true);
    }
    const local = localStorage.getItem("local") || "en-US";
    updateLocal(local);

    return () => {
      abortController.abort();
    };
  }, []);

  async function upsertMessage(
    message: Message,
    upsertMessages: AddMessagesType,
    updateUnreadMessages: SetUnreadMessagesType
  ) {
    await handlePromiseRejection(async () => {
      if (sidRef.current === message.conversation.sid) {
        await message.conversation.advanceLastReadMessageIndex(message.index);
      }
      upsertMessages(message.conversation.sid, [message]);
      await loadUnreadMessagesCount(message.conversation, updateUnreadMessages);
    }, addNotifications);
  }

  const openedConversation = useMemo(
    () => conversations.find((convo) => convo.sid === sid),
    [sid, conversations]
  );

  return (
    <Box style={stylesheet.appWrapper}>
      <AlertsView />
      <Notifications />
      <Box>
        <AppHeader
          user={username ?? ""}
          client={client}
          onSignOut={async () => {
            logout();

            const registrations =
              await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              registration.unregister();
            }
          }}
          connectionState={connectionState ?? "disconnected"}
        />
      </Box>
      <Box style={stylesheet.appContainer(alertsExist)}>
        <ConversationsContainer client={client} />
        <Box style={stylesheet.messagesWrapper}>
          <ConversationContainer
            conversation={openedConversation}
            client={client}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AppContainer;
