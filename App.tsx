import { useState } from "react";

// ── BASE ANNUAL MORTALITY RATES (CDC WONDER 2020-2022, per 100,000) ──────────
// Indexed by [sex][ageGroup] where ageGroup: 0=18-34, 1=35-44, 2=45-54, 3=55-64, 4=65-74, 5=75+
const BASE_RATES = {
  "Heart disease (coronary artery disease, heart failure, arrhythmia)": {
    M: [0.008, 0.045, 0.18, 0.48, 1.05, 3.2],
    F: [0.003, 0.018, 0.07, 0.22, 0.55, 2.4]
  },
  "Cancer (all malignant neoplasms)": {
    M: [0.025, 0.055, 0.18, 0.48, 0.95, 1.8],
    F: [0.022, 0.065, 0.18, 0.38, 0.72, 1.4]
  },
  "COVID-19 & influenza / pneumonia": {
    M: [0.004, 0.009, 0.025, 0.07, 0.18, 0.65],
    F: [0.002, 0.005, 0.015, 0.04, 0.12, 0.55]
  },
  "Stroke (cerebrovascular disease)": {
    M: [0.003, 0.009, 0.028, 0.075, 0.18, 0.72],
    F: [0.002, 0.007, 0.020, 0.055, 0.14, 0.68]
  },
  "Chronic lower respiratory disease (COPD, emphysema, asthma)": {
    M: [0.001, 0.003, 0.012, 0.055, 0.16, 0.52],
    F: [0.001, 0.003, 0.014, 0.052, 0.14, 0.44]
  },
  "Alzheimer's disease & other dementias": {
    M: [0.000, 0.000, 0.001, 0.008, 0.065, 0.72],
    F: [0.000, 0.000, 0.001, 0.008, 0.07, 0.95]
  },
  "Diabetes mellitus (Type 1 & Type 2)": {
    M: [0.003, 0.009, 0.022, 0.052, 0.10, 0.28],
    F: [0.002, 0.005, 0.014, 0.032, 0.07, 0.22]
  },
  "Chronic kidney disease & renal failure": {
    M: [0.001, 0.003, 0.009, 0.025, 0.07, 0.25],
    F: [0.001, 0.002, 0.006, 0.016, 0.05, 0.20]
  },
  "Sepsis & systemic infections": {
    M: [0.002, 0.005, 0.012, 0.028, 0.07, 0.22],
    F: [0.002, 0.004, 0.009, 0.020, 0.055, 0.19]
  },
  "Hypertensive diseases (hypertensive heart & renal disease)": {
    M: [0.001, 0.004, 0.014, 0.038, 0.085, 0.28],
    F: [0.001, 0.003, 0.009, 0.025, 0.065, 0.26]
  },
  "Liver disease & cirrhosis": {
    M: [0.003, 0.014, 0.038, 0.065, 0.072, 0.07],
    F: [0.001, 0.007, 0.020, 0.035, 0.038, 0.05]
  },
  "Drug overdose & poisoning (unintentional)": {
    M: [0.035, 0.055, 0.048, 0.032, 0.015, 0.006],
    F: [0.015, 0.025, 0.028, 0.020, 0.009, 0.004]
  },
  "Parkinson's disease & movement disorders": {
    M: [0.000, 0.000, 0.002, 0.010, 0.045, 0.28],
    F: [0.000, 0.000, 0.001, 0.006, 0.028, 0.18]
  },
  "Motor vehicle accidents (occupant)": {
    M: [0.022, 0.018, 0.016, 0.014, 0.014, 0.018],
    F: [0.010, 0.008, 0.007, 0.007, 0.007, 0.010]
  },
  "Atherosclerosis & peripheral vascular disease": {
    M: [0.000, 0.002, 0.007, 0.018, 0.048, 0.18],
    F: [0.000, 0.001, 0.004, 0.010, 0.030, 0.15]
  },
  "Aortic aneurysm & dissection": {
    M: [0.000, 0.002, 0.007, 0.020, 0.052, 0.14],
    F: [0.000, 0.001, 0.002, 0.006, 0.016, 0.06]
  },
  "Pneumonitis & aspiration": {
    M: [0.001, 0.002, 0.004, 0.009, 0.022, 0.12],
    F: [0.001, 0.001, 0.003, 0.006, 0.016, 0.10]
  },
  "Falls (unintentional)": {
    M: [0.002, 0.003, 0.005, 0.009, 0.022, 0.18],
    F: [0.001, 0.001, 0.002, 0.005, 0.014, 0.16]
  },
  "Suicide — firearm (self-inflicted gunshot)": {
    M: [0.012, 0.016, 0.016, 0.016, 0.016, 0.020],
    F: [0.001, 0.002, 0.002, 0.002, 0.002, 0.002]
  },
  "Suicide — non-firearm (hanging, overdose, other)": {
    M: [0.008, 0.009, 0.008, 0.007, 0.006, 0.005],
    F: [0.004, 0.005, 0.005, 0.004, 0.003, 0.002]
  },
  "Homicide — firearm": {
    M: [0.018, 0.014, 0.010, 0.007, 0.005, 0.004],
    F: [0.004, 0.003, 0.002, 0.002, 0.001, 0.001]
  },
  "Homicide — non-firearm": {
    M: [0.004, 0.003, 0.002, 0.002, 0.001, 0.001],
    F: [0.002, 0.001, 0.001, 0.001, 0.001, 0.001]
  },
  "Drowning (unintentional)": {
    M: [0.005, 0.004, 0.003, 0.003, 0.003, 0.004],
    F: [0.001, 0.001, 0.001, 0.001, 0.001, 0.002]
  },
  "Fire & burn injuries": {
    M: [0.002, 0.002, 0.002, 0.002, 0.003, 0.004],
    F: [0.001, 0.001, 0.001, 0.001, 0.002, 0.003]
  },
  "Viral hepatitis (A, B, C, D, E)": {
    M: [0.001, 0.004, 0.008, 0.008, 0.005, 0.003],
    F: [0.000, 0.002, 0.004, 0.004, 0.003, 0.002]
  },
  "Nutritional deficiencies & malnutrition": {
    M: [0.001, 0.001, 0.002, 0.003, 0.005, 0.014],
    F: [0.001, 0.001, 0.002, 0.003, 0.005, 0.014]
  },
  "Blood & lymphatic disorders (anemia, coagulation)": {
    M: [0.001, 0.002, 0.003, 0.005, 0.009, 0.022],
    F: [0.001, 0.002, 0.003, 0.005, 0.008, 0.020]
  },
  "Perinatal & congenital conditions": {
    M: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
    F: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001]
  },
  "Intestinal obstruction, hernia & GI complications": {
    M: [0.001, 0.002, 0.003, 0.005, 0.010, 0.032],
    F: [0.001, 0.001, 0.002, 0.004, 0.008, 0.028]
  },
  "Iatrogenic injury & medical error": {
    M: [0.002, 0.004, 0.007, 0.012, 0.020, 0.038],
    F: [0.002, 0.003, 0.006, 0.010, 0.016, 0.032]
  }
};

