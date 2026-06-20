import { useState } from "react";
import { languages, translate } from "../data/translations";
import logoImage from "../assets/images/logo.png";

const supportedFunctions = [
  "functionShelters",
  "functionShelterHelplines",
  "functionRequiredDocuments",
  "functionSchemes",
  "functionHospitals",
  "functionEmergency",
  "functionLegal",
  "functionComplaints",
  "functionPortals",
  "functionFood",
  "functionHousing",
];

function BrandMark({ onClick }) {
  if (onClick) {
    return (
      <button className="brand-wrap brand-button" type="button" onClick={onClick}>
        <img className="brand-logo" src={logoImage} alt="Beacon logo" />
        <span className="brand-name">Beacon.</span>
      </button>
    );
  }

  return (
    <div className="brand-wrap">
      <img className="brand-logo" src={logoImage} alt="Beacon logo" />
      <span className="brand-name">Beacon.</span>
    </div>
  );
}

function Header({
  page,
  language = "en",
  onBrandClick,
  onViewAnalytics,
  onBackToChat,
  onChangeLanguage,
}) {
  const [isFunctionsOpen, setIsFunctionsOpen] = useState(false);
  const [isLanguagesOpen, setIsLanguagesOpen] = useState(false);
  const [isOfflineModeActive, setIsOfflineModeActive] = useState(false);
  const isChatPage = page === "chat";
  const isAnalyticsPage = page === "analytics";
  const t = (key, replacements) => translate(language, key, replacements);

  function chooseLanguage(nextLanguage) {
    onChangeLanguage?.(nextLanguage);
    setIsLanguagesOpen(false);
  }

  return (
    <header className="site-header">
      <div className="header-brand-group">
        <BrandMark onClick={isChatPage || isAnalyticsPage ? onBrandClick : undefined} />

        {isChatPage && (
          <button
            className="header-pill status-pill"
            type="button"
            aria-pressed={isOfflineModeActive}
            onClick={() => setIsOfflineModeActive(!isOfflineModeActive)}
          >
            <span
              className={`status-dot ${isOfflineModeActive ? "online" : "offline"}`}
              aria-hidden="true"
            ></span>
            {t("offlineMode")}
          </button>
        )}

        {isAnalyticsPage && (
          <button className="header-pill status-pill" type="button" onClick={onBackToChat}>
            {t("backToChat")}
          </button>
        )}
      </div>

      {isChatPage ? (
        <div className="header-actions chat-actions">
          <div className="functions-menu-wrap">
            <button
              className="supported-functions-link"
              type="button"
              aria-expanded={isFunctionsOpen}
              aria-haspopup="true"
              onClick={() => setIsFunctionsOpen(!isFunctionsOpen)}
            >
              {t("supportedFunctions")}
            </button>

            {isFunctionsOpen && (
              <div className="functions-menu" role="menu">
                {supportedFunctions.map((item) => (
                  <p key={item}>{t(item)}</p>
                ))}
              </div>
            )}
          </div>

          <button className="header-pill" type="button" onClick={onViewAnalytics}>
            {t("analytics")}
          </button>
        </div>
      ) : isAnalyticsPage ? (
        <div className="header-actions">
          <button className="header-pill" type="button" onClick={onBackToChat}>
            {t("openChatbot")}
          </button>
        </div>
      ) : (
        <div className="header-actions">
          <div className="functions-menu-wrap">
            <button
              className="locations"
              type="button"
              aria-expanded={isLanguagesOpen}
              aria-haspopup="true"
              onClick={() => setIsLanguagesOpen(!isLanguagesOpen)}
            >
              {t("languages")}
            </button>

            {isLanguagesOpen && (
              <div className="functions-menu language-menu" role="menu">
                {languages.map((item) => (
                  <button
                    className="language-option"
                    key={item.code}
                    type="button"
                    onClick={() => chooseLanguage(item.code)}
                  >
                    <span>{item.label}</span>
                    {item.code === "en" && <small>{t("primaryLanguage")}</small>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="header-pill" type="button">
            {t("register")}
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
