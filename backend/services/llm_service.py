import json, os
from dotenv import load_dotenv
load_dotenv()

async def llm_analysis(evidence):
    key = os.getenv("LLM_API_KEY")
    if not key or key == "your_api_key_here": return None
    try:
        from openai import AsyncOpenAI
        prompt = """Analyze incident evidence and return valid JSON only. Do not invent events; use only supplied evidence. Every important claim must cite source. Distinguish facts from inferences. If insufficient say Unknown. Report disagreements as conflicts. Never call a cause confirmed without proof. Chronological ordering. Schema: {incident_id,title,severity,summary,impact:[strings],timeline:[{time,event,source,classification}],root_cause_candidates:[{cause,confidence,status,evidence:[strings]}],evidence:[{source,finding,type}],conflicts:[strings],unknowns:[strings],recommended_actions:[strings]}. severity one of LOW, MEDIUM, HIGH, CRITICAL. confidence 0-100."""
        client = AsyncOpenAI(api_key=key)
        response = await client.chat.completions.create(model=os.getenv("LLM_MODEL", "gpt-4o-mini"), response_format={"type":"json_object"}, messages=[{"role":"system","content":prompt},{"role":"user","content":json.dumps(evidence)}], temperature=0.1)
        return json.loads(response.choices[0].message.content)
    except Exception:
        # A provider outage or malformed response should not disable demo analysis.
        return None