function getAgeGroup(age) {
  const a = parseInt(age);
  if (a < 35) return 0;
  if (a < 45) return 1;
  if (a < 55) return 2;
  if (a < 65) return 3;
  if (a < 75) return 4;
  return 5;
}

function calcLifetimePercent(annualPct, age) {
  const remaining = Math.max(0, 82 - parseInt(age));
  return Math.min(99, (1 - Math.pow(1 - annualPct / 100, remaining)) * 100);
}

function oddsString(pct) {
  if (pct <= 0) return "< 1 in 1,000,000";
  const n = Math.round(100 / pct);
  return `1 in ${n.toLocaleString()}`;
}

// ── RISK MULTIPLIER ENGINE ────────────────────────────────────────────────────
function computeMultipliers(profile, cause) {
  let m = 1.0;
  const c = cause;
  const isCardio = c.includes("Heart") || c.includes("Stroke") || c.includes("Hypertensive") || c.includes("Atherosclerosis") || c.includes("Aortic");
  const isCancer = c.includes("Cancer");
  const isRespiratory = c.includes("COPD") || c.includes("respiratory");
  const isLiver = c.includes("Liver");
  const isOverdose = c.includes("overdose");
  const isFirearmSuicide = c.includes("Suicide — firearm");
  const isNonFirearmSuicide = c.includes("Suicide — non-firearm");
  const isSuicide = isFirearmSuicide || isNonFirearmSuicide;
  const isFirearmHomicide = c.includes("Homicide — firearm");
  const isHomicide = c.includes("Homicide");
  const isMVA = c.includes("Motor vehicle");
  const isFalls = c.includes("Falls");
  const isDrowning = c.includes("Drowning");
  const isFirearm = isFirearmSuicide || isFirearmHomicide;
  const isDiabetes = c.includes("Diabetes");
  const isKidney = c.includes("kidney");
  const isSepsis = c.includes("Sepsis");
  const isHepatitis = c.includes("hepatitis");
  const isNutritional = c.includes("Nutritional");
  const isFire = c.includes("Fire &");
  const isIatrogenic = c.includes("Iatrogenic");
  const isAlzheimer = c.includes("Alzheimer");

  // ── SMOKING ──
  if (profile.smoking === "daily") {
    if (isCardio) m *= 2.5;
    if (isCancer) m *= 3.0;
    if (isRespiratory) m *= 5.0;
    if (isLiver) m *= 1.4;
    if (c.includes("Aortic")) m *= 4.0;
    if (c.includes("Atherosclerosis")) m *= 3.0;
    if (isFire) m *= 2.0;
  } else if (profile.smoking === "occasional") {
    if (isCardio) m *= 1.5;
    if (isCancer) m *= 1.8;
    if (isRespiratory) m *= 2.5;
  } else if (profile.smoking === "former") {
    if (isCardio) m *= 1.3;
    if (isCancer) m *= 1.5;
    if (isRespiratory) m *= 2.0;
  }

  // ── ALCOHOL ──
  if (profile.alcohol === "heavy") {
    if (isLiver) m *= 5.0;
    if (isCancer) m *= 1.8;
    if (isCardio) m *= 1.4;
    if (isMVA) m *= 2.5;
    if (isSuicide) m *= 2.0;
    if (isOverdose) m *= 2.0;
    if (isNutritional) m *= 3.0;
    if (isFire) m *= 2.5;
  } else if (profile.alcohol === "moderate") {
    if (isLiver) m *= 1.5;
    if (isCancer) m *= 1.1;
  }

  // ── BMI ──
  const bmi = parseFloat(profile.bmi);
  if (!isNaN(bmi)) {
    if (bmi >= 35) {
      if (isCardio) m *= 2.0;
      if (isDiabetes) m *= 4.0;
      if (isCancer) m *= 1.4;
      if (isKidney) m *= 1.8;
      if (c.includes("Hypertensive")) m *= 2.0;
    } else if (bmi >= 30) {
      if (isCardio) m *= 1.5;
      if (isDiabetes) m *= 2.5;
      if (isKidney) m *= 1.4;
    } else if (bmi < 18.5) {
      if (isNutritional) m *= 3.0;
      if (isSuicide) m *= 1.5;
      if (isCancer) m *= 1.2;
    }
  }

  // ── EXERCISE ──
  if (profile.exercise === "none") {
    if (isCardio) m *= 1.7;
    if (isDiabetes) m *= 1.6;
    if (isCancer) m *= 1.3;
    if (isFalls) m *= 1.4;
  } else if (profile.exercise === "vigorous") {
    if (isCardio) m *= 0.6;
    if (isDiabetes) m *= 0.7;
    if (isCancer) m *= 0.8;
  } else if (profile.exercise === "light") {
    if (isCardio) m *= 1.2;
    if (isDiabetes) m *= 1.2;
  }

  // ── DIET ──
  if (profile.diet === "poor") {
    if (isCardio) m *= 1.4;
    if (isDiabetes) m *= 1.4;
    if (isCancer) m *= 1.2;
  } else if (profile.diet === "excellent") {
    if (isCardio) m *= 0.75;
    if (isDiabetes) m *= 0.7;
    if (isCancer) m *= 0.85;
  }

  // ── SEATBELT ──
  if (profile.seatbelt === "rarely") {
    if (isMVA) m *= 3.5;
  } else if (profile.seatbelt === "usually") {
    if (isMVA) m *= 1.4;
  }

  // ── FIREARM ACCESS ──
  if (profile.gunAccess === "yes — unsecured") {
    if (isFirearmSuicide) m *= 4.5;
    if (isFirearmHomicide) m *= 1.3;
  } else if (profile.gunAccess === "yes — secured") {
    if (isFirearmSuicide) m *= 1.8;
  } else {
    if (isFirearmSuicide) m *= 0.3;
    if (isFirearmHomicide) m *= 0.85;
  }

  // ── SUBSTANCE USE ──
  const drugs = profile.drugs || [];
  if (drugs.includes("fentanyl")) {
    if (isOverdose) m *= 15.0;
    if (isCardio) m *= 1.3;
  }
  if (drugs.includes("heroin")) {
    if (isOverdose) m *= 10.0;
    if (isHepatitis) m *= 8.0;
    if (isSepsis) m *= 3.0;
  }
  if (drugs.includes("meth")) {
    if (isOverdose) m *= 4.0;
    if (isCardio) m *= 3.0;
    if (isStroke) m *= 2.5;
    if (isSuicide) m *= 2.0;
  }
  if (drugs.includes("cocaine")) {
    if (isCardio) m *= 2.5;
    if (isStroke) m *= 2.0;
    if (isOverdose) m *= 2.0;
  }
  if (drugs.includes("benzo")) {
    if (isOverdose) m *= 4.0;
    if (isSuicide) m *= 1.5;
    if (isMVA) m *= 1.8;
  }
  if (drugs.includes("opioids_rx")) {
    if (isOverdose) m *= 3.0;
  }
  if (drugs.includes("polysubstance")) {
    if (isOverdose) m *= 6.0;
  }
  if (drugs.includes("alcohol_heavy")) {
    if (isLiver) m *= 4.0;
    if (isOverdose) m *= 2.5;
    if (isMVA) m *= 2.0;
    if (isSuicide) m *= 1.8;
  }

  // ── RECREATION ──
  const rec = profile.recreation || [];
  if (rec.includes("Motorcycles (regular rider)")) {
    if (isMVA) m *= 8.0;
  } else if (rec.includes("Motorcycles (occasional rider)")) {
    if (isMVA) m *= 3.0;
  }
  if (rec.includes("BASE jumping")) {
    if (isMVA) m *= 0; // accounted separately — add flat risk
    if (c.includes("Falls")) m *= 15.0;
  }
  if (rec.includes("Free solo climbing")) {
    if (isFalls) m *= 20.0;
  }
  if (rec.includes("Skydiving")) {
    if (isFalls) m *= 2.0;
  }
  if (rec.includes("Rock climbing / mountaineering")) {
    if (isFalls) m *= 1.5;
  }
  if (rec.includes("Backcountry skiing / avalanche terrain")) {
    if (isFalls) m *= 1.8;
    if (isDrowning) m *= 1.3;
  }
  if (rec.includes("Whitewater kayaking / rafting")) {
    if (isDrowning) m *= 2.5;
  }
  if (rec.includes("Racing / motorsports")) {
    if (isMVA) m *= 3.0;
  }

  // ── PHYSICAL HEALTH CONDITIONS ──
  const conds = profile.conditions || [];
  if (conds.includes("Hypertension")) {
    if (isCardio) m *= 2.0;
    if (isStroke) m *= 2.5;
    if (isKidney) m *= 1.8;
    if (c.includes("Hypertensive")) m *= 3.0;
  }
  if (conds.includes("Type 2 Diabetes")) {
    if (isDiabetes) m *= 3.0;
    if (isCardio) m *= 2.0;
    if (isKidney) m *= 2.5;
    if (isSepsis) m *= 1.8;
  }
  if (conds.includes("Heart Disease")) {
    if (isCardio) m *= 4.0;
    if (isSepsis) m *= 1.5;
  }
  if (conds.includes("COPD/Asthma")) {
    if (isRespiratory) m *= 5.0;
    if (isSepsis) m *= 1.8;
    if (c.includes("COVID")) m *= 2.0;
  }
  if (conds.includes("Cancer (history)")) {
    if (isCancer) m *= 5.0;
    if (isSepsis) m *= 2.0;
    if (isIatrogenic) m *= 2.0;
  }
  if (conds.includes("Kidney Disease")) {
    if (isKidney) m *= 5.0;
    if (isCardio) m *= 2.0;
    if (isSepsis) m *= 2.5;
  }
  if (conds.includes("Liver Disease")) {
    if (isLiver) m *= 5.0;
    if (isSepsis) m *= 2.0;
  }
  if (conds.includes("High Cholesterol")) {
    if (isCardio) m *= 1.5;
    if (c.includes("Atherosclerosis")) m *= 2.0;
  }
  if (conds.includes("Sleep Apnea")) {
    if (isCardio) m *= 1.6;
    if (isStroke) m *= 1.5;
  }
  if (conds.includes("HIV/AIDS")) {
    if (isSepsis) m *= 3.0;
    if (isCancer) m *= 2.5;
    if (isHepatitis) m *= 3.0;
  }
  if (conds.includes("Epilepsy / seizure disorder")) {
    if (isDrowning) m *= 4.0;
    if (isSuicide) m *= 2.0;
    if (isMVA) m *= 1.5;
  }

  // ── MENTAL HEALTH ──
  const mh = profile.mentalHealth || [];
  if (mh.includes("Depression")) {
    if (isSuicide) m *= 3.0;
    if (isOverdose) m *= 1.8;
    if (isCardio) m *= 1.4;
  }
  if (mh.includes("Bipolar I") || mh.includes("Bipolar II")) {
    if (isSuicide) m *= 4.0;
    if (isOverdose) m *= 2.0;
    if (isFirearmSuicide && profile.gunAccess === "yes — unsecured") m *= 2.0;
  }
  if (mh.includes("PTSD")) {
    if (isSuicide) m *= 2.5;
    if (isOverdose) m *= 1.8;
    if (isCardio) m *= 1.3;
  }
  if (mh.includes("Borderline Personality Disorder (BPD)")) {
    if (isSuicide) m *= 6.0;
    if (isOverdose) m *= 3.0;
    if (isNonFirearmSuicide) m *= 2.0;
  }
  if (mh.includes("Schizophrenia")) {
    if (isSuicide) m *= 4.0;
    if (isCardio) m *= 2.0;
    if (isOverdose) m *= 2.0;
  }
  if (mh.includes("Eating disorder")) {
    if (isNutritional) m *= 5.0;
    if (isCardio) m *= 2.0;
    if (isSuicide) m *= 3.0;
  }
  if (mh.includes("Anxiety disorder")) {
    if (isSuicide) m *= 1.5;
    if (isCardio) m *= 1.2;
  }

  // ── NEURODEVELOPMENTAL ──
  const nd = profile.neurodevelopmental || [];
  if (nd.includes("ADHD")) {
    if (isMVA) m *= 2.0;
    if (isFalls) m *= 1.5;
    if (isOverdose) m *= 2.0;
    if (isSuicide) m *= 2.0;
  }
  if (nd.includes("Autism Spectrum Disorder (ASD)")) {
    if (isDrowning) m *= 3.0;
    if (isSuicide) m *= 2.0;
    if (isMVA) m *= 1.5;
  }
  if (nd.includes("Traumatic Brain Injury (TBI)")) {
    if (isSuicide) m *= 2.5;
    if (isMVA) m *= 1.5;
    if (isAlzheimer) m *= 2.0;
    if (isFalls) m *= 1.8;
  }

  // ── DEMOGRAPHICS ──
  const demo = profile.demographics || [];
  if (demo.includes("Veteran (combat-deployed)")) {
    if (isSuicide) m *= 2.5;
    if (isFirearmSuicide) m *= 3.0;
    if (isOverdose) m *= 1.8;
  } else if (demo.includes("Veteran (non-combat)")) {
    if (isSuicide) m *= 1.5;
    if (isFirearmSuicide) m *= 2.0;
  }
  if (demo.includes("Unhoused / unstable housing")) {
    if (isSuicide) m *= 2.0;
    if (isOverdose) m *= 3.0;
    if (isSepsis) m *= 3.0;
    if (isNutritional) m *= 4.0;
    if (isFire) m *= 3.0;
    if (isHomicide) m *= 3.0;
  }
  if (demo.includes("First responder / EMT")) {
    if (isSuicide) m *= 1.5;
    if (isMVA) m *= 1.3;
    if (isSepsis) m *= 1.3;
  }
  if (demo.includes("Incarcerated (history of)")) {
    if (isHomicide) m *= 3.0;
    if (isOverdose) m *= 2.5;
    if (isSuicide) m *= 1.8;
    if (isHepatitis) m *= 4.0;
  }

  // ── FAMILY HISTORY ──
  const fam = profile.familyHistory || [];
  if (fam.includes("Heart disease (early onset)")) {
    if (isCardio) m *= 1.8;
    if (c.includes("Aortic")) m *= 1.5;
  }
  if (fam.includes("Cancer")) {
    if (isCancer) m *= 1.5;
  }
  if (fam.includes("Diabetes")) {
    if (isDiabetes) m *= 1.4;
  }
  if (fam.includes("Stroke")) {
    if (isStroke) m *= 1.5;
  }
  if (fam.includes("Alzheimer's")) {
    if (isAlzheimer) m *= 2.0;
  }
  if (fam.includes("Suicide")) {
    if (isSuicide) m *= 2.0;
  }
  if (fam.includes("Substance use disorder")) {
    if (isOverdose) m *= 1.5;
    if (isLiver) m *= 1.3;
  }

  return Math.max(m, 0.05);
}

