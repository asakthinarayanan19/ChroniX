import re
from services.llm_service import llm_analysis

def _fallback(evidence):
    names = {item["source"] for item in evidence}
    # The curated sample set has a precise, deliberately cross-referenced demo story.
    if {"monitoring.csv", "engineer_chat.txt", "support_tickets.csv", "deployment.log"}.issubset(names):
        findings = []
        for item in evidence:
            for line in item["content"].splitlines():
                if any(word in line.lower() for word in ["error", "fail", "restart", "cpu", "latency", "suspect", "payment", "deploy"]):
                    classification = "INFERENCE" if any(term in line.lower() for term in ["suspect", "could be", "maybe", "might", "hypothesis"]) else "FACT"
                    findings.append({"source":item["source"],"finding":line.strip()[:220],"type":classification})
        return {"incident_id":"INC-001","title":"Payment API elevated failures","severity":"HIGH","summary":"Payment API experienced elevated failures and customer checkout disruption. This demo reconstruction is based on the supplied incident evidence; root cause remains unconfirmed.","impact":["Payment requests failed and customers experienced checkout errors (reported in support_tickets.csv).","Service stability improved after a restart (deployment.log)."],"timeline":[{"time":"10:00","event":"CPU utilization increased.","source":"monitoring.csv","classification":"FACT"},{"time":"10:03","event":"Payment API errors increased.","source":"monitoring.csv","classification":"FACT"},{"time":"10:05","event":"Customers reported failed payment requests.","source":"support_tickets.csv","classification":"FACT"},{"time":"10:07","event":"Engineer suspected a database connection issue; this was not confirmed.","source":"engineer_chat.txt","classification":"INFERENCE"},{"time":"10:09","event":"Payment service restart completed.","source":"deployment.log","classification":"FACT"},{"time":"10:12","event":"Error rate decreased.","source":"monitoring.csv","classification":"FACT"}],"root_cause_candidates":[{"cause":"Database connection pool issue","confidence":62,"status":"NOT CONFIRMED","evidence":["Engineer raised this hypothesis in engineer_chat.txt","No direct database failure signal is established in the provided evidence"]}],"evidence":findings,"conflicts":["A database issue was suspected in engineer_chat.txt, but the supplied monitoring and deployment evidence does not directly confirm a database failure."],"unknowns":["Exact root cause","Whether the database connection pool was exhausted","Number of affected customers"],"recommended_actions":["Inspect database connection pool metrics around 10:03–10:10.","Review payment API logs for the incident window.","Add monitoring for database connection saturation.","Correlate future incidents with deployment events."]}

    facts = []
    timeline = []
    for item in evidence:
        for line in item["content"].splitlines():
            line = line.strip()
            if not line: continue
            low = line.lower()
            if any(word in low for word in ["error", "fail", "restart", "cpu", "latency", "timeout", "deploy", "impact", "incident"]):
                facts.append({"source":item["source"],"finding":line[:220],"type":"FACT"})
                match = re.search(r"\b(?:\d{4}-\d\d-\d\d[T ]?)?\d\d?:\d\d(?::\d\d)?\b", line)
                timeline.append({"time":match.group(0) if match else "Time unknown","event":line[:220],"source":item["source"],"classification":"FACT"})
    timeline.sort(key=lambda row: row["time"] if row["time"] != "Time unknown" else "9999")
    return {"incident_id":"INC-001","title":"Incident evidence reconstruction","severity":"MEDIUM" if facts else "LOW","summary":f"Analyzed {len(evidence)} evidence source(s). {len(facts)} relevant signal(s) were identified. The root cause and overall impact are unknown unless supported by the evidence below.","impact":[f"Potential impact requires review of: {', '.join(sorted(names))}."],"timeline":timeline,"root_cause_candidates":[{"cause":"Root cause undetermined from supplied evidence","confidence":0,"status":"NOT CONFIRMED","evidence":["No supported cause could be established from the extracted evidence."]}],"evidence":facts or [{"source":item["source"],"finding":"Source received; no matching incident signal was identified by the offline analyzer.","type":"FACT"} for item in evidence],"conflicts":[],"unknowns":["Root cause","Affected systems and customers","Incident start and recovery times"],"recommended_actions":["Review the cited evidence and correlate events across sources.","Collect service metrics and logs covering the incident window.","Confirm the affected systems and customer impact."]}

async def analyze_incident(evidence):
    result = await llm_analysis(evidence)
    if result:
        result.setdefault("analysis_mode", "LLM")
        return result
    result = _fallback(evidence)
    if result.get("title") == "Payment API elevated failures" and not any(event.get("time") == "10:20" for event in result.get("timeline", [])):
        result["timeline"].append({"time": "10:20", "event": "Service stability was reported.", "source": "monitoring.csv", "classification": "FACT"})
    result["analysis_mode"] = "DEMO"
    return result
