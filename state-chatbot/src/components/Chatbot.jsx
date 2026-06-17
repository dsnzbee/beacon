import { useState } from "react";
import Header from "./Header";

function Chatbot({ location, onChangeLocation }) {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `I found ${location.name} from pincode ${location.pincode}. I will use documents from the ${location.documentFolder} folder when the Python chatbot is connected.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

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
          pincode: location.pincode,
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
            "The Python chatbot is not connected yet. When it is ready, it should accept POST requests at /api/chat with the location, pincode, document folder, and user question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <Header page="chat" />

      <section className="chat-location-card">
        <div>
          <p className="small-heading">Current location</p>
          <h1>{location.name}</h1>
          <p className="location-meta">
            {location.state} | Sample pincode: {location.pincode}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onChangeLocation}>
          Change location
        </button>
      </section>

      <section className="suggestion-panel" aria-label="Suggested places">
        <p className="panel-label">Suggested nearby places</p>
        <div className="place-list">
          {location.suggestedPlaces.map((place) => (
            <span className="place-chip" key={place}>
              {place}
            </span>
          ))}
        </div>
      </section>

      <section className="chat-window" aria-label="Chat messages">
        {messages.map((message, index) => (
          <div className={`message-row ${message.sender}`} key={`${message.sender}-${index}`}>
            <p className="message-bubble">{message.text}</p>
          </div>
        ))}

        {isLoading && (
          <div className="message-row bot">
            <p className="message-bubble">Reading {location.name} documents...</p>
          </div>
        )}
      </section>

      <form className="chat-form" onSubmit={sendMessage}>
        <label htmlFor="question">Ask a question</label>
        <div className="chat-input-row">
          <input
            id="question"
            type="text"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Example: Which local schemes are available?"
          />
          <button type="submit">Send</button>
        </div>
      </form>
    </main>
  );
}

export default Chatbot;
