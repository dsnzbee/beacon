import { useState } from "react";
import delhiLocations from "../data/delhiLocations";
import Header from "./Header";

function LocationDropdown({ disabled = false, label, options, placeholder, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  function chooseOption(nextValue) {
    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <div className="custom-select">
      <label>{label}</label>
      <button
        className="custom-select-button"
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className={`select-chevron ${isOpen ? "open" : ""}`} aria-hidden="true">
          v
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="custom-select-menu">
          {options.map((option) => (
            <button
              className={`custom-select-option ${option.value === value ? "selected" : ""}`}
              key={option.value}
              type="button"
              onClick={() => chooseOption(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocationSelect({ onLocationSubmit }) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const stateOptions = [{ label: "Delhi", value: "Delhi" }];
  const provinceOptions = delhiLocations.map((location) => ({
    label: location.name,
    value: location.name,
  }));

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedState || !selectedProvince) {
      setErrorMessage("Please select both a state and a province.");
      return;
    }

    const location = delhiLocations.find((place) => place.name === selectedProvince);

    onLocationSubmit({
      ...location,
      state: selectedState,
      pincode: location.pincodes[0],
    });
  }

  return (
    <main className="location-page">
      <div className="backimg"></div>
      <Header page="location" />
      
      <section className="location-box" aria-labelledby="location-title">
        <h1 id="location-title">Select your location</h1>
        <p className="intro-text">
          For now this demo only supports Delhi - India. More will be added soon!
        </p>

        <form className="location-form" onSubmit={handleSubmit}>
          <div className="location-select-row">
            <LocationDropdown
              label="State"
              options={stateOptions}
              placeholder="Choose state"
              value={selectedState}
              onChange={(nextState) => {
                setSelectedState(nextState);
                setSelectedProvince("");
                setErrorMessage("");
              }}
            />

            <LocationDropdown
              disabled={!selectedState}
              label="Province"
              options={provinceOptions}
              placeholder="Choose province"
              value={selectedProvince}
              onChange={(nextProvince) => {
                setSelectedProvince(nextProvince);
                setErrorMessage("");
              }}
            />
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="continue-button" type="submit">
            Continue to chatbot
          </button>
        </form>
      </section>

      <p className="privacy-note">Your data is 100% anonymous and secure with us.</p>
    </main>
  );
}

export default LocationSelect;
