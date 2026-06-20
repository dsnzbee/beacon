import { useState } from "react";
import LocationSelect from "./components/LocationSelect";
import Chatbot from "./components/Chatbot";
import Analytics from "./components/Analytics";
import BlurFallback from "./BlurFallback";

function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activePage, setActivePage] = useState("location");
  const [language, setLanguage] = useState("en");

  function openChatbot(location) {
    setSelectedLocation(location);
    setActivePage("chat");
  }

  function goBackToLocationPage() {
    setSelectedLocation(null);
    setActivePage("location");
  }

  function openAnalytics() {
    setActivePage("analytics");
  }

  function openChatPage() {
    setActivePage("chat");
  }

  return (
    <>
      {(activePage === "chat" || activePage === "analytics") && <BlurFallback />}
      <div className="app-shell">
        {activePage === "location" || !selectedLocation ? (
          <LocationSelect
            language={language}
            onChangeLanguage={setLanguage}
            onLocationSubmit={openChatbot}
          />
        ) : activePage === "analytics" ? (
          <Analytics
            language={language}
            location={selectedLocation}
            onBackToChat={openChatPage}
            onChangeLanguage={setLanguage}
            onChangeLocation={goBackToLocationPage}
          />
        ) : (
          <Chatbot
            language={language}
            location={selectedLocation}
            onChangeLanguage={setLanguage}
            onChangeLocation={goBackToLocationPage}
            onViewAnalytics={openAnalytics}
          />
        )}
      </div>
    </>
  );
}

export default App;
