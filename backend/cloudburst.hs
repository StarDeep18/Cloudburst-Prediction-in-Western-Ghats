import System.Environment
import Text.Read (readMaybe)

-- safe string → float
toFloat :: String -> Float
toFloat s =
    case readMaybe s of
        Just v -> v
        Nothing -> 0

-- safe column access
safeGet :: Int -> [String] -> Float
safeGet i xs =
    if length xs > i then toFloat (xs !! i) else 0

-- split CSV line
splitComma :: String -> [String]
splitComma [] = []
splitComma s =
    let (a,b) = break (==',') s
    in a : case b of
        [] -> []
        (_:rest) -> splitComma rest

-- column extractors
getRain r = safeGet 3 r
getHumidity r = safeGet 4 r
getPressure r = safeGet 5 r
getTemp r = safeGet 6 r
getWind r = safeGet 7 r

-- recursion: average calculation
avgRec :: ( [String] -> Float ) -> [[String]] -> Float -> Int -> Float
avgRec _ [] total count =
    if count == 0 then 0 else total / fromIntegral count

avgRec f (r:rs) total count =
    avgRec f rs (total + f r) (count + 1)

avg f rows = avgRec f rows 0 0

-- normalize value 0–1
normalize :: Float -> Float -> Float -> Float
normalize minv maxv x =
    max 0 (min 1 ((x - minv) / (maxv - minv)))

-- guard-based risk classification
riskLevel :: Int -> String
riskLevel p
    | p >= 80 = "Extreme Cloudburst Risk"
    | p >= 60 = "High Cloudburst Risk"
    | p >= 40 = "Moderate Cloudburst Risk"
    | otherwise = "Low Cloudburst Risk"

-- horizon mapping
horizonDays :: String -> Int
horizonDays h
    | h == "day" = 1
    | h == "week" = 7
    | h == "month" = 30
    | h == "year" = 365
    | otherwise = 1

-- take last N rows
takeLast :: Int -> [a] -> [a]
takeLast n xs = reverse (take n (reverse xs))

main = do

    args <- getArgs

    let file = args !! 0
    let horizon = args !! 1

    content <- readFile file

    let rows = map splitComma (tail (lines content))

    let n = horizonDays horizon

    let recent = takeLast n rows

    let avgRain = avg getRain recent
    let avgHum = avg getHumidity recent
    let avgPres = (avg getPressure recent) / 100
    let avgTemp = avg getTemp recent
    let avgWind = avg getWind recent

    let score =
            0.40 * normalize 0 300 avgRain +
            0.25 * normalize 0 100 avgHum +
            0.15 * normalize 10 40 avgTemp +
            0.10 * normalize 0 25 avgWind +
            0.10 * normalize 950 1050 avgPres

    let probability = round (min 95 (score * 100))

    let risk = riskLevel probability

    putStrLn (risk ++ "|" ++ show probability)