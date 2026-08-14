/* ============================================================
   Osman's Health & Business Protocol Tracker — app.js
   Single-file vanilla JS SPA. State lives in `state` (mirrors
   protocol_state.json). Reads/writes go through /api/data (a
   Netlify Function backed by Netlify Blobs) — no GitHub commit
   per save, no external token. The only thing in localStorage is
   a single shared password used to authorize that endpoint; the
   repo's protocol_state.json is just the seed/fallback value.
   No framework, no build step.
   ============================================================ */

const API_URL = '/api/data';
const STATE_FILE = 'protocol_state.json';
const TOKEN_KEY = 'healthos-token';

const CYCLE_DAY_LABELS = ['Gün #1', 'Gün #2', 'Gün #3', 'Gün #4'];
const WEEKDAY_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const SUPPLEMENT_TIMELINE = [
  {
    time: '10:30', icon: '☀️', title: 'SABAH', subtitle: 'Aç Karna Ödem Yönetimi',
    items: [
      { key: 'bromelain_morning_1030', label: 'Ocean Bromelain (1. Doz)' },
      { key: 'apple_cider_vinegar_morning', label: 'Elma Sirkesi (1 Çay Kaşığı + 1 Bardak Su)' }
    ]
  },
  {
    time: 'Gün Boyu', icon: '💧', title: 'DETOKS & ÖDEM SÖKÜCÜ', subtitle: 'Hidrasyon ve Ödem Yönetimi',
    items: [
      { key: 'green_tea_cups', type: 'counter', label: 'Yeşil Çay', target: 2 },
      { key: 'electrolyte_mineral_water', label: 'Elektrolit / Maden Suyu (1 Şişe)' },
      { key: 'edema_water_cocktail', label: 'Ödem Sökücü Su Kokteyli (Maydanoz + Limon + Zencefil)' }
    ]
  },
  {
    time: '12:00', icon: '🕛', title: 'ÖĞLE', subtitle: 'Oruç Açılışı & Hücresel Koruma',
    items: [
      { key: 'diaformin_lunch_1200', label: 'Diaformin (1000 mg)' },
      { key: 'livex90_lunch_1200', label: 'Livex 90 (Karaciğer Desteği)' },
      { key: 'omega3_lunch_1200', label: 'Nutraxin Omega-3' },
      { key: 'zinc_lunch_1200', label: 'Çinko' },
      { key: 'folic_acid_lunch_1200', label: 'Folik Asit' },
      { key: 'protein_powder_lunch_1200', label: 'Protein Tozu (1 Ölçek)' },
      { key: 'devit3_friday_only', label: 'Devit-3 (20.000 IU)', condition: 'friday' }
    ]
  },
  {
    time: '16:30', icon: '🌆', title: 'ÖĞLEDEN SONRA', subtitle: 'Aç Karna Ödem Yönetimi',
    items: [
      { key: 'bromelain_afternoon_1630', label: 'Ocean Bromelain (2. Doz)' }
    ]
  },
  {
    time: '20:00', icon: '🌙', title: 'AKŞAM', subtitle: 'Akşam Yemeği & İnsülin Yönetimi',
    items: [
      { key: 'berliv_dinner_2000', label: 'Berliv Berberin (Glikoz Dağıtımı)' },
      { key: 'livex90_dinner_2000', label: 'Livex 90 (2. Doz)' },
      { key: 'evening_salad', label: 'Kapanış Salatası (Roka, Kereviz, Salatalık, Limon)' }
    ]
  },
  {
    time: '22:30', icon: '💤', title: 'GECE', subtitle: 'MSS Yenilenmesi & Uyku',
    items: [
      { key: 'magnesium_night_2230', label: 'Ocean Extramag (Magnezyum)' }
    ]
  }
];

const WORKOUT_PROGRAMS = [
  {
    day_id: 1, name: 'Upper & Arm Isolation',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Single Arm Dumbbell Shoulder Press', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Dumbbell Bench Press', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Single Arm Dumbbell Row', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Seated Leg Curl', sets: 3, reps: 15, target_rir: 1.5 },
      { name: 'Cable Pallof Hold', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Dumbbell Biceps Curl', sets: 3, reps: 10, target_rir: 1.0, note: 'Bu ağırlık tek kol için. Sağ + sol toplam 2x ile çalışıyorum.' },
      { name: 'Dumbbell Overhead Extension', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Dumbbell Hammer Curl', sets: 3, reps: 10, target_rir: 1.0, note: 'Bu ağırlık tek kol için. Sağ + sol toplam 2x ile çalışıyorum.' }
    ]
  },
  {
    day_id: 2, name: 'Back & Back Leg',
    exercises: [
      { name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 10, target_rir: 2.0 },
      { name: 'Seated Cable Row', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Pecdeck Fly', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Lat Pulldown Wide Grip', sets: 3, reps: 10, target_rir: 2.0 },
      { name: 'Standing Wood Chopper', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Dumbbell Biceps Curl', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Dumbbell Upright Row', sets: 3, reps: 10, target_rir: 1.0, note: 'Barbell ile yapıyorum.' }
    ]
  },
  {
    day_id: 3, name: 'Core & Power & Arms',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Dumbbell Bench Press', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Lat Pulldown Wide Grip', sets: 3, reps: 10, target_rir: 2.0 },
      { name: 'Triceps Pushdown', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Cable Pallof Hold', sets: 3, reps: 10, target_rir: 1.0, note: 'Sağ + Sol = 1 set.' },
      { name: 'Single Arm Carry', sets: 3, reps: 10, target_rir: 1.0, note: 'Sağ + Sol = 1 set - 15 adım tek taraf.' },
      { name: 'Dumbbell Biceps Curl', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Dumbbell Overhead Extension', sets: 3, reps: 8, target_rir: 1.0 },
      { name: 'Dumbbell Hammer Curl', sets: 3, reps: 10, target_rir: 1.0 }
    ]
  },
  {
    day_id: 4, name: 'Lower Body Isolation & Arms',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Seated Leg Curl', sets: 3, reps: 10, target_rir: 1.5 },
      { name: 'Seated Calf Raise', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Pecdeck Fly', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Lat Pulldown Wide Grip', sets: 3, reps: 10, target_rir: 2.0 },
      { name: 'Dumbbell Biceps Curl', sets: 3, reps: 10, target_rir: 1.0 },
      { name: 'Triceps Pushdown', sets: 3, reps: 10, target_rir: 1.0 }
    ]
  }
];

const BODY_MEASUREMENT_FIELDS = [
  { key: 'neck_cm', label: 'Boyun', color: '#BEE436' },
  { key: 'shoulder_cm', label: 'Omuz', color: '#1A2E23' },
  { key: 'chest_cm', label: 'Göğüs', color: '#9A6B0C' },
  { key: 'biceps_right_cm', label: 'Sağ Biceps', color: '#C0362C' },
  { key: 'biceps_left_cm', label: 'Sol Biceps', color: '#E8896F' },
  { key: 'waist_cm', label: 'Bel', color: '#1F7A4D' },
  { key: 'thigh_right_cm', label: 'Sağ Bacak', color: '#6B7268' },
  { key: 'thigh_left_cm', label: 'Sol Bacak', color: '#4A7FBF' },
  { key: 'calf_right_cm', label: 'Sağ Kalf', color: '#8B5FBF' },
  { key: 'calf_left_cm', label: 'Sol Kalf', color: '#C4915F' }
];

