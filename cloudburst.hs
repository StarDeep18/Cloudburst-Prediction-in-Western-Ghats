import System.Environment

-- Recursive rainfall accumulation
rainScore :: [Float] -> Float
rainScore [] = 0
rainScore (x:xs)
    | x > 200   = 5 + rainScore xs
    | x > 150   = 3 + rainScore xs
    | x > 100   = 2 + rainScore xs
    | x > 50    = 1 + rainScore xs
    | otherwise = rainScore xs

-- Cloudburst risk classification using guards
riskLevel :: Float -> String
riskLevel score
    | score >= 10 = "High Cloudburst Risk"
    | score >= 6  = "Moderate Risk"
    | score >= 3  = "Low Risk"
    | otherwise   = "No Risk"

main :: IO ()
main = do
    args <- getArgs
    let rainfall = map read args :: [Float]
    let score = rainScore rainfall
    putStrLn (riskLevel score)