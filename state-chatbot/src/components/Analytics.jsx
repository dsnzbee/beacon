import Header from "./Header";
import { translate } from "../data/translations";

const analyticsByLocation = {
  "north-delhi": {
    activeCases: 1280,
    weeklyChange: 12,
    coverage: 68,
    responseTime: "38 min",
    demand: [
      { labelKey: "shelter", value: 420, color: "#f0e5d9" },
      { labelKey: "food", value: 335, color: "#8fe6a1" },
      { labelKey: "medical", value: 220, color: "#7cb7ff" },
      { labelKey: "legalAid", value: 150, color: "#ffb4a8" },
      { labelKey: "documents", value: 155, color: "#d6b4ff" },
    ],
    trend: [72, 88, 84, 101, 112, 126, 138],
    capacity: [
      { labelKey: "shelterBeds", used: 74 },
      { labelKey: "foodRequestsServed", used: 61 },
      { labelKey: "medicalReferrals", used: 48 },
    ],
    hotspots: ["Azadpur", "Majnu Ka Tilla", "Sarai Pipal Thala"],
  },
  "south-delhi": {
    activeCases: 1045,
    weeklyChange: 8,
    coverage: 72,
    responseTime: "34 min",
    demand: [
      { labelKey: "shelter", value: 310, color: "#f0e5d9" },
      { labelKey: "food", value: 280, color: "#8fe6a1" },
      { labelKey: "medical", value: 255, color: "#7cb7ff" },
      { labelKey: "legalAid", value: 95, color: "#ffb4a8" },
      { labelKey: "documents", value: 105, color: "#d6b4ff" },
    ],
    trend: [58, 64, 73, 79, 92, 89, 108],
    capacity: [
      { labelKey: "shelterBeds", used: 69 },
      { labelKey: "foodRequestsServed", used: 58 },
      { labelKey: "medicalReferrals", used: 53 },
    ],
    hotspots: ["Kalkaji", "Nehru Place", "Lodhi Road"],
  },
  "central-delhi": {
    activeCases: 920,
    weeklyChange: 6,
    coverage: 75,
    responseTime: "31 min",
    demand: [
      { labelKey: "shelter", value: 300, color: "#f0e5d9" },
      { labelKey: "food", value: 225, color: "#8fe6a1" },
      { labelKey: "medical", value: 170, color: "#7cb7ff" },
      { labelKey: "legalAid", value: 120, color: "#ffb4a8" },
      { labelKey: "documents", value: 105, color: "#d6b4ff" },
    ],
    trend: [51, 59, 66, 70, 82, 86, 91],
    capacity: [
      { labelKey: "shelterBeds", used: 63 },
      { labelKey: "foodRequestsServed", used: 66 },
      { labelKey: "medicalReferrals", used: 44 },
    ],
    hotspots: ["Chandni Chowk", "Karol Bagh", "Kashmere Gate"],
  },
  "east-delhi": {
    activeCases: 860,
    weeklyChange: 5,
    coverage: 71,
    responseTime: "36 min",
    demand: [
      { labelKey: "shelter", value: 245, color: "#f0e5d9" },
      { labelKey: "food", value: 260, color: "#8fe6a1" },
      { labelKey: "medical", value: 155, color: "#7cb7ff" },
      { labelKey: "legalAid", value: 85, color: "#ffb4a8" },
      { labelKey: "documents", value: 115, color: "#d6b4ff" },
    ],
    trend: [48, 55, 61, 58, 74, 80, 84],
    capacity: [
      { labelKey: "shelterBeds", used: 57 },
      { labelKey: "foodRequestsServed", used: 69 },
      { labelKey: "medicalReferrals", used: 41 },
    ],
    hotspots: ["Preet Vihar", "Laxmi Nagar", "Mayur Vihar"],
  },
  "west-delhi": {
    activeCases: 1110,
    weeklyChange: 10,
    coverage: 70,
    responseTime: "35 min",
    demand: [
      { labelKey: "shelter", value: 360, color: "#f0e5d9" },
      { labelKey: "food", value: 295, color: "#8fe6a1" },
      { labelKey: "medical", value: 210, color: "#7cb7ff" },
      { labelKey: "legalAid", value: 110, color: "#ffb4a8" },
      { labelKey: "documents", value: 135, color: "#d6b4ff" },
    ],
    trend: [61, 72, 79, 83, 94, 102, 116],
    capacity: [
      { labelKey: "shelterBeds", used: 71 },
      { labelKey: "foodRequestsServed", used: 62 },
      { labelKey: "medicalReferrals", used: 50 },
    ],
    hotspots: ["Janakpuri", "Tilak Nagar", "Raja Garden"],
  },
};

function getAnalytics(location) {
  return analyticsByLocation[location.documentFolder] || analyticsByLocation["south-delhi"];
}

