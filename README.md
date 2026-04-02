# ⛈ Cloudburst Prediction Dashboard - Western Ghats MVP

A clean, interactive MVP dashboard for predicting cloudburst risk across the Western Ghats region.
Built with **React + TailwindCSS + Recharts**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# 1. Navigate to the project folder
cd cloudburst-dashboard

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
cloudburst-dashboard/
├── public/
│   └── sample_dataset.csv       # Sample data to test with
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   ├── Toast.jsx            # Toast notifications
│   │   ├── OverviewPanel.jsx    # Dashboard overview / landing
│   │   ├── UploadPanel.jsx      # CSV upload + data preview
│   │   ├── PredictionPanel.jsx  # Prediction controls & results
│   │   ├── VisualizationPanel.jsx # Charts & graphs
│   │   └── RiskMap.jsx          # SVG-based Western Ghats risk map
│   ├── lib/
│   │   └── prediction.js        # Prediction logic & data utilities
│   ├── App.jsx                  # Main app with routing state
│   ├── main.jsx                 # Entry point
│   └── index.css                # Tailwind + global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 📊 Dataset Format

Your CSV should include these columns (column names are case-sensitive):

| Column       | Description                          | Example      |
|-------------|--------------------------------------|-------------|
| `TIME`       | Timestamp / date                     | 2023-06-01   |
| `LATITUDE`   | Geographic latitude                   | 12.4         |
| `LONGITUDE`  | Geographic longitude                  | 75.7         |
| `RAINFALL`   | Rainfall in mm                       | 145.3        |
| `humidity`   | Relative humidity (%)                | 85           |
| `temperature`| Temperature in °C                    | 26.5         |
| `wind_speed` | Wind speed in km/h                   | 38           |
| `pressure`   | Atmospheric pressure (hPa)           | 993          |
| `cloudburst` | Cloudburst event label (0 or 1)      | 1            |

A ready-to-use sample file is included at `public/sample_dataset.csv`.

---

## 🧠 Prediction Logic

The MVP uses a **weighted rule-based model** (mimicking a simplified Random Forest):

```
Risk Score = Σ(feature × weight) + interaction bonuses

Weights:
  Rainfall    → 35%
  Humidity    → 25%
  Low Pressure → 20%
  Temperature → 10%
  Wind Speed  → 10%

Interaction bonuses:
  Rainfall > 150 mm  AND Humidity > 80%  → +12%
  Pressure < 990 hPa AND Rainfall > 100  → +10%
  Wind > 40 km/h     AND Rainfall > 80   → +6%

Horizon dampening:
  Next Day   → ×1.00  (full confidence)
  Next Week  → ×0.88
  Next Month → ×0.72
  Next Year  → ×0.55
```

**Risk Levels:**
- 🟢 Low      → 0–34%
- 🟡 Moderate → 35–64%
- 🔴 High     → 65–100%

---

## ✨ Features

- **Drag-and-drop CSV upload** with column validation
- **Dataset summary** — row count, column coverage, first 10 rows preview
- **Prediction controls** — sliders for all features + horizon selector
- **Auto-fill from dataset averages** button
- **Risk output** — risk level badge, probability bar, factor breakdown
- **4 interactive charts** — rainfall trend, humidity/rainfall scatter, risk timeline, wind+rain dual axis
- **SVG risk map** of Western Ghats with geo-coded data points (if CSV has lat/lon)
- **Toast notifications** for upload success/errors
- **Responsive layout** — sidebar + main content

---

**AUTHORS**

Deepak Bharathwaj S

Kanipakam Poojitha

---

## 🛠 Tech Stack

| Layer       | Technology             |
|-------------|------------------------|
| Framework   | React 18               |
| Styling     | TailwindCSS 3          |
| Charts      | Recharts               |
| CSV Parsing | PapaParse              |
| Icons       | Lucide React           |
| Bundler     | Vite                   |

---

*Western Ghats Cloudburst Prediction System — MVP v1.0*
