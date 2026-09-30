def calculate_priority_score(
    citizen_demand: float,
    infrastructure_gap: float,
    population_impact: float,
    severity: float,
    investment_gap: float
) -> dict:
    """
    Priority Score =
    35% Citizen Demand
    + 25% Infrastructure Gap
    + 20% Population Impact
    + 10% Severity
    + 10% Investment Gap
    """
    
    citizen_demand_score = citizen_demand * 0.35
    infra_gap_score = infrastructure_gap * 0.25
    pop_impact_score = population_impact * 0.20
    sev_score = severity * 0.10
    inv_gap_score = investment_gap * 0.10
    
    final_score = round(
        citizen_demand_score + infra_gap_score + pop_impact_score + sev_score + inv_gap_score, 
        1
    )
    
    if final_score < 40:
        priority_level = "Low"
    elif final_score < 60:
        priority_level = "Medium"
    elif final_score < 80:
        priority_level = "High"
    else:
        priority_level = "Critical"
        
    return {
        "citizen_demand_score": round(citizen_demand_score, 1),
        "infrastructure_gap_score": round(infra_gap_score, 1),
        "population_impact_score": round(pop_impact_score, 1),
        "severity_score": round(sev_score, 1),
        "investment_gap_score": round(inv_gap_score, 1),
        "final_score": final_score,
        "priority_level": priority_level
    }
