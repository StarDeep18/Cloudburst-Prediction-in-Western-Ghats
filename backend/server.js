const express = require("express")
const cors = require("cors")
const { exec } = require("child_process")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())

const PORT = 5000

app.post("/predict", (req, res) => {

    const horizon = req.body.horizon || "day"

    console.log("Prediction request received")
    console.log("Horizon received:", horizon)

    const datasetPath = path.join(__dirname, "../dataset/cloudburst_dataset_large.csv")

    const command =
        `runhaskell cloudburst.hs "${datasetPath}" ${horizon}`

    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {

        if (error) {
            console.error("Haskell error:", stderr)

            return res.json({
                risk: "Error",
                probability: 0,
                interpretation: stderr
            })
        }

        const output = stdout.trim()

        if (!output.includes("|")) {
            return res.json({
                risk: "Error",
                probability: 0,
                interpretation: "Invalid output from Haskell"
            })
        }

        const parts = output.split("|")

        const risk = parts[0]
        const probability = parseInt(parts[1])

        let color = "low";

if (probability >= 80) color = "high";
else if (probability >= 40) color = "moderate";
else color = "low";

res.json({
  risk: risk,
  probability: probability,
  color: color,
  interpretation: "Prediction generated from dataset analysis."
});

    })

})

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})