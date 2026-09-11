import { Zone, Shelter, OverviewKPIs, RelocationRecommendation, SimulationResult, SimulationScenario, AlertMessage } from '../types';

const API_BASE = 'http://127.0.0.1:8010/api';

export async function fetchOverview(): Promise<{ kpis: OverviewKPIs; risk_distribution: any[] }> {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error('Failed to fetch overview');
  return res.json();
}

export async function fetchZones(): Promise<Zone[]> {
  const res = await fetch(`${API_BASE}/zones`);
  if (!res.ok) throw new Error('Failed to fetch zones');
  return res.json();
}

export async function fetchZone(id: string): Promise<Zone> {
  const res = await fetch(`${API_BASE}/zones/${id}`);
  if (!res.ok) throw new Error('Failed to fetch zone');
  return res.json();
}

export async function fetchShelters(): Promise<Shelter[]> {
  const res = await fetch(`${API_BASE}/shelters`);
  if (!res.ok) throw new Error('Failed to fetch shelters');
  return res.json();
}

export async function fetchRoutePlan(zoneId: string): Promise<RelocationRecommendation> {
  const res = await fetch(`${API_BASE}/routes/${zoneId}`);
  if (!res.ok) throw new Error('Failed to fetch route plan');
  return res.json();
}

export async function runSimulation(scenario: SimulationScenario): Promise<SimulationResult> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario)
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

export async function fetchAlerts(): Promise<AlertMessage[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function askCopilot(query: string): Promise<{ answer: string; grounded_data: any; suggested_actions: string[] }> {
  const res = await fetch(`${API_BASE}/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Failed to query copilot');
  return res.json();
}
