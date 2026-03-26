const express  = require("express")
const cors     = require("cors")
const { execFile, spawnSync } = require("child_process")
const path     = require("path")
const os       = require("os")
const fs       = require("fs")

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 5000

// ── Locate GHC tools ──────────────────────────────────────────────────────────
function findGHCTool(toolName) {
    // On non-Windows just use PATH
    if (os.platform() !== "win32") return toolName

    const ext = ".exe"

    // Probe GHCup version dirs newest-first
    const ghcVersionsDir = "C:\\ghcup\\ghc"
    if (fs.existsSync(ghcVersionsDir)) {
        const versions = fs.readdirSync(ghcVersionsDir).sort().reverse()
        for (const v of versions) {
            const p = path.join(ghcVersionsDir, v, "bin", toolName + ext)
            if (fs.existsSync(p)) return p
        }
    }

    // Fallback candidates
    const fallbacks = [
        path.join(os.homedir(), "AppData", "Roaming", "ghcup", "bin", toolName + ext),
        `C:\\ghcup\\bin\\${toolName}${ext}`,
    ]
    for (const p of fallbacks) {
        if (fs.existsSync(p)) return p
    }

    return toolName   // hope it's on PATH
}

// ── Compile cloudburst.hs to a binary once ────────────────────────────────────
// Keeps the compiled exe next to the .hs file.
// Uses a short safe path in %TEMP% as the output to avoid spaces.
function getCompiledBinary() {
    const scriptPath = path.join(__dirname, "cloudburst.hs")
    const isWin      = os.platform() === "win32"
    const exeName    = isWin ? "cloudburst_pred.exe" : "cloudburst_pred"

    // Put the binary in a temp dir with no spaces in the path
    const tempDir    = path.join(os.tmpdir(), "cloudburst_pred")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const binPath    = path.join(tempDir, exeName)
    const ghc        = findGHCTool("ghc")

    // Check if already compiled and up-to-date
    if (fs.existsSync(binPath)) {
        const srcMtime = fs.statSync(scriptPath).mtimeMs
        const binMtime = fs.statSync(binPath).mtimeMs
        if (binMtime >= srcMtime) {
            console.log("Using cached binary:", binPath)
            return { ok: true, binPath }
        }
    }

    console.log("Compiling cloudburst.hs with:", ghc)
    console.log("Output binary:", binPath)

    // ghc -o <output> <source>   — no shell involved, no space issues
    const result = spawnSync(ghc, ["-o", binPath, scriptPath], {
        encoding: "utf8",
        timeout:  60000,   // 60s compile timeout
    })

    if (result.status !== 0) {
        console.error("Compile error:", result.stderr)
        return { ok: false, error: result.stderr || result.error?.message || "Unknown compile error" }
    }

    console.log("Compiled successfully:", binPath)
    return { ok: true, binPath }
}

// ── Pre-compile at startup ────────────────────────────────────────────────────
let cachedBin = null
console.log("Pre-compiling cloudburst.hs...")
const compileResult = getCompiledBinary()
if (compileResult.ok) {
    cachedBin = compileResult.binPath
    console.log("Ready. Binary at:", cachedBin)
} else {
    console.warn("Pre-compile failed — will retry on first request:", compileResult.error)
}

// ── Interpretation builder ────────────────────────────────────────────────────
function buildInterpretation(eventType, horizon, rainfall, humidity, pressure, windSpeed) {
    const hz = horizon || "day"

    if (eventType === "Cloudburst") {
        return (
            `Cloudburst conditions confirmed for the ${hz} horizon. ` +
            `Rainfall (${rainfall.toFixed(0)} mm) exceeds the 200 mm threshold, ` +
            `humidity (${humidity.toFixed(0)}%) exceeds 85%, ` +
            `and pressure (${pressure.toFixed(0)} hPa) has dropped below 995 hPa — ` +
            `all three critical thresholds are breached simultaneously.`
        )
    }
    if (eventType === "Storm") {
        return (
            `Storm conditions detected for the ${hz} horizon. ` +
            `Rainfall (${rainfall.toFixed(0)} mm) is between 80–200 mm, ` +
            `humidity (${humidity.toFixed(0)}%) is at or above 70%, ` +
            `pressure (${pressure.toFixed(0)} hPa) is at or below 1005 hPa, ` +
            `and wind speed (${windSpeed.toFixed(1)} km/h) meets the 10 km/h threshold.`
        )
    }
    return (
        `No severe weather event detected for the ${hz} horizon. ` +
        `Current conditions (rainfall ${rainfall.toFixed(0)} mm, ` +
        `humidity ${humidity.toFixed(0)}%, ` +
        `pressure ${pressure.toFixed(0)} hPa) ` +
        `do not meet the thresholds for Storm or Cloudburst classification.`
    )
}

// ── Predict endpoint ──────────────────────────────────────────────────────────
app.post("/predict", (req, res) => {

    const horizon     = req.body.horizon     || "day"
    const rainfall    = parseFloat(req.body.rainfall)    || 0
    const humidity    = parseFloat(req.body.humidity)    || 0
    const windSpeed   = parseFloat(req.body.windSpeed)   || 0
    const temperature = parseFloat(req.body.temperature) || 25

    let pressureRaw = parseFloat(req.body.pressure) || 1013
    const pressure  = pressureRaw > 2000 ? pressureRaw / 100 : pressureRaw

    const hasAllInputs =
        req.body.rainfall    != null &&
        req.body.humidity    != null &&
        req.body.pressure    != null &&
        req.body.temperature != null &&
        req.body.windSpeed   != null

    console.log("Prediction request:", { horizon, rainfall, humidity, pressure, temperature, windSpeed })

    // Retry compile if startup compile failed
    if (!cachedBin) {
        const retry = getCompiledBinary()
        if (!retry.ok) {
            return res.json({
                eventType:      "Normal",
                probability:    0,
                risk:           "Low",
                color:          "low",
                interpretation: "Compile error: " + retry.error,
            })
        }
        cachedBin = retry.binPath
    }

    const datasetPath = path.join(__dirname, "../dataset/cloudburst_dataset_large.csv")

    // Call the compiled binary directly — no shell, no runhaskell, no space issues
    const args = hasAllInputs
        ? [datasetPath, horizon,
           String(rainfall), String(humidity), String(pressure),
           String(temperature), String(windSpeed)]
        : [datasetPath, horizon]

    console.log("Running binary:", cachedBin, args.join(" "))

    execFile(cachedBin, args, { timeout: 15000 }, (error, stdout, stderr) => {

        if (error) {
            console.error("Binary error:", stderr || error.message)
            return res.json({
                eventType:      "Normal",
                probability:    0,
                risk:           "Low",
                color:          "low",
                interpretation: "Prediction engine error: " + (stderr || error.message),
            })
        }

        const output = stdout.trim()
        console.log("Output:", output)

        if (!output.includes("|")) {
            return res.json({
                eventType:      "Normal",
                probability:    0,
                risk:           "Low",
                color:          "low",
                interpretation: "Invalid output: " + output,
            })
        }

        // Format: "risk|probability|eventType|color"
        const parts       = output.split("|")
        const risk        = parts[0]
        const probability = Math.min(95, parseInt(parts[1]) || 0)
        const eventType   = parts[2] || "Normal"
        const color       = parts[3] || "low"

        res.json({
            eventType,
            probability,
            risk,
            color,
            interpretation: buildInterpretation(eventType, horizon, rainfall, humidity, pressure, windSpeed),
            rainfall,
            humidity,
            pressure,
            temperature,
            windSpeed,
        })
    })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})