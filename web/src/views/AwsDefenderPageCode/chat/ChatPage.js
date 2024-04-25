import React, { useState, useRef, useEffect } from "react";
import Paper from "@mui/material/Paper";
import { Box } from "@mui/material";
import { CustomInput } from "components/input";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import PersonPinIcon from "@mui/icons-material/PersonPin";
import { useSocketEvents } from "hooks/useSocketEvents";
import Markdown from "react-markdown";
import axiosInstance from "utils/axios";
import { TextRevealCard } from "components/ui/text-reveal-card";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMessageSend = () => {
    if (newMessage.trim() !== "") {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevents the newline
      handleMessageSend();
    }
  };

  const sendMessage = (message) => {
    if (message.trim() !== "") {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.status === "receiving"
            ? { ...msg, reply: message.response, status: "completed" }
            : msg
        )
      );
      const newMsg = {
        text: message.trim(),
        sender: "user",
      };

      // create a new message and add it to the list of messages with temporary id
      const tempId = Date.now();
      const msg = {
        id: tempId,
        prompt: message.trim(),
        reply: "...",
        status: "pending",
        time: Date.now(),
        replied: null,
      };

      let allMessages = [...messages, msg];

      axiosInstance
        .post(`/chat`, { message: message.trim() })
        .then((response) => {
          // Update logs state after accepting
          const updatedMessages = allMessages.map((msg) =>
            msg.id === tempId ? { ...msg, id: response.data.message_id } : msg
          );
          setMessages(updatedMessages);
        })
        .catch((error) => {
          console.error("Error accepting log:", error);
        });

      setMessages((prevMessages) => [...prevMessages, newMsg]);
    }
  };

  const events = [
    {
      name: "connect:messages",
      handler(message) {
        const updatedMessages = message.messages.map((msg) => ({
          id: msg.id,
          prompt: msg.user_message,
          reply: msg.ai_response,
          status: msg.response_status,
          time: msg.user_message_timestamp,
          replied: msg.ai_response_timestamp,
        }));
        setMessages(updatedMessages);
      },
    },
    {
      name: "chat:response",
      handler(message) {
        // update the receving status of the existing message
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === message.message_id
              ? {
                  ...msg,
                  reply: message.response,
                  status: "receiving",
                  replied: message.replied,
                }
              : msg
          )
        );
      },
    },
  ];

  useSocketEvents(events);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "85vh",
          padding: "16px",
        }}
      >
        {
          <Box
            ref={chatContainerRef}
            style={{
              width: "100%",
              height: "80vh",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "16px",
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "flex-start",
            }}
            elevation={3}
          >
            {messages
              .slice()
              .reverse()
              .map((message, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "8px",
                    display: "flex",
                    flexDirection: "column", // Display messages in columns
                    alignItems: "flex-start", // Align all messages to the left
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <PersonPinIcon
                      style={{ marginRight: "8px", color: "#2196F3" }}
                    />

                    <Paper
                      style={{
                        padding: "12px",
                      }}
                    >
                      <div className="dark:text-white text-black text-sm leading-snug tracking-wide font-bold">
                        {message.prompt}
                      </div>
                    </Paper>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <SettingsSuggestIcon
                      style={{ marginRight: "8px", color: "#FF5722" }}
                    />

                    <Paper
                      style={{
                        padding: "8px",
                      }}
                    >
                      {message.status === "pending" ? (
                        <TextRevealCard
                          text="Please wait for a moment..."
                          revealText="Hey I am working on it!"
                        ></TextRevealCard>
                      ) : (
                        <>
                          {message.reply &&
                            message.reply.length > 0 &&
                            message.status !== "receiving" && (
                              <div className="dark:text-white text-black text-sm leading-snug tracking-wide">
                                <Markdown>{message.reply}</Markdown>
                              </div>
                            )}
                          {message.reply &&
                            message.reply.length > 0 &&
                            message.status === "receiving" && (
                              <div className="dark:text-white text-black text-sm leading-snug tracking-wide">
                                <Markdown>{message.reply}</Markdown>
                              </div>
                            )}
                        </>
                      )}
                    </Paper>
                  </div>
                </div>
              ))}
          </Box>
        }
        <CustomInput
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          handleMessageSend={handleMessageSend}
          autoFocus
        />
      </div>
    </>
  );
};

export default ChatPage;
