// Web Worker: streaming unzip + XML parse + aggregation + IndexedDB save.
// Classic worker (not a module) so we can importScripts() fflate UMD.

importScripts('../vendor/fflate/fflate.min.js');

// ---------- Metric catalog (subset duplicated for worker; keep in sync with metrics.js) ----------
// To keep the bundle lean, the worker only needs (id, agg, distance, scale, group) per HK type.
// Anything unknown falls back to a sensible default.
const METRICS = {
  // Activity
  HKQuantityTypeIdentifierStepCount:                   { id:'StepCount', agg:'sum' },
  HKQuantityTypeIdentifierDistanceWalkingRunning:      { id:'DistanceWalkingRunning', agg:'sum', distance:true },
  HKQuantityTypeIdentifierDistanceCycling:             { id:'DistanceCycling', agg:'sum', distance:true },
  HKQuantityTypeIdentifierDistanceSwimming:            { id:'DistanceSwimming', agg:'sum' },
  HKQuantityTypeIdentifierSwimmingStrokeCount:         { id:'SwimmingStrokeCount', agg:'sum' },
  HKQuantityTypeIdentifierDistanceWheelchair:          { id:'DistanceWheelchair', agg:'sum', distance:true },
  HKQuantityTypeIdentifierPushCount:                   { id:'PushCount', agg:'sum' },
  HKQuantityTypeIdentifierFlightsClimbed:              { id:'FlightsClimbed', agg:'sum' },
  HKQuantityTypeIdentifierActiveEnergyBurned:          { id:'ActiveEnergyBurned', agg:'sum' },
  HKQuantityTypeIdentifierBasalEnergyBurned:           { id:'BasalEnergyBurned', agg:'sum' },
  HKQuantityTypeIdentifierAppleExerciseTime:           { id:'AppleExerciseTime', agg:'sum' },
  HKQuantityTypeIdentifierAppleMoveTime:               { id:'AppleMoveTime', agg:'sum' },
  HKQuantityTypeIdentifierAppleStandTime:              { id:'AppleStandTime', agg:'sum' },
  HKCategoryTypeIdentifierAppleStandHour:              { id:'AppleStandHour', agg:'count' },
  HKQuantityTypeIdentifierVO2Max:                      { id:'VO2Max', agg:'avg' },
  HKQuantityTypeIdentifierNikeFuel:                    { id:'NikeFuel', agg:'sum' },
  // Vital
  HKQuantityTypeIdentifierHeartRate:                   { id:'HeartRate', agg:'minmax' },
  HKQuantityTypeIdentifierRestingHeartRate:            { id:'RestingHeartRate', agg:'avg' },
  HKQuantityTypeIdentifierWalkingHeartRateAverage:     { id:'WalkingHeartRateAverage', agg:'avg' },
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN:    { id:'HeartRateVariabilitySDNN', agg:'avg' },
  HKQuantityTypeIdentifierHeartRateRecoveryOneMinute:  { id:'HeartRateRecoveryOneMinute', agg:'avg' },
  HKQuantityTypeIdentifierBloodPressureSystolic:       { id:'BloodPressureSystolic', agg:'avg' },
  HKQuantityTypeIdentifierBloodPressureDiastolic:      { id:'BloodPressureDiastolic', agg:'avg' },
  HKQuantityTypeIdentifierBodyTemperature:             { id:'BodyTemperature', agg:'avg' },
  HKQuantityTypeIdentifierBasalBodyTemperature:        { id:'BasalBodyTemperature', agg:'avg' },
  HKQuantityTypeIdentifierOxygenSaturation:            { id:'OxygenSaturation', agg:'avg', scale:100 },
  HKQuantityTypeIdentifierBloodGlucose:                { id:'BloodGlucose', agg:'avg' },
  HKQuantityTypeIdentifierBloodAlcoholContent:         { id:'BloodAlcoholContent', agg:'avg', scale:100 },
  HKQuantityTypeIdentifierPeripheralPerfusionIndex:    { id:'PeripheralPerfusionIndex', agg:'avg', scale:100 },
  HKCategoryTypeIdentifierHighHeartRateEvent:          { id:'HighHeartRateEvent', agg:'count' },
  HKCategoryTypeIdentifierLowHeartRateEvent:           { id:'LowHeartRateEvent', agg:'count' },
  HKCategoryTypeIdentifierIrregularHeartRhythmEvent:   { id:'IrregularHeartRhythmEvent', agg:'count' },
  HKQuantityTypeIdentifierAtrialFibrillationBurden:    { id:'AtrialFibrillationBurden', agg:'avg', scale:100 },
  HKDataTypeIdentifierElectrocardiogram:               { id:'Electrocardiogram', agg:'count' },
  // Respiratory
  HKQuantityTypeIdentifierRespiratoryRate:             { id:'RespiratoryRate', agg:'avg' },
  HKQuantityTypeIdentifierForcedVitalCapacity:         { id:'ForcedVitalCapacity', agg:'avg' },
  HKQuantityTypeIdentifierForcedExpiratoryVolume1:     { id:'ForcedExpiratoryVolume1', agg:'avg' },
  HKQuantityTypeIdentifierPeakExpiratoryFlowRate:      { id:'PeakExpiratoryFlowRate', agg:'avg' },
  HKQuantityTypeIdentifierInhalerUsage:                { id:'InhalerUsage', agg:'sum' },
  // Body
  HKQuantityTypeIdentifierBodyMass:                    { id:'BodyMass', agg:'avg' },
  HKQuantityTypeIdentifierHeight:                      { id:'Height', agg:'last' },
  HKQuantityTypeIdentifierBodyMassIndex:               { id:'BodyMassIndex', agg:'avg' },
  HKQuantityTypeIdentifierBodyFatPercentage:           { id:'BodyFatPercentage', agg:'avg', scale:100 },
  HKQuantityTypeIdentifierLeanBodyMass:                { id:'LeanBodyMass', agg:'avg' },
  HKQuantityTypeIdentifierWaistCircumference:          { id:'WaistCircumference', agg:'avg' },
  // Hearing
  HKQuantityTypeIdentifierEnvironmentalAudioExposure:  { id:'EnvironmentalAudioExposure', agg:'avg' },
  HKQuantityTypeIdentifierHeadphoneAudioExposure:      { id:'HeadphoneAudioExposure', agg:'avg' },
  HKCategoryTypeIdentifierAudioExposureEvent:          { id:'AudioExposureEvent', agg:'count' },
  HKCategoryTypeIdentifierHeadphoneAudioExposureEvent: { id:'HeadphoneAudioExposureEvent', agg:'count' },
  HKCategoryTypeIdentifierEnvironmentalAudioExposureEvent: { id:'EnvironmentalAudioExposureEvent', agg:'count' },
  // Mobility
  HKQuantityTypeIdentifierWalkingSpeed:                { id:'WalkingSpeed', agg:'avg' },
  HKQuantityTypeIdentifierWalkingStepLength:           { id:'WalkingStepLength', agg:'avg' },
  HKQuantityTypeIdentifierStairAscentSpeed:            { id:'StairAscentSpeed', agg:'avg' },
  HKQuantityTypeIdentifierStairDescentSpeed:           { id:'StairDescentSpeed', agg:'avg' },
  HKQuantityTypeIdentifierAppleWalkingSteadiness:      { id:'AppleWalkingSteadiness', agg:'avg', scale:100 },
  HKQuantityTypeIdentifierWalkingAsymmetryPercentage:  { id:'WalkingAsymmetryPercentage', agg:'avg', scale:100 },
  HKQuantityTypeIdentifierWalkingDoubleSupportPercentage: { id:'WalkingDoubleSupportPercentage', agg:'avg', scale:100 },
  HKQuantityTypeIdentifierSixMinuteWalkTestDistance:   { id:'SixMinuteWalkTestDistance', agg:'avg' },
  HKQuantityTypeIdentifierPhysicalEffort:              { id:'PhysicalEffort', agg:'avg' },
  HKCategoryTypeIdentifierAppleWalkingSteadinessEvent: { id:'AppleWalkingSteadinessEvent', agg:'count' },
  HKQuantityTypeIdentifierNumberOfTimesFallen:         { id:'NumberOfTimesFallen', agg:'sum' },
  HKQuantityTypeIdentifierRunningSpeed:                { id:'RunningSpeed', agg:'avg' },
  HKQuantityTypeIdentifierRunningPower:                { id:'RunningPower', agg:'avg' },
  HKQuantityTypeIdentifierRunningStrideLength:         { id:'RunningStrideLength', agg:'avg' },
  HKQuantityTypeIdentifierRunningVerticalOscillation:  { id:'RunningVerticalOscillation', agg:'avg' },
  HKQuantityTypeIdentifierRunningGroundContactTime:    { id:'RunningGroundContactTime', agg:'avg' },
  HKQuantityTypeIdentifierCyclingSpeed:                { id:'CyclingSpeed', agg:'avg' },
  HKQuantityTypeIdentifierCyclingCadence:              { id:'CyclingCadence', agg:'avg' },
  HKQuantityTypeIdentifierCyclingPower:                { id:'CyclingPower', agg:'avg' },
  HKQuantityTypeIdentifierCyclingFunctionalThresholdPower: { id:'CyclingFunctionalThresholdPower', agg:'avg' },
  HKQuantityTypeIdentifierWorkoutEffortScore:          { id:'WorkoutEffortScore', agg:'avg' },
  HKQuantityTypeIdentifierEstimatedWorkoutEffortScore: { id:'EstimatedWorkoutEffortScore', agg:'avg' },
  HKQuantityTypeIdentifierUnderwaterDepth:             { id:'UnderwaterDepth', agg:'minmax' },
  HKQuantityTypeIdentifierWaterTemperature:            { id:'WaterTemperature', agg:'avg' },
  // Sleep
  HKCategoryTypeIdentifierSleepAnalysis:               { id:'SleepAnalysis', agg:'sleep' },
  HKQuantityTypeIdentifierAppleSleepingWristTemperature: { id:'AppleSleepingWristTemperature', agg:'avg' },
  HKQuantityTypeIdentifierAppleSleepingBreathingDisturbances: { id:'AppleSleepingBreathingDisturbances', agg:'avg' },
  // Nutrition
  HKQuantityTypeIdentifierDietaryEnergyConsumed:       { id:'DietaryEnergyConsumed', agg:'sum' },
  HKQuantityTypeIdentifierDietaryCarbohydrates:        { id:'DietaryCarbohydrates', agg:'sum' },
  HKQuantityTypeIdentifierDietaryProtein:              { id:'DietaryProtein', agg:'sum' },
  HKQuantityTypeIdentifierDietaryFatTotal:             { id:'DietaryFatTotal', agg:'sum' },
  HKQuantityTypeIdentifierDietaryFatSaturated:         { id:'DietaryFatSaturated', agg:'sum' },
  HKQuantityTypeIdentifierDietaryFatMonounsaturated:   { id:'DietaryFatMonounsaturated', agg:'sum' },
  HKQuantityTypeIdentifierDietaryFatPolyunsaturated:   { id:'DietaryFatPolyunsaturated', agg:'sum' },
  HKQuantityTypeIdentifierDietaryCholesterol:          { id:'DietaryCholesterol', agg:'sum' },
  HKQuantityTypeIdentifierDietarySodium:               { id:'DietarySodium', agg:'sum' },
  HKQuantityTypeIdentifierDietaryPotassium:            { id:'DietaryPotassium', agg:'sum' },
  HKQuantityTypeIdentifierDietarySugar:                { id:'DietarySugar', agg:'sum' },
  HKQuantityTypeIdentifierDietaryFiber:                { id:'DietaryFiber', agg:'sum' },
  HKQuantityTypeIdentifierDietaryWater:                { id:'DietaryWater', agg:'sum' },
  HKQuantityTypeIdentifierDietaryCaffeine:             { id:'DietaryCaffeine', agg:'sum' },
  HKQuantityTypeIdentifierDietaryCalcium:              { id:'DietaryCalcium', agg:'sum' },
  HKQuantityTypeIdentifierDietaryIron:                 { id:'DietaryIron', agg:'sum' },
  HKQuantityTypeIdentifierDietaryVitaminC:             { id:'DietaryVitaminC', agg:'sum' },
  // Reproductive
  HKCategoryTypeIdentifierMenstrualFlow:               { id:'MenstrualFlow', agg:'flow' },
  HKCategoryTypeIdentifierIntermenstrualBleeding:      { id:'IntermenstrualBleeding', agg:'count' },
  HKCategoryTypeIdentifierInfrequentMenstrualCycles:   { id:'InfrequentMenstrualCycles', agg:'count' },
  HKCategoryTypeIdentifierIrregularMenstrualCycles:    { id:'IrregularMenstrualCycles', agg:'count' },
  HKCategoryTypeIdentifierPersistentIntermenstrualBleeding: { id:'PersistentIntermenstrualBleeding', agg:'count' },
  HKCategoryTypeIdentifierProlongedMenstrualPeriods:   { id:'ProlongedMenstrualPeriods', agg:'count' },
  HKCategoryTypeIdentifierOvulationTestResult:         { id:'OvulationTestResult', agg:'count' },
  HKCategoryTypeIdentifierCervicalMucusQuality:        { id:'CervicalMucusQuality', agg:'count' },
  HKCategoryTypeIdentifierSexualActivity:              { id:'SexualActivity', agg:'count' },
  HKCategoryTypeIdentifierContraceptive:               { id:'Contraceptive', agg:'count' },
  HKCategoryTypeIdentifierLactation:                   { id:'Lactation', agg:'count' },
  HKCategoryTypeIdentifierPregnancy:                   { id:'Pregnancy', agg:'count' },
  HKCategoryTypeIdentifierPregnancyTestResult:         { id:'PregnancyTestResult', agg:'count' },
  HKCategoryTypeIdentifierProgesteroneTestResult:      { id:'ProgesteroneTestResult', agg:'count' },
  HKCategoryTypeIdentifierAcne:                        { id:'Acne', agg:'count' },
  HKCategoryTypeIdentifierAppetiteChanges:             { id:'AppetiteChanges', agg:'count' },
  HKCategoryTypeIdentifierBladderIncontinence:         { id:'BladderIncontinence', agg:'count' },
  HKCategoryTypeIdentifierBreastPain:                  { id:'BreastPain', agg:'count' },
  HKCategoryTypeIdentifierDrySkin:                     { id:'DrySkin', agg:'count' },
  HKCategoryTypeIdentifierGeneralizedBodyAche:         { id:'GeneralizedBodyAche', agg:'count' },
  HKCategoryTypeIdentifierHairLoss:                    { id:'HairLoss', agg:'count' },
  HKCategoryTypeIdentifierVaginalDryness:              { id:'VaginalDryness', agg:'count' },
  // Mental
  HKCategoryTypeIdentifierMindfulSession:              { id:'MindfulSession', agg:'duration' },
  HKStateOfMind:                                       { id:'StateOfMind', agg:'avg' },
  // Symptoms (agg:count for all)
  HKCategoryTypeIdentifierAbdominalCramps:             { id:'AbdominalCramps', agg:'count' },
  HKCategoryTypeIdentifierBloating:                    { id:'Bloating', agg:'count' },
  HKCategoryTypeIdentifierChestTightnessOrPain:        { id:'ChestTightnessOrPain', agg:'count' },
  HKCategoryTypeIdentifierChills:                      { id:'Chills', agg:'count' },
  HKCategoryTypeIdentifierConstipation:                { id:'Constipation', agg:'count' },
  HKCategoryTypeIdentifierCoughing:                    { id:'Coughing', agg:'count' },
  HKCategoryTypeIdentifierDiarrhea:                    { id:'Diarrhea', agg:'count' },
  HKCategoryTypeIdentifierDizziness:                   { id:'Dizziness', agg:'count' },
  HKCategoryTypeIdentifierFatigue:                     { id:'Fatigue', agg:'count' },
  HKCategoryTypeIdentifierFever:                       { id:'Fever', agg:'count' },
  HKCategoryTypeIdentifierHeadache:                    { id:'Headache', agg:'count' },
  HKCategoryTypeIdentifierHeartburn:                   { id:'Heartburn', agg:'count' },
  HKCategoryTypeIdentifierHotFlashes:                  { id:'HotFlashes', agg:'count' },
  HKCategoryTypeIdentifierLowerBackPain:               { id:'LowerBackPain', agg:'count' },
  HKCategoryTypeIdentifierMemoryLapse:                 { id:'MemoryLapse', agg:'count' },
  HKCategoryTypeIdentifierMoodChanges:                 { id:'MoodChanges', agg:'count' },
  HKCategoryTypeIdentifierNausea:                      { id:'Nausea', agg:'count' },
  HKCategoryTypeIdentifierNightSweats:                 { id:'NightSweats', agg:'count' },
  HKCategoryTypeIdentifierPelvicPain:                  { id:'PelvicPain', agg:'count' },
  HKCategoryTypeIdentifierRapidPoundingOrFlutteringHeartbeat: { id:'RapidHeartbeat', agg:'count' },
  HKCategoryTypeIdentifierShortnessOfBreath:           { id:'ShortnessOfBreath', agg:'count' },
  HKCategoryTypeIdentifierSinusCongestion:             { id:'SinusCongestion', agg:'count' },
  HKCategoryTypeIdentifierSkippedHeartbeat:            { id:'SkippedHeartbeat', agg:'count' },
  HKCategoryTypeIdentifierSleepChanges:                { id:'SleepChanges', agg:'count' },
  HKCategoryTypeIdentifierSoreThroat:                  { id:'SoreThroat', agg:'count' },
  HKCategoryTypeIdentifierVomiting:                    { id:'Vomiting', agg:'count' },
  HKCategoryTypeIdentifierWheezing:                    { id:'Wheezing', agg:'count' },
  HKCategoryTypeIdentifierLossOfSmell:                 { id:'LossOfSmell', agg:'count' },
  HKCategoryTypeIdentifierLossOfTaste:                 { id:'LossOfTaste', agg:'count' },
  HKCategoryTypeIdentifierRunnyNose:                   { id:'RunnyNose', agg:'count' },
  HKCategoryTypeIdentifierFainting:                    { id:'Fainting', agg:'count' },
  // Other
  HKCategoryTypeIdentifierHandwashingEvent:            { id:'HandwashingEvent', agg:'count' },
  HKCategoryTypeIdentifierToothbrushingEvent:          { id:'ToothbrushingEvent', agg:'count' },
  HKQuantityTypeIdentifierUVExposure:                  { id:'UVExposure', agg:'avg' },
  HKQuantityTypeIdentifierTimeInDaylight:              { id:'TimeInDaylight', agg:'sum' },
  HKQuantityTypeIdentifierEnvironmentalSoundReduction: { id:'EnvironmentalSoundReduction', agg:'avg' },
  HKQuantityTypeIdentifierInsulinDelivery:             { id:'InsulinDelivery', agg:'sum' },
  HKQuantityTypeIdentifierNumberOfAlcoholicBeverages:  { id:'NumberOfAlcoholicBeverages', agg:'sum' },
};

