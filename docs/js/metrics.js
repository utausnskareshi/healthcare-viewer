// Metric catalog: HealthKit type -> display info.
// Aggregation modes:
//   'sum'    - total in bucket (steps, distance, energy, minutes)
//   'avg'    - simple average (vitals, etc.)
//   'minmax' - average + range (heart rate-like)
//   'last'   - last value in bucket (weight, height)
//   'count'  - number of records (events)
//   'sleep'  - custom: sum by sleep stage values
//
// Groups: used for the dashboard sectioning.
//   activity, vital, body, mobility, hearing, respiratory,
//   reproductive, nutrition, mental, symptom, sleep, other

const M = (o) => o; // alias for readability

export const METRICS = {
  // ===== Activity =====
  HKQuantityTypeIdentifierStepCount: M({
    id:'StepCount', name:'歩数', unit:'歩', icon:'👟', group:'activity', agg:'sum', color:'#ff9f0a' }),
  HKQuantityTypeIdentifierDistanceWalkingRunning: M({
    id:'DistanceWalkingRunning', name:'歩行+ランニング距離', unit:'km', icon:'🚶', group:'activity', agg:'sum', color:'#0a84ff', distance:true }),
  HKQuantityTypeIdentifierDistanceCycling: M({
    id:'DistanceCycling', name:'サイクリング距離', unit:'km', icon:'🚴', group:'activity', agg:'sum', color:'#32ade6', distance:true }),
  HKQuantityTypeIdentifierDistanceSwimming: M({
    id:'DistanceSwimming', name:'水泳距離', unit:'m', icon:'🏊', group:'activity', agg:'sum', color:'#5ac8fa' }),
  HKQuantityTypeIdentifierSwimmingStrokeCount: M({
    id:'SwimmingStrokeCount', name:'水泳ストローク数', unit:'回', icon:'🌊', group:'activity', agg:'sum', color:'#64d2ff' }),
  HKQuantityTypeIdentifierDistanceWheelchair: M({
    id:'DistanceWheelchair', name:'車いす移動距離', unit:'km', icon:'♿', group:'activity', agg:'sum', color:'#0a84ff', distance:true }),
  HKQuantityTypeIdentifierPushCount: M({
    id:'PushCount', name:'車いすプッシュ数', unit:'回', icon:'♿', group:'activity', agg:'sum', color:'#0a84ff' }),
  HKQuantityTypeIdentifierFlightsClimbed: M({
    id:'FlightsClimbed', name:'上った階数', unit:'階', icon:'🪜', group:'activity', agg:'sum', color:'#ff9500' }),
  HKQuantityTypeIdentifierActiveEnergyBurned: M({
    id:'ActiveEnergyBurned', name:'アクティブエネルギー', unit:'kcal', icon:'🔥', group:'activity', agg:'sum', color:'#ff3b30' }),
  HKQuantityTypeIdentifierBasalEnergyBurned: M({
    id:'BasalEnergyBurned', name:'安静時消費エネルギー', unit:'kcal', icon:'💤', group:'activity', agg:'sum', color:'#af52de' }),
  HKQuantityTypeIdentifierAppleExerciseTime: M({
    id:'AppleExerciseTime', name:'エクササイズ時間', unit:'分', icon:'💪', group:'activity', agg:'sum', color:'#30d158' }),
  HKQuantityTypeIdentifierAppleMoveTime: M({
    id:'AppleMoveTime', name:'ムーブ時間', unit:'分', icon:'➡️', group:'activity', agg:'sum', color:'#ff2d55' }),
  HKQuantityTypeIdentifierAppleStandTime: M({
    id:'AppleStandTime', name:'スタンド時間', unit:'分', icon:'🕴️', group:'activity', agg:'sum', color:'#64d2ff' }),
  HKCategoryTypeIdentifierAppleStandHour: M({
    id:'AppleStandHour', name:'スタンド時間（時）', unit:'時間', icon:'⏱️', group:'activity', agg:'count', color:'#5ac8fa' }),
  HKQuantityTypeIdentifierVO2Max: M({
    id:'VO2Max', name:'最大酸素摂取量', unit:'mL/kg·min', icon:'🏃', group:'activity', agg:'avg', color:'#30d158' }),
  HKQuantityTypeIdentifierNikeFuel: M({
    id:'NikeFuel', name:'NikeFuel', unit:'pt', icon:'⭐', group:'activity', agg:'sum', color:'#ffcc00' }),

  // ===== Vital signs / Cardiac =====
  HKQuantityTypeIdentifierHeartRate: M({
    id:'HeartRate', name:'心拍数', unit:'bpm', icon:'❤️', group:'vital', agg:'minmax', color:'#ff2d55' }),
  HKQuantityTypeIdentifierRestingHeartRate: M({
    id:'RestingHeartRate', name:'安静時心拍数', unit:'bpm', icon:'💗', group:'vital', agg:'avg', color:'#ff375f' }),
  HKQuantityTypeIdentifierWalkingHeartRateAverage: M({
    id:'WalkingHeartRateAverage', name:'歩行時平均心拍数', unit:'bpm', icon:'🏃', group:'vital', agg:'avg', color:'#ff6482' }),
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: M({
    id:'HeartRateVariabilitySDNN', name:'心拍変動（HRV）', unit:'ms', icon:'〰️', group:'vital', agg:'avg', color:'#bf5af2' }),
  HKQuantityTypeIdentifierHeartRateRecoveryOneMinute: M({
    id:'HeartRateRecoveryOneMinute', name:'心拍回復（1分）', unit:'bpm', icon:'💓', group:'vital', agg:'avg', color:'#ff6482' }),
  HKQuantityTypeIdentifierBloodPressureSystolic: M({
    id:'BloodPressureSystolic', name:'血圧（収縮期）', unit:'mmHg', icon:'🩸', group:'vital', agg:'avg', color:'#ff3b30' }),
  HKQuantityTypeIdentifierBloodPressureDiastolic: M({
    id:'BloodPressureDiastolic', name:'血圧（拡張期）', unit:'mmHg', icon:'🩸', group:'vital', agg:'avg', color:'#ff9f0a' }),
  HKQuantityTypeIdentifierBodyTemperature: M({
    id:'BodyTemperature', name:'体温', unit:'℃', icon:'🌡️', group:'vital', agg:'avg', color:'#ff9500' }),
  HKQuantityTypeIdentifierBasalBodyTemperature: M({
    id:'BasalBodyTemperature', name:'基礎体温', unit:'℃', icon:'🌡️', group:'vital', agg:'avg', color:'#ff9500' }),
  HKQuantityTypeIdentifierOxygenSaturation: M({
    id:'OxygenSaturation', name:'血中酸素', unit:'%', icon:'🫁', group:'vital', agg:'avg', color:'#64d2ff', scale:100 }),
  HKQuantityTypeIdentifierBloodGlucose: M({
    id:'BloodGlucose', name:'血糖値', unit:'mg/dL', icon:'🍬', group:'vital', agg:'avg', color:'#ff3b30' }),
  HKQuantityTypeIdentifierBloodAlcoholContent: M({
    id:'BloodAlcoholContent', name:'血中アルコール', unit:'%', icon:'🍺', group:'vital', agg:'avg', color:'#ff9500', scale:100 }),
  HKQuantityTypeIdentifierPeripheralPerfusionIndex: M({
    id:'PeripheralPerfusionIndex', name:'末梢灌流指数', unit:'%', icon:'💧', group:'vital', agg:'avg', color:'#0a84ff', scale:100 }),
  HKCategoryTypeIdentifierHighHeartRateEvent: M({
    id:'HighHeartRateEvent', name:'心拍上昇イベント', unit:'回', icon:'⚠️', group:'vital', agg:'count', color:'#ff375f' }),
  HKCategoryTypeIdentifierLowHeartRateEvent: M({
    id:'LowHeartRateEvent', name:'心拍低下イベント', unit:'回', icon:'⚠️', group:'vital', agg:'count', color:'#ff9f0a' }),
  HKCategoryTypeIdentifierIrregularHeartRhythmEvent: M({
    id:'IrregularHeartRhythmEvent', name:'不整脈イベント', unit:'回', icon:'💔', group:'vital', agg:'count', color:'#ff3b30' }),
  HKQuantityTypeIdentifierAtrialFibrillationBurden: M({
    id:'AtrialFibrillationBurden', name:'心房細動の負荷', unit:'%', icon:'💔', group:'vital', agg:'avg', color:'#ff3b30', scale:100 }),
  HKDataTypeIdentifierElectrocardiogram: M({
    id:'Electrocardiogram', name:'心電図 (ECG)', unit:'回', icon:'📈', group:'vital', agg:'count', color:'#ff2d55' }),

  // ===== Respiratory =====
  HKQuantityTypeIdentifierRespiratoryRate: M({
    id:'RespiratoryRate', name:'呼吸数', unit:'回/分', icon:'🌬️', group:'respiratory', agg:'avg', color:'#5e5ce6' }),
  HKQuantityTypeIdentifierForcedVitalCapacity: M({
    id:'ForcedVitalCapacity', name:'努力肺活量', unit:'L', icon:'🫁', group:'respiratory', agg:'avg', color:'#32ade6' }),
  HKQuantityTypeIdentifierForcedExpiratoryVolume1: M({
    id:'ForcedExpiratoryVolume1', name:'1秒量 (FEV1)', unit:'L', icon:'🫁', group:'respiratory', agg:'avg', color:'#32ade6' }),
  HKQuantityTypeIdentifierPeakExpiratoryFlowRate: M({
    id:'PeakExpiratoryFlowRate', name:'最大呼気流量', unit:'L/min', icon:'🫁', group:'respiratory', agg:'avg', color:'#64d2ff' }),
  HKQuantityTypeIdentifierInhalerUsage: M({
    id:'InhalerUsage', name:'吸入器使用', unit:'回', icon:'💨', group:'respiratory', agg:'sum', color:'#0a84ff' }),

  // ===== Body measurements =====
  HKQuantityTypeIdentifierBodyMass: M({
    id:'BodyMass', name:'体重', unit:'kg', icon:'⚖️', group:'body', agg:'avg', color:'#8e8e93' }),
  HKQuantityTypeIdentifierHeight: M({
    id:'Height', name:'身長', unit:'cm', icon:'📏', group:'body', agg:'last', color:'#636366' }),
  HKQuantityTypeIdentifierBodyMassIndex: M({
    id:'BodyMassIndex', name:'BMI', unit:'', icon:'📊', group:'body', agg:'avg', color:'#8e8e93' }),
  HKQuantityTypeIdentifierBodyFatPercentage: M({
    id:'BodyFatPercentage', name:'体脂肪率', unit:'%', icon:'🍩', group:'body', agg:'avg', color:'#ff9500', scale:100 }),
  HKQuantityTypeIdentifierLeanBodyMass: M({
    id:'LeanBodyMass', name:'除脂肪体重', unit:'kg', icon:'💪', group:'body', agg:'avg', color:'#30d158' }),
  HKQuantityTypeIdentifierWaistCircumference: M({
    id:'WaistCircumference', name:'ウエスト周囲径', unit:'cm', icon:'📐', group:'body', agg:'avg', color:'#8e8e93' }),

  // ===== Hearing / Audio exposure =====
  HKQuantityTypeIdentifierEnvironmentalAudioExposure: M({
    id:'EnvironmentalAudioExposure', name:'環境音レベル', unit:'dB', icon:'🔊', group:'hearing', agg:'avg', color:'#ffcc00' }),
  HKQuantityTypeIdentifierHeadphoneAudioExposure: M({
    id:'HeadphoneAudioExposure', name:'ヘッドフォン音量', unit:'dB', icon:'🎧', group:'hearing', agg:'avg', color:'#ff9500' }),
  HKCategoryTypeIdentifierAudioExposureEvent: M({
    id:'AudioExposureEvent', name:'大音量環境イベント', unit:'回', icon:'📢', group:'hearing', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierHeadphoneAudioExposureEvent: M({
    id:'HeadphoneAudioExposureEvent', name:'ヘッドフォン大音量', unit:'回', icon:'🎧', group:'hearing', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierEnvironmentalAudioExposureEvent: M({
    id:'EnvironmentalAudioExposureEvent', name:'環境大音量', unit:'回', icon:'🔔', group:'hearing', agg:'count', color:'#ffcc00' }),

  // ===== Mobility =====
  HKQuantityTypeIdentifierWalkingSpeed: M({
    id:'WalkingSpeed', name:'歩行速度', unit:'km/h', icon:'⚡', group:'mobility', agg:'avg', color:'#32ade6' }),
  HKQuantityTypeIdentifierWalkingStepLength: M({
    id:'WalkingStepLength', name:'歩幅', unit:'cm', icon:'👣', group:'mobility', agg:'avg', color:'#5856d6' }),
  HKQuantityTypeIdentifierStairAscentSpeed: M({
    id:'StairAscentSpeed', name:'階段上昇速度', unit:'m/s', icon:'🔺', group:'mobility', agg:'avg', color:'#a2845e' }),
  HKQuantityTypeIdentifierStairDescentSpeed: M({
    id:'StairDescentSpeed', name:'階段下降速度', unit:'m/s', icon:'🔻', group:'mobility', agg:'avg', color:'#ac8e68' }),
  HKQuantityTypeIdentifierAppleWalkingSteadiness: M({
    id:'AppleWalkingSteadiness', name:'歩行安定性', unit:'%', icon:'🧍', group:'mobility', agg:'avg', color:'#34c759', scale:100 }),
  HKQuantityTypeIdentifierWalkingAsymmetryPercentage: M({
    id:'WalkingAsymmetryPercentage', name:'歩行非対称性', unit:'%', icon:'↔️', group:'mobility', agg:'avg', color:'#ff9500', scale:100 }),
  HKQuantityTypeIdentifierWalkingDoubleSupportPercentage: M({
    id:'WalkingDoubleSupportPercentage', name:'両脚支持時間', unit:'%', icon:'🦶', group:'mobility', agg:'avg', color:'#af52de', scale:100 }),
  HKQuantityTypeIdentifierSixMinuteWalkTestDistance: M({
    id:'SixMinuteWalkTestDistance', name:'6分間歩行', unit:'m', icon:'🚶‍♂️', group:'mobility', agg:'avg', color:'#30b0c7' }),
  HKQuantityTypeIdentifierPhysicalEffort: M({
    id:'PhysicalEffort', name:'運動強度', unit:'MET', icon:'💥', group:'mobility', agg:'avg', color:'#ff6b35' }),
  HKCategoryTypeIdentifierAppleWalkingSteadinessEvent: M({
    id:'AppleWalkingSteadinessEvent', name:'歩行安定性通知', unit:'回', icon:'⚠️', group:'mobility', agg:'count', color:'#ff9500' }),
  HKQuantityTypeIdentifierNumberOfTimesFallen: M({
    id:'NumberOfTimesFallen', name:'転倒回数', unit:'回', icon:'⚠️', group:'mobility', agg:'sum', color:'#ff3b30' }),
  HKQuantityTypeIdentifierRunningSpeed: M({
    id:'RunningSpeed', name:'ランニング速度', unit:'m/s', icon:'🏃', group:'mobility', agg:'avg', color:'#ff9500' }),
  HKQuantityTypeIdentifierRunningPower: M({
    id:'RunningPower', name:'ランニングパワー', unit:'W', icon:'⚡', group:'mobility', agg:'avg', color:'#ff3b30' }),
  HKQuantityTypeIdentifierRunningStrideLength: M({
    id:'RunningStrideLength', name:'ランニングストライド', unit:'m', icon:'🏃', group:'mobility', agg:'avg', color:'#ff9500' }),
  HKQuantityTypeIdentifierRunningVerticalOscillation: M({
    id:'RunningVerticalOscillation', name:'ランニング上下動', unit:'cm', icon:'📈', group:'mobility', agg:'avg', color:'#ff9500' }),
  HKQuantityTypeIdentifierRunningGroundContactTime: M({
    id:'RunningGroundContactTime', name:'接地時間', unit:'ms', icon:'👟', group:'mobility', agg:'avg', color:'#ff9500' }),
  HKQuantityTypeIdentifierCyclingSpeed: M({
    id:'CyclingSpeed', name:'サイクリング速度', unit:'km/h', icon:'🚴', group:'mobility', agg:'avg', color:'#32ade6' }),
  HKQuantityTypeIdentifierCyclingCadence: M({
    id:'CyclingCadence', name:'ケイデンス', unit:'rpm', icon:'🚴', group:'mobility', agg:'avg', color:'#0a84ff' }),
  HKQuantityTypeIdentifierCyclingPower: M({
    id:'CyclingPower', name:'サイクリングパワー', unit:'W', icon:'⚡', group:'mobility', agg:'avg', color:'#ff3b30' }),
  HKQuantityTypeIdentifierCyclingFunctionalThresholdPower: M({
    id:'CyclingFunctionalThresholdPower', name:'FTP（機能的作業閾値）', unit:'W', icon:'⚡', group:'mobility', agg:'avg', color:'#ff3b30' }),
  HKQuantityTypeIdentifierWorkoutEffortScore: M({
    id:'WorkoutEffortScore', name:'ワークアウト効果スコア', unit:'pt', icon:'🎯', group:'mobility', agg:'avg', color:'#ff9500' }),
  HKQuantityTypeIdentifierEstimatedWorkoutEffortScore: M({
    id:'EstimatedWorkoutEffortScore', name:'推定ワークアウト効果', unit:'pt', icon:'🎯', group:'mobility', agg:'avg', color:'#ff9f0a' }),
  HKQuantityTypeIdentifierUnderwaterDepth: M({
    id:'UnderwaterDepth', name:'水中深度', unit:'m', icon:'🤿', group:'mobility', agg:'minmax', color:'#0a84ff' }),
  HKQuantityTypeIdentifierWaterTemperature: M({
    id:'WaterTemperature', name:'水温', unit:'℃', icon:'🌊', group:'mobility', agg:'avg', color:'#5ac8fa' }),

  // ===== Sleep =====
  HKCategoryTypeIdentifierSleepAnalysis: M({
    id:'SleepAnalysis', name:'睡眠', unit:'時間', icon:'🛌', group:'sleep', agg:'sleep', color:'#5e5ce6' }),
  HKQuantityTypeIdentifierAppleSleepingWristTemperature: M({
    id:'AppleSleepingWristTemperature', name:'睡眠中手首温度', unit:'℃', icon:'🌡️', group:'sleep', agg:'avg', color:'#ff6b6b' }),
  HKQuantityTypeIdentifierAppleSleepingBreathingDisturbances: M({
    id:'AppleSleepingBreathingDisturbances', name:'睡眠中呼吸の乱れ', unit:'', icon:'😴', group:'sleep', agg:'avg', color:'#7d7aff' }),

  // ===== Nutrition =====
  HKQuantityTypeIdentifierDietaryEnergyConsumed: M({
    id:'DietaryEnergyConsumed', name:'摂取エネルギー', unit:'kcal', icon:'🍽️', group:'nutrition', agg:'sum', color:'#ff9500' }),
  HKQuantityTypeIdentifierDietaryCarbohydrates: M({
    id:'DietaryCarbohydrates', name:'炭水化物', unit:'g', icon:'🍞', group:'nutrition', agg:'sum', color:'#ffcc00' }),
  HKQuantityTypeIdentifierDietaryProtein: M({
    id:'DietaryProtein', name:'タンパク質', unit:'g', icon:'🥩', group:'nutrition', agg:'sum', color:'#ff3b30' }),
  HKQuantityTypeIdentifierDietaryFatTotal: M({
    id:'DietaryFatTotal', name:'脂質', unit:'g', icon:'🧈', group:'nutrition', agg:'sum', color:'#ffcc00' }),
  HKQuantityTypeIdentifierDietaryFatSaturated: M({
    id:'DietaryFatSaturated', name:'飽和脂肪酸', unit:'g', icon:'🧈', group:'nutrition', agg:'sum', color:'#ff9500' }),
  HKQuantityTypeIdentifierDietaryFatMonounsaturated: M({
    id:'DietaryFatMonounsaturated', name:'一価不飽和脂肪', unit:'g', icon:'🥑', group:'nutrition', agg:'sum', color:'#30d158' }),
  HKQuantityTypeIdentifierDietaryFatPolyunsaturated: M({
    id:'DietaryFatPolyunsaturated', name:'多価不飽和脂肪', unit:'g', icon:'🐟', group:'nutrition', agg:'sum', color:'#0a84ff' }),
  HKQuantityTypeIdentifierDietaryCholesterol: M({
    id:'DietaryCholesterol', name:'コレステロール', unit:'mg', icon:'🥚', group:'nutrition', agg:'sum', color:'#ff9500' }),
  HKQuantityTypeIdentifierDietarySodium: M({
    id:'DietarySodium', name:'ナトリウム', unit:'mg', icon:'🧂', group:'nutrition', agg:'sum', color:'#8e8e93' }),
  HKQuantityTypeIdentifierDietaryPotassium: M({
    id:'DietaryPotassium', name:'カリウム', unit:'mg', icon:'🍌', group:'nutrition', agg:'sum', color:'#ffcc00' }),
  HKQuantityTypeIdentifierDietarySugar: M({
    id:'DietarySugar', name:'糖質', unit:'g', icon:'🍬', group:'nutrition', agg:'sum', color:'#ff2d55' }),
  HKQuantityTypeIdentifierDietaryFiber: M({
    id:'DietaryFiber', name:'食物繊維', unit:'g', icon:'🥬', group:'nutrition', agg:'sum', color:'#30d158' }),
  HKQuantityTypeIdentifierDietaryWater: M({
    id:'DietaryWater', name:'水分摂取量', unit:'mL', icon:'💧', group:'nutrition', agg:'sum', color:'#64d2ff' }),
  HKQuantityTypeIdentifierDietaryCaffeine: M({
    id:'DietaryCaffeine', name:'カフェイン', unit:'mg', icon:'☕', group:'nutrition', agg:'sum', color:'#8e8e93' }),
  HKQuantityTypeIdentifierDietaryCalcium: M({
    id:'DietaryCalcium', name:'カルシウム', unit:'mg', icon:'🥛', group:'nutrition', agg:'sum', color:'#e5e5ea' }),
  HKQuantityTypeIdentifierDietaryIron: M({
    id:'DietaryIron', name:'鉄分', unit:'mg', icon:'🥬', group:'nutrition', agg:'sum', color:'#8e8e93' }),
  HKQuantityTypeIdentifierDietaryVitaminC: M({
    id:'DietaryVitaminC', name:'ビタミンC', unit:'mg', icon:'🍊', group:'nutrition', agg:'sum', color:'#ff9500' }),

  // ===== Reproductive / Female health =====
  HKCategoryTypeIdentifierMenstrualFlow: M({
    id:'MenstrualFlow', name:'月経', unit:'日', icon:'🌸', group:'reproductive', agg:'flow', color:'#ff375f', special:'cycle' }),
  HKCategoryTypeIdentifierIntermenstrualBleeding: M({
    id:'IntermenstrualBleeding', name:'不正出血', unit:'回', icon:'🩸', group:'reproductive', agg:'count', color:'#ff2d55' }),
  HKCategoryTypeIdentifierInfrequentMenstrualCycles: M({
    id:'InfrequentMenstrualCycles', name:'希発月経', unit:'回', icon:'📅', group:'reproductive', agg:'count', color:'#ff375f' }),
  HKCategoryTypeIdentifierIrregularMenstrualCycles: M({
    id:'IrregularMenstrualCycles', name:'不規則な月経', unit:'回', icon:'📅', group:'reproductive', agg:'count', color:'#ff375f' }),
  HKCategoryTypeIdentifierPersistentIntermenstrualBleeding: M({
    id:'PersistentIntermenstrualBleeding', name:'持続性不正出血', unit:'回', icon:'🩸', group:'reproductive', agg:'count', color:'#ff2d55' }),
  HKCategoryTypeIdentifierProlongedMenstrualPeriods: M({
    id:'ProlongedMenstrualPeriods', name:'過長月経', unit:'回', icon:'📅', group:'reproductive', agg:'count', color:'#ff375f' }),
  HKCategoryTypeIdentifierOvulationTestResult: M({
    id:'OvulationTestResult', name:'排卵検査結果', unit:'回', icon:'🔬', group:'reproductive', agg:'count', color:'#bf5af2' }),
  HKCategoryTypeIdentifierCervicalMucusQuality: M({
    id:'CervicalMucusQuality', name:'頸管粘液', unit:'回', icon:'💧', group:'reproductive', agg:'count', color:'#0a84ff' }),
  HKCategoryTypeIdentifierSexualActivity: M({
    id:'SexualActivity', name:'性行為', unit:'回', icon:'💞', group:'reproductive', agg:'count', color:'#ff375f' }),
  HKCategoryTypeIdentifierContraceptive: M({
    id:'Contraceptive', name:'避妊', unit:'回', icon:'💊', group:'reproductive', agg:'count', color:'#bf5af2' }),
  HKCategoryTypeIdentifierLactation: M({
    id:'Lactation', name:'授乳', unit:'回', icon:'🍼', group:'reproductive', agg:'count', color:'#64d2ff' }),
  HKCategoryTypeIdentifierPregnancy: M({
    id:'Pregnancy', name:'妊娠', unit:'回', icon:'🤰', group:'reproductive', agg:'count', color:'#ff6482' }),
  HKCategoryTypeIdentifierPregnancyTestResult: M({
    id:'PregnancyTestResult', name:'妊娠検査結果', unit:'回', icon:'🔬', group:'reproductive', agg:'count', color:'#ff6482' }),
  HKCategoryTypeIdentifierProgesteroneTestResult: M({
    id:'ProgesteroneTestResult', name:'プロゲステロン検査', unit:'回', icon:'🔬', group:'reproductive', agg:'count', color:'#bf5af2' }),

  // Cycle-related symptoms (Apple categorizes these under cycle tracking symptoms)
  HKCategoryTypeIdentifierAcne: M({
    id:'Acne', name:'にきび', unit:'回', icon:'🔴', group:'reproductive', agg:'count', color:'#ff6b6b' }),
  HKCategoryTypeIdentifierAppetiteChanges: M({
    id:'AppetiteChanges', name:'食欲の変化', unit:'回', icon:'🍴', group:'reproductive', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierBladderIncontinence: M({
    id:'BladderIncontinence', name:'尿失禁', unit:'回', icon:'💧', group:'reproductive', agg:'count', color:'#0a84ff' }),
  HKCategoryTypeIdentifierBreastPain: M({
    id:'BreastPain', name:'乳房の痛み', unit:'回', icon:'💗', group:'reproductive', agg:'count', color:'#ff375f' }),
  HKCategoryTypeIdentifierDrySkin: M({
    id:'DrySkin', name:'乾燥肌', unit:'回', icon:'🧴', group:'reproductive', agg:'count', color:'#ffcc00' }),
  HKCategoryTypeIdentifierGeneralizedBodyAche: M({
    id:'GeneralizedBodyAche', name:'全身の痛み', unit:'回', icon:'🤕', group:'reproductive', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierHairLoss: M({
    id:'HairLoss', name:'抜け毛', unit:'回', icon:'💇', group:'reproductive', agg:'count', color:'#8e8e93' }),
  HKCategoryTypeIdentifierVaginalDryness: M({
    id:'VaginalDryness', name:'膣の乾燥', unit:'回', icon:'🌸', group:'reproductive', agg:'count', color:'#bf5af2' }),

  // ===== Mental health / Mindfulness =====
  HKCategoryTypeIdentifierMindfulSession: M({
    id:'MindfulSession', name:'マインドフルネス', unit:'分', icon:'🧘', group:'mental', agg:'duration', color:'#bf5af2' }),
  HKStateOfMind: M({
    id:'StateOfMind', name:'気分', unit:'', icon:'😊', group:'mental', agg:'avg', color:'#ff9500' }),

  // ===== Symptoms (common subset) =====
  HKCategoryTypeIdentifierAbdominalCramps: M({ id:'AbdominalCramps', name:'腹痛', unit:'回', icon:'🤕', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierBloating: M({ id:'Bloating', name:'腹部膨満', unit:'回', icon:'🫃', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierChestTightnessOrPain: M({ id:'ChestTightnessOrPain', name:'胸部症状', unit:'回', icon:'💔', group:'symptom', agg:'count', color:'#ff3b30' }),
  HKCategoryTypeIdentifierChills: M({ id:'Chills', name:'悪寒', unit:'回', icon:'🥶', group:'symptom', agg:'count', color:'#0a84ff' }),
  HKCategoryTypeIdentifierConstipation: M({ id:'Constipation', name:'便秘', unit:'回', icon:'🚽', group:'symptom', agg:'count', color:'#8e8e93' }),
  HKCategoryTypeIdentifierCoughing: M({ id:'Coughing', name:'咳', unit:'回', icon:'😷', group:'symptom', agg:'count', color:'#8e8e93' }),
  HKCategoryTypeIdentifierDiarrhea: M({ id:'Diarrhea', name:'下痢', unit:'回', icon:'🚽', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierDizziness: M({ id:'Dizziness', name:'めまい', unit:'回', icon:'😵‍💫', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierFatigue: M({ id:'Fatigue', name:'疲労', unit:'回', icon:'😩', group:'symptom', agg:'count', color:'#8e8e93' }),
  HKCategoryTypeIdentifierFever: M({ id:'Fever', name:'発熱', unit:'回', icon:'🥵', group:'symptom', agg:'count', color:'#ff3b30' }),
  HKCategoryTypeIdentifierHeadache: M({ id:'Headache', name:'頭痛', unit:'回', icon:'🤕', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierHeartburn: M({ id:'Heartburn', name:'胸焼け', unit:'回', icon:'🔥', group:'symptom', agg:'count', color:'#ff3b30' }),
  HKCategoryTypeIdentifierHotFlashes: M({ id:'HotFlashes', name:'ホットフラッシュ', unit:'回', icon:'🥵', group:'symptom', agg:'count', color:'#ff3b30' }),
  HKCategoryTypeIdentifierLowerBackPain: M({ id:'LowerBackPain', name:'腰痛', unit:'回', icon:'🦴', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierMemoryLapse: M({ id:'MemoryLapse', name:'物忘れ', unit:'回', icon:'🧠', group:'symptom', agg:'count', color:'#bf5af2' }),
  HKCategoryTypeIdentifierMoodChanges: M({ id:'MoodChanges', name:'気分の変動', unit:'回', icon:'😐', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierNausea: M({ id:'Nausea', name:'吐き気', unit:'回', icon:'🤢', group:'symptom', agg:'count', color:'#30d158' }),
  HKCategoryTypeIdentifierNightSweats: M({ id:'NightSweats', name:'寝汗', unit:'回', icon:'💦', group:'symptom', agg:'count', color:'#0a84ff' }),
  HKCategoryTypeIdentifierPelvicPain: M({ id:'PelvicPain', name:'骨盤痛', unit:'回', icon:'🦴', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierRapidPoundingOrFlutteringHeartbeat: M({ id:'RapidHeartbeat', name:'動悸', unit:'回', icon:'💓', group:'symptom', agg:'count', color:'#ff2d55' }),
  HKCategoryTypeIdentifierShortnessOfBreath: M({ id:'ShortnessOfBreath', name:'息切れ', unit:'回', icon:'😤', group:'symptom', agg:'count', color:'#0a84ff' }),
  HKCategoryTypeIdentifierSinusCongestion: M({ id:'SinusCongestion', name:'鼻づまり', unit:'回', icon:'🤧', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierSkippedHeartbeat: M({ id:'SkippedHeartbeat', name:'期外収縮', unit:'回', icon:'💔', group:'symptom', agg:'count', color:'#ff3b30' }),
  HKCategoryTypeIdentifierSleepChanges: M({ id:'SleepChanges', name:'睡眠の変化', unit:'回', icon:'😴', group:'symptom', agg:'count', color:'#bf5af2' }),
  HKCategoryTypeIdentifierSoreThroat: M({ id:'SoreThroat', name:'喉の痛み', unit:'回', icon:'🤒', group:'symptom', agg:'count', color:'#ff9500' }),
  HKCategoryTypeIdentifierVomiting: M({ id:'Vomiting', name:'嘔吐', unit:'回', icon:'🤮', group:'symptom', agg:'count', color:'#30d158' }),
  HKCategoryTypeIdentifierWheezing: M({ id:'Wheezing', name:'喘鳴', unit:'回', icon:'😮‍💨', group:'symptom', agg:'count', color:'#5856d6' }),
  HKCategoryTypeIdentifierLossOfSmell: M({ id:'LossOfSmell', name:'嗅覚の低下', unit:'回', icon:'👃', group:'symptom', agg:'count', color:'#bf5af2' }),
  HKCategoryTypeIdentifierLossOfTaste: M({ id:'LossOfTaste', name:'味覚の低下', unit:'回', icon:'👅', group:'symptom', agg:'count', color:'#bf5af2' }),
  HKCategoryTypeIdentifierRunnyNose: M({ id:'RunnyNose', name:'鼻水', unit:'回', icon:'🤧', group:'symptom', agg:'count', color:'#5ac8fa' }),
  HKCategoryTypeIdentifierFainting: M({ id:'Fainting', name:'失神', unit:'回', icon:'😵', group:'symptom', agg:'count', color:'#ff3b30' }),

  // ===== Other events =====
  HKCategoryTypeIdentifierHandwashingEvent: M({
    id:'HandwashingEvent', name:'手洗い', unit:'回', icon:'🧼', group:'other', agg:'count', color:'#0a84ff' }),
  HKCategoryTypeIdentifierToothbrushingEvent: M({
    id:'ToothbrushingEvent', name:'歯磨き', unit:'回', icon:'🪥', group:'other', agg:'count', color:'#30d158' }),
  HKQuantityTypeIdentifierUVExposure: M({
    id:'UVExposure', name:'紫外線曝露', unit:'indx', icon:'☀️', group:'other', agg:'avg', color:'#ffcc00' }),
  HKQuantityTypeIdentifierTimeInDaylight: M({
    id:'TimeInDaylight', name:'日光浴時間', unit:'分', icon:'🌞', group:'other', agg:'sum', color:'#ffcc00' }),
  HKQuantityTypeIdentifierEnvironmentalSoundReduction: M({
    id:'EnvironmentalSoundReduction', name:'環境音低減', unit:'dB', icon:'🔇', group:'hearing', agg:'avg', color:'#ffcc00' }),
  HKQuantityTypeIdentifierInsulinDelivery: M({
    id:'InsulinDelivery', name:'インスリン投与量', unit:'IU', icon:'💉', group:'other', agg:'sum', color:'#ff3b30' }),
  HKQuantityTypeIdentifierNumberOfAlcoholicBeverages: M({
    id:'NumberOfAlcoholicBeverages', name:'アルコール飲料数', unit:'杯', icon:'🍺', group:'other', agg:'sum', color:'#ff9500' }),
};

export const GROUPS = {
  activity:     { name:'アクティビティ', icon:'🏃', order:1 },
  vital:        { name:'バイタル',       icon:'❤️', order:2 },
  respiratory:  { name:'呼吸',           icon:'🫁', order:3 },
  body:         { name:'身体測定',       icon:'⚖️', order:4 },
  mobility:     { name:'モビリティ',     icon:'🚶', order:5 },
  hearing:      { name:'聴覚',           icon:'🎧', order:6 },
  sleep:        { name:'睡眠',           icon:'🛌', order:7 },
  nutrition:    { name:'栄養',           icon:'🍽️', order:8 },
  reproductive: { name:'女性の健康',     icon:'🌸', order:9 },
  mental:       { name:'心の健康',       icon:'🧘', order:10 },
  symptom:      { name:'症状',           icon:'🤒', order:11 },
  other:        { name:'その他',         icon:'📌', order:12 },
};

// Index by short id
export const BY_SHORT_ID = Object.fromEntries(
  Object.entries(METRICS).map(([k, v]) => [v.id, { hkType: k, ...v }])
);

// Catalog info by HK type (with fallback)
export function metricForType(hkType) {
  const m = METRICS[hkType];
  if (m) return { hkType, ...m };
  // Fallback: auto-generate basic info for unknown types.
  const isCategory = hkType.startsWith('HKCategoryTypeIdentifier');
  const short = hkType.replace(/^HK(Quantity|Category)TypeIdentifier/, '') || hkType;
  return {
    hkType,
    id: short,
    name: short,
    unit: '',
    icon: isCategory ? '📌' : '📈',
    group: 'other',
    agg: isCategory ? 'count' : 'avg',
    color: '#8e8e93',
    _auto: true,
  };
}

export function metricByShortId(shortId) {
  return BY_SHORT_ID[shortId];
}

// km normalization
export function normalizeDistance(value, unit) {
  if (!unit) return value;
  if (unit === 'mi') return value * 1.609344;
  return value;
}

// ===== Workout activity types =====
export const WORKOUT_TYPES = {
  HKWorkoutActivityTypeAmericanFootball: 'アメリカンフットボール',
  HKWorkoutActivityTypeArchery: 'アーチェリー',
  HKWorkoutActivityTypeAustralianFootball: 'オーストラリアンフットボール',
  HKWorkoutActivityTypeBadminton: 'バドミントン',
  HKWorkoutActivityTypeBarre: 'バー',
  HKWorkoutActivityTypeBaseball: '野球',
  HKWorkoutActivityTypeBasketball: 'バスケットボール',
  HKWorkoutActivityTypeBowling: 'ボウリング',
  HKWorkoutActivityTypeBoxing: 'ボクシング',
  HKWorkoutActivityTypeCardioDance: 'カーディオダンス',
  HKWorkoutActivityTypeClimbing: 'クライミング',
  HKWorkoutActivityTypeCooldown: 'クールダウン',
  HKWorkoutActivityTypeCoreTraining: 'コアトレーニング',
  HKWorkoutActivityTypeCricket: 'クリケット',
  HKWorkoutActivityTypeCrossCountrySkiing: 'クロスカントリースキー',
  HKWorkoutActivityTypeCrossTraining: 'クロストレーニング',
  HKWorkoutActivityTypeCurling: 'カーリング',
  HKWorkoutActivityTypeCycling: 'サイクリング',
  HKWorkoutActivityTypeDance: 'ダンス',
  HKWorkoutActivityTypeDanceInspiredTraining: 'ダンス系トレーニング',
  HKWorkoutActivityTypeDiscSports: 'ディスクスポーツ',
  HKWorkoutActivityTypeDownhillSkiing: 'ダウンヒルスキー',
  HKWorkoutActivityTypeElliptical: 'エリプティカル',
  HKWorkoutActivityTypeEquestrianSports: '乗馬',
  HKWorkoutActivityTypeFencing: 'フェンシング',
  HKWorkoutActivityTypeFishing: '釣り',
  HKWorkoutActivityTypeFitnessGaming: 'フィットネスゲーム',
  HKWorkoutActivityTypeFlexibility: '柔軟運動',
  HKWorkoutActivityTypeFunctionalStrengthTraining: '機能的筋力トレーニング',
  HKWorkoutActivityTypeGolf: 'ゴルフ',
  HKWorkoutActivityTypeGymnastics: '体操',
  HKWorkoutActivityTypeHandCycling: 'ハンドサイクリング',
  HKWorkoutActivityTypeHandball: 'ハンドボール',
  HKWorkoutActivityTypeHighIntensityIntervalTraining: 'HIIT',
  HKWorkoutActivityTypeHiking: 'ハイキング',
  HKWorkoutActivityTypeHockey: 'ホッケー',
  HKWorkoutActivityTypeHunting: '狩猟',
  HKWorkoutActivityTypeJumpRope: '縄跳び',
  HKWorkoutActivityTypeKickboxing: 'キックボクシング',
  HKWorkoutActivityTypeLacrosse: 'ラクロス',
  HKWorkoutActivityTypeMartialArts: '武術',
  HKWorkoutActivityTypeMindAndBody: '心と体',
  HKWorkoutActivityTypeMixedCardio: '複合カーディオ',
  HKWorkoutActivityTypeMixedMetabolicCardioTraining: 'カーディオトレーニング',
  HKWorkoutActivityTypeOther: 'その他',
  HKWorkoutActivityTypePaddleSports: 'パドルスポーツ',
  HKWorkoutActivityTypePickleball: 'ピックルボール',
  HKWorkoutActivityTypePilates: 'ピラティス',
  HKWorkoutActivityTypePlay: '遊び',
  HKWorkoutActivityTypePreparationAndRecovery: '準備と回復',
  HKWorkoutActivityTypeRacquetball: 'ラケットボール',
  HKWorkoutActivityTypeRockClimbing: 'ロッククライミング',
  HKWorkoutActivityTypeRowing: 'ローイング',
  HKWorkoutActivityTypeRugby: 'ラグビー',
  HKWorkoutActivityTypeRunning: 'ランニング',
  HKWorkoutActivityTypeSailing: 'セーリング',
  HKWorkoutActivityTypeSkatingSports: 'スケート',
  HKWorkoutActivityTypeSnowSports: 'スノースポーツ',
  HKWorkoutActivityTypeSnowboarding: 'スノーボード',
  HKWorkoutActivityTypeSoccer: 'サッカー',
  HKWorkoutActivityTypeSocialDance: 'ソーシャルダンス',
  HKWorkoutActivityTypeSoftball: 'ソフトボール',
  HKWorkoutActivityTypeSquash: 'スカッシュ',
  HKWorkoutActivityTypeStairClimbing: '階段登り',
  HKWorkoutActivityTypeStairs: '階段',
  HKWorkoutActivityTypeStepTraining: 'ステップトレーニング',
  HKWorkoutActivityTypeSurfingSports: 'サーフィン',
  HKWorkoutActivityTypeSwimBikeRun: 'トライアスロン',
  HKWorkoutActivityTypeSwimming: '水泳',
  HKWorkoutActivityTypeTableTennis: '卓球',
  HKWorkoutActivityTypeTaiChi: '太極拳',
  HKWorkoutActivityTypeTennis: 'テニス',
  HKWorkoutActivityTypeTrackAndField: '陸上競技',
  HKWorkoutActivityTypeTraditionalStrengthTraining: '筋力トレーニング',
  HKWorkoutActivityTypeTransition: 'トランジション',
  HKWorkoutActivityTypeUnderwaterDiving: 'ダイビング',
  HKWorkoutActivityTypeVolleyball: 'バレーボール',
  HKWorkoutActivityTypeWalking: '徒歩',
  HKWorkoutActivityTypeWaterFitness: 'アクアフィットネス',
  HKWorkoutActivityTypeWaterPolo: '水球',
  HKWorkoutActivityTypeWaterSports: 'ウォータースポーツ',
  HKWorkoutActivityTypeWheelchairRunPace: '車いす（ランニングペース）',
  HKWorkoutActivityTypeWheelchairWalkPace: '車いす（ウォーキングペース）',
  HKWorkoutActivityTypeWrestling: 'レスリング',
  HKWorkoutActivityTypeYoga: 'ヨガ',
};

export function workoutTypeName(t) {
  return WORKOUT_TYPES[t] || t?.replace('HKWorkoutActivityType', '') || '不明';
}

// ===== Menstrual flow value mapping =====
// HKCategoryValueMenstrualFlow* → simple intensity key
export const MENSTRUAL_FLOW = {
  HKCategoryValueMenstrualFlowNone:        { key:'none',        name:'なし',     color:'#e5e5ea', level:0 },
  HKCategoryValueMenstrualFlowUnspecified: { key:'unspecified', name:'記録あり', color:'#ff97a8', level:1 },
  HKCategoryValueMenstrualFlowLight:       { key:'light',       name:'少量',     color:'#ff97a8', level:2 },
  HKCategoryValueMenstrualFlowMedium:      { key:'medium',      name:'中量',     color:'#ff5470', level:3 },
  HKCategoryValueMenstrualFlowHeavy:       { key:'heavy',       name:'多量',     color:'#c5172e', level:4 },
};
export function flowFromValue(v) {
  // numeric value (older exports) or string
  if (v == null) return null;
  if (typeof v === 'number' || /^\d+$/.test(String(v))) {
    const n = parseInt(v, 10);
    return ({ 1:'unspecified', 2:'light', 3:'medium', 4:'heavy' })[n] || null;
  }
  return MENSTRUAL_FLOW[v]?.key || null;
}

// HKCategoryValueOvulationTestResult* mapping
export const OVULATION_TEST = {
  HKCategoryValueOvulationTestResultNegative:                     { key:'neg', name:'陰性',  color:'#8e8e93' },
  HKCategoryValueOvulationTestResultLuteinizingHormoneSurge:      { key:'lh',  name:'LHサージ', color:'#bf5af2' },
  HKCategoryValueOvulationTestResultEstrogenSurge:                { key:'es',  name:'エストロゲン上昇', color:'#5e5ce6' },
  HKCategoryValueOvulationTestResultIndeterminate:                { key:'ind', name:'判定不能', color:'#ffcc00' },
  HKCategoryValueOvulationTestResultPositive:                     { key:'pos', name:'陽性',  color:'#ff375f' },
};
export function ovulationFromValue(v) {
  if (v == null) return null;
  if (/^\d+$/.test(String(v))) {
    const n = parseInt(v, 10);
    return ({ 1:'neg', 2:'lh', 3:'ind', 4:'es' })[n] || null;
  }
  return OVULATION_TEST[v]?.key || null;
}

// ===== Sleep stage mapping =====
export const SLEEP_STAGES = {
  'HKCategoryValueSleepAnalysisInBed':            { key:'inBed',   name:'ベッド',       color:'#8e8e93' },
  'HKCategoryValueSleepAnalysisAsleep':           { key:'asleep',  name:'睡眠',         color:'#5856d6' },
  'HKCategoryValueSleepAnalysisAsleepUnspecified':{ key:'asleep',  name:'睡眠',         color:'#5856d6' },
  'HKCategoryValueSleepAnalysisAsleepCore':       { key:'core',    name:'コア',         color:'#5ac8fa' },
  'HKCategoryValueSleepAnalysisAsleepDeep':       { key:'deep',    name:'深い睡眠',     color:'#0a84ff' },
  'HKCategoryValueSleepAnalysisAsleepREM':        { key:'rem',     name:'レム睡眠',     color:'#bf5af2' },
  'HKCategoryValueSleepAnalysisAwake':            { key:'awake',   name:'覚醒',         color:'#ff9500' },
};
