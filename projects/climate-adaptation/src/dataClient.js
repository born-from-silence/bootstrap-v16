class ClimateDataClient {
  constructor() {
    this.sources = {
      openWeather: 'https://api.openweathermap.org/data/2.5',
      openMeteo: 'https://api.open-meteo.com/v1'
    };
  }

  async getCurrentConditions(lat, lon) {
    return {
      temperature: 25 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      precipitation: Math.random() * 10,
      windSpeed: Math.random() * 20,
      conditions: ['clear', 'cloudy', 'rain', 'storm'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toISOString(),
      extremeEvent: Math.random() > 0.9 ? 'heatwave' : null,
      source: 'simulated'
    };
  }

  async getClimateProjections(region, years = 30) {
    return {
      region,
      projectedTempRise: 1.5 + Math.random() * 2,
      projectedSeaLevelRise: 0.2 + Math.random() * 0.8,
      extremeEvents: Math.floor(years / 5),
      droughtRisk: Math.random() > 0.5 ? 'high' : 'medium',
      floodRisk: Math.random() > 0.5 ? 'high' : 'medium',
      confidence: 'medium'
    };
  }

  async fetchAdaptationStrategies() {
    return [
      {
        strategy_name: 'Community Managed Rainwater Harvesting',
        category: 'water',
        implementation_cost: 'low',
        effectiveness_score: 8.5,
        time_to_implement_days: 90,
        target_regions: 'arid, semi-arid',
        description: 'Installing rooftop and surface water collection systems with community management',
        success_rate: 0.78,
        case_study_url: 'https://example.com/rainwater-cases'
      },
      {
        strategy_name: 'Climate-Smart Agriculture - Drought Resistant Crops',
        category: 'agriculture',
        implementation_cost: 'medium',
        effectiveness_score: 8.2,
        time_to_implement_days: 180,
        target_regions: 'agricultural zones',
        description: 'Distribution of drought-resistant seed varieties and training',
        success_rate: 0.73,
        case_study_url: 'https://example.com/csa-cases'
      },
      {
        strategy_name: 'Coastal Mangrove Restoration',
        category: 'coastal',
        implementation_cost: 'medium',
        effectiveness_score: 9.1,
        time_to_implement_days: 730,
        target_regions: 'coastal, tropical',
        description: 'Planting mangrove forests for storm surge protection and carbon sinks',
        success_rate: 0.85,
        case_study_url: 'https://example.com/mangrove-cases'
      },
      {
        strategy_name: 'Heat Action Plans - Early Warning Systems',
        category: 'health',
        implementation_cost: 'low',
        effectiveness_score: 7.8,
        time_to_implement_days: 60,
        target_regions: 'urban, heat-prone',
        description: 'Temperature thresholds, cooling center activation protocols',
        success_rate: 0.81,
        case_study_url: 'https://example.com/heat-action-cases'
      },
      {
        strategy_name: 'Flood-Resistant Infrastructure Retrofit',
        category: 'infrastructure',
        implementation_cost: 'high',
        effectiveness_score: 8.8,
        time_to_implement_days: 365,
        target_regions: 'flood-prone urban areas',
        description: 'Elevating critical infrastructure, improving drainage',
        success_rate: 0.76,
        case_study_url: 'https://example.com/flood-infrastructure-cases'
      },
      {
        strategy_name: 'Community Emergency Response Teams (CERT)',
        category: 'health',
        implementation_cost: 'low',
        effectiveness_score: 8.0,
        time_to_implement_days: 120,
        target_regions: 'all communities',
        description: 'Training community volunteers in disaster response',
        success_rate: 0.82,
        case_study_url: 'https://example.com/cert-cases'
      },
      {
        strategy_name: 'Urban Green Infrastructure - Cooling Corridors',
        category: 'ecosystem',
        implementation_cost: 'medium',
        effectiveness_score: 7.5,
        time_to_implement_days: 550,
        target_regions: 'urban heat islands',
        description: 'Tree-lined streets, green roofs, urban parks',
        success_rate: 0.70,
        case_study_url: 'https://example.com/green-infrastructure-cases'
      },
      {
        strategy_name: 'Managed Aquifer Recharge',
        category: 'water',
        implementation_cost: 'medium',
        effectiveness_score: 8.7,
        time_to_implement_days: 270,
        target_regions: 'groundwater-dependent regions',
        description: 'Enhancing groundwater recharge through infiltration',
        success_rate: 0.79,
        case_study_url: 'https://example.com/mar-cases'
      }
    ];
  }
}

module.exports = ClimateDataClient;