// Menstrual flow / Ovulation value mapping (used for 'flow' & ovulation aggregation)
const FLOW_MAP = {
  HKCategoryValueMenstrualFlowNone:        'none',
  HKCategoryValueMenstrualFlowUnspecified: 'unspecified',
  HKCategoryValueMenstrualFlowLight:       'light',
  HKCategoryValueMenstrualFlowMedium:      'medium',
  HKCategoryValueMenstrualFlowHeavy:       'heavy',
};
const FLOW_LEVEL = { none:0, unspecified:1, light:2, medium:3, heavy:4 };
const NUMERIC_FLOW = { '1':'unspecified','2':'light','3':'medium','4':'heavy' };
function flowKey(v) {
  if (v == null) return null;
  if (typeof v === 'string' && /^\d+$/.test(v)) return NUMERIC_FLOW[v] || null;
  return FLOW_MAP[v] || null;
}
const OV_MAP = {
  HKCategoryValueOvulationTestResultNegative:                'neg',
  HKCategoryValueOvulationTestResultLuteinizingHormoneSurge: 'lh',
  HKCategoryValueOvulationTestResultEstrogenSurge:           'es',
  HKCategoryValueOvulationTestResultIndeterminate:           'ind',
  HKCategoryValueOvulationTestResultPositive:                'pos',
};
function ovKey(v) {
  if (v == null) return null;
  if (typeof v === 'string' && /^\d+$/.test(v)) {
    return ({ '1':'neg', '2':'lh', '3':'ind', '4':'es' })[v] || null;
  }
  return OV_MAP[v] || null;
}

