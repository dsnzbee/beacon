import { useState } from "react";
import delhiLocations from "../data/delhiLocations";
import { translate } from "../data/translations";
import Header from "./Header";

function LocationDropdown({ disabled = false, label, options, placeholder, value, onChange }) {
  return (
    <div className="location-field">
      <label>{label}</label>
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LocationSelect({ language, onChangeLanguage, onLocationSubmit }) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const t = (key, replacements) => translate(language, key, replacements);
  const stateOptions = [{ label: "Delhi", value: "Delhi" }];
  const provinceOptions = delhiLocations.map((location) => ({
    label: location.name,
    value: location.name,
  }));

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedState || !selectedProvince) {
      setErrorMessage(t("formError"));
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
      <Header page="location" language={language} onChangeLanguage={onChangeLanguage} />
      
      <section className="location-box" aria-labelledby="location-title">
        <h1 id="location-title">{t("selectLocation")}</h1>
        <p className="intro-text">
          {t("locationIntro")}
        </p>

        <form className="location-form" onSubmit={handleSubmit}>
          <div className="location-select-row">
            <LocationDropdown
              label={t("state")}
              options={stateOptions}
              placeholder={t("chooseState")}
              value={selectedState}
              onChange={(nextState) => {
                setSelectedState(nextState);
                setSelectedProvince("");
                setErrorMessage("");
              }}
            />

            <LocationDropdown
              disabled={!selectedState}
              label={t("province")}
              options={provinceOptions}
              placeholder={t("chooseProvince")}
              value={selectedProvince}
              onChange={(nextProvince) => {
                setSelectedProvince(nextProvince);
                setErrorMessage("");
              }}
            />
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="continue-button" type="submit">
            {t("continueToChatbot")}
          </button>
        </form>
      </section>

      <p className="privacy-note">{t("privacyNote")}</p>
    </main>
  );
}

export default LocationSelect;