/* ---------------- Default state ---------------- */

function emptySupplements() {
  return {
    bromelain_morning_1030: false,
    apple_cider_vinegar_morning: false,
    electrolyte_mineral_water: false,
    edema_water_cocktail: false,
    diaformin_lunch_1200: false,
    livex90_lunch_1200: false,
    omega3_lunch_1200: false,
    zinc_lunch_1200: false,
    folic_acid_lunch_1200: false,
    protein_powder_lunch_1200: false,
    devit3_friday_only: false,
    bromelain_afternoon_1630: false,
    berliv_dinner_2000: false,
    livex90_dinner_2000: false,
    evening_salad: false,
    magnesium_night_2230: false
  };
}

function newLog(date, carryWeight) {
  return {
    date: date,
    weight: carryWeight,
    water_consumed_liters: 0.0,
    steps_walked: 0,
    green_tea_cups: 0,
    is_gluten_free: true,
    dessert_consumed: false,
    packaged_food_consumed: false,
    trigger_foods: {
      sugar_added: false,
      refined_oils_trans_fats: false,
      artificial_sweeteners: false,
      excess_lactose_dairy: false
    },
    brain_fog_note: '',
    symptoms: { headache: false, fatigue: false },
    supplements: emptySupplements(),
    workout_completed: null,
    cardio_session: null,
    sleep_bed_time: null,
    sleep_wake_time: null,
    notes: ''
  };
}

function getDefaultState() {
  return {
    user_profile: {
      name: 'Osman Nuri Erdoğan',
      current_weight: 153.5,
      target_weight: 100.0,
      weight_milestones: [145, 140, 135, 130, 125, 120, 115, 110, 105, 100],
      daily_calorie_budget_kcal: 2000,
      daily_water_target_liters: 4.0,
      daily_step_target: 8500
    },
    daily_logs: [newLog(todayISO(), 153.5)],
    workout_programs: {
      cycle_days: CYCLE_DAY_LABELS,
      programs: WORKOUT_PROGRAMS
    },
    weekly_measurements: [
      { date: '2026-05-16', weight: 156.4, muscle_mass_kg: 88.3, fat_mass_kg: 63.3, fluid_kg: 62.1 },
      { date: '2026-06-05', weight: 153.2, muscle_mass_kg: 87.1, fat_mass_kg: 61.4, fluid_kg: 60.5 },
      { date: '2026-06-20', weight: 153.4, muscle_mass_kg: 88.4, fat_mass_kg: 60.4, fluid_kg: 63.8 },
      { date: '2026-06-27', weight: 151.7, muscle_mass_kg: 87.0, fat_mass_kg: 60.1, fluid_kg: 60.9 },
      { date: '2026-07-04', weight: 153.5, muscle_mass_kg: 88.1, fat_mass_kg: 60.6, fluid_kg: 63.3 }
    ],
    body_measurements: []
  };
}

/* ---------------- Date helpers ---------------- */

function todayISO() {
  return formatDateISO(new Date());
}

function formatDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekdayTR(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return WEEKDAY_TR[d.getDay()];
}

function isFriday(dateStr) {
  return weekdayTR(dateStr) === 'Cuma';
}

function isWeekend(dateStr) {
  const w = weekdayTR(dateStr);
  return w === 'Cumartesi' || w === 'Pazar';
}

function nextSuggestedDayId() {
  const completedLogs = state.daily_logs
    .filter(l => l.workout_completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (completedLogs.length === 0) return 1;
  const lastDayId = completedLogs[completedLogs.length - 1].workout_completed.day_id;
  return (lastDayId % WORKOUT_PROGRAMS.length) + 1;
}

/* ---------------- Persistence ----------------
   Reads and writes go through /api/data — a Netlify Function backed
   by Netlify Blobs, gated by a single shared password. No GitHub
   commit per save, no external token to provision. The only thing
   ever written to localStorage is that password (just a credential,
   not app data); the repo's protocol_state.json is only the seed
   value used when the blob store is empty. If the API can't be
   reached at all, a load gate offers a manual file picker or
   starting from defaults instead. */

let state = null;
let hasUnsavedChanges = false;
let saveUiState = 'idle'; // 'idle' | 'saving' | 'saved' | 'error'
let saveErrorMsg = null;

function isValidState(data) {
  return !!(data && data.user_profile && Array.isArray(data.daily_logs) && data.workout_programs && Array.isArray(data.weekly_measurements));
}

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
}
function setToken(t) {
  try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { /* ignore */ }
}
function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: 'Bearer ' + t } : {};
}
function fetchWithToken(url, options) {
  const opts = Object.assign({}, options, {
    headers: Object.assign({}, options && options.headers, authHeaders())
  });
  return fetch(url, opts);
}

async function tryLoadFromApi() {
  try {
    const res = await fetchWithToken(API_URL, { cache: 'no-store' });
    if (res.status === 401) { clearToken(); return null; }
    if (!res.ok) return null;
    const data = await res.json();
    return isValidState(data) ? data : null;
  } catch (e) {
    return null;
  }
}

