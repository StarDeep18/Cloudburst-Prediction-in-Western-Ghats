import System.Environment
import Text.Read (readMaybe)

-- convert string to float safely
toFloat :: String -> Float
toFloat s = case readMaybe s of
    Just v -> v
    Nothing -> 0

-- safe list access
safeGet :: Int -> [String] -> Float
safeGet i xs =
    if length xs > i then toFloat (xs !! i) else 0

-- split CSV row
splitComma :: String -> [String]
splitComma [] = []
splitComma s =
    let (a,b) = break (==',') s
    in a : case b of
        [] -> []
        (_:rest) -> splitComma rest

-- extract features from row
getFeatures :: [String] -> (Float,Float,Float,Float,Float)
getFeatures cols =
    let rainfall = safeGet 3 cols
        humidity = safeGet 5 cols
        temp     = safeGet 6 cols
        windU    = safeGet 7 cols
        windV    = safeGet 8 cols
        wind     = sqrt (windU*windU + windV*windV)
        pressure = 1013  -- dataset doesn't contain pressure
    in (rainfall, humidity, pressure, temp, wind)

-- recursive dataset processing
processRows :: [[String]] -> (Float,Float,Float,Float,Float) -> Int -> (Float,Float,Float,Float,Float)
processRows [] acc _ = acc
processRows (r:rs) (sr,sh,sp,st,sw) n =
    let (rain,hum,pres,temp,wind) = getFeatures r
    in processRows rs (sr+rain,sh+hum,sp+pres,st+temp,sw+wind) (n+1)

-- normalization
normalize :: Float -> Float -> Float -> Float
normalize minVal maxVal x =
    max 0 (min 1 ((x - minVal) / (maxVal - minVal)))

-- risk classification using guards
riskLevel :: Int -> String
riskLevel p
    | p >= 80 = "Extreme Cloudburst Risk"
    | p >= 60 = "High Cloudburst Risk"
    | p >= 40 = "Moderate Cloudburst Risk"
    | otherwise = "Low Cloudburst Risk"

main :: IO ()
main = do
    args <- getArgs
    let file = head args

    content <- readFile file
    let rows = map splitComma (tail (lines content))

    let (sr,sh,sp,st,sw) = processRows rows (0,0,0,0,0) 0
    let count = fromIntegral (length rows)

    let avgRain = sr / count
    let avgHum  = sh / count
    let avgPres = sp / count
    let avgTemp = st / count
    let avgWind = sw / count

    -- normalized weighted score
    let score =
            0.40 * normalize 0 300 avgRain +
            0.25 * normalize 0 100 avgHum +
            0.15 * normalize 10 40 avgTemp +
            0.10 * normalize 0 25 avgWind +
            0.10 * normalize 0 100 (1013 - avgPres)

    let probability = round (score * 100)

    let risk = riskLevel probability

    putStrLn (risk ++ "|" ++ show probability)