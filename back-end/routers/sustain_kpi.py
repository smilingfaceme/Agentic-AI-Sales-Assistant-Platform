from fastapi import APIRouter, HTTPException, Depends, Query, Body
from middleware.auth import verify_token
from db.public_table import get_companies
from src.utils.sustainability import generate_kpi_data

router = APIRouter()

@router.get("/kpi")
async def get_kpi_data(
    timeperiod: str = Query(..., description="Time period for data aggregation (7d, 30d, 3m, 1y, all)"),
    user = Depends(verify_token)
):
    """
    Retrieve sustainability KPI data for the authenticated user's company.

    Args:
        timperiod (str): Timespace for aggregation (e.g., 'day', 'week', 'month').
        user (dict): Authenticated user data, injected via dependency.

    Returns:
        dict: Sustainability KPI data, trend data, energy breakdown, and emissions breakdown.
    """
    if timeperiod == '7d':
        timespace = 'day'
        period = '7 days'
    elif timeperiod == '30d':
        timespace = 'day'
        period = '1 month'
    elif timeperiod == '3m':
        timespace = 'week'
        period = '3 months'
    elif timeperiod == '6m':
        timespace = 'month'
        period = '6 months'
    elif timeperiod == '1y':
        timespace = 'month'
        period = '1 year'
    elif timeperiod == 'all':
        timespace = 'month'
        period = 'all'
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    kpi_data, trend_data, energy_breakdown, emissions_breakdown = generate_kpi_data(company_schema, timespace, period)
    return {
        "kpiData": kpi_data,
        "trendData": trend_data,
        "energyBreakdown": energy_breakdown,
        "emissionsBreakdown": emissions_breakdown
    }
    