function metricForType(hkType) {
  const m = METRICS[hkType];
  if (m) return m;
  // Fallback: derive id from hk type so unknown data still records
  const isCategory = hkType.startsWith('HKCategoryTypeIdentifier');
  const short = hkType.replace(/^HK(Quantity|Category)TypeIdentifier/, '');
  return { id: short || hkType, agg: isCategory ? 'count' : 'avg', _auto: true };
}

const SLEEP_STAGES = {
  HKCategoryValueSleepAnalysisInBed:             'inBed',
  HKCategoryValueSleepAnalysisAsleep:            'asleep',
  HKCategoryValueSleepAnalysisAsleepUnspecified: 'asleep',
  HKCategoryValueSleepAnalysisAsleepCore:        'core',
  HKCategoryValueSleepAnalysisAsleepDeep:        'deep',
  HKCategoryValueSleepAnalysisAsleepREM:         'rem',
  HKCategoryValueSleepAnalysisAwake:             'awake',
};

// ---------- Date helpers ----------
// Apple Health export date format: "YYYY-MM-DD HH:MM:SS ±HHMM"
//   e.g., "2024-01-15 08:30:00 +0900"
// Safari's new Date() cannot parse this (space separator + no colon in TZ),
// so we decompose with regex and build explicitly. We return BOTH the wall-
// clock day/hour (as recorded on the device) and a true Date object for
// duration math.
const APPLE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:\s*(Z|[+-]\d{2}:?\d{2}))?/;
function parseAppleDate(s) {
  if (!s) return null;
  const m = APPLE_DATE_RE.exec(s);
  if (!m) return null;
  const Y = m[1], M = m[2], D = m[3], h = m[4], mn = m[5], sec = m[6];
  const tz = m[7];
  const day = `${Y}-${M}-${D}`;
  const hour = `${day}T${h}`;
  let date;
  if (tz) {
    const iso = `${day}T${h}:${mn}:${sec}${tz === 'Z' ? 'Z' : (tz.length === 5 ? tz.slice(0, 3) + ':' + tz.slice(3) : tz)}`;
    date = new Date(iso);
  } else {
    // No timezone: treat as local time
    date = new Date(+Y, +M - 1, +D, +h, +mn, +sec);
  }
  if (isNaN(date.getTime())) return null;
  return { date, day, hour, ms: date.getTime() };
}
function normalizeDistance(value, unit) {
  if (!unit) return value;
  if (unit === 'mi') return value * 1.609344;
  return value;
}

