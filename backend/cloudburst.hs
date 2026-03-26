import System.Environment
import Text.Read (readMaybe)

-- ── Helpers ───────────────────────────────────────────────────────────────────

toFloat :: String -> Float
toFloat s = case readMaybe s of
    Just v  -> v
    Nothing -> 0

safeGet :: Int -> [String] -> Float
safeGet i xs = if length xs > i then toFloat (xs !! i) else 0

splitComma :: String -> [String]
splitComma [] = []
splitComma s  =
    let (a, b) = break (== ',') s
    in  a : case b of
              []       -> []
              (_ : rest) -> splitComma rest

-- Column extractors for dataset fallback (MODE B)
getRain     r = safeGet 3 r
getHumidity r = safeGet 4 r
getPressure r = safeGet 5 r
getTemp     r = safeGet 6 r
getWind     r = safeGet 7 r

avgRec :: ([String] -> Float) -> [[String]] -> Float -> Int -> Float
avgRec _ [] total count = if count == 0 then 0 else total / fromIntegral count
avgRec f (r:rs) total count = avgRec f rs (total + f r) (count + 1)

avg :: ([String] -> Float) -> [[String]] -> Float
avg f rows = avgRec f rows 0 0

takeLast :: Int -> [a] -> [a]
takeLast n xs = reverse (take n (reverse xs))

horizonDays :: String -> Int
horizonDays h
    | h == "day"   = 1
    | h == "week"  = 7
    | h == "month" = 30
    | h == "year"  = 365
    | otherwise    = 1

-- ── Pressure safety: ensure value is always in hPa ───────────────────────────
-- If raw value > 2000 it is in Pascals — divide by 100
toHPa :: Float -> Float
toHPa p = if p > 2000 then p / 100 else p

-- ── Strict threshold-based classification ────────────────────────────────────
--
-- Priority: Cloudburst → Storm → Normal
--
-- Cloudburst : rainfall >= 200  AND  humidity >= 85  AND  pressure <= 995
-- Storm      : rainfall >= 80   AND  rainfall <  200
--              AND  humidity >= 70
--              AND  pressure <= 1005
--              AND  windSpeed >= 10
-- Normal     : everything else
--
classifyEvent :: Float -> Float -> Float -> Float -> String
classifyEvent rain hum pres wind
    | rain >= 200 && hum >= 85 && pres <= 995  = "Cloudburst"
    | rain >= 80  && rain < 200
        && hum  >= 70
        && pres <= 1005
        && wind >= 10                            = "Storm"
    | otherwise                                  = "Normal"

-- ── Deterministic probability from event type ─────────────────────────────────
--
-- Cloudburst → 85–95  (scale within band using how far inputs exceed thresholds)
-- Storm      → 50–80
-- Normal     → 0–40
--
-- The band position is driven by how strongly the inputs exceed their thresholds,
-- keeping it physically interpretable and never reaching 100.
--
eventProbability :: String -> Float -> Float -> Float -> Float -> Float -> Int
eventProbability "Cloudburst" rain hum pres wind _temp =
    let
        -- How far each feature exceeds its Cloudburst threshold (capped at 1)
        rainExcess = min 1.0 ((rain - 200) / 100)   -- 0 at 200mm, 1 at 300mm
        humExcess  = min 1.0 ((hum  - 85)  / 15)    -- 0 at 85%,   1 at 100%
        presExcess = min 1.0 ((995  - pres) / 30)    -- 0 at 995,   1 at 965 hPa
        windBonus  = min 0.5 (wind / 60)             -- small bonus for high wind
        strength   = (rainExcess + humExcess + presExcess + windBonus) / 3.5
        -- Map strength 0–1 onto band 85–95, cap at 95
        prob       = 85 + strength * 10
    in  round (min 95 prob)

