import React, { useState } from "react";
import { Client } from "@twilio/conversations";

import ConversationTitleModal from "../modals/ConversationTitleModal";
import { addConversation } from "../../api";
import { Button } from "@twilio-paste/button";
import { PlusIcon } from "@twilio-paste/icons/esm/PlusIcon";
import { useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import { actionCreators, AppState } from "../../store";
import { getTranslation } from "./../../utils/localUtils";

interface NewConvoProps {
  client?: Client;
  collapsed: boolean;
}

const CreateConversationButton: React.FC<NewConvoProps> = (
  props: NewConvoProps
) => {
  const dispatch = useDispatch();
  const { updateCurrentConversation, addNotifications, updateParticipants } =
    bindActionCreators(actionCreators, dispatch);

  const local = useSelector((state: AppState) => state.local);
  const createNewConvo = getTranslation(local, "createNewConvo");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = () => setIsModalOpen(true);

  const handleSave = async (title: string) => {
    if (!props.client) {
      addNotifications?.([
        {
          id: Date.now(),
          message: "Conversations client is not initialized.",
          variant: "error",
          dismissAfter: 5000,
        },
      ]);
      return;
    }

    try {
      console.log("Creating conversation with title:", title);

      const convo = await addConversation(
        title,
        updateParticipants,
        props.client,
        addNotifications
      );

      if (!convo) {
        throw new Error("Conversation creation returned undefined.");
      }

      console.log("Conversation created successfully:", convo);
      setIsModalOpen(false);
      updateCurrentConversation(convo.sid);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      addNotifications?.([
        {
          id: Date.now(),
          message: error.message || "Failed to create conversation.",
          variant: "error",
          dismissAfter: 5000,
        },
      ]);
    }
  };

  return (
    <>
      <Button fullWidth variant="secondary" onClick={handleOpen}>
        <PlusIcon decorative={false} title="Add convo" />
        {!props.collapsed ? createNewConvo : null}
      </Button>
      <ConversationTitleModal
        title=""
        type="new"
        isModalOpen={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};

export default CreateConversationButton;