async function fetchStateFile() {
  try {
    const res = await fetch(STATE_FILE, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return isValidState(data) ? data : null;
  } catch (e) {
    return null;
  }
}

function commit() {
  hasUnsavedChanges = true;
  if (saveUiState !== 'idle') saveUiState = 'idle';
  render();
}

function markSaved() {
  hasUnsavedChanges = false;
  render();
}

async function saveState() {
  saveUiState = 'saving';
  saveErrorMsg = null;
  render();
  try {
    const res = await fetchWithToken(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (res.status === 401) {
      clearToken();
      const entered = window.prompt('Parola geçersiz görünüyor. Tekrar girin:');
      if (entered) {
        setToken(entered.trim());
        return saveState();
      }
      throw new Error('Yetkilendirme gerekli.');
    }
    if (!res.ok) {
      throw new Error(`Sunucu hatası (${res.status})`);
    }
    hasUnsavedChanges = false;
    saveUiState = 'saved';
    render();
    setTimeout(() => {
      if (saveUiState === 'saved') {
        saveUiState = 'idle';
        render();
      }
    }, 2500);
  } catch (e) {
    saveUiState = 'error';
    saveErrorMsg = e.message || 'Bilinmeyen hata';
    render();
  }
}

/* ---------------- Rollover ---------------- */

function ensureTodayLog() {
  const today = todayISO();
  const last = state.daily_logs[state.daily_logs.length - 1];
  if (!last || last.date !== today) {
    const carryWeight = last ? last.weight : state.user_profile.current_weight;
    state.daily_logs.push(newLog(today, carryWeight));
    return true;
  }
  if (!last.symptoms) last.symptoms = { headache: false, fatigue: false };
  return false;
}

function currentLog() {
  return state.daily_logs[state.daily_logs.length - 1];
}

/* ---------------- UI-only transient state ---------------- */

let selectedWorkoutDayId = null;
let workoutFormOpenForDayId = null;
let cardioFormOpen = false;
let charts = { weight: null, water: null, steps: null, weekly: null, workouts: null, bodyMeasurements: null, cardio: null, sleep: null };

/* ---------------- Mutation handlers ---------------- */

function addWater(amount) {
  const log = currentLog();
  log.water_consumed_liters = Math.round((log.water_consumed_liters + amount) * 100) / 100;
  commit();
}

function setSteps(value) {
  const n = Math.max(0, parseInt(value, 10) || 0);
  currentLog().steps_walked = n;
  commit();
}

function toggleGlutenFree() {
  const log = currentLog();
  log.is_gluten_free = !log.is_gluten_free;
  commit();
}

function toggleDessert() {
  const log = currentLog();
  log.dessert_consumed = !log.dessert_consumed;
  commit();
}

function togglePackagedFood() {
  const log = currentLog();
  log.packaged_food_consumed = !log.packaged_food_consumed;
  commit();
}

function toggleTriggerFood(key) {
  const log = currentLog();
  log.trigger_foods[key] = !log.trigger_foods[key];
  commit();
}

function setBrainFogNote(value) {
  currentLog().brain_fog_note = value;
  commit();
}

function toggleSupplement(key) {
  const log = currentLog();
  log.supplements[key] = !log.supplements[key];
  commit();
}

function addGreenTea() {
  const log = currentLog();
  log.green_tea_cups = (log.green_tea_cups || 0) + 1;
  commit();
}

function toggleSymptom(key) {
  const log = currentLog();
  log.symptoms[key] = !log.symptoms[key];
  commit();
}

function setNotes(value) {
  currentLog().notes = value;
  commit();
}

function setWeight(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return;
  currentLog().weight = n;
  state.user_profile.current_weight = n;
  commit();
}

function setSleepBedTime(value) {
  currentLog().sleep_bed_time = value || null;
  commit();
}

function setSleepWakeTime(value) {
  currentLog().sleep_wake_time = value || null;
  commit();
}

function sleepDurationHours(bedTime, wakeTime) {
  if (!bedTime || !wakeTime) return null;
  const [bh, bm] = bedTime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  const bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
  return (wakeMinutes - bedMinutes) / 60;
}

function selectWorkoutDay(dayId) {
  selectedWorkoutDayId = dayId;
  render();
}

function openCompleteWorkoutForm(dayId) {
  workoutFormOpenForDayId = dayId;
  render();
}

function cancelCompleteWorkoutForm() {
  workoutFormOpenForDayId = null;
  render();
}

function completeWorkout(dayId) {
  const program = WORKOUT_PROGRAMS.find(p => p.day_id === dayId);
  const rirInput = document.getElementById('workout-rir-input');
  const cardioInput = document.getElementById('workout-cardio-input');
  const fatigueRir = rirInput ? parseFloat(rirInput.value) : null;
  const cardio = cardioInput ? cardioInput.value.trim() : '';

  currentLog().workout_completed = {
    day_id: dayId,
    program_name: program ? program.name : null,
    fatigue_rir: isNaN(fatigueRir) ? null : fatigueRir,
    cardio: cardio,
    completed_at: new Date().toISOString()
  };
  workoutFormOpenForDayId = null;
  commit();
}

function openCardioForm() {
  cardioFormOpen = true;
  render();
}

function cancelCardioForm() {
  cardioFormOpen = false;
  render();
}

function logCardioSession() {
  const type = document.getElementById('cardio-type-input').value;
  const duration = parseFloat(document.getElementById('cardio-duration-input').value);
  const calories = parseFloat(document.getElementById('cardio-calories-input').value);
  if (isNaN(duration) || isNaN(calories)) {
    alert('Lütfen süre ve kalori alanlarını doldurun.');
    return;
  }
  currentLog().cardio_session = {
    type: type,
    duration_min: duration,
    calories_est: calories,
    completed_at: new Date().toISOString()
  };
  cardioFormOpen = false;
  commit();
}

function addWeeklyMeasurement() {
  const weight = parseFloat(document.getElementById('measure-weight').value);
  const muscle = parseFloat(document.getElementById('measure-muscle').value);
  const fat = parseFloat(document.getElementById('measure-fat').value);
  const fluid = parseFloat(document.getElementById('measure-fluid').value);
  if ([weight, muscle, fat, fluid].some(isNaN)) {
    alert('Lütfen tüm ölçüm alanlarını doldurun.');
    return;
  }
  state.weekly_measurements.push({
    date: todayISO(),
    weight: weight,
    muscle_mass_kg: muscle,
    fat_mass_kg: fat,
    fluid_kg: fluid
  });
  commit();
}

function addBodyMeasurement() {
  const entry = { date: todayISO() };
  let anyValue = false;
  BODY_MEASUREMENT_FIELDS.forEach(f => {
    const raw = document.getElementById('bodymeasure-' + f.key).value;
    const val = parseFloat(raw);
    if (!isNaN(val)) {
      entry[f.key] = val;
      anyValue = true;
    } else {
      entry[f.key] = null;
    }
  });
  if (!anyValue) {
    alert('Lütfen en az bir ölçüm alanı doldurun.');
    return;
  }
  state.body_measurements.push(entry);
  commit();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'protocol_state.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showJSONStatus('İndirildi (yedek kopya) — repoyu güncellemek için "Kaydet" butonunu kullanın.');
}

function copyJSON() {
  const text = JSON.stringify(state, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    showJSONStatus('Kopyalandı!');
  }).catch(() => {
    const ta = document.getElementById('json-output');
    ta.select();
    document.execCommand('copy');
    showJSONStatus('Kopyalandı!');
  });
}

function showJSONStatus(msg) {
  const el = document.getElementById('json-status');
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 2500);
}

function handleImportFile(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      const merged = Object.assign(getDefaultState(), imported);
      activateState(merged, 'Yüklendi!');
    } catch (e) {
      alert('Geçersiz JSON dosyası: ' + e.message);
    }
  };
  reader.readAsText(file);
  evt.target.value = '';
}

function startWithDefaults() {
  activateState(getDefaultState(), 'Varsayılan verilerle başlatıldı.');
}

/* ---------------- SOP business logic ---------------- */

function isWaterRisk(log) {
  return log.water_consumed_liters < 3;
}

function showElectrolyteReminder(log) {
  return !!(log.symptoms && (log.symptoms.headache || log.symptoms.fatigue));
}

function glutenRisk(log) {
  return !log.is_gluten_free;
}

function nextMilestone(currentWeight) {
  const milestones = state.user_profile.weight_milestones || [];
  return milestones.find(m => currentWeight > m);
}