// Fix missing isStroke reference
function isStroke(c) { return c.includes("Stroke"); }

// ── NOTE GENERATOR ────────────────────────────────────────────────────────────
function generateNote(profile, cause, annualPct, baseRate, multiplier) {
  const c = cause;
  const drivers = [];
  const drugs = profile.drugs || [];
  const mh = profile.mentalHealth || [];
  const nd = profile.neurodevelopmental || [];
  const conds = profile.conditions || [];
  const demo = profile.demographics || [];
  const rec = profile.recreation || [];

  if (c.includes("Heart") || c.includes("Stroke") || c.includes("Hypertensive") || c.includes("Atherosclerosis") || c.includes("Aortic")) {
    if (profile.smoking === "daily") drivers.push("daily smoking");
    if (conds.includes("Hypertension")) drivers.push("hypertension");
    if (conds.includes("Type 2 Diabetes")) drivers.push("diabetes");
    if (conds.includes("Heart Disease")) drivers.push("existing heart disease");
    if (conds.includes("High Cholesterol")) drivers.push("high cholesterol");
    if (drugs.includes("meth") || drugs.includes("cocaine")) drivers.push("stimulant use");
    if (profile.exercise === "none") drivers.push("sedentary lifestyle");
    if (profile.diet === "poor") drivers.push("poor diet");
    const bmi = parseFloat(profile.bmi);
    if (!isNaN(bmi) && bmi >= 30) drivers.push(`BMI of ${bmi}`);
  }
  if (c.includes("Cancer")) {
    if (profile.smoking === "daily") drivers.push("daily smoking (primary carcinogen)");
    if (conds.includes("Cancer (history)")) drivers.push("personal cancer history");
    if (profile.familyHistory?.includes("Cancer")) drivers.push("family history of cancer");
    if (profile.alcohol === "heavy" || drugs.includes("alcohol_heavy")) drivers.push("heavy alcohol use");
  }
  if (c.includes("overdose")) {
    if (drugs.includes("fentanyl")) drivers.push("fentanyl use (~1-2% annual fatality rate for active users)");
    if (drugs.includes("heroin")) drivers.push("heroin use");
    if (drugs.includes("polysubstance")) drivers.push("polysubstance mixing");
    if (drugs.includes("benzo") && (drugs.includes("fentanyl") || drugs.includes("heroin") || drugs.includes("opioids_rx"))) drivers.push("opioid+benzo combination (highest overdose risk)");
    if (drugs.includes("meth")) drivers.push("methamphetamine use");
    if (drugs.includes("alcohol_heavy")) drivers.push("heavy alcohol use");
  }
  if (c.includes("Suicide")) {
    if (mh.includes("Borderline Personality Disorder (BPD)")) drivers.push("BPD (~10% lifetime completed suicide rate)");
    if (mh.includes("Bipolar I") || mh.includes("Bipolar II")) drivers.push("bipolar disorder");
    if (mh.includes("Depression")) drivers.push("depression");
    if (mh.includes("PTSD")) drivers.push("PTSD");
    if (demo.includes("Veteran (combat-deployed)")) drivers.push("combat veteran status");
    if (c.includes("firearm") && profile.gunAccess === "yes — unsecured") drivers.push("unsecured firearm access");
    if (nd.includes("ADHD")) drivers.push("ADHD");
    if (nd.includes("Traumatic Brain Injury (TBI)")) drivers.push("TBI history");
    if (profile.familyHistory?.includes("Suicide")) drivers.push("family history of suicide");
  }
  if (c.includes("Homicide")) {
    if (demo.includes("Unhoused / unstable housing")) drivers.push("housing instability");
    if (demo.includes("Incarcerated (history of)")) drivers.push("incarceration history");
  }
  if (c.includes("Motor vehicle")) {
    if (profile.seatbelt === "rarely") drivers.push("rarely wearing a seatbelt");
    if (rec.includes("Motorcycles (regular rider)")) drivers.push("regular motorcycle riding (29x higher fatality rate per mile)");
    if (rec.includes("Motorcycles (occasional rider)")) drivers.push("occasional motorcycle riding");
    if (drugs.includes("alcohol_heavy") || profile.alcohol === "heavy") drivers.push("heavy alcohol use");
    if (nd.includes("ADHD")) drivers.push("ADHD (2x accident risk)");
  }
  if (c.includes("Falls")) {
    if (rec.includes("Free solo climbing")) drivers.push("free solo climbing");
    if (rec.includes("BASE jumping")) drivers.push("BASE jumping");
    if (rec.includes("Rock climbing / mountaineering")) drivers.push("rock climbing");
    if (nd.includes("ADHD")) drivers.push("ADHD");
  }
  if (c.includes("Liver")) {
    if (drugs.includes("alcohol_heavy") || profile.alcohol === "heavy") drivers.push("heavy alcohol use");
    if (conds.includes("Liver Disease")) drivers.push("existing liver disease");
    if (drugs.includes("heroin")) drivers.push("IV drug use");
  }
  if (c.includes("Drowning")) {
    if (nd.includes("Autism Spectrum Disorder (ASD)")) drivers.push("ASD (drowning is leading cause of death in ASD)");
    if (rec.includes("Whitewater kayaking / rafting")) drivers.push("whitewater kayaking");
    if (conds.includes("Epilepsy / seizure disorder")) drivers.push("seizure disorder (4x drowning risk)");
  }
  if (c.includes("COPD")) {
    if (profile.smoking === "daily") drivers.push("daily smoking (primary cause of COPD)");
    if (profile.smoking === "former") drivers.push("former smoking history");
    if (conds.includes("COPD/Asthma")) drivers.push("existing COPD/asthma diagnosis");
  }
  if (c.includes("hepatitis")) {
    if (drugs.includes("heroin") || drugs.includes("fentanyl")) drivers.push("IV drug use");
    if (demo.includes("Incarcerated (history of)")) drivers.push("incarceration history");
  }
  if (c.includes("Nutritional")) {
    if (mh.includes("Eating disorder")) drivers.push("eating disorder");
    if (drugs.includes("alcohol_heavy") || profile.alcohol === "heavy") drivers.push("heavy alcohol use");
    if (demo.includes("Unhoused / unstable housing")) drivers.push("housing instability");
  }
  if (c.includes("Alzheimer")) {
    if (profile.familyHistory?.includes("Alzheimer's")) drivers.push("family history of Alzheimer's");
    if (nd.includes("Traumatic Brain Injury (TBI)")) drivers.push("TBI history (2x dementia risk)");
  }
  if (c.includes("Iatrogenic")) {
    if (conds.length >= 3) drivers.push(`${conds.length} concurrent medical conditions`);
  }

  const sexLabel = profile.sex === "Male" ? "males" : "females";
  const ageLabel = profile.age;

  if (drivers.length === 0) {
    if (multiplier < 0.8) return `Your risk is below average for ${ageLabel}-year-old ${sexLabel} with no major risk factors identified for this cause.`;
    return `Your risk approximates the population average for ${ageLabel}-year-old ${sexLabel}; no major personal risk factors identified for this cause.`;
  }

  if (drivers.length === 1) {
    return `Your risk is elevated primarily due to ${drivers[0]}, placing you above average for ${ageLabel}-year-old ${sexLabel}.`;
  }

  const top = drivers.slice(0, 3);
  return `Key drivers for this cause include ${top.join(", ")}, compounding your baseline risk as a ${ageLabel}-year-old ${sexLabel}.`;
}

