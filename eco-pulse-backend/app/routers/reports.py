from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from app.database import get_supabase
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# ── PDF Builder ───────────────────────────────────────────────────────────────

def build_audit_pdf(audit: dict, user: dict) -> BytesIO:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=2*cm, bottomMargin=2*cm,
                            leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    GREEN = colors.HexColor("#10B981")
    DARK  = colors.HexColor("#0F172A")
    GRAY  = colors.HexColor("#64748B")

    title_style = ParagraphStyle("title", fontSize=24, textColor=DARK,
                                  fontName="Helvetica-Bold", spaceAfter=6)
    sub_style   = ParagraphStyle("sub", fontSize=11, textColor=GRAY,
                                  fontName="Helvetica", spaceAfter=4)
    section_style = ParagraphStyle("section", fontSize=13, textColor=GREEN,
                                    fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=6)
    body_style  = ParagraphStyle("body", fontSize=10, textColor=DARK,
                                  fontName="Helvetica", leading=16)

    b = audit.get("breakdown", {})
    inp = audit.get("inputs", {})
    story = [
        Paragraph("EcoPulse", ParagraphStyle("brand", fontSize=10, textColor=GREEN, fontName="Helvetica-Bold")),
        Spacer(1, 0.3*cm),
        Paragraph("Campus Carbon Audit Report", title_style),
        Paragraph(f"Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}  |  Prepared for: {user.get('full_name', 'Admin')}", sub_style),
        HRFlowable(width="100%", thickness=1, color=GREEN, spaceAfter=12),

        Paragraph("Executive Summary", section_style),
        Paragraph(f"This report presents the verified carbon footprint audit of the campus for the current academic session, "
                  f"computed using the EcoPulse AI platform aligned with ISO 14064, NAAC Criterion VII, and BEE ESCO standards.", body_style),
        Spacer(1, 0.4*cm),

        Paragraph("Key Results", section_style),
        Table([
            ["Metric", "Value"],
            ["Net Campus Emissions", f"{audit.get('net_tons', '—')} tCO₂e / year"],
            ["Gross Emissions (before offsets)", f"{audit.get('gross_tons', '—')} tCO₂e / year"],
            ["Solar Generation Offset", f"-{audit.get('solar_offset_tons', '—')} tCO₂e / year"],
            ["Campus Tree Sequestration", f"-{audit.get('tree_offset_tons', 28)} tCO₂e / year"],
            ["NAAC Green Audit Score", f"{audit.get('naac_score', '—')} / 100  (Grade {audit.get('naac_grade', '—')})"],
            ["Per-Capita Intensity", f"{audit.get('per_capita_kg', '—')} kg CO₂e / person / year"],
        ], colWidths=[9*cm, 7*cm],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,0), GREEN),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 10),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ("LEFTPADDING",(0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 6),
            ("BOTTOMPADDING",(0,0),(-1,-1),6),
        ])),
        Spacer(1, 0.4*cm),

        Paragraph("Emission Source Breakdown", section_style),
        Table([
            ["Source", "Metric Tons CO₂e"],
            ["Academic & Laboratory Facilities", b.get("academic", "—")],
            ["Student Hostels & Residential", b.get("hostel", "—")],
            ["Campus Fleet & Transportation", b.get("fleet", "—")],
            ["Grid Power Consumption", b.get("grid", "—")],
            ["DG Generator Sets", b.get("dg", "—")],
            ["Central Mess & Dining Waste", b.get("mess", "—")],
        ], colWidths=[11*cm, 5*cm],
        style=TableStyle([
            ("BACKGROUND", (0,0), (-1,0), DARK),
            ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
            ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",   (0,0), (-1,-1), 10),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.HexColor("#F8FAFC"), colors.white]),
            ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ("LEFTPADDING",(0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 6),
            ("BOTTOMPADDING",(0,0),(-1,-1),6),
        ])),
        Spacer(1, 0.4*cm),

        Paragraph("Infrastructure Parameters Used", section_style),
        Paragraph(
            f"Labs: {inp.get('lab_count', '—')} | HVAC: {inp.get('hvac_hours', '—')} hrs/day | "
            f"Solar: {inp.get('solar_kwp', '—')} kWp | Grid: {inp.get('grid_monthly_kwh', '—')} kWh/month | "
            f"Hostel residents: {inp.get('hostel_residents', '—')} | Buses: {inp.get('bus_count', '—')} | "
            f"Biogas plant: {inp.get('has_biogas_plant', '—')}", body_style),
        Spacer(1, 0.6*cm),

        HRFlowable(width="100%", thickness=0.5, color=GRAY),
        Spacer(1, 0.2*cm),
        Paragraph("EcoPulse Carbon Intelligence Platform  |  Compliant with ISO 14064 · NAAC Criterion VII · BEE ESCO",
                  ParagraphStyle("footer", fontSize=8, textColor=GRAY, fontName="Helvetica", alignment=TA_CENTER)),
    ]

    doc.build(story)
    buf.seek(0)
    return buf

# ── Routes (static paths BEFORE parameterized paths) ─────────────────────────

@router.get("/audit/latest/pdf")
async def export_latest_audit_pdf(current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    # Prefer user-owned audits; fall back to latest campus-wide (user_id null) row
    audit_res = db.table("audit_results") \
        .select("*").eq("user_id", current_user["sub"]) \
        .order("created_at", desc=True).limit(1).execute()

    if not audit_res.data:
        audit_res = db.table("audit_results") \
            .select("*").order("created_at", desc=True).limit(1).execute()

    if not audit_res.data:
        raise HTTPException(status_code=404, detail="No audits found. Save an audit first.")

    user_res = db.table("users").select("full_name, email").eq("id", current_user["sub"]).execute()
    user = user_res.data[0] if user_res.data else {}

    pdf_buf = build_audit_pdf(audit_res.data[0], user)
    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="ecopulse_latest_audit.pdf"'},
    )


@router.get("/audit/{audit_id}/pdf")
async def export_audit_pdf(audit_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    audit_res = db.table("audit_results").select("*").eq("id", audit_id).execute()
    if not audit_res.data:
        raise HTTPException(status_code=404, detail="Audit not found")

    user_res = db.table("users").select("full_name, email").eq("id", current_user["sub"]).execute()
    user = user_res.data[0] if user_res.data else {}

    pdf_buf = build_audit_pdf(audit_res.data[0], user)
    filename = f"ecopulse_audit_{audit_id[:8]}.pdf"
    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