function PieChart({ data, language }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;

  return (
    <div className="pie-chart-wrap" aria-label="Need category distribution">
      <svg className="pie-chart" viewBox="0 0 42 42" role="img">
        <circle className="pie-ring" cx="21" cy="21" r="15.915" />
        {data.map((item) => {
          const percent = (item.value / total) * 100;
          const segment = (
            <circle
              className="pie-segment"
              cx="21"
              cy="21"
              key={item.label}
              r="15.915"
              stroke={item.color}
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeDashoffset={offset}
            />
          );
          offset -= percent;
          return segment;
        })}
      </svg>
      <div className="pie-total">
        <strong>{total}</strong>
        <span>{translate(language, "peopleTracked")}</span>
      </div>
    </div>
  );
}

function TrendChart({ values }) {
  const maxValue = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 86;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
      <polyline className="trend-grid" points="0,82 100,82" />
      <polyline className="trend-grid" points="0,52 100,52" />
      <polyline className="trend-grid" points="0,22 100,22" />
      <polyline className="trend-line" points={points} />
    </svg>
  );
}

function Analytics({ language, location, onBackToChat, onChangeLanguage, onChangeLocation }) {
  const stats = getAnalytics(location);
  const t = (key, replacements) => translate(language, key, replacements);
  const topNeed = stats.demand.reduce((largest, item) =>
    item.value > largest.value ? item : largest
  );
  const maxDemand = Math.max(...stats.demand.map((item) => item.value));

  return (
    <main className="analytics-page">
      <div className="backimg"></div>
      <Header
        page="analytics"
        language={language}
        onBackToChat={onBackToChat}
        onBrandClick={onChangeLocation}
        onChangeLanguage={onChangeLanguage}
      />

      <section className="analytics-shell" aria-labelledby="analytics-title">
        <div className="analytics-title-row">
          <div>
            <p className="small-heading">{t("analyticsTitle")}</p>
            <h1 id="analytics-title">{location.name}</h1>
          </div>
          <button className="text-link-button" type="button" onClick={onChangeLocation}>
            {t("changeLocation")}
          </button>
        </div>

        <div className="metric-grid">
          <article className="metric-tile">
            <span>{t("activeCases")}</span>
            <strong>{stats.activeCases.toLocaleString()}</strong>
            <p>+{stats.weeklyChange}% {t("thisWeek")}</p>
          </article>
          <article className="metric-tile">
            <span>{t("topRequest")}</span>
            <strong>{t(topNeed.labelKey)}</strong>
            <p>{topNeed.value} {t("estimatedPeople")}</p>
          </article>
          <article className="metric-tile">
            <span>{t("serviceCoverage")}</span>
            <strong>{stats.coverage}%</strong>
            <p>{t("pilotEstimate")}</p>
          </article>
          <article className="metric-tile">
            <span>{t("avgResponseTime")}</span>
            <strong>{stats.responseTime}</strong>
            <p>{t("fromFirstRequest")}</p>
          </article>
        </div>

        <div className="analytics-grid">
          <section className="analytics-panel demand-panel">
            <div className="panel-heading">
              <h2>{t("needsDistribution")}</h2>
              <span>{t("fakeData")}</span>
            </div>
            <div className="demand-layout">
              <PieChart data={stats.demand} language={language} />
              <div className="chart-legend">
                {stats.demand.map((item) => (
                  <div className="legend-row" key={item.labelKey}>
                    <span className="legend-dot" style={{ background: item.color }}></span>
                    <span>{t(item.labelKey)}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <h2>{t("requestsByService")}</h2>
              <span>{t("currentMonth")}</span>
            </div>
            <div className="bar-chart">
              {stats.demand.map((item) => (
                <div className="bar-row" key={item.labelKey}>
                  <span>{t(item.labelKey)}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(item.value / maxDemand) * 100}%`,
                        background: item.color,
                      }}
                    ></div>
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <h2>{t("weeklyDemandTrend")}</h2>
              <span>{t("last7Days")}</span>
            </div>
            <TrendChart values={stats.trend} />
            <div className="trend-labels">
              <span>{t("mon")}</span>
              <span>{t("tue")}</span>
              <span>{t("wed")}</span>
              <span>{t("thu")}</span>
              <span>{t("fri")}</span>
              <span>{t("sat")}</span>
              <span>{t("sun")}</span>
            </div>
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <h2>{t("capacityPressure")}</h2>
              <span>{t("usedCapacity")}</span>
            </div>
            <div className="capacity-list">
              {stats.capacity.map((item) => (
                <div className="capacity-row" key={item.labelKey}>
                  <div>
                    <span>{t(item.labelKey)}</span>
                    <strong>{item.used}%</strong>
                  </div>
                  <div className="capacity-track">
                    <div className="capacity-fill" style={{ width: `${item.used}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="analytics-panel hotspots-panel">
            <div className="panel-heading">
              <h2>{t("highNeedAreas")}</h2>
              <span>{location.name}</span>
            </div>
            <div className="hotspot-list">
              {stats.hotspots.map((hotspot, index) => (
                <div className="hotspot-row" key={hotspot}>
                  <strong>{index + 1}</strong>
                  <span>{hotspot}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default Analytics;
