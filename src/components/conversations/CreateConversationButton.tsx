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

  console.log("CreateConversationButton props.client:", props.client);

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
        onCancel={() => {
          setIsModalOpen(false);
        }}
        onSave={async (title: string) => {
          try {
            if (!props.client) {
              throw new Error(
                "Twilio Conversations Client is not initialized."
              );
            }
            console.log("Creating conversation with title:", title);

            const convo = await addConversation(
              title,
              updateParticipants,
              props.client,
              addNotifications
            );

            console.log("Conversation created successfully:", convo);
            setIsModalOpen(false);
            updateCurrentConversation(convo.sid);
          } catch (error) {
            console.error("Error creating conversation:", error);
            addNotifications &&
              addNotifications([
                {
                  id: Date.now(),
                  message: "Failed to create conversation.",
                  variant: "error",
                  dismissAfter: 5000,
                },
              ]);
          }
        }}
      />
    </>
  );
};

export default CreateConversationButton;