// ---------- IndexedDB (minimal duplicate of db.js) ----------
const DB_NAME = 'healthcare-viewer';
const DB_VERSION = 1;
let _db;
function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('files'))    db.createObjectStore('files',    { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('daily'))    db.createObjectStore('daily',    { keyPath: ['fileId', 'metric', 'day'] });
      if (!db.objectStoreNames.contains('hourly'))   db.createObjectStore('hourly',   { keyPath: ['fileId', 'metric', 'hour'] });
      if (!db.objectStoreNames.contains('workouts')) db.createObjectStore('workouts', { keyPath: ['fileId', 'idx'] });
      if (!db.objectStoreNames.contains('routes'))   db.createObjectStore('routes',   { keyPath: ['fileId', 'workoutIdx'] });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror   = () => reject(req.error);
  });
}
function req2p(r) { return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
function txDone(t) { return new Promise((resolve, reject) => { t.oncomplete = () => resolve(); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error); }); }

async function putChunks(storeName, items) {
  if (!items || !items.length) return;
  const db = await openDB();
  const CHUNK = 3000;
  for (let i = 0; i < items.length; i += CHUNK) {
    const part = items.slice(i, i + CHUNK);
    const t = db.transaction([storeName], 'readwrite');
    const s = t.objectStore(storeName);
    for (const it of part) s.put(it);
    await txDone(t);
  }
}

