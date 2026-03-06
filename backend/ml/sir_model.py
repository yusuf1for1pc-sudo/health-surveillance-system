"""
SIR (Susceptible-Infected-Recovered) epidemiological model.
Uses scipy ODE solver for differential equations.
"""

import numpy as np
from scipy.integrate import odeint
from typing import Optional


# Default SIR parameters per disease (beta=transmission, gamma=recovery rate)
DEFAULT_SIR_PARAMS = {
    "Dengue":         {"beta": 0.35, "gamma": 1/14, "N": 10000, "description": "Vector-borne, 14-day avg recovery"},
    "Malaria":        {"beta": 0.25, "gamma": 1/21, "N": 10000, "description": "Vector-borne, 21-day avg recovery"},
    "Leptospirosis":  {"beta": 0.20, "gamma": 1/10, "N": 10000, "description": "Water-borne, 10-day avg recovery"},
    "Typhoid":        {"beta": 0.30, "gamma": 1/14, "N": 10000, "description": "Water/food-borne, 14-day avg recovery"},
    "Tuberculosis":   {"beta": 0.10, "gamma": 1/180, "N": 10000, "description": "Airborne, 6-month avg treatment"},
    "COVID-19":       {"beta": 0.40, "gamma": 1/10, "N": 10000, "description": "Airborne, 10-day avg recovery"},
    "Influenza":      {"beta": 0.50, "gamma": 1/7,  "N": 10000, "description": "Airborne, 7-day avg recovery"},
    "Gastroenteritis": {"beta": 0.30, "gamma": 1/5, "N": 10000, "description": "Water/food-borne, 5-day avg recovery"},
    "Chikungunya":    {"beta": 0.30, "gamma": 1/10, "N": 10000, "description": "Vector-borne, 10-day avg recovery"},
    "Default":        {"beta": 0.25, "gamma": 1/14, "N": 10000, "description": "Generic disease parameters"},
}


def sir_derivatives(y, t, N, beta, gamma):
    """SIR model differential equations."""
    S, I, R = y
    dSdt = -beta * S * I / N
    dIdt = beta * S * I / N - gamma * I
    dRdt = gamma * I
    return dSdt, dIdt, dRdt


def run_sir_model(
    disease: str,
    initial_infected: int,
    days: int = 90,
    intervention_day: Optional[int] = None,
    intervention_effectiveness: float = 0.0,
    custom_beta: Optional[float] = None,
    custom_gamma: Optional[float] = None,
    population: Optional[int] = None,
):
    """
    Run the SIR model for a given disease.
    
    Args:
        disease: Disease name to look up default parameters
        initial_infected: Current number of infected individuals
        days: Number of days to simulate
        intervention_day: Day on which intervention is deployed (None = no intervention)
        intervention_effectiveness: Reduction in beta (0.0-1.0) when intervention is active
        custom_beta: Override default transmission rate
        custom_gamma: Override default recovery rate
        population: Override default population size
        
    Returns:
        Dictionary with S, I, R time series and R0 values
    """
    params = DEFAULT_SIR_PARAMS.get(disease, DEFAULT_SIR_PARAMS["Default"])
    
    beta = custom_beta if custom_beta is not None else params["beta"]
    gamma = custom_gamma if custom_gamma is not None else params["gamma"]
    N = population if population is not None else params["N"]
    
    I0 = min(initial_infected, N - 1)
    R0_initial = 0
    S0 = N - I0 - R0_initial
    
    y0 = S0, I0, R0_initial
    t = np.linspace(0, days, days + 1)
    
    R0 = beta / gamma  # Basic reproduction number
    
    if intervention_day is not None and 0 < intervention_day < days:
        # Phase 1: before intervention
        t1 = np.linspace(0, intervention_day, intervention_day + 1)
        ret1 = odeint(sir_derivatives, y0, t1, args=(N, beta, gamma))
        S1, I1, R1 = ret1.T
        
        # Phase 2: after intervention (reduced beta)
        beta_reduced = beta * (1 - intervention_effectiveness)
        y0_phase2 = ret1[-1]
        remaining_days = days - intervention_day
        t2 = np.linspace(0, remaining_days, remaining_days + 1)
        ret2 = odeint(sir_derivatives, y0_phase2, t2, args=(N, beta_reduced, gamma))
        S2, I2, R2 = ret2.T
        
        # Combine phases
        S = np.concatenate([S1, S2[1:]])
        I = np.concatenate([I1, I2[1:]])
        R = np.concatenate([R1, R2[1:]])
        
        R0_post = beta_reduced / gamma
    else:
        ret = odeint(sir_derivatives, y0, t, args=(N, beta, gamma))
        S, I, R = ret.T
        R0_post = R0
    
    # Peak infection
    peak_idx = int(np.argmax(I))
    peak_infections = int(round(I[peak_idx]))
    
    return {
        "days": list(range(days + 1)),
        "susceptible": [int(round(x)) for x in S],
        "infected": [int(round(x)) for x in I],
        "recovered": [int(round(x)) for x in R],
        "R0": round(R0, 2),
        "R0_post_intervention": round(R0_post, 2),
        "peak_day": peak_idx,
        "peak_infections": peak_infections,
        "total_infected_end": int(round(R[-1])),
        "parameters": {
            "beta": round(beta, 4),
            "gamma": round(gamma, 4),
            "N": N,
            "disease": disease,
            "description": params.get("description", ""),
        }
    }