// ── POPULATION AVERAGE LOOKUP ─────────────────────────────────────────────────
function getPopAvg(cause, sex, ageGroup) {
  const rates = BASE_RATES[cause];
  if (!rates) return 0.01;
  return rates[sex === "Male" ? "M" : "F"][ageGroup];
}

// ── MAIN CALCULATION FUNCTION ─────────────────────────────────────────────────
function calculateRisks(profile) {
  const ageGroup = getAgeGroup(profile.age);
  const sex = profile.sex;
  const causes = [];

  for (const cause of Object.keys(BASE_RATES)) {
    const baseRate = getPopAvg(cause, sex, ageGroup);
    const mult = computeMultipliers(profile, cause);
    const annualPct = Math.min(baseRate * mult, 15);
    const popAvg = baseRate;
    const elevated = annualPct >= popAvg * 2 && annualPct > 0.002;
    const lifetimePct = calcLifetimePercent(annualPct, profile.age);
    const note = generateNote(profile, cause, annualPct, baseRate, mult);

    causes.push({
      name: cause,
      annual_percent: parseFloat(annualPct.toFixed(4)),
      annual_odds: oddsString(annualPct),
      lifetime_percent: parseFloat(lifetimePct.toFixed(1)),
      elevated,
      note,
      rank: 0
    });
  }

  causes.sort((a, b) => b.annual_percent - a.annual_percent);
  causes.forEach((c, i) => c.rank = i + 1);

  // Profile summary
  const topCauses = causes.slice(0, 3).map(c => c.name.split("(")[0].trim()).join(", ");
  const elevatedCount = causes.filter(c => c.elevated).length;
  const profile_summary = `${profile.age}-year-old ${profile.sex}, BMI ${profile.bmi || "unknown"} — top risks: ${topCauses}${elevatedCount > 0 ? ` (${elevatedCount} elevated causes)` : ""}.`;

  // Narrative
  const topElevated = causes.filter(c => c.elevated).slice(0, 3);
  let narrative = `Based on your profile, your most significant personalized risks are ${causes[0].name.split("(")[0]} and ${causes[1].name.split("(")[0]}.`;
  if (topElevated.length > 0) {
    narrative += ` You have ${elevatedCount} cause(s) with risk 2x or more above population average for your age and sex.`;
  }
  const highImpact = [];
  if ((profile.drugs || []).some(d => ["fentanyl","heroin","polysubstance"].includes(d))) highImpact.push("high-risk substance use");
  if ((profile.mentalHealth || []).some(m => ["Borderline Personality Disorder (BPD)","Bipolar I","Bipolar II","Depression"].includes(m)) && profile.gunAccess === "yes — unsecured") highImpact.push("mental health conditions combined with unsecured firearm access");
  if (profile.smoking === "daily") highImpact.push("daily smoking");
  if (highImpact.length > 0) narrative += ` Highest-leverage modifiable risk factors: ${highImpact.join("; ")}.`;

  // Life expectancy
  const totalAnnual = causes.reduce((s, c) => s + c.annual_percent / 100, 0);
  const estLE = Math.round(parseInt(profile.age) + Math.min(1 / totalAnnual, 65));
  const popLE = profile.sex === "Male" ? 76 : 81;
  const diff = estLE - popLE;
  const life_expectancy_note = `Estimated life expectancy based on your risk profile: ~${estLE} years${diff >= 0 ? ` (+${diff} vs. population average of ${popLE})` : ` (${diff} vs. population average of ${popLE})`} for a ${profile.sex.toLowerCase()} in the U.S.`;

  return { profile_summary, causes, narrative, life_expectancy_note };
}

