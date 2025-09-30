from app import create_app, db
from app.models import CostCode

# CSI MasterFormat 2020 Division Codes
csi_codes = [
    # Division 00 — Procurement and Contracting Requirements
    ("00 01 01", "Project Title Page"),
    ("00 01 10", "Table of Contents"),
    ("00 11 13", "Advertisement for Bids"),
    ("00 21 13", "Instructions to Bidders"),
    ("00 31 13", "Preliminary Schedule"),
    ("00 41 13", "Bid Form"),
    ("00 52 13", "Agreement Form"),
    ("00 72 13", "General Conditions"),

    # Division 01 — General Requirements
    ("01 10 00", "Summary"),
    ("01 20 00", "Price and Payment Procedures"),
    ("01 30 00", "Administrative Requirements"),
    ("01 40 00", "Quality Requirements"),
    ("01 50 00", "Temporary Facilities and Controls"),
    ("01 60 00", "Product Requirements"),
    ("01 70 00", "Execution and Closeout Requirements"),

    # Division 02 — Existing Conditions
    ("02 41 00", "Demolition"),
    ("02 50 00", "Site Remediation"),
    ("02 60 00", "Contaminated Site Material Removal"),
    ("02 70 00", "Water Remediation"),
    ("02 80 00", "Facility Remediation"),

    # Division 03 — Concrete
    ("03 10 00", "Concrete Forming and Accessories"),
    ("03 20 00", "Concrete Reinforcing"),
    ("03 30 00", "Cast-in-Place Concrete"),
    ("03 40 00", "Precast Concrete"),
    ("03 50 00", "Cast Decks and Underlayment"),
    ("03 60 00", "Grouting"),

    # Division 04 — Masonry
    ("04 20 00", "Unit Masonry"),
    ("04 40 00", "Stone Assemblies"),
    ("04 50 00", "Refractory Masonry"),
    ("04 60 00", "Corrosion-Resistant Masonry"),

    # Division 05 — Metals
    ("05 10 00", "Structural Metal Framing"),
    ("05 20 00", "Metal Joists"),
    ("05 30 00", "Metal Decking"),
    ("05 40 00", "Cold-Formed Metal Framing"),
    ("05 50 00", "Metal Fabrications"),
    ("05 70 00", "Decorative Metal"),

    # Division 06 — Wood, Plastics, and Composites
    ("06 10 00", "Rough Carpentry"),
    ("06 20 00", "Finish Carpentry"),
    ("06 40 00", "Architectural Woodwork"),
    ("06 50 00", "Structural Plastics"),
    ("06 60 00", "Plastic Fabrications"),
    ("06 70 00", "Structural Composites"),

    # Division 07 — Thermal and Moisture Protection
    ("07 10 00", "Dampproofing and Waterproofing"),
    ("07 20 00", "Thermal Protection"),
    ("07 30 00", "Steep Slope Roofing"),
    ("07 40 00", "Roofing and Siding Panels"),
    ("07 50 00", "Membrane Roofing"),
    ("07 60 00", "Flashing and Sheet Metal"),
    ("07 70 00", "Roof and Wall Specialties and Accessories"),
    ("07 80 00", "Fire and Smoke Protection"),
    ("07 90 00", "Joint Protection"),

    # Division 08 — Openings
    ("08 10 00", "Doors and Frames"),
    ("08 30 00", "Specialty Doors and Frames"),
    ("08 40 00", "Entrances, Storefronts, and Curtain Walls"),
    ("08 50 00", "Windows"),
    ("08 60 00", "Roof Windows and Skylights"),
    ("08 70 00", "Hardware"),
    ("08 80 00", "Glazing"),
    ("08 90 00", "Louvers and Vents"),

    # Division 09 — Finishes
    ("09 20 00", "Plaster and Gypsum Board"),
    ("09 30 00", "Tiling"),
    ("09 50 00", "Ceilings"),
    ("09 60 00", "Flooring"),
    ("09 70 00", "Wall Finishes"),
    ("09 80 00", "Acoustic Treatment"),
    ("09 90 00", "Painting and Coating"),

    # Division 10 — Specialties
    ("10 10 00", "Information Specialties"),
    ("10 20 00", "Interior Specialties"),
    ("10 30 00", "Fireplaces and Stoves"),
    ("10 40 00", "Safety Specialties"),
    ("10 50 00", "Storage Specialties"),
    ("10 70 00", "Exterior Specialties"),
    ("10 80 00", "Other Specialties"),

    # Division 11 — Equipment
    ("11 10 00", "Vehicle and Pedestrian Equipment"),
    ("11 20 00", "Commercial Equipment"),
    ("11 30 00", "Residential Equipment"),
    ("11 40 00", "Foodservice Equipment"),
    ("11 50 00", "Educational and Scientific Equipment"),
    ("11 60 00", "Entertainment Equipment"),
    ("11 70 00", "Healthcare Equipment"),

    # Division 12 — Furnishings
    ("12 10 00", "Art"),
    ("12 20 00", "Window Treatments"),
    ("12 30 00", "Casework"),
    ("12 40 00", "Furnishings and Accessories"),
    ("12 50 00", "Furniture"),
    ("12 60 00", "Multiple Seating"),

    # Division 13 — Special Construction
    ("13 10 00", "Special Facility Components"),
    ("13 20 00", "Special Purpose Rooms"),
    ("13 30 00", "Special Structures"),
    ("13 40 00", "Integrated Construction"),
    ("13 50 00", "Special Instrumentation"),

    # Division 14 — Conveying Equipment
    ("14 10 00", "Dumbwaiters"),
    ("14 20 00", "Elevators"),
    ("14 30 00", "Escalators and Moving Walks"),
    ("14 40 00", "Lifts"),
    ("14 90 00", "Other Conveying Equipment"),

    # Division 21 — Fire Suppression
    ("21 10 00", "Water-Based Fire-Suppression Systems"),
    ("21 20 00", "Fire-Extinguishing Systems"),
    ("21 30 00", "Fire Pumps"),
    ("21 40 00", "Fire-Suppression Water Storage"),

    # Division 22 — Plumbing
    ("22 10 00", "Plumbing Piping"),
    ("22 30 00", "Plumbing Equipment"),
    ("22 40 00", "Plumbing Fixtures"),
    ("22 50 00", "Pool and Fountain Plumbing Systems"),
    ("22 60 00", "Gas and Vacuum Systems for Laboratory and Healthcare Facilities"),

    # Division 23 — Heating, Ventilating, and Air Conditioning (HVAC)
    ("23 10 00", "Facility Fuel Systems"),
    ("23 20 00", "HVAC Piping and Pumps"),
    ("23 30 00", "HVAC Air Distribution"),
    ("23 40 00", "HVAC Air Cleaning Devices"),
    ("23 50 00", "Central Heating Equipment"),
    ("23 60 00", "Central Cooling Equipment"),
    ("23 70 00", "Central HVAC Equipment"),
    ("23 80 00", "Decentralized HVAC Equipment"),

    # Division 26 — Electrical
    ("26 10 00", "Medium-Voltage Electrical Distribution"),
    ("26 20 00", "Low-Voltage Electrical Distribution"),
    ("26 30 00", "Facility Electrical Power Generating and Storing Equipment"),
    ("26 40 00", "Electrical Protection"),
    ("26 50 00", "Lighting"),
    ("26 60 00", "Electronic Safety and Security"),

    # Division 27 — Communications
    ("27 10 00", "Structured Cabling"),
    ("27 30 00", "Voice Communications"),
    ("27 40 00", "Audio-Video Communications"),
    ("27 50 00", "Distributed Communications and Monitoring Systems"),

    # Division 28 — Electronic Safety and Security
    ("28 10 00", "Electronic Access Control and Intrusion Detection"),
    ("28 20 00", "Electronic Surveillance"),
    ("28 30 00", "Electronic Detection and Alarm"),
    ("28 40 00", "Electronic Monitoring and Control"),

    # Division 31 — Earthwork
    ("31 10 00", "Site Clearing"),
    ("31 20 00", "Earth Moving"),
    ("31 30 00", "Earthwork Methods"),
    ("31 40 00", "Shoring and Underpinning"),
    ("31 50 00", "Excavation Support and Protection"),
    ("31 60 00", "Special Foundations and Load-Bearing Elements"),
    ("31 70 00", "Tunneling and Mining"),

    # Division 32 — Exterior Improvements
    ("32 10 00", "Bases, Ballasts, and Paving"),
    ("32 30 00", "Site Improvements"),
    ("32 40 00", "Site Furnishings"),
    ("32 80 00", "Irrigation"),
    ("32 90 00", "Planting"),

    # Division 33 — Utilities
    ("33 10 00", "Water Utilities"),
    ("33 20 00", "Wells"),
    ("33 30 00", "Sanitary Sewerage Utilities"),
    ("33 40 00", "Storm Drainage Utilities"),
    ("33 50 00", "Fuel Distribution Utilities"),
    ("33 60 00", "Hydronic and Steam Energy Utilities"),
    ("33 70 00", "Electrical Utilities"),
    ("33 80 00", "Communications Utilities"),

    # Division 34 — Transportation
    ("34 10 00", "Guided Transportation"),
    ("34 40 00", "Transportation Signaling and Control Equipment"),
    ("34 70 00", "Transportation Construction and Equipment"),

    # Division 35 — Waterway and Marine Construction
    ("35 10 00", "Waterway and Marine Signaling and Control Equipment"),
    ("35 20 00", "Waterway and Marine Construction and Equipment"),
    ("35 50 00", "Marine Construction and Equipment"),

    # Division 40 — Process Integration
    ("40 10 00", "Gas and Vapor Process Piping"),
    ("40 20 00", "Liquid Process Piping"),
    ("40 30 00", "Solid and Mixed Process Piping"),
    ("40 40 00", "Process Piping Protection"),
    ("40 50 00", "Process Valves"),

    # Division 41 — Material Processing and Handling Equipment
    ("41 10 00", "Bulk Material Processing Equipment"),
    ("41 20 00", "Unit Material Handling Equipment"),
    ("41 50 00", "Material Handling Control"),

    # Division 42 — Process Heating, Cooling, and Drying Equipment
    ("42 10 00", "Process Heating Equipment"),
    ("42 20 00", "Process Cooling Equipment"),
    ("42 30 00", "Process Drying Equipment"),

    # Division 43 — Process Gas and Liquid Handling
    ("43 10 00", "Gas Handling Equipment"),
    ("43 20 00", "Liquid Handling Equipment"),
    ("43 30 00", "Gas and Liquid Storage Equipment"),
    ("43 40 00", "Gas and Liquid Purification Equipment"),

    # Division 44 — Pollution and Waste Control Equipment
    ("44 10 00", "Air Pollution Control"),
    ("44 20 00", "Water Treatment Equipment"),
    ("44 40 00", "Pollution Control Equipment"),
    ("44 50 00", "Solid Waste Control Equipment"),

    # Division 46 — Water and Wastewater Equipment
    ("46 10 00", "Water and Wastewater Equipment"),
    ("46 20 00", "Water Treatment Equipment"),
    ("46 30 00", "Wastewater Treatment Equipment"),
    ("46 50 00", "Water and Wastewater Treatment Equipment"),

    # Division 48 — Electrical Power Generation
    ("48 10 00", "Generation Equipment"),
    ("48 20 00", "Energy Conversion Equipment"),
    ("48 30 00", "Energy Storage Equipment"),
    ("48 40 00", "Energy Distribution Equipment"),
]

def populate_cost_codes():
    app = create_app()
    
    with app.app_context():
        print("🔄 Populating cost codes table...")
        
        # Create cost codes
        for code, description in csi_codes:
            division = code[:2]  # Extract first two digits
            cost_code = CostCode(
                code=code,
                description=description,
                division=division,
                status='active'
            )
            db.session.add(cost_code)
        
        try:
            db.session.commit()
            print(f"✅ Successfully added {len(csi_codes)} cost codes!")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error adding cost codes: {str(e)}")

if __name__ == "__main__":
    populate_cost_codes()



