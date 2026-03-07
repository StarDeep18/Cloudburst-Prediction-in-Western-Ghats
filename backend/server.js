const express = require("express")
const cors = require("cors")
const { exec } = require("child_process")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())

// dataset path
const datasetPath = path.join(__dirname, "..", "dataset", "cloudburst_dataset_large.csv")

// prediction endpoint
app.post("/predict", (req, res) => {

    console.log("Prediction request received")

    exec(
        `runhaskell cloudburst.hs "${datasetPath}"`,
        { cwd: __dirname }, // ensures Haskell runs inside backend folder
        (error, stdout, stderr) => {

            if (error) {
                console.error("Haskell error:", stderr)

                return res.json({
                    risk: "Error",
                    probability: 0,
                    interpretation: stderr,
                    color: "low"
                })
            }

            try {

                // expected output format from Haskell:
                // Risk Level|Probability
                const output = stdout.trim().split("|")

                const risk = output[0]
                const probability = parseInt(output[1]) || 0

                let color = "low"

                if (probability > 80) color = "high"
                else if (probability > 50) color = "moderate"

                res.json({
                    risk,
                    probability,
                    interpretation: "Prediction generated using Haskell model analysing dataset.",
                    color
                })

            } catch (e) {

                console.error("Parsing error:", e)

                res.json({
                    risk: "Error",
                    probability: 0,
                    interpretation: "Failed to parse Haskell output.",
                    color: "low"
                })
            }

        }
    )

})

app.listen(5000, () => {
    console.log("Haskell backend running on port 5000")
})