function computeStreak(predicate) {
  const logsByDate = {};
  state.daily_logs.forEach(l => { logsByDate[l.date] = l; });
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (true) {
    const log = logsByDate[formatDateISO(cursor)];
    if (!log || !predicate(log)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function glutenFreeStreak() { return computeStreak(l => l.is_gluten_free); }
function dessertFreeStreak() { return computeStreak(l => !l.dessert_consumed); }
function packagedFoodFreeStreak() { return computeStreak(l => !l.packaged_food_consumed); }

const WEEKLY_STABLE_THRESHOLD_KG = 0.3;

function weeklyInsight(list) {
  if (!list || list.length < 2) return null;
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const prev = sorted[sorted.length - 2];
  const curr = sorted[sorted.length - 1];
  const dFluid = curr.fluid_kg - prev.fluid_kg;
  const dFat = curr.fat_mass_kg - prev.fat_mass_kg;
  const dMuscle = curr.muscle_mass_kg - prev.muscle_mass_kg;
  const t = WEEKLY_STABLE_THRESHOLD_KG;

  if (dMuscle < -t) {
    return { tone: 'warning', text: `Kas kütlesinde ${Math.abs(dMuscle).toFixed(1)} kg düşüş var — protein alımını ve antrenman yoğunluğunu kontrol et.` };
  }
  if (dFat < -t && dFluid < -t && Math.abs(dMuscle) <= t) {
    return { tone: 'success', text: 'Yağ yakımı başladı — hem yağ hem sıvı düşerken kas kütlen korunuyor. Böyle devam!' };
  }
  if (dFluid < -t && Math.abs(dMuscle) <= t) {
    return { tone: 'info', text: 'Bu bir hücresel su hareketidir, moral bozma. Kas kütlen stabil.' };
  }
  return { tone: 'info', text: 'Veriler stabil görünüyor, protokole devam.' };
}

/* ---------------- Render functions ---------------- */

function render() {
  renderSaveStatus();
  renderBanners();
  renderProfileCard();
  renderProtocolNotes();
  renderHabitChains();
  renderWaterCard();
  renderStepsCard();
  renderSupplementTimeline();
  renderSymptomsNotes();
  renderWorkoutModule();
  renderCardioModule();
  renderWeeklyMeasurements();
  renderBodyMeasurements();
  renderCharts();
  renderJSONView();
}

function renderSaveStatus() {
  const el = document.getElementById('save-status-banner');
  if (!el) return;

  el.classList.remove('banner-warning', 'banner-danger', 'banner-success');

  if (saveUiState === 'saving') {
    el.classList.remove('hidden');
    el.classList.add('banner-warning');
    el.innerHTML = `⏳ Kaydediliyor...`;
  } else if (saveUiState === 'saved') {
    el.classList.remove('hidden');
    el.classList.add('banner-success');
    el.innerHTML = `✅ Kaydedildi.`;
  } else if (saveUiState === 'error') {
    el.classList.remove('hidden');
    el.classList.add('banner-danger');
    el.innerHTML = `⚠️ Kaydetme başarısız: ${saveErrorMsg} <button class="btn btn-primary btn-small" onclick="saveState()">Tekrar Dene</button>`;
  } else if (hasUnsavedChanges) {
    el.classList.remove('hidden');
    el.classList.add('banner-warning');
    el.innerHTML = `⚠️ Kaydedilmemiş değişiklikler var. <button class="btn btn-primary btn-small" onclick="saveState()">Kaydet</button>`;
  } else {
    el.classList.add('hidden');
  }
}

function renderBanners() {
  const log = currentLog();

  const waterBanner = document.getElementById('water-warning-banner');
  if (isWaterRisk(log)) {
    waterBanner.textContent = '⚠️ Ödem Riski: Suyu Artır!';
    waterBanner.classList.remove('hidden');
  } else {
    waterBanner.classList.add('hidden');
  }

  const glutenBanner = document.getElementById('gluten-warning-banner');
  if (glutenRisk(log)) {
    glutenBanner.textContent = '🌾 Potansiyel Ödem Riski: Bugün glüten tüketildi.';
    glutenBanner.classList.remove('hidden');
  } else {
    glutenBanner.classList.add('hidden');
  }

  const electroBanner = document.getElementById('electrolyte-banner');
  if (showElectrolyteReminder(log)) {
    electroBanner.textContent = '💧 Kaya tuzlu su tükettin mi?';
    electroBanner.classList.remove('hidden');
  } else {
    electroBanner.classList.add('hidden');
  }
}

function renderProfileCard() {
  const p = state.user_profile;
  const log = currentLog();
  const startWeight = state.daily_logs[0].weight;
  const total = startWeight - p.target_weight;
  const done = startWeight - log.weight;
  const pct = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;

  const nextM = nextMilestone(log.weight);
  const milestoneHtml = nextM !== undefined
    ? `<p class="kpi-target">Sıradaki ara hedef: <strong>${nextM} kg</strong> (${(log.weight - nextM).toFixed(1)} kg kaldı)</p>`
    : `<p class="kpi-target">🎉 Tüm ara hedeflere ulaşıldı!</p>`;

  document.getElementById('profile-card').innerHTML = `
    <div class="profile-top">
      <h1>${p.name}</h1>
      <span class="profile-weights"><strong>${log.weight.toFixed(1)} kg</strong> → <span class="lime-mark">${p.target_weight.toFixed(1)} kg</span> hedef</span>
    </div>
    <div class="progress-track"><div class="progress-fill success" style="width:${pct}%"></div></div>
    <div class="progress-label"><span>Başlangıç: ${startWeight.toFixed(1)} kg</span><span>%${pct.toFixed(0)} tamamlandı</span></div>
    ${milestoneHtml}
    <div class="form-row" style="margin-top:12px; max-width:180px;">
      <label for="weight-input">Bugünkü Kilo (kg)</label>
      <input type="number" step="0.1" id="weight-input" value="${log.weight}" onchange="setWeight(this.value)">
    </div>
  `;
}

function renderProtocolNotes() {
  const p = state.user_profile;
  document.getElementById('protocol-notes').innerHTML = `
    <div class="section-label"><span class="dot"></span>REHBER</div>
    <h2>Protokol Notları</h2>
    <ul class="protocol-notes-list">
      <li><strong>Günlük kalori bütçesi:</strong> ~${p.daily_calorie_budget_kcal} kcal (FatSecret üzerinden ayrıca takip ediliyor).</li>
      <li><strong>Oruç kapanışı:</strong> Akşam pencere genelde 20:30–23:00 arası kapanır.</li>
      <li><strong>Mangal/et günlerinde:</strong> Pirzola yerine tavuk göğsü tercih et, porsiyon 300-350gr bandında kalsın.</li>
      <li><strong>Akşam kapanış rutini:</strong> Geç saatte ağır egzersizden kaçın (vücut ısısı düşsün), yatıştan hemen önce sıvı alma.</li>
    </ul>
  `;
}

function renderWaterCard() {
  const p = state.user_profile;
  const log = currentLog();
  const pct = Math.min(100, (log.water_consumed_liters / p.daily_water_target_liters) * 100);
  document.getElementById('water-card').innerHTML = `
    <div class="kpi-icon-badge">💧</div>
    <h3>Su Tüketimi</h3>
    <div class="kpi-value">${log.water_consumed_liters.toFixed(1)} L</div>
    <div class="kpi-target">Hedef: ${p.daily_water_target_liters.toFixed(1)} L</div>
    <div class="progress-track" style="margin-top:8px;"><div class="progress-fill ${isWaterRisk(log) ? 'danger' : ''}" style="width:${pct}%"></div></div>
    <div class="kpi-actions">
      <button class="btn btn-primary" onclick="addWater(0.5)">+0.5L</button>
    </div>
  `;
}

function renderStepsCard() {
  const p = state.user_profile;
  const log = currentLog();
  const pct = Math.min(100, (log.steps_walked / p.daily_step_target) * 100);
  document.getElementById('steps-card').innerHTML = `
    <div class="kpi-icon-badge">👣</div>
    <h3>Adım Sayısı</h3>
    <div class="kpi-value">${log.steps_walked.toLocaleString('tr-TR')}</div>
    <div class="kpi-target">Hedef: ${p.daily_step_target.toLocaleString('tr-TR')}</div>
    <div class="progress-track" style="margin-top:8px;"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="kpi-actions">
      <input type="number" min="0" class="steps-input" value="${log.steps_walked}" onchange="setSteps(this.value)">
    </div>
  `;
}

function renderHabitChains() {
  const log = currentLog();

  const chains = [
    {
      icon: '🌾', label: 'Glutensiz Günler', streak: glutenFreeStreak(),
      failed: !log.is_gluten_free, question: 'Bugün glüten tüketildi mi?',
      onchange: 'toggleGlutenFree()'
    },
    {
      icon: '🍰', label: 'Tatlısız Günler', streak: dessertFreeStreak(),
      failed: log.dessert_consumed, question: 'Bugün tatlı tüketildi mi?',
      onchange: 'toggleDessert()'
    },
    {
      icon: '📦', label: 'Paketli Gıda Tüketmeme', streak: packagedFoodFreeStreak(),
      failed: log.packaged_food_consumed, question: 'Bugün paketli gıda tüketildi mi?',
      onchange: 'togglePackagedFood()'
    }
  ];

  const blocksHtml = chains.map(c => `
    <div class="chain-block">
      <div class="chain-icon">${c.icon}</div>
      <div class="chain-count">${c.streak}</div>
      <div class="chain-label">${c.label}</div>
      <div class="gluten-row">
        <span class="kpi-target">${c.question}</span>
        <label class="switch">
          <input type="checkbox" ${c.failed ? 'checked' : ''} onchange="${c.onchange}">
          <span class="switch-track"></span>
        </label>
      </div>
    </div>
  `).join('');

  document.getElementById('habit-chains').innerHTML = `
    <div class="section-label"><span class="dot"></span>ZİNCİRİ KIRMA</div>
    <h2>Alışkanlık Zincirleri</h2>
    <div class="grid grid-3">
      ${blocksHtml}
    </div>
  `;
}

function renderSupplementTimeline() {
  const log = currentLog();
  const today = todayISO();
  const blocksHtml = SUPPLEMENT_TIMELINE.map(block => {
    const itemsHtml = block.items
      .filter(item => item.condition !== 'friday' || isFriday(today))
      .map(item => {
        if (item.type === 'counter') {
          const count = log[item.key] || 0;
          return `
            <div class="check-item counter-item">
              <span class="check-label">${item.label}</span>
              <div class="counter-controls">
                <span class="counter-value">${count}/${item.target}</span>
                <button class="btn btn-ghost btn-small" onclick="addGreenTea()">+1 Fincan</button>
              </div>
            </div>
          `;
        }
        const checked = !!log.supplements[item.key];
        return `
          <label class="check-item ${checked ? 'checked' : ''}">
            <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleSupplement('${item.key}')">
            <span class="check-label">${item.label}</span>
          </label>
        `;
      }).join('');
    return `
      <div class="timeline-block">
        <div class="timeline-head">
          <span>${block.icon}</span>
          <span class="timeline-time">${block.title} (${block.time})</span>
          <span class="timeline-subtitle">— ${block.subtitle}</span>
        </div>
        ${itemsHtml}
      </div>
    `;
  }).join('');

  document.getElementById('supplement-timeline').innerHTML = `
    <div class="section-label"><span class="dot"></span>PROTOKOL</div>
    <h2>Zaman Tüneli & Supplement Protokolü</h2>
    ${blocksHtml}
  `;
}

function renderSymptomsNotes() {
  const log = currentLog();
  const durationHours = sleepDurationHours(log.sleep_bed_time, log.sleep_wake_time);
  const inBand = durationHours !== null && durationHours >= 6.5 && durationHours <= 7.5;
  const durationHtml = durationHours !== null
    ? `<p class="kpi-target"${inBand ? ' style="color:var(--success);font-weight:700;"' : ''}>Uyku süresi: ${durationHours.toFixed(1)} saat</p>`
    : '';

  const triggerFields = [
    { key: 'sugar_added', label: 'Şeker / İlave Glikoz' },
    { key: 'refined_oils_trans_fats', label: 'Rafine Tohum Yağları / Trans Yağlar' },
    { key: 'artificial_sweeteners', label: 'Yapay Tatlandırıcılar / Katkı Maddeleri' },
    { key: 'excess_lactose_dairy', label: 'Aşırı Laktoz / İşlenmiş Süt Ürünleri' }
  ];
  const triggerRowHtml = triggerFields.map(f => `
    <label class="symptom-check">
      <input type="checkbox" ${log.trigger_foods[f.key] ? 'checked' : ''} onchange="toggleTriggerFood('${f.key}')">
      ${f.label}
    </label>
  `).join('');

  const anyTrigger = !log.is_gluten_free || Object.values(log.trigger_foods).some(v => v);
  const brainFogHtml = anyTrigger ? `
    <div class="form-row" style="margin-top:8px;">
      <label for="brain-fog-note-input">Beyin Sisi / Ruh Hali Notu</label>
      <textarea id="brain-fog-note-input" placeholder="Bugün tetikleyici besin sonrası beyin sisi/ruh hali değişimi hissettin mi?" onchange="setBrainFogNote(this.value)">${log.brain_fog_note}</textarea>
    </div>
  ` : '';

  document.getElementById('symptoms-notes').innerHTML = `
    <div class="section-label"><span class="dot"></span>DURUM</div>
    <h2>Semptomlar & Notlar</h2>
    <div class="symptom-row">
      <label class="symptom-check">
        <input type="checkbox" ${log.symptoms.headache ? 'checked' : ''} onchange="toggleSymptom('headache')">
        Baş ağrısı
      </label>
      <label class="symptom-check">
        <input type="checkbox" ${log.symptoms.fatigue ? 'checked' : ''} onchange="toggleSymptom('fatigue')">
        Halsizlik
      </label>
    </div>
    <h3>Tetikleyici Besinler (Beyin Sisi)</h3>
    <div class="symptom-row">
      ${triggerRowHtml}
    </div>
    ${brainFogHtml}
    <h3>Uyku (Hedef: 22:15–05:15)</h3>
    <div class="measure-input-grid sleep-input-grid">
      <div class="form-row"><label>Yatış Saati</label><input type="time" id="sleep-bed-input" value="${log.sleep_bed_time || ''}" onchange="setSleepBedTime(this.value)"></div>
      <div class="form-row"><label>Kalkış Saati</label><input type="time" id="sleep-wake-input" value="${log.sleep_wake_time || ''}" onchange="setSleepWakeTime(this.value)"></div>
    </div>
    ${durationHtml}
    <textarea id="notes-input" placeholder="Bugünle ilgili notlar..." onchange="setNotes(this.value)">${log.notes}</textarea>
  `;
}

function renderWorkoutModule() {
  const suggestedDayId = nextSuggestedDayId();
  if (selectedWorkoutDayId === null) selectedWorkoutDayId = suggestedDayId;

  const pillsHtml = WORKOUT_PROGRAMS.map(p => `
    <button class="pill ${p.day_id === selectedWorkoutDayId ? 'active' : ''} ${p.day_id === suggestedDayId ? 'suggested' : ''}"
            onclick="selectWorkoutDay(${p.day_id})">${CYCLE_DAY_LABELS[p.day_id - 1]}: ${p.name}</button>
  `).join('');

  const program = WORKOUT_PROGRAMS.find(p => p.day_id === selectedWorkoutDayId);
  const exercisesHtml = program.exercises.map(ex => `
    <div class="exercise-row">
      <span class="exercise-name">${ex.name}${ex.note ? `<span class="exercise-note">${ex.note}</span>` : ''}</span>
      <span class="exercise-meta">${ex.sets} set × ${ex.reps} tekrar @ ${ex.target_rir} RiR</span>
    </div>
  `).join('');

  const log = currentLog();
  const completed = log.workout_completed;
  const isCompletedForThisProgram = completed && completed.day_id === selectedWorkoutDayId;

  let actionHtml;
  if (isCompletedForThisProgram) {
    actionHtml = `
      <div class="workout-summary">
        ✅ Tamamlandı — ${completed.program_name}<br>
        MSS Bitkinlik Derecesi (RiR): <strong>${completed.fatigue_rir !== null ? completed.fatigue_rir : '-'}</strong><br>
        Kardiyo: ${completed.cardio || '-'}
      </div>
    `;
  } else if (workoutFormOpenForDayId === selectedWorkoutDayId) {
    actionHtml = `
      <div class="form-row">
        <label for="workout-rir-input">MSS Bitkinlik Derecesi (RiR bazlı)</label>
        <input type="number" step="0.5" min="0" id="workout-rir-input" placeholder="Örn. 2.0">
      </div>
      <div class="form-row">
        <label for="workout-cardio-input">Kardiyo (Örn. 20 dk LISS yürüme bandı)</label>
        <input type="text" id="workout-cardio-input" placeholder="Örn. 20 dk LISS yürüme bandı">
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="completeWorkout(${selectedWorkoutDayId})">Kaydet</button>
        <button class="btn btn-ghost" onclick="cancelCompleteWorkoutForm()">İptal</button>
      </div>
    `;
  } else {
    actionHtml = `<button class="btn btn-primary" onclick="openCompleteWorkoutForm(${selectedWorkoutDayId})">Antrenmanı Tamamla</button>`;
  }

  document.getElementById('workout-module').innerHTML = `
    <div class="section-label"><span class="dot"></span>ANTRENMAN</div>
    <h2>Antrenman Modülü — 4 Günlük Döngü</h2>
    <div class="pill-row">${pillsHtml}</div>
    <h3>${program.name}</h3>
    ${exercisesHtml}
    <div style="margin-top:12px;">${actionHtml}</div>
  `;
}

function renderCardioModule() {
  const log = currentLog();
  const session = log.cardio_session;

  let actionHtml;
  if (session) {
    const typeLabel = session.type === 'yuzme' ? 'Yüzme' : 'Yürüyüş';
    actionHtml = `
      <div class="workout-summary">
        ✅ ${typeLabel} tamamlandı<br>
        Süre: <strong>${session.duration_min} dk</strong><br>
        Tahmini Kalori: <strong>${session.calories_est} kcal</strong>
      </div>
    `;
  } else if (cardioFormOpen) {
    actionHtml = `
      <div class="form-row">
        <label for="cardio-type-input">Tür</label>
        <select id="cardio-type-input" class="steps-input">
          <option value="yuruyus">Yürüyüş</option>
          <option value="yuzme">Yüzme</option>
        </select>
      </div>
      <div class="form-row">
        <label for="cardio-duration-input">Süre (dk)</label>
        <input type="number" step="1" min="0" id="cardio-duration-input" placeholder="Örn. 110">
      </div>
      <div class="form-row">
        <label for="cardio-calories-input">Tahmini Kalori (kcal)</label>
        <input type="number" step="10" min="0" id="cardio-calories-input" placeholder="Örn. 980">
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="logCardioSession()">Kaydet</button>
        <button class="btn btn-ghost" onclick="cancelCardioForm()">İptal</button>
      </div>
    `;
  } else {
    actionHtml = `<button class="btn btn-primary" onclick="openCardioForm()">Kardiyo Seansı Ekle</button>`;
  }

  document.getElementById('cardio-module').innerHTML = `
    <div class="section-label"><span class="dot"></span>KARDİYO</div>
    <h2>Kardiyo Seansları</h2>
    <p class="hint-text">Yüksek kalorili yürüyüş (~2 saat, ~1000 kcal) veya yüzme seansı.</p>
    ${actionHtml}
  `;
}

function renderWeeklyMeasurements() {
  const list = [...state.weekly_measurements].sort((a, b) => a.date.localeCompare(b.date));
  const rowsHtml = list.map(m => `
    <tr>
      <td>${m.date}</td>
      <td>${m.weight.toFixed(1)}</td>
      <td>${m.muscle_mass_kg.toFixed(1)}</td>
      <td>${m.fat_mass_kg.toFixed(1)}</td>
      <td>${m.fluid_kg.toFixed(1)}</td>
    </tr>
  `).join('');

  const insight = weeklyInsight(state.weekly_measurements);
  const insightHtml = insight ? `<div class="insight-box">${insight.text}</div>` : '';
  const weekendHint = isWeekend(todayISO())
    ? '<p class="kpi-target">Bugün Tanita ölçüm günü — yeni verileri aşağıya ekle.</p>' : '';

  document.getElementById('weekly-measurements').innerHTML = `
    <div class="section-label"><span class="dot"></span>HAFTALIK ANALİZ</div>
    <h2>Haftalık Tanita Ölçümleri</h2>
    ${weekendHint}
    ${list.length ? `
      <table class="measure-table">
        <thead><tr><th>Tarih</th><th>Kilo</th><th>Saf Kas</th><th>Saf Yağ</th><th>Sıvı</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    ` : '<p class="kpi-target">Henüz ölçüm eklenmedi.</p>'}
    ${insightHtml}
    <div class="measure-input-grid">
      <div class="form-row"><label>Kilo (kg)</label><input type="number" step="0.1" id="measure-weight"></div>
      <div class="form-row"><label>Saf Kas (kg)</label><input type="number" step="0.1" id="measure-muscle"></div>
      <div class="form-row"><label>Saf Yağ (kg)</label><input type="number" step="0.1" id="measure-fat"></div>
      <div class="form-row"><label>Sıvı (kg)</label><input type="number" step="0.1" id="measure-fluid"></div>
    </div>
    <button class="btn btn-primary" onclick="addWeeklyMeasurement()">Ölçüm Ekle</button>
  `;
}

function renderBodyMeasurements() {
  const list = [...state.body_measurements].sort((a, b) => a.date.localeCompare(b.date));

  const headerHtml = BODY_MEASUREMENT_FIELDS.map(f => `<th>${f.label}</th>`).join('');
  const rowsHtml = list.map(m => `
    <tr>
      <td>${m.date}</td>
      ${BODY_MEASUREMENT_FIELDS.map(f => `<td>${m[f.key] != null ? m[f.key].toFixed(1) : '—'}</td>`).join('')}
    </tr>
  `).join('');

  const weekendHint = isWeekend(todayISO())
    ? '<p class="kpi-target">Bugün Tanita ölçüm günü — mezura ölçümlerini de aşağıya ekle.</p>' : '';

  const formHtml = BODY_MEASUREMENT_FIELDS.map(f => `
    <div class="form-row"><label>${f.label} (cm)</label><input type="number" step="0.1" id="bodymeasure-${f.key}"></div>
  `).join('');

  document.getElementById('body-measurements').innerHTML = `
    <div class="section-label"><span class="dot"></span>MEZURA</div>
    <h2>Vücut Ölçüleri</h2>
    ${weekendHint}
    ${list.length ? `
      <div class="table-scroll">
        <table class="measure-table">
          <thead><tr><th>Tarih</th>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    ` : '<p class="kpi-target">Henüz ölçüm eklenmedi.</p>'}
    <div class="measure-input-grid body-measure-grid">
      ${formHtml}
    </div>
    <button class="btn btn-primary" onclick="addBodyMeasurement()">Ölçüm Ekle</button>
  `;
}

function chartPalette() {
  const css = getComputedStyle(document.documentElement);
  const get = (name, fallback) => (css.getPropertyValue(name) || fallback).trim();
  return {
    lime: get('--lime', '#BEE436'),
    limeBright: get('--lime-bright', '#C4EB42'),
    dark: get('--dark', '#1A2E23'),
    muted: get('--muted', '#6B7268'),
    text: get('--text', '#0B1410'),
    grid: get('--chart-grid', 'rgba(11,20,16,.08)'),
    danger: get('--danger', '#ff5c5c'),
    warning: get('--warning', '#f5b942')
  };
}

function baseChartOptions(colors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, labels: { color: colors.text, font: { family: 'DM Sans', size: 11 }, boxWidth: 12 } }
    },
    scales: {
      x: { ticks: { color: colors.muted, font: { family: 'DM Sans', size: 10 } }, grid: { color: colors.grid } },
      y: { ticks: { color: colors.muted, font: { family: 'DM Sans', size: 10 } }, grid: { color: colors.grid } }
    }
  };
}