async function addFileRow(row) {
  const db = await openDB();
  const t = db.transaction(['files'], 'readwrite');
  const id = await req2p(t.objectStore('files').add(row));
  await txDone(t);
  return id;
}
async function updateFileRow(row) {
  const db = await openDB();
  const t = db.transaction(['files'], 'readwrite');
  await req2p(t.objectStore('files').put(row));
  await txDone(t);
}

// ---------- Mini SAX parser (element-level events) ----------
function decodeAttr(s) {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (m, e) => {
    if (e === 'amp') return '&';
    if (e === 'lt') return '<';
    if (e === 'gt') return '>';
    if (e === 'quot') return '"';
    if (e === 'apos') return "'";
    if (e[0] === '#' && e[1] === 'x') return String.fromCharCode(parseInt(e.slice(2), 16));
    if (e[0] === '#') return String.fromCharCode(parseInt(e.slice(1), 10));
    return m;
  });
}
function parseAttrs(s) {
  const attrs = {};
  const re = /([A-Za-z_][\w:.-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) {
    attrs[m[1]] = decodeAttr(m[2]);
  }
  return attrs;
}

class MiniSAX {
  constructor(onOpen, onClose) {
    this.buf = '';
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.done = false;
  }
  write(s) {
    this.buf += s;
    this._process();
  }
  end() {
    this.done = true;
    this._process();
  }
  _process() {
    let i = 0;
    const buf = this.buf;
    const len = buf.length;
    while (i < len) {
      const lt = buf.indexOf('<', i);
      if (lt < 0) { i = len; break; }
      // DOCTYPE with internal subset
      if (buf.startsWith('<!DOCTYPE', lt)) {
        const bracket = buf.indexOf('[', lt);
        const close = buf.indexOf('>', lt);
        if (bracket >= 0 && (close < 0 || bracket < close)) {
          const end = buf.indexOf(']>', bracket);
          if (end < 0) { i = lt; break; }
          i = end + 2;
          continue;
        } else {
          if (close < 0) { i = lt; break; }
          i = close + 1;
          continue;
        }
      }
      // Comment
      if (buf.startsWith('<!--', lt)) {
        const end = buf.indexOf('-->', lt + 4);
        if (end < 0) { i = lt; break; }
        i = end + 3;
        continue;
      }
      // CDATA
      if (buf.startsWith('<![CDATA[', lt)) {
        const end = buf.indexOf(']]>', lt + 9);
        if (end < 0) { i = lt; break; }
        i = end + 3;
        continue;
      }
      // Processing instruction
      if (buf.startsWith('<?', lt)) {
        const end = buf.indexOf('?>', lt + 2);
        if (end < 0) { i = lt; break; }
        i = end + 2;
        continue;
      }
      // Other DTD markup like <!ELEMENT, <!ATTLIST, <!ENTITY — single-line, find '>'
      if (buf.startsWith('<!', lt)) {
        const close = buf.indexOf('>', lt);
        if (close < 0) { i = lt; break; }
        i = close + 1;
        continue;
      }
      // Normal tag: find matching '>'
      const gt = buf.indexOf('>', lt);
      if (gt < 0) { i = lt; break; }
      const raw = buf.substring(lt + 1, gt);
      if (raw[0] === '/') {
        // closing
        const name = raw.slice(1).trim();
        this.onClose(name);
        i = gt + 1;
        continue;
      }
      const selfClose = raw.endsWith('/');
      const core = selfClose ? raw.slice(0, -1) : raw;
      const sp = core.search(/\s/);
      const name = sp < 0 ? core : core.substring(0, sp);
      const rest = sp < 0 ? '' : core.substring(sp + 1);
      const attrs = rest ? parseAttrs(rest) : {};
      this.onOpen(name, attrs, selfClose);
      i = gt + 1;
    }
    // Shift consumed bytes out.
    if (i > 0) this.buf = buf.substring(i);
    // Soft cap: if buffer got huge due to an unterminated tag, give up to avoid memory bloat.
    if (this.buf.length > 1_000_000) {
      // Drop up to the last safe boundary (a newline).
      const safe = this.buf.lastIndexOf('\n');
      if (safe > 0) this.buf = this.buf.substring(safe + 1);
    }
  }
}

// ---------- Aggregation state ----------
class Ingest {
  constructor(fileId) {
    this.fileId = fileId;
    this.dailyMap = new Map();   // key: `${metric}\u0001${day}` -> row
    this.hourlyMap = new Map();  // key: `${metric}\u0001${hour}` -> row
    this.workouts = [];          // array, flushed at end
    this.pendingRoutes = new Map(); // filename -> workoutIdx
    this.metricsSeen = new Set();
    this.records = 0;
    this.workoutsCount = 0;
    this.routesCount = 0;
    this.minDate = null;
    this.maxDate = null;
    this.exportDate = null;
    this.me = null;
  }

  _bucket(map, key, seed, mode) {
    let b = map.get(key);
    if (!b) {
      b = { ...seed };
      if (mode === 'sum' || mode === 'avg' || mode === 'duration') { b.sum = 0; b.count = 0; }
      else if (mode === 'minmax') { b.sum = 0; b.count = 0; b.min = Infinity; b.max = -Infinity; }
      else if (mode === 'last') { b.value = null; b.count = 0; b.ts = 0; }
      else if (mode === 'count') { b.count = 0; }
      else if (mode === 'sleep') { b.inBed = 0; b.asleep = 0; b.core = 0; b.deep = 0; b.rem = 0; b.awake = 0; }
      else if (mode === 'flow')  { b.flow = 'none'; b.level = 0; b.count = 0; }
      map.set(key, b);
    }
    return b;
  }

  processRecord(attrs) {
    const meta = metricForType(attrs.type);
    if (!meta) return;
    const sP = parseAppleDate(attrs.startDate);
    if (!sP) return;
    const eP = attrs.endDate ? (parseAppleDate(attrs.endDate) || sP) : sP;
    const start = sP.date;
    const end   = eP.date;

    // Track file date range
    if (!this.minDate || start < this.minDate) this.minDate = start;
    if (!this.maxDate || end   > this.maxDate) this.maxDate = end;
    this.metricsSeen.add(meta.id);
    this.records++;

    // Menstrual flow: store max intensity per day (also as count for charts)
    if (meta.agg === 'flow') {
      const day = sP.day;
      const key = meta.id + '\u0001' + day;
      const b = this._bucket(this.dailyMap, key, { fileId: this.fileId, metric: meta.id, day }, 'flow');
      const fk = flowKey(attrs.value);
      if (fk) {
        const lvl = FLOW_LEVEL[fk] || 0;
        if (lvl >= b.level) { b.level = lvl; b.flow = fk; }
      }
      b.count += 1;
      // Hourly is not meaningful for flow; skip.
      return;
    }

    // Ovulation test: store latest result per day (also count)
    if (meta.id === 'OvulationTestResult') {
      const day = sP.day;
      const key = meta.id + '\u0001' + day;
      const b = this._bucket(this.dailyMap, key, { fileId: this.fileId, metric: meta.id, day }, 'count');
      const ok = ovKey(attrs.value);
      if (ok) {
        b.result = ok;
        if (ok === 'pos' || ok === 'lh') b.positive = true;
      }
      b.count += 1;
      return;
    }

    // Sleep: use endDate day (wake-up day), accumulate seconds per stage
    if (meta.agg === 'sleep') {
      const stage = SLEEP_STAGES[attrs.value];
      if (!stage) return;
      const durSec = Math.max(0, (end - start) / 1000);
      const day = eP.day;
      const key = meta.id + '\u0001' + day;
      const b = this._bucket(this.dailyMap, key, { fileId: this.fileId, metric: meta.id, day }, 'sleep');
      b[stage] = (b[stage] || 0) + durSec;
      return;
    }

    // Mindful session: duration
    if (meta.agg === 'duration') {
      const durMin = Math.max(0, (end - start) / 60000);
      const day = sP.day;
      const hour = sP.hour;
      const dk = meta.id + '\u0001' + day;
      const hk = meta.id + '\u0001' + hour;
      const d = this._bucket(this.dailyMap,  dk, { fileId: this.fileId, metric: meta.id, day  }, 'sum');
      const h = this._bucket(this.hourlyMap, hk, { fileId: this.fileId, metric: meta.id, hour }, 'sum');
      d.sum += durMin; d.count += 1;
      h.sum += durMin; h.count += 1;
      return;
    }

    // Count (events / category occurrences)
    if (meta.agg === 'count') {
      const day = sP.day;
      const hour = sP.hour;
      const d = this._bucket(this.dailyMap,  meta.id + '\u0001' + day,  { fileId: this.fileId, metric: meta.id, day  }, 'count');
      const h = this._bucket(this.hourlyMap, meta.id + '\u0001' + hour, { fileId: this.fileId, metric: meta.id, hour }, 'count');
      d.count += 1;
      h.count += 1;
      return;
    }

    // Quantity types
    let v = parseFloat(attrs.value);
    if (!isFinite(v)) return;
    if (meta.distance) v = normalizeDistance(v, attrs.unit);
    if (meta.scale)    v = v * meta.scale;

    const day = sP.day;
    const hour = sP.hour;
    const dk = meta.id + '\u0001' + day;
    const hk = meta.id + '\u0001' + hour;
    const d = this._bucket(this.dailyMap,  dk, { fileId: this.fileId, metric: meta.id, day  }, meta.agg);
    const h = this._bucket(this.hourlyMap, hk, { fileId: this.fileId, metric: meta.id, hour }, meta.agg);

    if (meta.agg === 'sum' || meta.agg === 'avg') {
      d.sum += v; d.count += 1;
      h.sum += v; h.count += 1;
    } else if (meta.agg === 'minmax') {
      d.sum += v; d.count += 1;
      if (v < d.min) d.min = v;
      if (v > d.max) d.max = v;
      h.sum += v; h.count += 1;
      if (v < h.min) h.min = v;
      if (v > h.max) h.max = v;
    } else if (meta.agg === 'last') {
      const ts = start.getTime();
      if (ts > (d.ts || 0)) { d.value = v; d.ts = ts; }
      d.count = (d.count || 0) + 1;
      if (ts > (h.ts || 0)) { h.value = v; h.ts = ts; }
      h.count = (h.count || 0) + 1;
    }
  }

  addWorkout(attrs) {
    const idx = this.workouts.length;
    const sP = attrs.startDate ? parseAppleDate(attrs.startDate) : null;
    const eP = attrs.endDate   ? parseAppleDate(attrs.endDate)   : null;
    const start = sP ? sP.date : null;
    const end   = eP ? eP.date : null;
    const durSec = attrs.duration ? parseFloat(attrs.duration) * (attrs.durationUnit === 'min' ? 60 : 1)
                   : (start && end ? (end - start) / 1000 : null);
    let dist = attrs.totalDistance ? parseFloat(attrs.totalDistance) : null;
    if (dist != null && attrs.totalDistanceUnit === 'mi') dist *= 1.609344;
    const energy = attrs.totalEnergyBurned ? parseFloat(attrs.totalEnergyBurned) : null;

    if (start) {
      if (!this.minDate || start < this.minDate) this.minDate = start;
      const eff = end || start;
      if (!this.maxDate || eff > this.maxDate) this.maxDate = eff;
    }

    const wo = {
      fileId: this.fileId,
      idx,
      activityType: attrs.workoutActivityType || 'HKWorkoutActivityTypeOther',
      start: attrs.startDate,
      end: attrs.endDate,
      durationSec: durSec,
      distanceKm: dist,
      energyKcal: energy,
      source: attrs.sourceName,
      stats: {},
      routeFile: null,
      meta: {},
    };
    this.workouts.push(wo);
    this.workoutsCount++;
    return wo;
  }

  addWorkoutStat(wo, attrs) {
    if (!wo) return;
    const t = attrs.type || '';
    const key = t.replace(/^HK(Quantity|Category)TypeIdentifier/, '');
    const entry = {};
    if (attrs.sum     != null) entry.sum     = parseFloat(attrs.sum);
    if (attrs.average != null) entry.average = parseFloat(attrs.average);
    if (attrs.minimum != null) entry.minimum = parseFloat(attrs.minimum);
    if (attrs.maximum != null) entry.maximum = parseFloat(attrs.maximum);
    if (attrs.unit    != null) entry.unit    = attrs.unit;
    wo.stats[key] = entry;
  }

  setWorkoutRouteFile(wo, filePath) {
    if (!wo || !filePath) return;
    wo.routeFile = filePath;
    this.pendingRoutes.set(filePath, wo.idx);
    this.routesCount++;
  }

  addMetadata(wo, attrs) {
    if (!wo) return;
    const k = (attrs.key || '').replace(/^HK/, '');
    if (k) wo.meta[k] = attrs.value;
  }

  _dailyRows() { return Array.from(this.dailyMap.values()); }
  _hourlyRows() {
    // Only keep hourly rows for aggregation modes that make sense.
    const out = [];
    for (const r of this.hourlyMap.values()) out.push(r);
    return out;
  }

  async flush() {
    await putChunks('daily', this._dailyRows());
    await putChunks('hourly', this._hourlyRows());
    await putChunks('workouts', this.workouts);
  }
}

// ---------- GPX parser ----------
function parseGPX(text) {
  const points = [];
  const re = /<trkpt\s+([^>]*?)>([\s\S]*?)<\/trkpt>|<trkpt\s+([^>]*?)\/>/g;
  const attrRe = /(lat|lon)\s*=\s*"([^"]+)"/g;
  const timeRe = /<time>([^<]+)<\/time>/;
  const eleRe  = /<ele>([^<]+)<\/ele>/;
  let m;
  while ((m = re.exec(text))) {
    const attrs = m[1] || m[3] || '';
    attrRe.lastIndex = 0;
    let a, lat = null, lon = null;
    while ((a = attrRe.exec(attrs))) {
      if (a[1] === 'lat') lat = parseFloat(a[2]);
      if (a[1] === 'lon') lon = parseFloat(a[2]);
    }
    if (lat == null || lon == null) continue;
    const body = m[2] || '';
    const tm = timeRe.exec(body);
    const em = eleRe.exec(body);
    const t = tm ? new Date(tm[1]).getTime() : null;
    const ele = em ? parseFloat(em[1]) : null;
    points.push([lat, lon, t, ele]);
  }
  return points;
}

