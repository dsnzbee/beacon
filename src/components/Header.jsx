import { useState } from "react";
import logoImage from "../assets/images/logo.png";

function BrandMark() {
  return (
    <div className="brand-wrap">
      <img className="brand-logo" src={logoImage} alt="Beacon logo" />
      <span className="brand-name">beacon.</span>
    </div>
  );
}

function Header({ page }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isChatPage = page === "chat";

  return (
    <header className="site-header">
      <BrandMark />

      {isChatPage ? (
        <div className="header-actions chat-actions">
          <div className="assist-menu-wrap">
            <button
              className="round-action"
              type="button"
              aria-label="Open quick help menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              &gt;
            </button>

            {isMenuOpen && (
              <div className="assist-menu">
                <button type="button">Look for shelter</button>
                <button type="button">Find food support</button>
                <button type="button">Search housing help</button>
              </div>
            )}
          </div>

          <button className="header-pill" type="button">
            View district analysis
          </button>

          <button className="header-pill status-pill" type="button">
            <span className="status-dot online" aria-hidden="true"></span>
            Offline mode
          </button>
        </div>
      ) : (
        <div className="header-actions">
          <button className="locations" type="button">
            Locations
          </button>
          <button className="header-pill" type="button">
            Register
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