function upsertChart(key, canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (charts[key]) charts[key].destroy();
  charts[key] = new Chart(canvas, config);
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  const colors = chartPalette();
  const opts = baseChartOptions(colors);
  const logs = [...state.daily_logs].sort((a, b) => a.date.localeCompare(b.date));
  const labels = logs.map(l => l.date.slice(5));

  upsertChart('weight', 'chart-weight', {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Kilo (kg)', data: logs.map(l => l.weight), borderColor: colors.lime, backgroundColor: colors.lime, tension: .3, pointRadius: 3 },
        { label: 'Hedef', data: logs.map(() => state.user_profile.target_weight), borderColor: colors.muted, borderDash: [6, 4], pointRadius: 0 }
      ]
    },
    options: opts
  });

  upsertChart('water', 'chart-water', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Su (L)', data: logs.map(l => l.water_consumed_liters), backgroundColor: colors.lime },
        { label: 'Hedef', data: logs.map(() => state.user_profile.daily_water_target_liters), type: 'line', borderColor: colors.muted, borderDash: [6, 4], pointRadius: 0 }
      ]
    },
    options: opts
  });

  upsertChart('steps', 'chart-steps', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Adım', data: logs.map(l => l.steps_walked), backgroundColor: colors.lime },
        { label: 'Hedef', data: logs.map(() => state.user_profile.daily_step_target), type: 'line', borderColor: colors.muted, borderDash: [6, 4], pointRadius: 0 }
      ]
    },
    options: opts
  });

  const weekly = [...state.weekly_measurements].sort((a, b) => a.date.localeCompare(b.date));
  const weeklyCanvas = document.getElementById('chart-weekly');
  const weeklyEmpty = document.getElementById('chart-weekly-empty');
  if (weekly.length < 2) {
    weeklyCanvas.classList.add('hidden');
    weeklyEmpty.classList.remove('hidden');
    if (charts.weekly) { charts.weekly.destroy(); charts.weekly = null; }
  } else {
    weeklyCanvas.classList.remove('hidden');
    weeklyEmpty.classList.add('hidden');
    const wLabels = weekly.map(m => m.date.slice(5));
    upsertChart('weekly', 'chart-weekly', {
      type: 'line',
      data: {
        labels: wLabels,
        datasets: [
          { label: 'Kilo', data: weekly.map(m => m.weight), borderColor: colors.lime, tension: .3, pointRadius: 3 },
          { label: 'Saf Kas', data: weekly.map(m => m.muscle_mass_kg), borderColor: colors.limeBright, tension: .3, pointRadius: 3 },
          { label: 'Saf Yağ', data: weekly.map(m => m.fat_mass_kg), borderColor: colors.warning, tension: .3, pointRadius: 3 },
          { label: 'Sıvı', data: weekly.map(m => m.fluid_kg), borderColor: colors.muted, tension: .3, pointRadius: 3 }
        ]
      },
      options: opts
    });
  }

  const workoutLogs = state.daily_logs
    .filter(l => l.workout_completed)
    .sort((a, b) => a.date.localeCompare(b.date));
  const workoutsCanvas = document.getElementById('chart-workouts');
  const workoutsEmpty = document.getElementById('chart-workouts-empty');
  if (workoutLogs.length === 0) {
    workoutsCanvas.classList.add('hidden');
    workoutsEmpty.classList.remove('hidden');
    if (charts.workouts) { charts.workouts.destroy(); charts.workouts = null; }
  } else {
    workoutsCanvas.classList.remove('hidden');
    workoutsEmpty.classList.add('hidden');
    const wLabels = workoutLogs.map(l => l.date.slice(5));
    const dayCount = WORKOUT_PROGRAMS.length;
    upsertChart('workouts', 'chart-workouts', {
      type: 'line',
      data: {
        labels: wLabels,
        datasets: [{
          label: 'Tamamlanan Gün',
          data: workoutLogs.map(l => l.workout_completed.day_id),
          borderColor: colors.lime,
          backgroundColor: colors.lime,
          stepped: false,
          tension: 0,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Gün #${ctx.raw}`
            }
          }
        },
        scales: {
          x: { ticks: { color: colors.muted, font: { family: 'DM Sans', size: 10 } }, grid: { color: colors.grid } },
          y: {
            min: 0.5,
            max: dayCount + 0.5,
            ticks: {
              stepSize: 1,
              color: colors.muted,
              font: { family: 'DM Sans', size: 10 },
              callback: (val) => (Number.isInteger(val) && val >= 1 && val <= dayCount) ? `Gün #${val}` : ''
            },
            grid: { color: colors.grid }
          }
        }
      }
    });
  }

  const bodyList = [...state.body_measurements].sort((a, b) => a.date.localeCompare(b.date));
  const bodyCanvas = document.getElementById('chart-body-measurements');
  const bodyEmpty = document.getElementById('chart-body-measurements-empty');
  if (bodyList.length < 2) {
    bodyCanvas.classList.add('hidden');
    bodyEmpty.classList.remove('hidden');
    if (charts.bodyMeasurements) { charts.bodyMeasurements.destroy(); charts.bodyMeasurements = null; }
  } else {
    bodyCanvas.classList.remove('hidden');
    bodyEmpty.classList.add('hidden');
    const bLabels = bodyList.map(m => m.date.slice(5));
    upsertChart('bodyMeasurements', 'chart-body-measurements', {
      type: 'line',
      data: {
        labels: bLabels,
        datasets: BODY_MEASUREMENT_FIELDS.map(f => ({
          label: f.label,
          data: bodyList.map(m => (m[f.key] != null ? m[f.key] : null)),
          borderColor: f.color,
          backgroundColor: f.color,
          spanGaps: true,
          tension: .3,
          pointRadius: 3
        }))
      },
      options: opts
    });
  }

  const cardioLogs = state.daily_logs
    .filter(l => l.cardio_session)
    .sort((a, b) => a.date.localeCompare(b.date));
  const cardioCanvas = document.getElementById('chart-cardio');
  const cardioEmpty = document.getElementById('chart-cardio-empty');
  if (cardioLogs.length === 0) {
    cardioCanvas.classList.add('hidden');
    cardioEmpty.classList.remove('hidden');
    if (charts.cardio) { charts.cardio.destroy(); charts.cardio = null; }
  } else {
    cardioCanvas.classList.remove('hidden');
    cardioEmpty.classList.add('hidden');
    upsertChart('cardio', 'chart-cardio', {
      type: 'bar',
      data: {
        labels: cardioLogs.map(l => l.date.slice(5)),
        datasets: [{
          label: 'Tahmini Kalori',
          data: cardioLogs.map(l => l.cardio_session.calories_est),
          backgroundColor: colors.lime
        }]
      },
      options: opts
    });
  }

  const sleepLogs = state.daily_logs
    .filter(l => l.sleep_bed_time && l.sleep_wake_time)
    .sort((a, b) => a.date.localeCompare(b.date));
  const sleepCanvas = document.getElementById('chart-sleep');
  const sleepEmpty = document.getElementById('chart-sleep-empty');
  if (sleepLogs.length < 2) {
    sleepCanvas.classList.add('hidden');
    sleepEmpty.classList.remove('hidden');
    if (charts.sleep) { charts.sleep.destroy(); charts.sleep = null; }
  } else {
    sleepCanvas.classList.remove('hidden');
    sleepEmpty.classList.add('hidden');
    upsertChart('sleep', 'chart-sleep', {
      type: 'line',
      data: {
        labels: sleepLogs.map(l => l.date.slice(5)),
        datasets: [{
          label: 'Uyku Süresi (saat)',
          data: sleepLogs.map(l => sleepDurationHours(l.sleep_bed_time, l.sleep_wake_time)),
          borderColor: colors.lime,
          backgroundColor: colors.lime,
          tension: .3,
          pointRadius: 3
        }]
      },
      options: opts
    });
  }
}

