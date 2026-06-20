import { useState } from "react";
import Header from "./Header";
import { translate } from "../data/translations";
import logoImage from "../assets/images/logo.png";

const promptSuggestions = [
  { labelKey: "promptShelter", prompt: "Help me find shelter nearby" },
  { labelKey: "promptSchemes", prompt: "Tell me government schemes I may qualify for" },
  { labelKey: "promptDocuments", prompt: "What documents should I keep ready?" },
];

function FormattedMessage({ text }) {
  return text.split("\n").map((line, lineIndex) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);

    return (
      <span className="message-line" key={`${line}-${lineIndex}`}>
        {parts.map((part, partIndex) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={`${part}-${partIndex}`}>{part.slice(2, -2)}</strong>;
          }

          return <span key={`${part}-${partIndex}`}>{part}</span>;
        })}
      </span>
    );
  });
}

function Chatbot({ language, location, onChangeLanguage, onChangeLocation, onViewAnalytics }) {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const t = (key, replacements) => translate(language, key, replacements);
  const locationLabel = `${location.name}, ${location.state}`;

  async function sendChatMessage(cleanMessage) {
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
          text: t("backendUnavailable"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    sendChatMessage(messageText.trim());
  }

  function sendSuggestedPrompt(prompt) {
    sendChatMessage(prompt);
  }

  return (
    <main className="chat-page">
      <div className="backimg"></div>
      <Header
        page="chat"
        language={language}
        onBrandClick={onChangeLocation}
        onChangeLanguage={onChangeLanguage}
        onViewAnalytics={onViewAnalytics}
      />

      <section className="chat-shell">
        <div className={`chat-stage ${messages.length === 0 ? "is-empty" : ""}`}>
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <img className="welcome-logo" src={logoImage} alt="Beacon logo" />
              <h1>{t("howCanIHelp")}</h1>
              <p>
                {t("currentLocation")}: {locationLabel}
              </p>
              <button className="text-link-button" type="button" onClick={onChangeLocation}>
                {t("changeLocation")}
              </button>

              <div className="prompt-suggestions" aria-label="Suggested prompts">
                {promptSuggestions.map((prompt) => (
                  <button
                    className="prompt-chip"
                    key={prompt.prompt}
                    type="button"
                    onClick={() => sendSuggestedPrompt(prompt.prompt)}
                  >
                    {t(prompt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-thread" aria-label="Chat messages">
              {messages.map((message, index) => (
                <div className={`message-row ${message.sender}`} key={`${message.sender}-${index}`}>
                  <p className="message-bubble">
                    <FormattedMessage text={message.text} />
                  </p>
                </div>
              ))}

              {isLoading && (
                <div className="message-row bot">
                  <p className="message-bubble">
                    {t("readingDocuments", { location: locationLabel })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <form className="chat-form" onSubmit={sendMessage} autoComplete="off">
          <div className="chat-input-row">
            <input
              id="beacon-message"
              name="beacon-message"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck="false"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={t("askBeacon")}
            />
            <button type="submit">{t("send")}</button>
          </div>
        </form>
        <p className="wip-note">
          {t("developmentNote")}
        </p>
      </section>
    </main>
  );
}

export default Chatbot;