function basename(p) {
  const i = p.lastIndexOf('/');
  return i < 0 ? p : p.substring(i + 1);
}

// ---------- Main ingest flow ----------
async function ingest(file, displayName) {
  // Create file row early so we can delete on error.
  const now = new Date().toISOString();
  const fileId = await addFileRow({
    name: displayName,
    originalName: file.name,
    importedAt: now,
    sizeCompressed: file.size,
    progressing: true,
  });

  post({ type: 'fileCreated', fileId });

  const ingest = new Ingest(fileId);

  // Element stack for hierarchical parsing
  const stack = []; // { name, wo? }

  function currentWorkout() {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].name === 'Workout') return stack[i].wo;
    return null;
  }

  const onOpen = (name, attrs, selfClose) => {
    switch (name) {
      case 'Record': {
        ingest.processRecord(attrs);
        if (!selfClose) stack.push({ name });
        if (ingest.records % 20000 === 0) {
          post({
            type: 'progress',
            phase: 'parse',
            records: ingest.records,
            workouts: ingest.workoutsCount,
          });
        }
        break;
      }
      case 'Workout': {
        const wo = ingest.addWorkout(attrs);
        if (!selfClose) stack.push({ name, wo });
        break;
      }
      case 'WorkoutRoute': {
        const wo = currentWorkout();
        if (!selfClose) stack.push({ name, wo });
        break;
      }
      case 'FileReference': {
        const top = stack[stack.length - 1];
        if (top && top.name === 'WorkoutRoute') {
          ingest.setWorkoutRouteFile(top.wo, attrs.path);
        }
        if (!selfClose) stack.push({ name });
        break;
      }
      case 'WorkoutStatistics': {
        const wo = currentWorkout();
        ingest.addWorkoutStat(wo, attrs);
        if (!selfClose) stack.push({ name });
        break;
      }
      case 'WorkoutEvent': {
        if (!selfClose) stack.push({ name });
        break;
      }
      case 'MetadataEntry': {
        const wo = currentWorkout();
        if (wo) ingest.addMetadata(wo, attrs);
        if (!selfClose) stack.push({ name });
        break;
      }
      case 'ActivitySummary': {
        // Daily activity summary - treat as implicit daily rows if useful
        const d = attrs.dateComponents;
        if (d) {
          const day = d; // already YYYY-MM-DD
          const energy = parseFloat(attrs.activeEnergyBurned || 0);
          const moveMin = parseFloat(attrs.appleMoveTime || 0);
          const exMin = parseFloat(attrs.appleExerciseTime || 0);
          const standH = parseFloat(attrs.appleStandHours || 0);
          ingest.metricsSeen.add('ActivitySummary');
          const b = ingest._bucket(ingest.dailyMap, 'ActivitySummary\u0001' + day,
            { fileId: ingest.fileId, metric: 'ActivitySummary', day }, 'last');
          b.energyGoal = parseFloat(attrs.activeEnergyBurnedGoal || 0);
          b.exerciseGoal = parseFloat(attrs.appleExerciseTimeGoal || 0);
          b.standGoal = parseFloat(attrs.appleStandHoursGoal || 0);
          b.energy = energy;
          b.move = moveMin;
          b.exercise = exMin;
          b.standHours = standH;
        }
        if (!selfClose) stack.push({ name });
        break;
      }
      case 'Me': {
        ingest.me = { ...attrs };
        if (!selfClose) stack.push({ name });
        break;
      }
      case 'ExportDate': {
        ingest.exportDate = attrs.value || null;
        if (!selfClose) stack.push({ name });
        break;
      }
      default: {
        if (!selfClose) stack.push({ name });
        break;
      }
    }
  };

  const onClose = (name) => {
    // pop until we find matching
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].name === name) {
        stack.length = i;
        break;
      }
    }
  };

  const parser = new MiniSAX(onOpen, onClose);
  const decoder = new TextDecoder('utf-8');

  // Buffer GPX bytes per file then parse at end
  const gpxBuffers = new Map(); // filename -> Uint8Array[]

  // Set up fflate Unzip
  let unzipperDone = false;
  let xmlDone = false;

  const unzipper = new fflate.Unzip();
  unzipper.register(fflate.UnzipInflate);

  unzipper.onfile = (uzf) => {
    const fname = uzf.name;
    if (!fname) return;

    if (/export\.xml$/i.test(fname)) {
      uzf.ondata = (err, chunk, final) => {
        if (err) {
          post({ type: 'error', message: 'export.xml 解凍エラー: ' + err.message });
          return;
        }
        const text = decoder.decode(chunk, { stream: !final });
        parser.write(text);
        if (final) {
          parser.end();
          xmlDone = true;
          post({ type: 'progress', phase: 'parsed', records: ingest.records, workouts: ingest.workoutsCount });
        }
      };
      uzf.start();
    } else if (/\.gpx$/i.test(fname)) {
      const bn = basename(fname);
      const bufs = [];
      gpxBuffers.set(bn, bufs);
      uzf.ondata = (err, chunk, final) => {
        if (err) return;
        bufs.push(chunk);
        // nothing else — we parse on flush
      };
      uzf.start();
    } else {
      // ignore (export_cda.xml etc.)
    }
  };

  // Feed zip bytes in chunks
  post({ type: 'progress', phase: 'unzip-start' });
  const stream = file.stream();
  const reader = stream.getReader();
  let bytesRead = 0;
  const totalBytes = file.size;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      unzipper.push(new Uint8Array(0), true);
      break;
    }
    bytesRead += value.byteLength;
    unzipper.push(value, false);
    if (bytesRead % (1 << 20) < value.byteLength) {
      post({
        type: 'progress',
        phase: 'unzip',
        bytesRead,
        totalBytes,
        records: ingest.records,
      });
    }
  }
  unzipperDone = true;

  // Safety: ensure XML parsing finalized
  if (!xmlDone) parser.end();

  // Process collected GPX files and write routes (only for workouts with a routeFile we saw)
  post({ type: 'progress', phase: 'routes-start', routes: ingest.routesCount });
  const routeRows = [];
  for (const [fname, idx] of ingest.pendingRoutes.entries()) {
    const bn = basename(fname);
    const bufs = gpxBuffers.get(bn);
    if (!bufs) continue;
    const total = bufs.reduce((a, b) => a + b.byteLength, 0);
    const merged = new Uint8Array(total);
    let off = 0;
    for (const b of bufs) { merged.set(b, off); off += b.byteLength; }
    const text = new TextDecoder('utf-8').decode(merged);
    const points = parseGPX(text);
    if (!points.length) continue;
    routeRows.push({ fileId, workoutIdx: idx, points });
  }
  await putChunks('routes', routeRows);

  post({ type: 'progress', phase: 'save-start',
    daily: ingest.dailyMap.size, hourly: ingest.hourlyMap.size,
    workouts: ingest.workoutsCount });

  await ingest.flush();

  // Finalize file row
  await updateFileRow({
    id: fileId,
    name: displayName,
    originalName: file.name,
    importedAt: now,
    sizeCompressed: file.size,
    progressing: false,
    exportDate: ingest.exportDate,
    me: ingest.me,
    rangeStart: ingest.minDate ? ingest.minDate.toISOString() : null,
    rangeEnd:   ingest.maxDate ? ingest.maxDate.toISOString() : null,
    metrics: Array.from(ingest.metricsSeen).sort(),
    counts: {
      records: ingest.records,
      workouts: ingest.workoutsCount,
      routes: routeRows.length,
      days: ingest.dailyMap.size,
    },
  });

  post({
    type: 'done',
    fileId,
    summary: {
      records: ingest.records,
      workouts: ingest.workoutsCount,
      routes: routeRows.length,
      metrics: Array.from(ingest.metricsSeen).sort(),
      rangeStart: ingest.minDate ? ingest.minDate.toISOString() : null,
      rangeEnd:   ingest.maxDate ? ingest.maxDate.toISOString() : null,
    },
  });
}

function post(msg) { postMessage(msg); }

self.addEventListener('message', async (ev) => {
  const data = ev.data || {};
  if (data.type === 'ingest') {
    try {
      await ingest(data.file, data.name || data.file?.name || 'エクスポート');
    } catch (e) {
      post({ type: 'error', message: (e && e.message) || String(e) });
    }
  }
});
