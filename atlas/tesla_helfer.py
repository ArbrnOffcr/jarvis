"""Signierte Tesla-Befehle (Vehicle Command Protocol) – läuft in einer eigenen Python-3.13-Umgebung
(~/.atlas/tesla-venv) mit der Bibliothek tesla-fleet-api. Bekommt den Auftrag als JSON auf stdin und
antwortet mit genau einer JSON-Zeile. Importiert bewusst nichts aus JARVIS.

    {"aktion": "schluessel", "pfad": ".../private_key.pem"}
    {"aktion": "befehl", "pfad": "...", "token": "...", "region": "eu", "vin": "...", "befehl": "set_charge_limit",
     "args": {"percent": 80}}
"""
import asyncio
import json
import sys

ERLAUBT = {"auto_conditioning_start", "auto_conditioning_stop", "set_temps", "charge_start", "charge_stop",
           "set_charge_limit", "set_scheduled_charging", "set_scheduled_departure", "set_preconditioning_max"}


async def main(d: dict) -> dict:
    import aiohttp
    from cryptography.hazmat.primitives import serialization
    from tesla_fleet_api import TeslaFleetApi

    async with aiohttp.ClientSession() as session:
        api = TeslaFleetApi(session=session, access_token=d.get("token") or "-", region=d.get("region", "eu"))
        key = await api.get_private_key(d["pfad"])
        if d["aktion"] == "schluessel":
            pub = key.public_key().public_bytes(serialization.Encoding.PEM,
                                                serialization.PublicFormat.SubjectPublicKeyInfo).decode()
            return {"ok": True, "public_key": pub}
        if d["aktion"] == "befehl":
            from tesla_fleet_api.tesla.vehicle.signed import VehicleSigned
            name = d["befehl"]
            if name not in ERLAUBT:
                return {"ok": False, "fehler": f"Befehl {name} nicht freigegeben"}
            v = VehicleSigned(api, d["vin"])
            antwort = await getattr(v, name)(**(d.get("args") or {}))
            return {"ok": True, "antwort": antwort}
    return {"ok": False, "fehler": "unbekannte Aktion"}


if __name__ == "__main__":
    try:
        auftrag = json.loads(sys.stdin.read() or "{}")
        ergebnis = asyncio.run(main(auftrag))
    except Exception as e:                       # Fehler als JSON melden, nie den Schlüssel ausgeben
        ergebnis = {"ok": False, "fehler": f"{type(e).__name__}: {str(e)[:300]}"}
    print(json.dumps(ergebnis, ensure_ascii=False, default=str))