eventProbability "Storm" rain hum pres wind _temp =
    let
        rainExcess = min 1.0 ((rain - 80)   / 120)  -- 0 at 80mm,  1 at 200mm
        humExcess  = min 1.0 ((hum  - 70)   / 30)   -- 0 at 70%,   1 at 100%
        presExcess = min 1.0 ((1005 - pres)  / 50)  -- 0 at 1005,  1 at 955 hPa
        windExcess = min 1.0 ((wind - 20)    / 40)  -- 0 at 20,    1 at 60 km/h
        strength   = (rainExcess + humExcess + presExcess + windExcess) / 4.0
        -- Map strength 0–1 onto band 50–80
        prob       = 50 + strength * 30
    in  round (min 80 prob)

eventProbability _ rain hum pres _wind _temp =
    let
        -- For Normal: probability reflects how close conditions are to thresholds
        -- Higher = more borderline; always stays 0–40
        rainScore = min 1.0 (rain / 80)
        humScore  = min 1.0 (hum  / 70)
        presScore = min 1.0 ((1013 - pres) / 20)
        strength  = (rainScore + humScore + presScore) / 3.0
        prob      = strength * 40
    in  round (min 40 prob)

-- ── Risk label from event type ────────────────────────────────────────────────
riskLabel :: String -> String
riskLabel "Cloudburst" = "High"
riskLabel "Storm"      = "Moderate"
riskLabel _            = "Low"

-- ── Color from event type ─────────────────────────────────────────────────────
colorLabel :: String -> String
colorLabel "Cloudburst" = "high"
colorLabel "Storm"      = "moderate"
colorLabel _            = "low"

-- ── Horizon dampening for probability ────────────────────────────────────────
-- Keeps probability within each band but reduces certainty for longer horizons
horizonDampen :: String -> Int -> Int
horizonDampen "Cloudburst" p = round (fromIntegral p * factor)
  where factor = 1.00  -- Cloudburst: no dampening (physical conditions drive it)
horizonDampen "Storm" p = round (fromIntegral p * factor)
  where factor = 0.95  -- slight uncertainty
horizonDampen _ p = p   -- Normal: no change

-- ── Entry point ───────────────────────────────────────────────────────────────
--
-- MODE A (7 args) – slider inputs:
--   runhaskell cloudburst.hs <dataset> <horizon>
--             <rainfall_mm> <humidity_%> <pressure_hPa>
--             <temperature_C> <windSpeed_kmh>
--
-- MODE B (2 args) – dataset average fallback:
--   runhaskell cloudburst.hs <dataset> <horizon>
--
-- Output: "<risk>|<probability>|<eventType>|<color>"
-- ─────────────────────────────────────────────────────────────────────────────
main :: IO ()
main = do
    args <- getArgs

    let file    = args !! 0
    let horizon = args !! 1

    (inputRain, inputHum, inputPres, inputTemp, inputWind) <-
        if length args >= 7
        then do
            -- MODE A: slider values passed directly; pressure already in hPa
            let rain = toFloat (args !! 2)
            let hum  = toFloat (args !! 3)
            let pres = toHPa (toFloat (args !! 4))
            let temp = toFloat (args !! 5)
            let wind = toFloat (args !! 6)
            return (rain, hum, pres, temp, wind)
        else do
            -- MODE B: compute averages from dataset
            content <- readFile file
            let rows   = map splitComma (tail (lines content))
            let n      = horizonDays horizon
            let recent = takeLast n rows
            let rain = avg getRain     recent
            let hum  = avg getHumidity recent
            let pres = toHPa (avg getPressure recent)  -- convert Pa → hPa safely
            let temp = avg getTemp     recent
            let wind = avg getWind     recent
            return (rain, hum, pres, temp, wind)

    let eventType   = classifyEvent inputRain inputHum inputPres inputWind
    let rawProb     = eventProbability eventType inputRain inputHum inputPres inputWind inputTemp
    let probability = horizonDampen eventType rawProb
    let risk        = riskLabel  eventType
    let color       = colorLabel eventType

    putStrLn (risk ++ "|" ++ show probability ++ "|" ++ eventType ++ "|" ++ color)
