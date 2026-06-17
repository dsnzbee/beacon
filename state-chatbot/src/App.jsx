import { useState } from "react";
import LocationSelect from "./components/LocationSelect";
import Chatbot from "./components/Chatbot";

function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);

  function openChatbot(location) {
    setSelectedLocation(location);
  }

  function goBackToLocationPage() {
    setSelectedLocation(null);
  }

  return (
    <div className="app-shell">
      {selectedLocation ? (
        <Chatbot location={selectedLocation} onChangeLocation={goBackToLocationPage} />
      ) : (
        <LocationSelect onLocationSubmit={openChatbot} />
      )}
    </div>
  );
}

export default App;
