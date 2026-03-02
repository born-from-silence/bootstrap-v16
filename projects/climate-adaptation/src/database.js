const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'climate.db');

class ClimateDatabase {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.init();
  }

  init() {
    this.db.run(`CREATE TABLE IF NOT EXISTS climate_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      temperature REAL,
      humidity REAL,
      precipitation_mm REAL,
      sea_level_mm REAL,
      extreme_event TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_source TEXT,
      region_code TEXT
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS vulnerability_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT NOT NULL,
      region_code TEXT,
      population_at_risk INTEGER,
      infrastructure_risk_level TEXT,
      agriculture_risk_level TEXT,
      health_risk_level TEXT,
      water_security_risk TEXT,
      adaptation_capacity_score REAL,
      last_assessed DATETIME DEFAULT CURRENT_TIMESTAMP,
      assessment_notes TEXT
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS adaptation_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy_name TEXT NOT NULL,
      category TEXT,
      implementation_cost TEXT,
      effectiveness_score REAL,
      time_to_implement_days INTEGER,
      target_regions TEXT,
      description TEXT,
      case_study_url TEXT,
      success_rate REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS community_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      report_type TEXT,
      severity TEXT,
      description TEXT,
      reported_by TEXT,
      contact_info TEXT,
      status TEXT DEFAULT 'active',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS early_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warning_type TEXT NOT NULL,
      severity TEXT,
      affected_regions TEXT,
      start_time DATETIME,
      end_time DATETIME,
      description TEXT,
      recommended_actions TEXT,
      issued_by TEXT,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    )`);

    console.log('[Database] Climate adaptation database initialized');
  }

  async insertReading(data) {
    const sql = `INSERT INTO climate_readings 
      (location_name, latitude, longitude, temperature, humidity, precipitation_mm, 
       sea_level_mm, extreme_event, data_source, region_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        data.location_name, data.latitude, data.longitude, 
        data.temperature, data.humidity, data.precipitation_mm,
        data.sea_level_mm, data.extreme_event, data.data_source, data.region_code
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async getReadingsByRegion(regionCode, limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM climate_readings WHERE region_code = ? ORDER BY timestamp DESC LIMIT ?`,
        [regionCode, limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async getRecentExtremeEvents(limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM climate_readings WHERE extreme_event IS NOT NULL ORDER BY timestamp DESC LIMIT ?`,
        [limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async insertVulnerabilityAssessment(data) {
    const sql = `INSERT INTO vulnerability_assessments 
      (location_name, region_code, population_at_risk, infrastructure_risk_level, 
       agriculture_risk_level, health_risk_level, water_security_risk, 
       adaptation_capacity_score, assessment_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        data.location_name, data.region_code, data.population_at_risk,
        data.infrastructure_risk_level, data.agriculture_risk_level,
        data.health_risk_level, data.water_security_risk,
        data.adaptation_capacity_score, data.assessment_notes
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async getVulnerabilityByRegion(regionCode) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM vulnerability_assessments WHERE region_code = ? ORDER BY last_assessed DESC`,
        [regionCode], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async insertCommunityReport(data) {
    const sql = `INSERT INTO community_reports 
      (location_name, latitude, longitude, report_type, severity, description, reported_by, contact_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        data.location_name, data.latitude, data.longitude,
        data.report_type, data.severity, data.description,
        data.reported_by, data.contact_info
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async getActiveCommunityReports() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM community_reports WHERE status = 'active' ORDER BY timestamp DESC`,
        [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async insertStrategy(data) {
    const sql = `INSERT INTO adaptation_strategies 
      (strategy_name, category, implementation_cost, effectiveness_score, 
       time_to_implement_days, target_regions, description, case_study_url, success_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        data.strategy_name, data.category, data.implementation_cost,
        data.effectiveness_score, data.time_to_implement_days, data.target_regions,
        data.description, data.case_study_url, data.success_rate
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async getStrategiesByCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM adaptation_strategies WHERE category = ? ORDER BY effectiveness_score DESC`,
        [category], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async insertWarning(data) {
    const sql = `INSERT INTO early_warnings 
      (warning_type, severity, affected_regions, start_time, end_time, 
       description, recommended_actions, issued_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        data.warning_type, data.severity, data.affected_regions,
        data.start_time, data.end_time, data.description, 
        data.recommended_actions, data.issued_by
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  async getActiveWarnings() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM early_warnings WHERE status = 'active' 
         AND (end_time IS NULL OR end_time > datetime('now'))
         ORDER BY issued_at DESC`,
        [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close(() => resolve());
    });
  }
}

module.exports = ClimateDatabase;
