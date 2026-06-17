import { useState } from "react";
import Header from "./Header";
import logoImage from "../assets/images/logo.png";

function Chatbot({ location, onChangeLocation }) {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const locationLabel = `${location.name}, ${location.state}`;

  async function sendMessage(event) {
    event.preventDefault();

    const cleanMessage = messageText.trim();

    if (!cleanMessage) {
      return;
    }

    const userMessage = {
      sender: "user",
      text: cleanMessage,
    };

    setMessages((oldMessages) => [...oldMessages, userMessage]);
    setMessageText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: location.name,
          state: location.state,
          documentFolder: location.documentFolder,
          question: cleanMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Python chatbot server is not ready yet.");
      }

      const data = await response.json();

      setMessages((oldMessages) => [
        ...oldMessages,
        {
          sender: "bot",
          text: data.answer,
        },
      ]);
    } catch {
      setMessages((oldMessages) => [
        ...oldMessages,
        {
          sender: "bot",
          text:
            "The Python chatbot is not connected yet. When it is ready, it should accept POST requests at /api/chat with the state, province, document folder, and user question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="backimg"></div>
      <Header page="chat" />

      <section className="chat-shell">
        <div className={`chat-stage ${messages.length === 0 ? "is-empty" : ""}`}>
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <img className="welcome-logo" src={logoImage} alt="Beacon logo" />
              <h1>How can I help?</h1>
              <p>Current location: {locationLabel}</p>
              <button className="text-link-button" type="button" onClick={onChangeLocation}>
                click here to change the location
              </button>
            </div>
          ) : (
            <div className="chat-thread" aria-label="Chat messages">
              {messages.map((message, index) => (
                <div className={`message-row ${message.sender}`} key={`${message.sender}-${index}`}>
                  <p className="message-bubble">{message.text}</p>
                </div>
              ))}

              {isLoading && (
                <div className="message-row bot">
                  <p className="message-bubble">Reading {locationLabel} documents...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <form className="chat-form" onSubmit={sendMessage}>
          <div className="chat-input-row">
            <input
              id="question"
              type="text"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Ask Beacon"
            />
            <button type="submit">Send</button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Chatbot;
