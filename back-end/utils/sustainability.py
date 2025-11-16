from db.company_table import get_carbon_energy_from_messages
from statistics import mean
from datetime import datetime
import random

def estimate_renewable_energy(chatbot_energy, chatbot_carbon):
    carbon_intensity = chatbot_carbon / chatbot_energy  # gCO2 per kWh
    max_intensity = 0.4  # gCO2/kWh for fossil energy (approx)
    renewable_fraction = max_intensity - carbon_intensity
    return renewable_fraction*1000

def make_emissions_breakdown(chatbot_energy, chatbot_carbon):
    """
    Estimate emission sources breakdown (%) dynamically.
    Uses energy intensity to scale compute vs infrastructure share.
    """
    # Compute energy intensity (gCO2 per kWh)
    carbon_intensity = chatbot_carbon / chatbot_energy

    # Normalize intensity range (200–600 gCO2/kWh typical)
    normalized = max(0, min(1, (carbon_intensity - 200) / (600 - 200)))

    # As intensity rises → inference dominates
    model_inference_share = 25 + 25 * normalized  # 25–50%
    data_processing_share = 40 - 10 * normalized  # 40→30%
    storage_share = 15
    network_share = 100 - (data_processing_share + model_inference_share + storage_share)

    emissionsBreakdownData = [
        {"name": "Data Processing", "value": round(data_processing_share, 2), "color": "#3b82f6"},
        {"name": "Model Inference", "value": round(model_inference_share, 2), "color": "#8b5cf6"},
        {"name": "Data Storage", "value": round(storage_share, 2), "color": "#ec4899"},
        {"name": "Network Transfer", "value": round(network_share, 2), "color": "#f59e0b"},
    ]
    return emissionsBreakdownData

def generate_kpi_data(company_schema: str, timespace: str, period: str):
    conversations = get_carbon_energy_from_messages(company_schema, timespace, period)
    
    conversations = [
        c for c in conversations
        if (c["chatbot_energy"] not in [None, 0]) and (c["chatbot_carbon"] not in [None, 0])
    ]
    if len(conversations) == 0:
        return None, None, None, None
    # --- Extract core values ---
    energy_values = [c["chatbot_energy"] for c in conversations]
    carbon_values = [c["chatbot_carbon"] for c in conversations]
    
    avg_energy = mean(energy_values)
    avg_carbon = mean(carbon_values)
    latest = conversations[-1]
    baseline_carbon = 0.008
    baseline_energy = 0.02
    
    # --- Derived metrics ---
    efficiency_improvement = ((baseline_energy - latest["chatbot_energy"]) / baseline_energy) * 100
    emissions_savings = ((baseline_carbon - latest["chatbot_carbon"]) / baseline_carbon) * 100
    renewable = estimate_renewable_energy(avg_energy, avg_carbon)
    # --- KPI summary ---
    mockKPIData = {
        "energyPerConversation": {
            "current": round(avg_energy, 4),
            "target": baseline_energy,
            "status": "on-track",
            "trend": {"value": round(efficiency_improvement, 2), "isPositive": True},
        },
        "carbonFootprint": {
            "current": round(avg_carbon,4),
            "target": baseline_carbon,
            "status": "on-track",
            "trend": {"value": round(emissions_savings, 2), "isPositive": True},
        },
        "efficiencyRatio": {
            "current": round(efficiency_improvement, 2),
            "target": 35,
            "status": "on-track",
            "trend": {"value": round(efficiency_improvement / 10, 2), "isPositive": True},
        },
        "emissionsSavings": {
            "current": round(emissions_savings, 2),
            "target": 60,
            "status": "on-track",
            "trend": {"value": round(emissions_savings / 2, 2), "isPositive": True},
        },
        "renewableEnergy": {
            "current": round(renewable, 2),
            "target": 10,
            "status": "on-track",
            "trend": {"value": 5, "isPositive": renewable >= 70},
        },
    }

    # --- Trend data ---
    trendData = []
    for c in conversations:
        date_label = c["date"]
        trendData.append({
            "date": date_label,
            "energy": c["chatbot_energy"],
            "carbon": c["chatbot_carbon"],
            "efficiency": round(((baseline_carbon - c["chatbot_carbon"]) /baseline_energy) * 100, 2),
            "renewable": round(estimate_renewable_energy(c["chatbot_energy"], c["chatbot_carbon"]), 2),
        })
    
    # --- Breakdown data (optional placeholders) ---
    energyBreakdownData = [
        {"name": "Renewable", "value": round(renewable, 2), "color": "#10b981"},
    ]
    emissionsBreakdownData = make_emissions_breakdown(latest["chatbot_energy"], latest["chatbot_carbon"])
    
    return mockKPIData, trendData, energyBreakdownData, emissionsBreakdownData
