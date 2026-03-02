const express = require('express');
const cors = require('cors');
const path = require('path');
const ClimateDatabase = require('./database');
const ClimateDataClient = require('./dataClient');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'views')));

const db = new ClimateDatabase();
const client = new ClimateDataClient();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'Climate Adaptation Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get climate readings
app.get('/api/climate/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const readings = await db.getReadingsByRegion(region, limit);
    res.json({ region, count: readings.length, readings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get extreme events
app.get('/api/events/extreme', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const events = await db.getRecentExtremeEvents(limit);
    res.json({ count: events.length, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vulnerability
app.get('/api/vulnerability/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const assessments = await db.getVulnerabilityByRegion(region);
    res.json({ region, count: assessments.length, assessments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get strategies
app.get('/api/strategies', async (req, res) => {
  try {
    const { category } = req.query;
    let strategies;
    
    if (category) {
      strategies = await db.getStrategiesByCategory(category);
    } else {
      strategies = await new Promise((resolve, reject) => {
        db.db.all('SELECT * FROM adaptation_strategies ORDER BY effectiveness_score DESC', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
    
    res.json({ count: strategies.length, strategies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get community reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await db.getActiveCommunityReports();
    res.json({ count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit report
app.post('/api/reports', async (req, res) => {
  try {
    const report = await db.insertCommunityReport(req.body);
    res.status(201).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get warnings
app.get('/api/warnings', async (req, res) => {
  try {
    const warnings = await db.getActiveWarnings();
    res.json({ count: warnings.length, warnings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get projections
app.get('/api/projections/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const projections = await client.getClimateProjections(region);
    res.json(projections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const [extremeEvents, activeWarnings, reports, strategies] = await Promise.all([
      db.getRecentExtremeEvents(5),
      db.getActiveWarnings(),
      db.getActiveCommunityReports(),
      new Promise((resolve, reject) => {
        db.db.all('SELECT * FROM adaptation_strategies ORDER BY effectiveness_score DESC LIMIT 5', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      })
    ]);
    
    const categoryCounts = await new Promise((resolve, reject) => {
      db.db.all(`
        SELECT category, COUNT(*) as count, AVG(effectiveness_score) as avg_effectiveness
        FROM adaptation_strategies GROUP BY category
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    res.json({
      summary: {
        recentExtremeEvents: extremeEvents.length,
        activeWarnings: activeWarnings.length,
        activeReports: reports.length,
        availableStrategies: strategies.length
      },
      extremeEvents,
      activeWarnings,
      communityReports: reports,
      topStrategies: strategies,
      categoryBreakdown: categoryCounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed database
app.post('/api/seed', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM adaptation_strategies', [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const strategies = await client.fetchAdaptationStrategies();
    for (const strategy of strategies) {
      await db.insertStrategy(strategy);
    }
    
    const regions = [
      { name: 'Coastal Bangladesh', code: 'BC-BD', lat: 22.3, lon: 89.8 },
      { name: 'Sahel Region', code: 'SA-SH', lat: 15.0, lon: 0.0 },
      { name: 'Pacific Islands', code: 'PI-PAC', lat: -8.0, lon: 158.0 },
      { name: 'Mediterranean', code: 'MED-ME', lat: 36.0, lon: 14.0 },
      { name: 'Arctic Region', code: 'ARC-AR', lat: 71.7, lon: -42.6 }
    ];
    
    for (const region of regions) {
      const conditions = await client.getCurrentConditions(region.lat, region.lon);
      await db.insertReading({
        location_name: region.name,
        latitude: region.lat,
        longitude: region.lon,
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        precipitation_mm: conditions.precipitation,
        sea_level_mm: Math.random() * 100,
        extreme_event: conditions.extremeEvent,
        data_source: conditions.source,
        region_code: region.code
      });
      
      await db.insertVulnerabilityAssessment({
        location_name: region.name,
        region_code: region.code,
        population_at_risk: Math.floor(Math.random() * 50000000),
        infrastructure_risk_level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        agriculture_risk_level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        health_risk_level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        water_security_risk: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        adaptation_capacity_score: Math.random() * 10,
        assessment_notes: `Initial assessment for ${region.name}`
      });
    }
    
    const warningTypes = ['Heat Wave', 'Flood Watch', 'Drought Warning'];
    const severities = ['watch', 'advisory', 'warning'];
    
    for (let i = 0; i < 3; i++) {
      await db.insertWarning({
        warning_type: warningTypes[i],
        severity: severities[i],
        affected_regions: regions[i].name,
        start_time: new Date().toISOString(),
        end_time: null,
        description: `Ongoing ${warningTypes[i].toLowerCase()} in affected region`,
        recommended_actions: 'Monitor local advisories, prepare emergency supplies',
        issued_by: 'Climate Adaptation Platform'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Database seeded successfully',
      strategiesAdded: strategies.length,
      readingsAdded: regions.length,
      warningsAdded: 3
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] Climate Adaptation Platform running on port ${PORT}`);
  console.log(`[Server] Dashboard: http://localhost:${PORT}/`);
  console.log(`[Server] API: http://localhost:${PORT}/api/`);
});

module.exports = app;