// ── UI COMPONENTS ─────────────────────────────────────────────────────────────
function Disclaimer() {
  return (
    <div className="disclaimer">
      <div className="disclaimer-title">Important Disclaimers & Limitations</div>
      <div className="disclaimer-grid">
        <div className="disclaimer-block">
          <strong>Not Medical Advice</strong>
          These estimates are statistical probabilities derived from population-level epidemiological data — they are not a clinical diagnosis, a medical prediction, or a substitute for professional medical evaluation. Nothing in this tool should be used to make health, treatment, or lifestyle decisions without consulting a licensed physician, mental health professional, or qualified healthcare provider.
        </div>
        <div className="disclaimer-block">
          <strong>Statistical Limitations</strong>
          All figures are model-generated estimates grounded in published CDC, SAMHSA, VA, and actuarial data, but they carry inherent uncertainty. Population averages may not reflect your individual biology, genetics, environment, or circumstances. Treat all numbers as order-of-magnitude approximations, not precise predictions.
        </div>
        <div className="disclaimer-block">
          <strong>Data Currency</strong>
          Underlying mortality statistics reflect CDC WONDER and SSA actuarial tables primarily from 2019–2022. Mortality trends shift over time due to medical advances, drug supply changes, public health interventions, and other factors.
        </div>
        <div className="disclaimer-block">
          <strong>Mental Health & Crisis Resources</strong>
          If reviewing this information has raised concerns about suicide, self-harm, or substance use — for yourself or someone you know — please reach out. <strong>988 Suicide & Crisis Lifeline: call or text 988.</strong> SAMHSA National Helpline: 1-800-662-4357. Crisis Text Line: text HOME to 741741.
        </div>
        <div className="disclaimer-block">
          <strong>Privacy</strong>
          All calculations run entirely in your browser. No personal data is transmitted to any server or stored anywhere.
        </div>
        <div className="disclaimer-block">
          <strong>Purpose of This Tool</strong>
          This calculator supports rational, data-informed reflection on personal risk — the same actuarial reasoning used by insurers and public health researchers. It is not intended to cause distress and results should be interpreted with the full complexity of your life in mind.
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ onSubmit }) {
  const [form, setForm] = useState({
    age: "", sex: "", height: "", weight: "",
    smoking: "never", alcohol: "light",
    exercise: "moderate", diet: "average",
    conditions: [], mentalHealth: [],
    neurodevelopmental: [], demographics: [],
    gunAccess: "no", state: "",
    occupation: "", seatbelt: "always",
    drugs: [], recreation: [], familyHistory: []
  });

  const conditions = ["Hypertension","Type 2 Diabetes","Heart Disease","COPD/Asthma","Cancer (history)","Kidney Disease","Liver Disease","Sleep Apnea","High Cholesterol","Autoimmune disorder","Epilepsy / seizure disorder","HIV/AIDS"];
  const mentalHealthOpts = ["Depression","Bipolar I","Bipolar II","Anxiety disorder","PTSD","Schizophrenia","Borderline Personality Disorder (BPD)","Eating disorder","OCD","Psychosis","None"];
  const neurodevelopmentalOpts = ["ADHD","Autism Spectrum Disorder (ASD)","Intellectual disability","Traumatic Brain Injury (TBI)","None"];
  const demographicOpts = ["Veteran (non-combat)","Veteran (combat-deployed)","First responder / EMT","Unhoused / unstable housing","Incarcerated (history of)","Caregiver / healthcare worker"];
  const drugOpts = [
    { label: "Opioids (prescription)", key: "opioids_rx" },
    { label: "Heroin", key: "heroin" },
    { label: "Fentanyl / illicit opioids", key: "fentanyl" },
    { label: "Methamphetamine", key: "meth" },
    { label: "Cocaine / crack", key: "cocaine" },
    { label: "Benzodiazepines (non-rx)", key: "benzo" },
    { label: "MDMA / ecstasy", key: "mdma" },
    { label: "Cannabis", key: "cannabis" },
    { label: "Psychedelics (LSD, psilocybin)", key: "psychedelics" },
    { label: "Alcohol (heavy/binge)", key: "alcohol_heavy" },
    { label: "Polysubstance (mixing)", key: "polysubstance" },
    { label: "None", key: "none" },
  ];
  const recreationOpts = ["Motorcycles (regular rider)","Motorcycles (occasional rider)","Rock climbing / mountaineering","Free solo climbing","Skydiving","BASE jumping","Backcountry skiing / avalanche terrain","Whitewater kayaking / rafting","Hunting (regular)","Scuba diving","Racing / motorsports","Extreme sports (general)"];
  const familyOpts = ["Heart disease (early onset)","Cancer","Diabetes","Stroke","Alzheimer's","Suicide","Substance use disorder","None"];

  const toggle = (field, val) => {
    setForm(f => {
      const cur = f[field];
      if (val === "None" || val === "none") return { ...f, [field]: cur.includes(val) ? [] : [val] };
      const without = cur.filter(x => x !== "None" && x !== "none");
      return { ...f, [field]: without.includes(val) ? without.filter(x => x !== val) : [...without, val] };
    });
  };

  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    if (!form.age || !form.sex) return;
    const newErrors = {};
    const age = parseInt(form.age);
    const height = parseFloat(form.height);
    const weight = parseFloat(form.weight);
    if (isNaN(age) || age < 18 || age > 99) newErrors.age = "Age must be between 18 and 99.";
    if (form.height && (isNaN(height) || height < 48 || height > 96)) newErrors.height = "Height must be between 48 and 96 inches (4–8 ft).";
    if (form.weight && (isNaN(weight) || weight < 70 || weight > 700)) newErrors.weight = "Weight must be between 70 and 700 lbs.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    const bmi = form.height && form.weight ? ((weight / (height * height)) * 703).toFixed(1) : null;
    onSubmit({ ...form, bmi });
  };

  const sel = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="form-container">
      <div className="form-grid">
        <div className="form-section">
          <h3 className="section-label">Demographics</h3>
          <div className="field-row">
            <div className="field"><label>Age</label><input type="number" placeholder="e.g. 38" value={form.age} onChange={e => sel("age", e.target.value)} min="18" max="99" />{errors.age && <span className="field-error">{errors.age}</span>}</div>
            <div className="field"><label>Biological Sex</label><div className="pill-row">{["Male","Female"].map(s => <button key={s} className={`pill ${form.sex===s?"active":""}`} onClick={() => sel("sex",s)}>{s}</button>)}</div></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Height (inches)</label><input type="number" placeholder="48–96 inches" value={form.height} onChange={e => sel("height", e.target.value)} min="48" max="96" />{errors.height && <span className="field-error">{errors.height}</span>}</div>
            <div className="field"><label>Weight (lbs)</label><input type="number" placeholder="70–700 lbs" value={form.weight} onChange={e => sel("weight", e.target.value)} min="70" max="700" />{errors.weight && <span className="field-error">{errors.weight}</span>}</div>
          </div>
          <div className="field"><label>State of Residence</label><input type="text" placeholder="e.g. California" value={form.state} onChange={e => sel("state", e.target.value)} /></div>
          <div className="field"><label>Occupation</label><input type="text" placeholder="e.g. office worker, nurse, construction..." value={form.occupation} onChange={e => sel("occupation", e.target.value)} /></div>
        </div>

        <div className="form-section">
          <h3 className="section-label">Core Lifestyle</h3>
          {[
            { label: "Smoking", field: "smoking", opts: ["never","former","occasional","daily"] },
            { label: "Alcohol", field: "alcohol", opts: ["none","light","moderate","heavy"] },
            { label: "Exercise", field: "exercise", opts: ["none","light","moderate","vigorous"] },
            { label: "Diet Quality", field: "diet", opts: ["poor","average","good","excellent"] },
            { label: "Seatbelt Use", field: "seatbelt", opts: ["always","usually","rarely"] },
          ].map(({ label, field, opts }) => (
            <div className="field" key={field}>
              <label>{label}</label>
              <div className="pill-row">{opts.map(o => <button key={o} className={`pill ${form[field]===o?"active":""}`} onClick={() => sel(field,o)}>{o}</button>)}</div>
            </div>
          ))}
          <div className="field">
            <label>Firearm Access at Home</label>
            <div className="pill-row">{["no","yes — secured","yes — unsecured"].map(o => <button key={o} className={`pill ${form.gunAccess===o?"active":""}`} onClick={() => sel("gunAccess",o)}>{o}</button>)}</div>
          </div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Substance Use <span className="label-sub">— select all that apply; specificity matters for overdose risk</span></h3>
          <div className="chip-grid">{drugOpts.map(({ label, key }) => <button key={key} className={`chip ${form.drugs.includes(key)?"active":""}`} onClick={() => toggle("drugs",key)}>{label}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">High-Risk Recreation <span className="label-sub">— select any that apply regularly</span></h3>
          <div className="chip-grid">{recreationOpts.map(r => <button key={r} className={`chip ${form.recreation.includes(r)?"active":""}`} onClick={() => toggle("recreation",r)}>{r}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Physical Health Conditions</h3>
          <div className="chip-grid">{conditions.map(c => <button key={c} className={`chip ${form.conditions.includes(c)?"active":""}`} onClick={() => toggle("conditions",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Mental Health History</h3>
          <div className="chip-grid">{mentalHealthOpts.map(c => <button key={c} className={`chip ${form.mentalHealth.includes(c)?"active":""}`} onClick={() => toggle("mentalHealth",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Neurodevelopmental Profile</h3>
          <div className="chip-grid">{neurodevelopmentalOpts.map(c => <button key={c} className={`chip ${form.neurodevelopmental.includes(c)?"active":""}`} onClick={() => toggle("neurodevelopmental",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Background & Identity <span className="label-sub">— select any that apply; these have specific mortality data</span></h3>
          <div className="chip-grid">{demographicOpts.map(c => <button key={c} className={`chip ${form.demographics.includes(c)?"active":""}`} onClick={() => toggle("demographics",c)}>{c}</button>)}</div>
        </div>

        <div className="form-section full-width">
          <h3 className="section-label">Family History</h3>
          <div className="chip-grid">{familyOpts.map(c => <button key={c} className={`chip ${form.familyHistory.includes(c)?"active":""}`} onClick={() => toggle("familyHistory",c)}>{c}</button>)}</div>
        </div>
      </div>

      <Disclaimer />

      <button className="analyze-btn" onClick={handleSubmit} disabled={!form.age || !form.sex}>
        Calculate My Risk Profile
      </button>
    </div>
  );
}

function RiskBar({ percent, max }) {
  const width = Math.min((percent / max) * 100, 100);
  const color = percent >= max * 0.5 ? "#b84040" : percent >= max * 0.2 ? "#c0732a" : percent >= max * 0.05 ? "#9a7f3c" : "#4a7a6a";
  return (
    <div className="risk-bar-track">
      <div className="risk-bar-fill" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

function Results({ data, onReset }) {
  const maxAnnual = Math.max(...data.causes.map(c => c.annual_percent));
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="profile-badge">{data.profile_summary}</div>
        <p className="life-exp-note">{data.life_expectancy_note}</p>
      </div>
      <div className="narrative-box">
        <div className="narrative-label">Risk Analysis</div>
        <p>{data.narrative}</p>
      </div>
      <div className="causes-table">
        <div className="table-header">
          <span>Rank</span><span>Cause of Death</span><span>Annual Risk</span><span>Odds</span><span>Lifetime</span><span></span>
        </div>
        {data.causes.map((c, i) => (
          <div key={i}>
            <div className={`table-row ${c.elevated?"elevated":""} ${expanded===i?"open":""}`} onClick={() => setExpanded(expanded===i?null:i)}>
              <span className="rank-num">{c.rank}</span>
              <span className="cause-name">{c.name}{c.elevated && <span className="elevated-badge">↑ Elevated</span>}</span>
              <span className="annual-pct">{c.annual_percent.toFixed(3)}%</span>
              <span className="odds-text">{c.annual_odds}</span>
              <span className="lifetime-pct">{c.lifetime_percent.toFixed(1)}%</span>
              <span className="expand-icon">{expanded===i?"▲":"▼"}</span>
            </div>
            <div className="bar-row"><RiskBar percent={c.annual_percent} max={maxAnnual} /></div>
            {expanded===i && <div className="note-row">{c.note}</div>}
          </div>
        ))}
      </div>
      <Disclaimer />
      <button className="reset-btn" onClick={onReset}>← Start Over</button>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("form");
  const [results, setResults] = useState(null);

  const analyze = (profile) => {
    const data = calculateRisks(profile);
    setResults(data);
    setPhase("results");
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f5f2ec; --surface: #ffffff; --surface2: #f0ece3; --border: #ddd8cc;
          --text: #1a2540; --muted: #6b7280; --accent: #9a7f3c; --accent-hover: #7d6530;
          --danger: #b84040; --warn: #c0732a; --radius: 8px;
          --font: "Helvetica Neue", Helvetica, "Neue Haas Grotesk Display", Arial, sans-serif;
        }
        body { background: var(--bg); color: var(--text); font-family: var(--font); }
        .app { min-height: 100vh; font-family: var(--font); background: var(--bg); color: var(--text); padding: 0 16px 80px; }
        .app-header { text-align: left; padding: 52px 0 40px; border-bottom: 1px solid var(--border); margin-bottom: 40px; max-width: 780px; margin-left: auto; margin-right: auto; }
        .app-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
        .app-title { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(32px, 5vw, 52px); font-weight: 400; color: var(--text); line-height: 1.12; margin-bottom: 18px; }
        .app-title em { font-style: italic; color: var(--accent); }
        .app-sub { font-size: 15px; color: var(--muted); max-width: 520px; line-height: 1.7; font-weight: 300; }
        .form-container { max-width: 780px; margin: 0 auto; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .form-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px; }
        .form-section.full-width { grid-column: 1 / -1; }
        .section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; display: block; }
        .label-sub { font-size: 10px; letter-spacing: 0; text-transform: none; color: var(--muted); font-weight: 400; }
        .field { margin-bottom: 14px; }
        .field:last-child { margin-bottom: 0; }
        .field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); margin-bottom: 6px; letter-spacing: 0.06em; text-transform: uppercase; }
        .field input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); padding: 9px 12px; font-size: 14px; font-family: var(--font); outline: none; transition: border-color 0.15s; }
        .field input:focus { border-color: var(--accent); }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pill-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .pill { padding: 5px 13px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface2); color: var(--muted); font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font); }
        .pill:hover { border-color: var(--accent); color: var(--accent); background: #f7f3ea; }
        .pill.active { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
        .chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { padding: 6px 13px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface2); color: var(--muted); font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: var(--font); }
        .chip:hover { border-color: var(--accent); color: var(--accent); background: #f7f3ea; }
        .chip.active { background: #f0e8d0; border-color: var(--accent); color: var(--accent); font-weight: 600; }
        .analyze-btn { width: 100%; padding: 16px; background: var(--accent); border: none; border-radius: var(--radius); color: #fff; font-family: var(--font); font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; display: flex; align-items: center; justify-content: center; gap: 10px; letter-spacing: 0.03em; margin-top: 24px; }
        .analyze-btn:hover:not(:disabled) { background: var(--accent-hover); }
        .analyze-btn:active:not(:disabled) { transform: scale(0.99); }
        .analyze-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .results-container { max-width: 860px; margin: 0 auto; }
        .results-header { margin-bottom: 24px; }
        .profile-badge { display: inline-block; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 8px 14px; font-size: 12px; color: var(--muted); margin-bottom: 10px; font-weight: 500; }
        .life-exp-note { font-size: 14px; color: var(--muted); font-style: italic; font-family: 'Playfair Display', Georgia, serif; }
        .narrative-box { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: var(--radius); padding: 20px 22px; margin-bottom: 28px; }
        .narrative-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
        .narrative-box p { font-size: 14px; line-height: 1.75; color: var(--text); font-weight: 300; }
        .causes-table { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; }
        .table-header { display: grid; grid-template-columns: 42px 1fr 90px 90px 80px 28px; padding: 10px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); gap: 8px; }
        .table-row { display: grid; grid-template-columns: 42px 1fr 90px 90px 80px 28px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; gap: 8px; cursor: pointer; transition: background 0.12s; }
        .table-row:hover { background: var(--surface2); }
        .table-row.elevated { background: rgba(184,64,64,0.03); }
        .table-row.elevated:hover { background: rgba(184,64,64,0.07); }
        .table-row.open { background: var(--surface2); }
        .rank-num { font-size: 12px; font-weight: 500; color: var(--muted); }
        .cause-name { font-size: 13px; font-weight: 400; color: var(--text); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .elevated-badge { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; background: rgba(184,64,64,0.08); color: var(--danger); border: 1px solid rgba(184,64,64,0.25); border-radius: 3px; padding: 2px 6px; text-transform: uppercase; }
        .annual-pct { font-size: 12px; font-weight: 600; color: var(--accent); }
        .odds-text { font-size: 10px; color: var(--muted); }
        .lifetime-pct { font-size: 11px; font-weight: 500; color: var(--text); }
        .expand-icon { font-size: 9px; color: var(--muted); text-align: right; }
        .bar-row { padding: 0 16px 5px; border-bottom: 1px solid var(--border); }
        .risk-bar-track { height: 3px; background: var(--surface2); border-radius: 2px; overflow: hidden; }
        .risk-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
        .note-row { padding: 10px 16px 12px 58px; font-size: 13px; color: var(--muted); line-height: 1.7; border-bottom: 1px solid var(--border); font-style: italic; font-family: 'Playfair Display', Georgia, serif; }
        .disclaimer { font-size: 12px; color: var(--muted); line-height: 1.7; padding: 22px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 24px; }
        .disclaimer-title { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
        .disclaimer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .disclaimer-block { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 14px 16px; }
        .disclaimer-block strong { display: block; color: var(--text); font-size: 11px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .reset-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 10px 22px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font); }
        .field-error { display: block; color: var(--danger); font-size: 10px; margin-top: 4px; font-weight: 500; }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-section.full-width { grid-column: 1; }
          .table-header, .table-row { grid-template-columns: 32px 1fr 70px 0 60px 24px; }
          .table-header span:nth-child(4), .table-row .odds-text { display: none; }
          .field-row { grid-template-columns: 1fr; }
          .disclaimer-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="app-header">
        <div className="app-eyebrow">Mortality Risk Calculator</div>
        <h1 className="app-title">What are the <em>real odds</em><br />of how you might die?</h1>
        <p className="app-sub">Enter your personal health profile. Get a data-driven breakdown of your top 30 causes of death — annual probability, lifetime risk, and what's elevated for you specifically.</p>
      </header>

      {phase === "form" && <ProfileForm onSubmit={analyze} />}
      {phase === "results" && results && <Results data={results} onReset={() => { setResults(null); setPhase("form"); }} />}
    </div>
  );
}