function renderJSONView() {
  document.getElementById('json-output').value = JSON.stringify(state, null, 2);
}

/* ---------------- Entrance animation (one-time, load-triggered) ---------------- */

function setupEntranceAnimation() {
  document.querySelectorAll('.card').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.animationDelay = `${Math.min(i, 8) * 40}ms`;
  });
}

/* ---------------- Load gate (fetch failed / no file yet) ---------------- */

let appInitialized = false;

const NEW_SUPPLEMENT_KEYS = ['apple_cider_vinegar_morning', 'electrolyte_mineral_water', 'edema_water_cocktail', 'evening_salad'];

function activateState(newState, statusMsg) {
  state = newState;
  if (!Array.isArray(state.body_measurements)) state.body_measurements = [];
  if (!Array.isArray(state.user_profile.weight_milestones)) {
    state.user_profile.weight_milestones = [145, 140, 135, 130, 125, 120, 115, 110, 105, 100];
  }
  if (state.user_profile.daily_calorie_budget_kcal == null) {
    state.user_profile.daily_calorie_budget_kcal = 2000;
  }
  state.daily_logs.forEach(log => {
    if (log.green_tea_cups == null) log.green_tea_cups = 0;
    if (log.cardio_session === undefined) log.cardio_session = null;
    if (log.sleep_bed_time === undefined) log.sleep_bed_time = null;
    if (log.sleep_wake_time === undefined) log.sleep_wake_time = null;
    if (log.dessert_consumed === undefined) log.dessert_consumed = false;
    if (log.packaged_food_consumed === undefined) log.packaged_food_consumed = false;
    if (!log.trigger_foods) {
      log.trigger_foods = {
        sugar_added: false,
        refined_oils_trans_fats: false,
        artificial_sweeteners: false,
        excess_lactose_dairy: false
      };
    }
    ['sugar_added', 'refined_oils_trans_fats', 'artificial_sweeteners', 'excess_lactose_dairy'].forEach(k => {
      if (log.trigger_foods[k] === undefined) log.trigger_foods[k] = false;
    });
    if (log.brain_fog_note === undefined) log.brain_fog_note = '';
    if (!log.supplements) log.supplements = emptySupplements();
    NEW_SUPPLEMENT_KEYS.forEach(k => {
      if (log.supplements[k] === undefined) log.supplements[k] = false;
    });
  });
  const rolledOver = ensureTodayLog();
  hasUnsavedChanges = rolledOver;
  hideLoadGate();
  document.getElementById('app-root').classList.remove('hidden');
  render();
  if (!appInitialized) setupEntranceAnimation();
  appInitialized = true;
  if (statusMsg) showJSONStatus(statusMsg);
}

function showLoadGate() {
  document.getElementById('load-gate').classList.remove('hidden');
  document.getElementById('app-root').classList.add('hidden');
}

function hideLoadGate() {
  document.getElementById('load-gate').classList.add('hidden');
}

/* ---------------- Init ---------------- */

async function initLoad() {
  if (getToken()) {
    const data = await tryLoadFromApi();
    if (data) return data;
  }

  const entered = window.prompt('Bu panoya erişmek için parolayı girin:');
  if (entered) {
    setToken(entered.trim());
    const data = await tryLoadFromApi();
    if (data) return data;
    showJSONStatus('Parola yanlış görünüyor ya da sunucuya ulaşılamadı — salt okunur moda geçiliyor.');
  }

  // Fallback: read-only static file (works even without the API, e.g. local testing)
  return fetchStateFile();
}

document.addEventListener('DOMContentLoaded', async () => {
  const loaded = await initLoad();
  if (loaded) {
    activateState(loaded, getToken() ? 'Yüklendi.' : `${STATE_FILE} yüklendi (salt okunur).`);
  } else {
    showLoadGate();
  }
});
