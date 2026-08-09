const fs = require("fs");
const path = require("path");

const kbDir = path.join(__dirname, "../../knowledge-base");

// Define 160 NEW Enterprise Consulting Use Cases (10 NEW documents per industry folder numbered 11_*.md to 20_*.md)
const newDomains = [
  // 1. Banking
  {
    folder: "Banking",
    industry: "Banking & Capital Markets",
    docs: [
      { file: "11_ai_credit_scoring.md", title: "Enterprise AI Credit Scoring & Alternative Data Risk Assessment", department: "Risk & Credit Operations", function: "AI Credit Scoring", keywords: ["credit scoring", "alternative data", "underwriting", "default risk", "loan approval", "credit bureau"], tech: ["XGBoost", "Databricks", "AWS SageMaker", "PostgreSQL"], roi: "290%", time: "6 Months", cost: "$450,000" },
      { file: "12_loan_origination.md", title: "Autonomous Commercial Loan Origination & Digital Application Processing", department: "Commercial Lending", function: "Loan Origination Automation", keywords: ["loan origination", "digital application", "dscr", "debt service", "commercial underwriting"], tech: ["LayoutLM", "FastAPI", "MongoDB Atlas", "React"], roi: "310%", time: "5 Months", cost: "$380,000" },
      { file: "13_kyc_intelligence.md", title: "Next-Gen Identity Verification & KYC Regulatory Intelligence", department: "Compliance & Security", function: "KYC Intelligence", keywords: ["kyc", "identity verification", "liveness detection", "passport ocr", "sanctions screening"], tech: ["Vision AI", "Sumsub API", "Node.js", "Redis"], roi: "270%", time: "4 Months", cost: "$290,000" },
      { file: "14_aml_transaction_monitoring.md", title: "High-Velocity AML Network & Suspicious Activity Monitoring", department: "Financial Crime & AML", function: "AML Transaction Monitoring", keywords: ["aml", "money laundering", "str filing", "suspicious activity", "graph neural network"], tech: ["Graph Neural Networks", "Kafka", "Elasticsearch", "Python"], roi: "350%", time: "7 Months", cost: "$520,000" },
      { file: "15_branch_operations.md", title: "Bank Branch Network Optimization & Teller Cash Scheduling", department: "Retail Branch Operations", function: "Branch Operations Optimization", keywords: ["branch optimization", "teller staffing", "vault cash", "atm replenishment", "foot traffic"], tech: ["Prophet", "TimescaleDB", "React"], roi: "210%", time: "4 Months", cost: "$220,000" },
      { file: "16_customer_churn_prediction.md", title: "High-Net-Worth Deposit Attrition & Churn Prevention Model", department: "Customer Analytics", function: "Customer Churn Prediction", keywords: ["deposit churn", "wealth retention", "attrition risk", "account closure", "next best action"], tech: ["Random Forest", "Segment API", "Python"], roi: "240%", time: "4 Months", cost: "$260,000" },
      { file: "17_ai_relationship_manager.md", title: "Private Banking Wealth Advisor AI Copilot", department: "Wealth Management", function: "AI Relationship Manager", keywords: ["wealth advisor", "copilot", "portfolio rebalancing", "asset allocation", "client portal"], tech: ["LLM Assistant", "Markowitz Model", "FastAPI"], roi: "280%", time: "5 Months", cost: "$340,000" },
      { file: "18_treasury_risk_analytics.md", title: "Global Treasury FX & Liquidity Stress Test Analytics", department: "Corporate Treasury", function: "Treasury Risk Analytics", keywords: ["treasury risk", "fx volatility", "liquidity stress test", "basel iii", "cash flow"], tech: ["LSTM", "SWIFT API", "Snowflake"], roi: "260%", time: "6 Months", cost: "$410,000" },
      { file: "19_regulatory_compliance.md", title: "Automated Regulatory Reporting & Compliance Audit AI", department: "Regulatory Affairs", function: "Regulatory Compliance Automation", keywords: ["regulatory reporting", "dodd-frank", "finra", "compliance audit", "sec filing"], tech: ["PyTorch", "XBRL Engine", "PostgreSQL"], roi: "300%", time: "5 Months", cost: "$390,000" },
      { file: "20_digital_banking_copilot.md", title: "Conversational Consumer Mobile Banking AI Copilot", department: "Digital Channels", function: "Digital Banking Copilot", keywords: ["mobile banking", "conversational ai", "transaction search", "bill pay bot", "financial wellness"], tech: ["LLM Agent", "Websockets", "React Native"], roi: "320%", time: "4 Months", cost: "$310,000" }
    ]
  },

  // 2. Education
  {
    folder: "Education",
    industry: "Education & EdTech",
    docs: [
      { file: "11_ai_exam_evaluation.md", title: "Automated Short-Answer Essay & Code Assessment Auto-Grader", department: "Examination Assessment", function: "AI Exam Evaluation", keywords: ["exam evaluation", "auto grader", "essay scoring", "code review", "rubric match"], tech: ["BERT", "Sentence Transformers", "Python"], roi: "260%", time: "4 Months", cost: "$240,000" },
      { file: "12_smart_attendance_analytics.md", title: "Computer Vision Campus Attendance & Spatial Engagement Analytics", department: "Campus Administration", function: "Smart Attendance Analytics", keywords: ["attendance analytics", "facial recognition", "lecture hall", "engagement score", "campus safety"], tech: ["OpenCV", "YOLOv8", "Node.js"], roi: "190%", time: "3 Months", cost: "$180,000" },
      { file: "13_student_dropout_prediction.md", title: "Higher Education At-Risk Student Early Warning & Retention Model", department: "Student Success", function: "Student Dropout Prediction", keywords: ["dropout prediction", "at-risk student", "lms engagement", "gpa risk", "retention"], tech: ["Random Forest", "Canvas API", "PostgreSQL"], roi: "280%", time: "4 Months", cost: "$210,000" },
      { file: "14_ai_course_recommendation.md", title: "Personalized Academic Curriculum & Skill Pathway Recommender", department: "Academic Advising", function: "AI Course Recommendation", keywords: ["course recommendation", "curriculum path", "skill gap", "prerequisite match"], tech: ["Collaborative Filtering", "Python", "React"], roi: "220%", time: "3 Months", cost: "$190,000" },
      { file: "15_faculty_scheduling.md", title: "University Faculty Workload & Classroom Timetable Optimizer", department: "Registrar Operations", function: "Faculty Scheduling", keywords: ["faculty scheduling", "timetable optimization", "room allocation", "conflict resolution"], tech: ["Constraint Programming", "Python"], roi: "200%", time: "3 Months", cost: "$170,000" },
      { file: "16_research_knowledge_assistant.md", title: "Academic Literature Search & Grant Proposal AI Assistant", department: "Research & Development", function: "Research Knowledge Assistant", keywords: ["research assistant", "literature review", "grant proposal", "citation search", "rag"], tech: ["Vector Search", "Pinecone", "FastAPI"], roi: "250%", time: "4 Months", cost: "$230,000" },
      { file: "17_campus_security_analytics.md", title: "Campus Public Safety & Perimeter Video Telemetry AI", department: "Campus Safety", function: "Campus Security Analytics", keywords: ["campus security", "video telemetry", "license plate recognition", "perimeter alert"], tech: ["YOLOv8", "RTSP Streaming", "C++"], roi: "210%", time: "4 Months", cost: "$260,000" },
      { file: "18_digital_library_search.md", title: "University Digital Library RAG Vector Search Engine", department: "Library Services", function: "Digital Library Search", keywords: ["digital library", "rag search", "pdf parser", "academic archives"], tech: ["OpenAI Embeddings", "MongoDB Atlas", "React"], roi: "230%", time: "3 Months", cost: "$160,000" },
      { file: "19_placement_prediction.md", title: "Career Services Graduate Placement & Employer Matching Model", department: "Career Placement", function: "Placement Prediction", keywords: ["placement prediction", "graduate employment", "skill matching", "salary forecast"], tech: ["XGBoost", "LinkedIn API", "Python"], roi: "240%", time: "3 Months", cost: "$180,000" },
      { file: "20_personalized_learning.md", title: "K-12 Adaptive Socratic Tutoring & Learning Path Engine", department: "K-12 Instruction", function: "Personalized Learning Assistant", keywords: ["personalized learning", "socratic tutor", "adaptive textbook", "mastery score"], tech: ["LLM Socratic Agent", "React Native"], roi: "290%", time: "5 Months", cost: "$280,000" }
    ]
  },

  // 3. Energy
  {
    folder: "Energy",
    industry: "Energy & Utilities",
    docs: [
      { file: "11_smart_grid_intelligence.md", title: "Substation Smart Grid Load Balancing & Voltage Stability AI", department: "Grid Operations", function: "Smart Grid Intelligence", keywords: ["smart grid", "voltage stability", "substation", "scada", "load balancing"], tech: ["Deep Reinforcement Learning", "SCADA API", "Python"], roi: "340%", time: "7 Months", cost: "$580,000" },
      { file: "12_renewable_energy_forecasting.md", title: "Multi-Asset Solar Irradiance & Wind Generation Forecasting", department: "Renewables Generation", function: "Renewable Energy Forecasting", keywords: ["renewable forecasting", "solar irradiance", "wind power", "weather model"], tech: ["Gradient Boosting", "Satellite Weather API"], roi: "310%", time: "5 Months", cost: "$360,000" },
      { file: "13_wind_farm_optimization.md", title: "Wind Turbine Wake Effect Mitigation & Yaw Alignment Control", department: "Wind Operations", function: "Wind Farm Optimization", keywords: ["wind turbine", "wake effect", "yaw alignment", "scada control", "blade pitch"], tech: ["Reinforcement Learning", "IoT Sensors"], roi: "280%", time: "6 Months", cost: "$420,000" },
      { file: "14_solar_yield_prediction.md", title: "Photovoltaic Solar Panel Dust Inspection & Degradation Model", department: "Solar Generation", function: "Solar Yield Prediction", keywords: ["solar yield", "pv panel", "soiling loss", "thermal camera", "drone inspection"], tech: ["Computer Vision", "YOLOv8", "Python"], roi: "260%", time: "4 Months", cost: "$250,000" },
      { file: "15_utility_asset_inspection.md", title: "High-Voltage Transmission Line Drone Vision Inspection", department: "Asset Inspection", function: "Utility Asset Inspection", keywords: ["transmission line", "drone vision", "insulator defect", "vegetation encroachment"], tech: ["YOLOv8", "GIS Mapping", "PyTorch"], roi: "290%", time: "5 Months", cost: "$340,000" },
      { file: "16_transformer_failure_prediction.md", title: "Electrical Substation Transformer Dissolved Gas Analysis AI", department: "Substation Maintenance", function: "Transformer Failure Prediction", keywords: ["transformer failure", "dga", "dissolved gas", "oil sensor", "substation"], tech: ["LSTM Autoencoders", "TimescaleDB"], roi: "330%", time: "5 Months", cost: "$390,000" },
      { file: "17_energy_demand_forecasting.md", title: "Regional Wholesale Peak Electrical Demand & Tariff Forecasting", department: "Power Supply Planning", function: "Energy Demand Forecasting", keywords: ["demand forecasting", "peak load", "tariff model", "megawatt demand"], tech: ["Prophet", "LSTM", "InfluxDB"], roi: "300%", time: "5 Months", cost: "$310,000" },
      { file: "18_carbon_emission_analytics.md", title: "Continuous Emission Monitoring Systems (CEMS) Carbon Tracker", department: "Environmental Compliance", function: "Carbon Emission Analytics", keywords: ["carbon emission", "cems", "ghg tracking", "epa compliance", "smokestack"], tech: ["CEMS Pipeline", "Python", "Tableau API"], roi: "220%", time: "3 Months", cost: "$190,000" },
      { file: "19_water_distribution_optimization.md", title: "Municipal Water Distribution Hydraulic Pressure & Leak AI", department: "Water Utility", function: "Water Distribution Optimization", keywords: ["water leak", "hydraulic pressure", "non-revenue water", "pipe burst"], tech: ["Hydraulic Modeling", "Python", "PostgreSQL"], roi: "250%", time: "4 Months", cost: "$270,000" },
      { file: "20_smart_meter_intelligence.md", title: "AMI Smart Meter Non-Technical Loss & Theft Detection", department: "Revenue Protection", function: "Smart Meter Intelligence", keywords: ["smart meter", "electricity theft", "meter bypass", "non-technical loss"], tech: ["Isolation Forest", "AMI Telemetry API"], roi: "270%", time: "4 Months", cost: "$280,000" }
    ]
  },

  // 4. Finance
  {
    folder: "Finance",
    industry: "Finance & Accounting",
    docs: [
      { file: "11_financial_planning_copilot.md", title: "Enterprise FP&A Scenario Simulation & Revenue Planning Copilot", department: "FP&A", function: "Financial Planning Copilot", keywords: ["fp&a", "revenue planning", "scenario simulation", "ebitda forecast", "budget copilot"], tech: ["LLM Assistant", "Monte Carlo Simulation", "Python"], roi: "290%", time: "5 Months", cost: "$350,000" },
      { file: "12_budget_forecasting.md", title: "Rolling Multi-Subsidiary Operating Budget Variance Forecasting", department: "Corporate Controller", function: "Budget Forecasting", keywords: ["budget forecasting", "variance analysis", "operating expense", "general ledger"], tech: ["Prophet", "SAP ERP API", "PostgreSQL"], roi: "260%", time: "4 Months", cost: "$270,000" },
      { file: "13_working_capital_optimization.md", title: "Cash Conversion Cycle & Working Capital Yield Optimization", department: "Treasury Operations", function: "Working Capital Optimization", keywords: ["working capital", "cash conversion cycle", "dso", "dpo", "liquidity yield"], tech: ["Linear Programming", "Python", "Snowflake"], roi: "310%", time: "5 Months", cost: "$380,000" },
      { file: "14_expense_intelligence.md", title: "Corporate Card Receipt Policy Audit & Duplicate Claim AI", department: "Corporate Audit", function: "Expense Intelligence", keywords: ["expense audit", "concur", "receipt ocr", "duplicate claim", "policy compliance"], tech: ["Vision AI", "SAP Concur API", "FastAPI"], roi: "240%", time: "3 Months", cost: "$210,000" },
      { file: "15_procurement_analytics.md", title: "Strategic Procurement Spend Cube Analytics & Supplier Renegotiation", department: "Procurement", function: "Procurement Analytics", keywords: ["procurement analytics", "spend cube", "supplier risk", "vendor negotiation"], tech: ["NLP Categorization", "PostgreSQL", "Tableau"], roi: "230%", time: "4 Months", cost: "$230,000" },
      { file: "16_cfo_decision_assistant.md", title: "Executive CFO Strategic M&A & Capital Allocation Assistant", department: "CFO Suite", function: "CFO Decision Assistant", keywords: ["cfo assistant", "m&a valuation", "capital allocation", "irr model", "executive dashboard"], tech: ["LLM Copilot", "FastAPI", "React"], roi: "330%", time: "5 Months", cost: "$420,000" },
      { file: "17_cost_optimization.md", title: "Cross-Departmental Operating Expense Reduction Intelligence", department: "Operations Excellence", function: "Cost Optimization", keywords: ["cost optimization", "opex reduction", "headcount cost", "saas spend audit"], tech: ["Isolation Forest", "Python", "Snowflake"], roi: "270%", time: "4 Months", cost: "$260,000" },
      { file: "18_financial_compliance_ai.md", title: "Automated Sarbanes-Oxley (SOX) Internal Controls Audit Engine", department: "Internal Audit", function: "Financial Compliance AI", keywords: ["sox audit", "internal controls", "financial compliance", "audit trail", "general ledger"], tech: ["LLM Audit Parser", "PostgreSQL"], roi: "280%", time: "4 Months", cost: "$290,000" },
      { file: "19_revenue_leakage_detection.md", title: "Enterprise Billing Contract Audit & Revenue Leakage AI", department: "Revenue Operations", function: "Revenue Leakage Detection", keywords: ["revenue leakage", "contract audit", "billing dispute", "unbilled revenue"], tech: ["Regex Parser", "Python", "FastAPI"], roi: "320%", time: "4 Months", cost: "$310,000" },
      { file: "20_business_performance_analytics.md", title: "Executive EBITDA Drivers & Balanced Scorecard Analytics", department: "Corporate Strategy", function: "Business Performance Analytics", keywords: ["ebitda drivers", "balanced scorecard", "kpi tracking", "business intelligence"], tech: ["Databricks", "Tableau API", "Python"], roi: "250%", time: "4 Months", cost: "$240,000" }
    ]
  },

  // 5. Government
  {
    folder: "Government",
    industry: "Government & Public Sector",
    docs: [
      { file: "11_smart_city_platform.md", title: "Urban IoT Smart City Infrastructure Operations Center", department: "Smart City Management", function: "Smart City Platform", keywords: ["smart city", "urban iot", "city operations", "environmental sensor", "traffic camera"], tech: ["IoT Platform", "TimescaleDB", "React"], roi: "280%", time: "8 Months", cost: "$650,000" },
      { file: "12_tax_fraud_detection.md", title: "Corporate & Personal Income Tax Audit Anomaly Detection", department: "Department of Revenue", function: "Tax Fraud Detection", keywords: ["tax fraud", "underreporting", "tax audit", "revenue anomaly", "tax return"], tech: ["XGBoost", "PostgreSQL", "Python"], roi: "350%", time: "6 Months", cost: "$480,000" },
      { file: "13_citizen_service_copilot.md", title: "Multilingual 311 Municipal Citizen Query Assistant", department: "Citizen Services", function: "Citizen Service Copilot", keywords: ["311 chatbot", "citizen service", "municipal bot", "multilingual ai", "public portal"], tech: ["LLM Chatbot", "Twilio SMS", "Node.js"], roi: "250%", time: "4 Months", cost: "$220,000" },
      { file: "14_digital_permit_processing.md", title: "Commercial Building Blueprint & Zoning Permit Review AI", department: "Building & Planning", function: "Digital Permit Processing", keywords: ["building permit", "zoning review", "blueprint parser", "cad compliance"], tech: ["Computer Vision", "LLM Parser", "FastAPI"], roi: "290%", time: "5 Months", cost: "$360,000" },
      { file: "15_traffic_intelligence.md", title: "Metropolitan Traffic Signal Optimization & Congestion AI", department: "Department of Transportation", function: "Traffic Intelligence", keywords: ["traffic signal", "congestion control", "intersection camera", "smart traffic"], tech: ["YOLOv8", "SUMO Simulation", "C++"], roi: "240%", time: "6 Months", difficulty: "High", cost: "$410,000" },
      { file: "16_disaster_response_ai.md", title: "Emergency Management Natural Disaster Satellite Triage AI", department: "Emergency Management", function: "Disaster Response AI", keywords: ["disaster response", "satellite imagery", "flood mapping", "first responder triage"], tech: ["PyTorch", "GIS API", "Python"], roi: "310%", time: "5 Months", cost: "$390,000" },
      { file: "17_welfare_distribution_analytics.md", title: "Public Assistance Program Eligibility Verification & Fraud Detection", department: "Human Services", function: "Welfare Distribution Analytics", keywords: ["welfare fraud", "snap benefits", "eligibility verification", "synthetic identity"], tech: ["Graph Neural Networks", "Python"], roi: "330%", time: "5 Months", cost: "$370,000" },
      { file: "18_public_procurement_monitoring.md", title: "Government Vendor Bidding Audit & Anti-Collusion Analytics", department: "Inspector General Office", function: "Public Procurement Monitoring", keywords: ["procurement audit", "bid rigging", "vendor collusion", "public contract"], tech: ["Network Graph AI", "PostgreSQL"], roi: "300%", time: "5 Months", cost: "$340,000" },
      { file: "19_crime_pattern_analytics.md", title: "Municipal Public Safety Spatial Hotspot & Resource Allocation", department: "Police Operations", function: "Crime Pattern Analytics", keywords: ["crime analytics", "spatial hotspot", "patrol allocation", "public safety"], tech: ["Spatial Statistics", "Python", "Mapbox"], roi: "220%", time: "4 Months", cost: "$260,000" },
      { file: "20_urban_planning_intelligence.md", title: "City Population Growth & Infrastructure Zoning Simulation", department: "Urban Planning", function: "Urban Planning Intelligence", keywords: ["urban planning", "zoning simulation", "population density", "transit planning"], tech: ["Monte Carlo Simulation", "Three.js"], roi: "230%", time: "5 Months", cost: "$290,000" }
    ]
  },

  // 6. Healthcare
  {
    folder: "Healthcare",
    industry: "Healthcare & Life Sciences",
    docs: [
      { file: "11_hospital_bed_prediction.md", title: "Inpatient Bed Occupancy & Emergency Overflow Forecasting", department: "Hospital Administration", function: "Hospital Bed Prediction", keywords: ["bed prediction", "inpatient capacity", "discharge forecasting", "emergency overflow"], tech: ["Gradient Boosting", "SIMUL8", "Epic API"], roi: "260%", time: "5 Months", cost: "$320,000" },
      { file: "12_icu_capacity_planning.md", title: "Intensive Care Unit (ICU) Patient Deterioration & Length-of-Stay AI", department: "ICU & Critical Care", function: "ICU Capacity Planning", keywords: ["icu capacity", "patient deterioration", "vitals monitoring", "length of stay"], tech: ["Random Forest", "HL7 FHIR Streaming", "Kafka"], roi: "340%", time: "6 Months", cost: "$460,000" },
      { file: "13_medical_imaging_ai.md", title: "Multi-Modal Diagnostic X-Ray & MRI Triage Computer Vision", department: "Radiology", function: "Medical Imaging AI", keywords: ["medical imaging", "dicom", "x-ray vision", "mri anomaly", "tumor triage"], tech: ["Convolutional Neural Networks", "DICOM", "PyTorch"], roi: "310%", time: "7 Months", cost: "$510,000" },
      { file: "14_clinical_decision_support.md", title: "Real-Time Sepsis Early Warning & Clinical Protocol Alert System", department: "Clinical Operations", function: "Clinical Decision Support", keywords: ["sepsis warning", "clinical decision support", "vitals alert", "ehr integration"], tech: ["LightGBM", "Epic FHIR API", "FastAPI"], roi: "360%", time: "6 Months", cost: "$490,000" },
      { file: "15_hospital_resource_optimization.md", title: "Operating Room Staffing & Surgical Instrument Batching AI", department: "Surgical Services", function: "Hospital Resource Optimization", keywords: ["or optimization", "surgical staffing", "instrument sterilization", "operating room"], tech: ["Constraint Programming", "Python"], roi: "270%", time: "4 Months", cost: "$280,000" },
      { file: "16_patient_flow_prediction.md", title: "Outpatient Clinic Waiting Room & Ambulatory Care Triage", department: "Outpatient Care", function: "Patient Flow Prediction", keywords: ["patient flow", "clinic wait time", "ambulatory triage", "appointment pacing"], tech: ["XGBoost", "Cerner API", "React"], roi: "230%", time: "4 Months", cost: "$230,000" },
      { file: "17_insurance_authorization_automation.md", title: "Automated Clinical Prior Authorization EDI 278 Engine", department: "Revenue Cycle", function: "Insurance Authorization Automation", keywords: ["prior authorization", "edi 278", "claims denial", "clinical necessity"], tech: ["LLM Parser", "RPA", "EDI 278 Engine"], roi: "320%", time: "5 Months", cost: "$380,000" },
      { file: "18_medical_inventory_optimization.md", title: "High-Value Pharmaceutical & Medical Supplies Stockout AI", department: "Hospital Pharmacy", function: "Medical Inventory Optimization", keywords: ["pharmacy inventory", "medical supply", "stockout prevention", "pyxis integration"], tech: ["DeepAR", "PostgreSQL"], roi: "210%", time: "4 Months", cost: "$190,000" },
      { file: "19_surgery_scheduling.md", title: "Elective Surgery Block Scheduling & Anesthesia Slot Optimizer", department: "Surgery Operations", function: "Surgery Scheduling", keywords: ["surgery scheduling", "or block time", "anesthesia slot", "surgeon availability"], tech: ["Genetic Algorithms", "Python"], roi: "250%", time: "4 Months", cost: "$260,000" },
      { file: "20_ai_hospital_operations_center.md", title: "Hospital Enterprise Command Center Live Operational Telemetry", department: "Executive Operations", function: "AI Hospital Operations Center", keywords: ["hospital command center", "telemetry dashboard", "ed crowding", "bed management"], tech: ["React", "Kafka", "TimescaleDB"], roi: "290%", time: "6 Months", cost: "$430,000" }
    ]
  },

  // 7. Hospitality
  {
    folder: "Hospitality",
    industry: "Hospitality & Tourism",
    docs: [
      { file: "11_dynamic_hotel_pricing.md", title: "Automated Hotel Room Dynamic Rate & Yield Optimization Engine", department: "Revenue Management", function: "Dynamic Hotel Pricing", keywords: ["hotel pricing", "dynamic rate", "revpar", "yield management", "occupancy forecast"], tech: ["XGBoost", "Opera PMS API", "Python"], roi: "320%", time: "4 Months", cost: "$290,000" },
      { file: "12_guest_experience_personalization.md", title: "Luxury Resort Guest Preferences & Amenity Recommendation", department: "Guest Relations", function: "Guest Experience Personalization", keywords: ["guest personalization", "resort amenities", "spa recommendation", "guest profile"], tech: ["Collaborative Filtering", "Opera PMS API"], roi: "240%", time: "3 Months", cost: "$210,000" },
      { file: "13_restaurant_demand_forecasting.md", title: "Hotel F&B Daily Covers & Ingredient Spoilage Forecasting", department: "Food & Beverage", function: "Restaurant Demand Forecasting", keywords: ["f&b forecasting", "restaurant covers", "food waste", "ingredient order"], tech: ["Time-Series Analytics", "PostgreSQL"], roi: "210%", time: "3 Months", cost: "$170,000" },
      { file: "14_hotel_revenue_optimization.md", title: "RevPAR Optimization & Group Booking Discount Evaluator", department: "Sales & Revenue", function: "Hotel Revenue Optimization", keywords: ["revpar", "group booking", "convention discount", "ancillary revenue"], tech: ["Linear Programming", "Python"], roi: "280%", time: "4 Months", cost: "$260,000" },
      { file: "15_ai_concierge.md", title: "24/7 Multilingual Guest WhatsApp Digital AI Concierge", department: "Front Desk", function: "AI Concierge", keywords: ["ai concierge", "guest chatbot", "whatsapp bot", "multilingual concierge"], tech: ["LLM Assistant", "Twilio API", "Node.js"], roi: "260%", time: "3 Months", cost: "$180,000" },
      { file: "16_housekeeping_scheduling.md", title: "Smart Housekeeping Turnover Route & Room Inspection AI", department: "Housekeeping", function: "Housekeeping Scheduling", keywords: ["housekeeping scheduling", "room turnover", "pms status", "inspection app"], tech: ["Optimization Algorithm", "React Native"], roi: "200%", time: "3 Months", cost: "$160,000" },
      { file: "17_event_planning_intelligence.md", title: "Convention Center Banquet Space Allocation & Catering AI", department: "Event Sales", function: "Event Planning Intelligence", keywords: ["event planning", "banquet space", "catering order", "convention booking"], tech: ["FastAPI", "React", "PostgreSQL"], roi: "220%", time: "3 Months", cost: "$190,000" },
      { file: "18_hotel_maintenance_prediction.md", title: "Resort HVAC & Elevator Predictive Maintenance Sensor AI", department: "Engineering & Facilities", function: "Hotel Maintenance Prediction", keywords: ["hotel maintenance", "hvac sensor", "elevator predictive", "building management"], tech: ["BACnet API", "InfluxDB"], roi: "230%", time: "4 Months", cost: "$220,000" },
      { file: "19_food_waste_reduction.md", title: "Commercial Kitchen Buffet Food Waste & Portion Control Analytics", department: "Culinary Operations", function: "Food Waste Reduction", keywords: ["food waste", "buffet portion", "kitchen waste", "sustainability"], tech: ["Computer Vision", "Python"], roi: "190%", time: "3 Months", cost: "$140,000" },
      { file: "20_customer_sentiment_analytics.md", title: "Online Travel Agency (OTA) Review Sentiment & Brand Reputation", department: "Brand Marketing", function: "Customer Sentiment Analytics", keywords: ["review sentiment", "tripadvisor", "google reviews", "reputation management"], tech: ["BERT Sentiment Analysis", "Web Scraper"], roi: "180%", time: "2 Months", cost: "$120,000" }
    ]
  },

  // 8. HR
  {
    folder: "HR",
    industry: "Human Resources & Talent Management",
    docs: [
      { file: "11_talent_acquisition_copilot.md", title: "ATS Candidate Experience Ranking & Resume Parser Copilot", department: "Talent Acquisition", function: "Talent Acquisition Copilot", keywords: ["resume parser", "ats screening", "candidate ranking", "recruitment copilot"], tech: ["NER", "Sentence Transformers", "Workday API"], roi: "270%", time: "3 Months", cost: "$230,000" },
      { file: "12_interview_intelligence.md", title: "Asynchronous Video Interview Sentiment & Competency Scorer", department: "Talent Assessment", function: "Interview Intelligence", keywords: ["interview intelligence", "video interview", "competency scoring", "sentiment analysis"], tech: ["Whisper AI", "OpenCV", "Python"], roi: "230%", time: "4 Months", cost: "$240,000" },
      { file: "13_internal_mobility_prediction.md", title: "Corporate Internal Job Matching & Stretch Assignment AI", department: "Internal Mobility", function: "Internal Mobility Prediction", keywords: ["internal mobility", "gig marketplace", "stretch assignment", "skill matching"], tech: ["Vector Embeddings", "FastAPI", "React"], roi: "260%", time: "4 Months", cost: "$220,000" },
      { file: "14_employee_skill_mapping.md", title: "Enterprise Skill Taxonomy & Workforce Gap Matrix", department: "L&D", function: "Employee Skill Mapping", keywords: ["skill mapping", "skill taxonomy", "workforce gap", "upskilling matrix"], tech: ["NLP Categorization", "PostgreSQL"], roi: "220%", time: "3 Months", cost: "$180,000" },
      { file: "15_succession_planning.md", title: "Executive Succession Planning & High-Potential Identification", department: "Talent Management", function: "Succession Planning", keywords: ["succession planning", "hipo identification", "executive pipeline", "nine box"], tech: ["Decision Trees", "Tableau API"], roi: "250%", time: "4 Months", cost: "$250,000" },
      { file: "16_workforce_cost_optimization.md", title: "Global Headcount Expense Simulation & Overtime Audit", department: "HR Operations", function: "Workforce Cost Optimization", keywords: ["headcount cost", "overtime audit", "workforce expense", "payroll simulation"], tech: ["Monte Carlo Simulation", "Anaplan API"], roi: "290%", time: "4 Months", cost: "$270,000" },
      { file: "17_learning_recommendation_engine.md", title: "Personalized Corporate L&D Upskilling Recommendation Engine", department: "Learning & Development", function: "Learning Recommendation Engine", keywords: ["l&d recommendations", "upskilling", "coursera integration", "course pathway"], tech: ["Collaborative Filtering", "Python"], roi: "210%", time: "3 Months", cost: "$170,000" },
      { file: "18_hr_knowledge_assistant.md", title: "Employee Self-Service Benefits & Policy RAG Assistant", department: "HR Shared Services", function: "HR Knowledge Assistant", keywords: ["hr assistant", "benefits bot", "pto policy", "rag search", "workday bot"], tech: ["RAG Search", "Workday API", "Node.js"], roi: "240%", time: "3 Months", cost: "$160,000" },
      { file: "19_employee_wellness_analytics.md", title: "Organizational Burnout Risk & EAP Program Analytics", department: "People Analytics", function: "Employee Wellness Analytics", keywords: ["burnout risk", "wellness analytics", "eap usage", "workplace stress"], tech: ["Sentiment Analysis", "Python"], roi: "200%", time: "3 Months", cost: "$150,000" },
      { file: "20_leadership_potential_prediction.md", title: "Management Assessment & Promotional Readiness Predictive AI", department: "Leadership Development", function: "Leadership Potential Prediction", keywords: ["leadership potential", "promotional readiness", "manager scoring", "360 feedback"], tech: ["Random Forest", "Lattice API"], roi: "230%", time: "4 Months", cost: "$210,000" }
    ]
  },

  // 9. Insurance
  {
    folder: "Insurance",
    industry: "Insurance & Underwriting",
    docs: [
      { file: "11_claims_fraud_detection.md", title: "Special Investigation Unit (SIU) Auto & Property Fraud Ring AI", department: "SIU Fraud Operations", function: "Claims Fraud Detection", keywords: ["claims fraud", "siu fraud ring", "staged accident", "inflated claim", "fraud network"], tech: ["Graph Neural Networks", "Python", "Elasticsearch"], roi: "360%", time: "6 Months", cost: "$490,000" },
      { file: "12_ai_underwriting.md", title: "Automated Commercial Property & Casualty Risk Underwriting", department: "Commercial Underwriting", function: "AI Underwriting", keywords: ["ai underwriting", "p&c risk", "loss run parser", "bind rate", "guidewire"], tech: ["LLM Document Parser", "Guidewire API"], roi: "290%", time: "5 Months", cost: "$370,000" },
      { file: "13_policy_recommendation.md", title: "Personal Lines Umbrella & Bundle Policy Recommendation Engine", department: "Marketing & Distribution", function: "Policy Recommendation", keywords: ["policy recommendation", "bundle discount", "umbrella policy", "cross-sell"], tech: ["Two-Tower Model", "Salesforce API"], roi: "230%", time: "3 Months", cost: "$210,000" },
      { file: "14_customer_risk_scoring.md", title: "Life & Health Policyholder Risk Rating & Medical History Parser", department: "Life Underwriting", function: "Customer Risk Scoring", keywords: ["customer risk scoring", "life insurance", "medical history", "underwriting rating"], tech: ["BioBERT", "FastAPI", "PostgreSQL"], roi: "270%", time: "4 Months", cost: "$290,000" },
      { file: "15_catastrophe_prediction.md", title: "Climate Change Satellite Geospatial Flood & Hurricane Loss AI", department: "Actuarial Science", function: "Catastrophe Prediction", keywords: ["catastrophe modeling", "flood loss", "geospatial risk", "satellite imagery"], tech: ["GIS Mapping API", "PyTorch"], roi: "310%", time: "6 Months", cost: "$440,000" },
      { file: "16_vehicle_damage_assessment.md", title: "Smartphone Photo Auto Accident Repair Cost Estimation Vision AI", department: "Auto Claims", function: "Vehicle Damage Assessment", keywords: ["vehicle damage", "auto claim vision", "repair estimate", "photo appraisal"], tech: ["YOLOv8", "Vision AI", "Guidewire API"], roi: "330%", time: "5 Months", cost: "$380,000" },
      { file: "17_medical_claim_automation.md", title: "Health Insurance Claim Adjudication & ICD-10 Coding Audit", department: "Health Claims", function: "Medical Claim Automation", keywords: ["medical claim", "adjudication", "icd-10 audit", "cpt verification"], tech: ["LLM Parser", "PostgreSQL"], roi: "280%", time: "4 Months", cost: "$310,000" },
      { file: "18_insurance_knowledge_copilot.md", title: "Independent Agency Policy Coverage Comparison Assistant", department: "Agency Support", function: "Insurance Knowledge Copilot", keywords: ["insurance copilot", "policy comparison", "carrier quoting", "agency assistant"], tech: ["RAG Engine", "FastAPI", "React"], roi: "220%", time: "3 Months", cost: "$180,000" },
      { file: "19_customer_lifetime_value.md", title: "Policyholder Retention & Premium Elasticity CLV Model", department: "Actuarial Marketing", function: "Customer Lifetime Value", keywords: ["clv", "policyholder retention", "premium elasticity", "churn prevention"], tech: ["Survival Analysis", "Python"], roi: "250%", time: "4 Months", cost: "$230,000" },
      { file: "20_renewal_prediction.md", title: "Property & Casualty Annual Policy Lapse & Winback Campaign AI", department: "Retention Marketing", function: "Renewal Prediction", keywords: ["policy renewal", "lapse prediction", "winback campaign", "rate increase"], tech: ["Logistic Regression", "HubSpot API"], roi: "240%", time: "3 Months", cost: "$190,000" }
    ]
  },

  // 10. IT
  {
    folder: "IT",
    industry: "Information Technology & Software Services",
    docs: [
      { file: "11_devops_intelligence.md", title: "Autonomous CI/CD Pipeline Build Failure & Release Gate AI", department: "DevOps Engineering", function: "DevOps Intelligence", keywords: ["devops intelligence", "ci/cd gate", "build failure", "github actions", "docker"], tech: ["LLM Code Parser", "GitHub Actions API"], roi: "310%", time: "4 Months", cost: "$290,000" },
      { file: "12_kubernetess_optimization.md", title: "Kubernetes Pod Resource Rightsizing & Cloud Cost Optimization", department: "Infrastructure", function: "Kubernetes Optimization", keywords: ["kubernetes optimization", "pod rightsizing", "cluster autoscaling", "k8s cost"], tech: ["Prometheus", "Kubecost API", "Go"], roi: "280%", time: "4 Months", cost: "$250,000" },
      { file: "13_cloud_cost_analytics.md", title: "Multi-Cloud FinOps AWS / Azure Unused Resource Reclamation Engine", department: "FinOps Operations", function: "Cloud Cost Analytics", keywords: ["finops", "cloud cost", "aws cost", "azure savings", "unallocated spend"], tech: ["AWS Cost Explorer API", "Python"], roi: "340%", time: "3 Months", cost: "$220,000" },
      { file: "14_api_monitoring.md", title: "API Gateway Latency Anomaly & Distributed Tracing Analytics", department: "Platform Engineering", function: "API Monitoring", keywords: ["api monitoring", "latency anomaly", "kong gateway", "distributed tracing"], tech: ["OpenTelemetry", "Elasticsearch", "Grafana"], roi: "260%", time: "4 Months", cost: "$240,000" },
      { file: "15_ai_code_review.md", title: "Automated Pull Request OWASP Vulnerability & Code Style Review Bot", department: "AppSec", function: "AI Code Review", keywords: ["code review bot", "owasp vulnerability", "sast", "pull request review"], tech: ["LLM Code Parser", "GitHub API", "Python"], roi: "290%", time: "3 Months", cost: "$210,000" },
      { file: "16_security_operations_copilot.md", title: "Autonomous SOC Phishing Sandbox & Threat Isolation Agent", department: "Cybersecurity SOC", function: "Security Operations Copilot", keywords: ["soc copilot", "phishing sandbox", "soar", "threat isolation", "malware analysis"], tech: ["Cortex SOAR API", "Python"], roi: "350%", time: "5 Months", cost: "$410,000" },
      { file: "17_release_risk_prediction.md", title: "Software Release Code Churn & Production Outage Probability", department: "Quality Assurance", function: "Release Risk Prediction", keywords: ["release risk", "code churn", "outage probability", "deployment gate"], tech: ["Random Forest", "Jira API", "Python"], roi: "250%", time: "3 Months", cost: "$190,000" },
      { file: "18_incident_root_cause_ai.md", title: "Microservices OpenTelemetry Distributed Tracing Root Cause Engine", department: "SRE", function: "Incident Root Cause AI", keywords: ["root cause ai", "opentelemetry", "microservices trace", "datadog", "rca"], tech: ["Causal Graph AI", "Elasticsearch"], roi: "330%", time: "5 Months", cost: "$380,000" },
      { file: "19_software_quality_prediction.md", title: "Software Engineering Defect Density & Technical Debt AI", department: "Software Engineering", function: "Software Quality Prediction", keywords: ["software quality", "defect density", "technical debt", "sonarqube"], tech: ["SonarQube API", "Python", "Tableau"], roi: "220%", time: "3 Months", cost: "$170,000" },
      { file: "20_enterprise_knowledge_assistant.md", title: "Internal Confluence & Runbook RAG Diagnostic Assistant", department: "Knowledge Management", function: "Enterprise Knowledge Assistant", keywords: ["enterprise knowledge", "confluence rag", "runbook assistant", "internal wiki"], tech: ["Vector Search", "OpenAI Embeddings", "React"], roi: "270%", time: "3 Months", cost: "$180,000" }
    ]
  },

  // 11. Legal
  {
    folder: "Legal",
    industry: "Legal & Corporate Compliance",
    docs: [
      { file: "11_ai_contract_review.md", title: "Commercial Vendor Contract Risk Scoring & Liability Clause Audit", department: "Legal Operations", function: "AI Contract Review", keywords: ["contract review", "liability cap", "indemnification", "legal risk scoring"], tech: ["LegalBERT", "LLM Parser", "FastAPI"], roi: "320%", time: "4 Months", cost: "$310,000" },
      { file: "12_due_diligence_automation.md", title: "M&A Virtual Data Room Document Auditing & Change-of-Control AI", department: "M&A Legal Practice", function: "Due Diligence Automation", keywords: ["due diligence", "virtual data room", "m&a audit", "change of control"], tech: ["LLM Multi-Doc Parser", "Python"], roi: "340%", time: "4 Months", cost: "$380,000" },
      { file: "13_legal_research_assistant.md", title: "Judicial Case Law & Court Opinion RAG Vector Search Engine", department: "Litigation Practice", function: "Legal Research Assistant", keywords: ["legal research", "case law", "court opinion", "rag search", "precedent"], tech: ["Vector Search", "Pinecone", "FastAPI"], roi: "290%", time: "4 Months", cost: "$270,000" },
      { file: "14_compliance_monitoring.md", title: "Global Regulatory Change Tracking & Statutory Compliance Briefs", department: "Regulatory Compliance", function: "Compliance Monitoring", keywords: ["compliance monitoring", "gdpr", "statutory update", "regulatory brief"], tech: ["Web Scraping", "LLM Summarizer"], roi: "240%", time: "3 Months", cost: "$190,000" },
      { file: "15_litigation_intelligence.md", title: "Court Case Outcome Probability & Damages Settlement Analytics", department: "Litigation Management", function: "Litigation Intelligence", keywords: ["litigation intelligence", "settlement analytics", "win probability", "case damages"], tech: ["XGBoost", "Python"], roi: "280%", time: "5 Months", cost: "$330,000" },
      { file: "16_clause_extraction.md", title: "Legal Playbook Key Clause Extraction & Expiration Date Parser", department: "Corporate Governance", function: "Clause Extraction", keywords: ["clause extraction", "governing law", "termination notice", "contract playbook"], tech: ["NER", "PostgreSQL"], roi: "230%", time: "3 Months", cost: "$160,000" },
      { file: "17_privacy_compliance.md", title: "GDPR / CCPA Data Subject Access Request Auto-Redaction Engine", department: "Data Privacy", function: "Privacy Compliance", keywords: ["privacy compliance", "dsar", "gdpr redaction", "pii masking"], tech: ["Auto-Redaction Engine", "Python"], roi: "270%", time: "4 Months", cost: "$240,000" },
      { file: "18_regulatory_knowledge_search.md", title: "Corporate Governance Statute & Legal Opinion Assistant", department: "General Counsel Office", function: "Regulatory Knowledge Search", keywords: ["legal search", "statute search", "corporate governance", "legal memo"], tech: ["RAG Engine", "React", "PostgreSQL"], roi: "250%", time: "3 Months", cost: "$180,000" },
      { file: "19_corporate_governance_ai.md", title: "Board Resolution & Shareholder Meeting Compliance Tracker", department: "Corporate Secretary", function: "Corporate Governance AI", keywords: ["corporate governance", "board resolution", "shareholder proxy", "sec filing"], tech: ["LLM Parser", "Node.js"], roi: "210%", time: "3 Months", cost: "$150,000" },
      { file: "20_legal_risk_analytics.md", title: "General Counsel Regulatory Enforcement & Class Action Risk Scoring", department: "Risk Governance", function: "Legal Risk Analytics", keywords: ["legal risk analytics", "class action risk", "sec enforcement", "litigation rating"], tech: ["Decision Trees", "Tableau API"], roi: "260%", time: "4 Months", cost: "$260,000" }
    ]
  },

  // 12. Logistics
  {
    folder: "Logistics",
    industry: "Logistics & Supply Chain",
    docs: [
      { file: "11_warehouse_robotics.md", title: "Autonomous Mobile Robot (AMR) Goods-to-Person Picking Path Optimizer", department: "Warehouse Robotics", function: "Warehouse Robotics", keywords: ["warehouse robotics", "amr routing", "goods to person", "wms", "picking path"], tech: ["Pathfinding Algorithms", "ROS2", "C++"], roi: "310%", time: "6 Months", cost: "$490,000" },
      { file: "12_packaging_line_optimization.md", title: "Automated Carton Sizing & 3D Packing Cube Utilization AI", department: "Packaging Operations", function: "Packaging Line Optimization", keywords: ["carton sizing", "3d packing", "cube utilization", "dim weight"], tech: ["3D Bin Packing Algorithm", "Three.js"], roi: "230%", time: "4 Months", cost: "$210,000" },
      { file: "13_parcel_routing_ai.md", title: "Express Parcel Sortation Center Destination Routing Engine", department: "Sortation Hubs", function: "Parcel Routing AI", keywords: ["parcel routing", "sortation center", "barcode scanner", "conveyor routing"], tech: ["Computer Vision", "MQTT", "Python"], roi: "270%", time: "5 Months", cost: "$340,000" },
      { file: "14_last_mile_optimization.md", title: "Dynamic Last-Mile Courier Dispatch & 15-Min Customer ETA AI", department: "Last Mile", function: "Last Mile Optimization", keywords: ["last mile optimization", "delivery eta", "courier dispatch", "driver routing"], tech: ["Google OR-Tools", "Mapbox API"], roi: "330%", time: "5 Months", cost: "$380,000" },
      { file: "15_dock_scheduling.md", title: "Freight Cross-Dock Door Assignment & Trailer Offloading AI", department: "Cross-Docking", function: "Dock Scheduling", keywords: ["dock scheduling", "door assignment", "trailer loading", "yard management"], tech: ["Linear Programming", "Python"], roi: "240%", time: "4 Months", cost: "$230,000" },
      { file: "16_fleet_maintenance_prediction.md", title: "Heavy Truck Engine Telematics & Brake Fault Predictive Maintenance", department: "Fleet Engineering", function: "Fleet Maintenance Prediction", keywords: ["fleet maintenance", "truck telematics", "eld diagnostic", "engine fault"], tech: ["LSTM", "IoT Telematics API", "InfluxDB"], roi: "290%", time: "5 Months", cost: "$310,000" },
      { file: "17_driver_safety_analytics.md", title: "Commercial Fleet Telematics In-Cab Camera Safety Scorer", department: "Fleet Safety", function: "Driver Safety Analytics", keywords: ["driver safety", "in-cab camera", "harsh braking", "fatigue detection"], tech: ["Vision AI", "Edge Computing"], roi: "220%", time: "4 Months", cost: "$260,000" },
      { file: "18_cold_chain_monitoring.md", title: "Pharmaceutical Refrigerated Transport Temperature Excursion Sensor AI", department: "Cold Chain Quality", function: "Cold Chain Monitoring", keywords: ["cold chain", "refrigerated container", "temperature excursion", "pharma transport"], tech: ["IoT Temperature Sensors", "Grafana"], roi: "320%", time: "4 Months", cost: "$270,000" },
      { file: "19_delivery_delay_prediction.md", title: "Global Freight Container Port Congestion & Demurrage Risk AI", department: "International Freight", function: "Delivery Delay Prediction", keywords: ["delivery delay", "port congestion", "demurrage risk", "ocean container"], tech: ["AIS Satellite API", "Random Forest"], roi: "260%", time: "4 Months", cost: "$250,000" },
      { file: "20_logistics_control_tower.md", title: "End-to-End Multimodal Supply Chain Control Tower Telemetry", department: "Global Operations", function: "Logistics Control Tower", keywords: ["logistics control tower", "supply chain visibility", "multimodal tracking", "exception management"], tech: ["Snowflake", "Kafka", "React"], roi: "340%", time: "6 Months", cost: "$520,000" }
    ]
  },

  // 13. Manufacturing
  {
    folder: "Manufacturing",
    industry: "Manufacturing",
    docs: [
      { file: "11_factory_digital_twin.md", title: "Industrial 3D Factory Simulation & Bottleneck Stress-Testing AI", department: "Plant Engineering", function: "Factory Digital Twin", keywords: ["digital twin", "factory simulation", "bottleneck analysis", "cad/cam"], tech: ["NVIDIA Omniverse", "IoT Telemetry", "Three.js"], roi: "310%", time: "7 Months", cost: "$540,000" },
      { file: "12_smart_quality_inspection.md", title: "High-Speed Edge Computer Vision Defect Inspection (60 FPS)", department: "Quality Control", function: "Smart Quality Inspection", keywords: ["quality inspection", "surface defect", "computer vision", "60 fps camera"], tech: ["YOLOv8", "NVIDIA Jetson", "TensorRT"], roi: "290%", time: "5 Months", cost: "$360,000" },
      { file: "13_machine_vision.md", title: "6-DOF Robotic Arm Bin Picking 3D Point Cloud Guidance Engine", department: "Robotics", function: "Machine Vision", keywords: ["machine vision", "bin picking", "6-dof pose", "robotic arm"], tech: ["3D Point Cloud", "Open3D", "ROS2"], roi: "280%", time: "6 Months", cost: "$410,000" },
      { file: "14_ai_production_scheduling.md", title: "Dynamic Shop-Floor Job Re-Sequencing & Work Order Scheduling", department: "Production Planning", function: "AI Production Scheduling", keywords: ["production scheduling", "shop floor", "work order", "mes", "changeover"], tech: ["Genetic Algorithms", "Constraint Programming"], roi: "260%", time: "5 Months", cost: "$290,000" },
      { file: "15_asset_health_monitoring.md", title: "Industrial Machine OPC-UA Telemetry & Live OEE Analytics", department: "Operations Excellence", function: "Asset Health Monitoring", keywords: ["asset health", "oee analytics", "opc-ua", "plc telemetry"], tech: ["OPC-UA", "TimescaleDB", "Grafana"], roi: "240%", time: "4 Months", cost: "$230,000" },
      { file: "16_robotics_optimization.md", title: "Weld & Paint Industrial Robot Motion Path & Cycle Time AI", department: "Automation Engineering", function: "Robotics Optimization", keywords: ["robotics optimization", "welding robot", "cycle time", "path planning"], tech: ["ROS2", "C++", "Python"], roi: "270%", time: "5 Months", cost: "$320,000" },
      { file: "17_factory_energy_optimization.md", title: "Heavy Industrial Plant HVAC & Arc Furnace Peak Shaving AI", department: "Facilities", function: "Factory Energy Optimization", keywords: ["factory energy", "peak shaving", "arc furnace", "hvac optimization"], tech: ["Reinforcement Learning", "BACnet API"], roi: "220%", time: "4 Months", cost: "$250,000" },
      { file: "18_predictive_yield_analytics.md", title: "Semiconductor & Chemical Process Batch Quality Yield Model", department: "Process Engineering", function: "Predictive Yield Analytics", keywords: ["yield analytics", "batch quality", "semiconductor yield", "spc"], tech: ["Deep Learning", "Python", "Databricks"], roi: "330%", time: "6 Months", cost: "$460,000" },
      { file: "19_industrial_safety_monitoring.md", title: "CCTV Factory Floor PPE Compliance & Ergonomic Hazard Detection", department: "EHS", function: "Industrial Safety Monitoring", keywords: ["industrial safety", "ppe compliance", "forklift hazard", "ergonomic strain"], tech: ["Vision AI", "Edge Computing", "RTSP"], roi: "210%", time: "4 Months", cost: "$210,000" },
      { file: "20_autonomous_factory_operations.md", title: "Dark Factory Cyber-Physical Systems Control Engine", department: "Smart Manufacturing", function: "Autonomous Factory Operations", keywords: ["autonomous factory", "dark factory", "cyber physical", "industry 4.0"], tech: ["ROS2", "MQTT", "Python", "Docker"], roi: "350%", time: "8 Months", cost: "$720,000" }
    ]
  },

  // 14. Real Estate
  {
    folder: "Real Estate",
    industry: "Real Estate & PropTech",
    docs: [
      { file: "11_smart_building_analytics.md", title: "Smart Commercial Real Estate HVAC & Lighting Occupancy Sensor AI", department: "Property Operations", function: "Smart Building Analytics", keywords: ["smart building", "occupancy sensor", "hvac control", "leed certification"], tech: ["Reinforcement Learning", "BACnet API", "TimescaleDB"], roi: "260%", time: "5 Months", cost: "$310,000" },
      { file: "12_tenant_experience_ai.md", title: "Commercial Property Tenant Portal & Service Request Bot", department: "Tenant Relations", function: "Tenant Experience AI", keywords: ["tenant portal", "service request", "facility helpdesk", "yardi"], tech: ["RAG Chatbot", "Yardi API", "React"], roi: "220%", time: "3 Months", cost: "$170,000" },
      { file: "13_lease_optimization.md", title: "Multi-Family Apartment Rental Rate Pricing & Lease Renewal AI", department: "Asset Management", function: "Lease Optimization", keywords: ["lease optimization", "apartment pricing", "rental rate", "occupancy rate"], tech: ["Random Forest", "Yardi API", "Python"], roi: "280%", time: "4 Months", cost: "$260,000" },
      { file: "14_property_maintenance_prediction.md", title: "Office Tower Elevator & Chiller Plant Predictive Maintenance", department: "Building Engineering", function: "Property Maintenance Prediction", keywords: ["property maintenance", "elevator predictive", "chiller plant", "bms sensor"], tech: ["IoT Telemetry", "InfluxDB"], roi: "240%", time: "4 Months", cost: "$230,000" },
      { file: "15_construction_cost_forecasting.md", title: "Commercial Construction Raw Material Inflation & Risk AI", department: "Construction Management", function: "Construction Cost Forecasting", keywords: ["construction cost", "material inflation", "bim model", "budget variance"], tech: ["Prophet", "Python", "Tableau"], roi: "230%", time: "4 Months", cost: "$210,000" },
      { file: "16_occupancy_intelligence.md", title: "Corporate Office Desk Utilization & Hybrid Workplace Planner", department: "Corporate Real Estate", function: "Occupancy Intelligence", keywords: ["occupancy intelligence", "desk utilization", "hybrid workplace", "space planning"], tech: ["Occupancy Sensors", "PostgreSQL", "React"], roi: "210%", time: "3 Months", cost: "$180,000" },
      { file: "17_energy_efficient_buildings.md", title: "Building Energy Star Rating & Carbon Footprint Reduction Engine", department: "Sustainability", function: "Energy Efficient Buildings", keywords: ["energy efficient building", "carbon footprint", "energy star", "ghg audit"], tech: ["Python", "Tableau API"], roi: "200%", time: "3 Months", cost: "$160,000" },
      { file: "18_property_recommendation_engine.md", title: "Commercial Real Estate Site Selection & Buyer Matchmaker", department: "Commercial Brokerage", function: "Property Recommendation Engine", keywords: ["site selection", "property recommendation", "cre matchmaker", "foot traffic"], tech: ["GIS Mapping API", "FastAPI"], roi: "270%", time: "4 Months", cost: "$240,000" },
      { file: "19_real_estate_portfolio_analytics.md", title: "REIT Investment Portfolio Cash Flow & Tenant Concentration Risk Model", department: "REIT Strategy", function: "Real Estate Portfolio Analytics", keywords: ["reit analytics", "portfolio cash flow", "tenant default risk", "irr"], tech: ["Monte Carlo Simulation", "Python"], roi: "300%", time: "5 Months", cost: "$350,000" },
      { file: "20_facility_management_ai.md", title: "Facility Operations Preventive Maintenance & Vendor Dispatch AI", department: "Facility Operations", function: "Facility Management AI", keywords: ["facility management", "vendor dispatch", "work order app", "preventive maintenance"], tech: ["FastAPI", "React Native", "PostgreSQL"], roi: "230%", time: "3 Months", cost: "$190,000" }
    ]
  },

  // 15. Retail
  {
    folder: "Retail",
    industry: "Retail & E-Commerce",
    docs: [
      { file: "11_smart_checkout.md", title: "Computer Vision Grab-and-Go Frictionless Store Checkout System", department: "Store Technology", function: "Smart Checkout", keywords: ["smart checkout", "grab and go", "frictionless retail", "sensor fusion"], tech: ["Multi-Camera Tracking", "Sensor Fusion", "C++"], roi: "290%", time: "8 Months", cost: "$620,000" },
      { file: "12_retail_shelf_analytics.md", title: "Overhead Fixed Camera Out-of-Stock Shelf Monitoring AI", department: "Store Operations", function: "Retail Shelf Analytics", keywords: ["shelf analytics", "out of stock", "planogram compliance", "shelf camera"], tech: ["YOLOv8", "Edge Computing", "Node.js"], roi: "250%", time: "4 Months", cost: "$240,000" },
      { file: "13_customer_basket_prediction.md", title: "E-Commerce Market Basket Analysis & Cross-Sell Engine", department: "E-Commerce Merchandising", function: "Customer Basket Prediction", keywords: ["market basket", "cross-sell engine", "frequently bought together", "aov"], tech: ["Apriori", "Two-Tower DNN", "Python"], roi: "310%", time: "4 Months", cost: "$280,000" },
      { file: "14_dynamic_promotions.md", title: "Targeted Loyalty Member Promotional Offer Personalization", department: "CRM & Marketing", function: "Dynamic Promotions", keywords: ["promotional personalization", "loyalty offer", "rfm segmentation", "coupon recommendation"], tech: ["Collaborative Filtering", "Klaviyo API"], roi: "270%", time: "3 Months", cost: "$210,000" },
      { file: "15_retail_workforce_planning.md", title: "Retail Store Peak Foot-Traffic & Staff Shift Scheduling", department: "Store Workforce", function: "Retail Workforce Planning", keywords: ["retail workforce", "staff scheduling", "foot traffic pacing", "labor budget"], tech: ["Linear Programming", "Python"], roi: "230%", time: "3 Months", cost: "$180,000" },
      { file: "16_product_recommendation_engine.md", title: "Two-Tower Deep Neural Network Product Recommendation AI", department: "E-Commerce Growth", function: "Product Recommendation Engine", keywords: ["recommendation engine", "two tower model", "vector search", "clickstream"], tech: ["Two-Tower DNN", "Pinecone", "FastAPI"], roi: "330%", time: "5 Months", cost: "$360,000" },
      { file: "17_inventory_intelligence.md", title: "Omnichannel Fulfillment Center Order Routing & Split Shipment AI", department: "Supply Chain", function: "Inventory Intelligence", keywords: ["inventory intelligence", "order routing", "split shipment", "warehouse picking"], tech: ["MILP Optimization", "Python", "Kafka"], roi: "280%", time: "5 Months", cost: "$330,000" },
      { file: "18_demand_forecasting.md", title: "Multi-Store SKU Demand Forecasting & Seasonal Weather Elasticity", department: "Inventory Planning", function: "Demand Forecasting", keywords: ["demand forecasting", "sku replenishment", "weather elasticity", "promotions forecast"], tech: ["Prophet", "LightGBM", "Snowflake"], roi: "300%", time: "5 Months", cost: "$340,000" },
      { file: "19_omnichannel_analytics.md", title: "Online Click-and-Collect & In-Store Customer Journey Analytics", department: "Omnichannel Strategy", function: "Omnichannel Analytics", keywords: ["omnichannel analytics", "bopis", "click and collect", "customer journey"], tech: ["Snowflake", "Tableau API"], roi: "240%", time: "4 Months", cost: "$220,000" },
      { file: "20_store_performance_dashboard.md", title: "Retail Store Footfall Heatmap & Conversion Rate Analytics", department: "Store Management", function: "Store Performance Dashboard", keywords: ["store performance", "footfall heatmap", "conversion rate", "dwell time"], tech: ["OpenCV", "People Counter API", "React"], roi: "210%", time: "3 Months", cost: "$170,000" }
    ]
  },

  // 16. Telecommunications
  {
    folder: "Telecommunications",
    industry: "Telecommunications & Networks",
    docs: [
      { file: "11_5g_network_optimization.md", title: "5G Beamforming & Dynamic Cell Spectrum Carrier Aggregation", department: "5G Network Engineering", function: "5G Network Optimization", keywords: ["5g optimization", "beamforming", "carrier aggregation", "spectrum planning"], tech: ["Deep Reinforcement Learning", "5G gNodeB API"], roi: "340%", time: "7 Months", cost: "$590,000" },
      { file: "12_telecom_fraud_detection.md", title: "International Revenue Share Fraud (IRSF) & SIM Swap Alert AI", department: "Telecom Fraud Operations", function: "Telecom Fraud Detection", keywords: ["telecom fraud", "irsf", "sim swap", "roaming anomaly", "toll fraud"], tech: ["Graph AI", "Redis", "Golang"], roi: "360%", time: "6 Months", cost: "$470,000" },
      { file: "13_customer_retention_ai.md", title: "Mobile Subscriber Port-Out Churn Risk & Data Upgrade AI", department: "Subscriber Marketing", function: "Customer Retention AI", keywords: ["subscriber retention", "port out churn", "arpu", "prepaid retention"], tech: ["XGBoost", "Amdocs API", "Python"], roi: "290%", time: "4 Months", cost: "$280,000" },
      { file: "14_tower_health_monitoring.md", title: "Drone Inspection Camera 5G Tower Structural Defect AI", department: "Field Maintenance", function: "Tower Health Monitoring", keywords: ["tower health", "drone inspection", "antenna alignment", "cell tower defect"], tech: ["YOLOv8", "Computer Vision", "Python"], roi: "250%", time: "4 Months", cost: "$240,000" },
      { file: "15_intelligent_network_planning.md", title: "Fiber Backhaul & Urban 5G Small Cell Deployment Planner", department: "Network Strategy", function: "Intelligent Network Planning", keywords: ["network planning", "fiber backhaul", "small cell", "5g rollout"], tech: ["GIS Mapping API", "Python"], roi: "270%", time: "5 Months", cost: "$320,000" },
      { file: "16_telecom_billing_analytics.md", title: "Automated BSS CDR Roaming Overcharge Dispute Resolution", department: "Billing Operations", function: "Telecom Billing Analytics", keywords: ["telecom billing", "cdr audit", "roaming dispute", "bss/oss"], tech: ["LLM Dispute Agent", "Amdocs BSS API"], roi: "230%", time: "3 Months", cost: "$190,000" },
      { file: "17_service_quality_prediction.md", title: "Subscriber Mobile App Packet Loss & Quality of Experience Dashboard", department: "Quality Assurance", function: "Service Quality Prediction", keywords: ["service quality", "qoe", "packet loss", "latency tracking", "call drop"], tech: ["Kafka", "ClickHouse", "Grafana"], roi: "220%", time: "4 Months", cost: "$210,000" },
      { file: "18_telecom_operations_copilot.md", title: "Network Operations Center (NOC) Alarm Correlation Agent", department: "NOC Operations", function: "Telecom Operations Copilot", keywords: ["noc copilot", "snmp alarms", "alarm correlation", "outage agent"], tech: ["LLM Agent", "Kafka", "Python"], roi: "310%", time: "5 Months", cost: "$360,000" },
      { file: "19_customer_experience_intelligence.md", title: "Self-Service Mobile Plan Renewal & eSIM Activation Assistant", department: "Customer Care", function: "Customer Experience Intelligence", keywords: ["customer experience", "esim activation", "plan renewal bot", "data topup"], tech: ["LLM Assistant", "React Native"], roi: "260%", time: "3 Months", cost: "$180,000" },
      { file: "20_network_capacity_forecasting.md", title: "Cellular Traffic Peak Hour Bandwidth Demand Predictor", department: "Capacity Engineering", function: "Network Capacity Forecasting", keywords: ["capacity forecasting", "bandwidth demand", "cell congestion", "peak traffic"], tech: ["Prophet", "PostgreSQL", "Python"], roi: "240%", time: "4 Months", cost: "$220,000" }
    ]
  }
];

// Document Generator Function with exact requested structure
function generateMarkdownDocument(doc, domain) {
  const fileContent = `---
industry: "${domain.industry}"
department: "${doc.department}"
business_function: "${doc.function}"
keywords:
${doc.keywords.map((k) => `  - "${k}"`).join("\n")}
technologies:
${doc.tech.map((t) => `  - "${t}"`).join("\n")}
difficulty: "High"
estimated_roi: "${doc.roi}"
implementation_time: "${doc.time}"
---

# ${doc.title}

## Industry
${domain.industry}

## Business Function
${doc.function}

## Executive Summary
This enterprise consulting playbook outlines an AI transformation architecture for ${doc.function} within ${domain.industry}. By deploying ${doc.tech.slice(0, 3).join(", ")}, enterprise clients eliminate legacy operational bottlenecks, achieve straight-through processing, and realize an estimated ${doc.roi} return on investment over a ${doc.time} implementation timeline.

## Current Business Problem
Legacy operational workflows in ${doc.department} suffer from severe latency, high error rates, and escalating labor overhead:
1. Fragmented Data Silos: Enterprise data remains trapped across legacy mainframe ERPs, spreadsheets, and unindexed document repositories.
2. High Manual Triage: Operations staff spend up to 65% of their working hours manually triaging and verifying low-complexity transactions.
3. SLA Breaches: Processing times stretch from hours to days, leading to customer churn, penalty fees, and regulatory exposure.

## Root Causes
- Lack of Semantic Understanding: Rule-based legacy systems cannot parse unstructured natural language, complex financial documents, or visual imagery.
- Brittle Integration Layers: Middleware APIs require constant manual maintenance and lack real-time streaming capability.
- Absent Telemetry: Executive leadership lacks real-time operational visibility into active queues and bottleneck points.

## Operational Challenges
- Scalability Friction: Transaction volume spikes force enterprises to scale operational headcount linearly.
- High Human Error Rates: Manual keying introduces 4% to 8% downstream error rates, triggering expensive reconciliation cycles.
- Audit Vulnerability: Inconsistent policy enforcement during manual processing creates compliance audit risks.

## AI Solution Overview
The proposed solution establishes an end-to-end intelligent automation pipeline:
- Automated Ingestion: Captures multi-modal inputs (streaming Kafka events, REST payloads, unstructured PDFs, high-speed camera feeds).
- AI Core Engine: Employs ${doc.tech[0]} and ${doc.tech[1] || "Deep Learning"} for contextual extraction, anomaly detection, and predictive scoring.
- Automated Orchestration: Straight-through processing for high-confidence predictions; low-confidence exceptions automatically populate human-in-the-loop triage queues.

## Detailed Solution Architecture
1. Data & Event Streaming Layer: Ingests real-time events via Apache Kafka and secure REST webhooks into containerized microservices.
2. Intelligence & Vector Search Layer: Leverages ${doc.tech[0]} paired with MongoDB Atlas Vector Search for semantic chunk retrieval and real-time inference.
3. Decision & Governance Engine: Evaluates AI model confidence thresholds against enterprise business rules and compliance policy frameworks.
4. Enterprise Integration Layer: Writes verified decisions directly into enterprise backends (${doc.tech[2] || "Enterprise Core System"}) via authenticated OAuth2 REST APIs.

## Technologies Used
- AI & ML Models: ${doc.tech.join(", ")}
- Data & Vector Infra: MongoDB Atlas Vector Search, PostgreSQL, Redis, Apache Kafka
- Enterprise Stack: FastAPI / Express.js, Docker, Kubernetes, ${doc.tech[3] || "Cloud Platform"}

## Implementation Roadmap

### Phase 1
Workflow Discovery & Architecture Alignment (Weeks 1-3): Map operational processes, audit legacy API feeds, and establish baseline SLAs.

### Phase 2
Model Development & Pipeline Integration (Weeks 4-10): Fine-tune ${doc.tech[0]} models, build RAG vector indexes, and integrate containerized ingestion microservices.

### Phase 3
Human-in-the-Loop Pilot & System Validation (Months 3-4): Launch controlled pilot in production environment with operational triage staff validating AI output confidence.

### Phase 4
Enterprise Production Rollout & Telemetry Monitoring (Months 5-6): Scale pipeline to full transaction volume, activate automated SLA telemetry dashboards, and transition staff to strategic exception management.

## Estimated ROI
- Return on Investment: Estimated ${doc.roi} return within 12 months post-deployment.
- Operating Cost Savings: 35% to 55% reduction in operational processing cost per transaction.
- Velocity Multiplier: 5x throughput increase with end-to-end SLA turnaround time cut by 80%.

## KPIs
- Straight-Through Processing (STP) Rate: > 85% fully automated without manual intervention.
- AI Prediction Accuracy: > 98.2% precision across production transaction volume.
- SLA Processing Time: Reduced from 48 hours to under 3 minutes per item.

## Risks
- Data Drift: Shifts in input distributions over time can degrade model confidence.
- Legacy Systems Resistance: Older legacy mainframes may require custom middleware adapters.
- Risk Mitigations: Automated continuous retraining pipelines, human-in-the-loop fallback thresholds, and strict RBAC data governance.

## Cost Estimate
- Total Solution Cost: ${doc.cost} (Includes architecture design, model training, API integration, and change management).

## Timeline
- Project Duration: ${doc.time} to full production rollout.

## Expected Benefits
- Direct bottom-line savings and rapid financial payback within 12 months.
- Comprehensive digital audit logs guaranteeing regulatory compliance.
- Enhanced workforce satisfaction by replacing tedious data entry with strategic analysis.

## Example Enterprise Scenario
A Global 2000 client operating in ${domain.industry} deployed this solution to transform its ${doc.department} operations. Within 90 days of production launch, straight-through processing reached 87%, processing turnaround dropped from 3 days to 4 minutes, and annual operating costs declined by $2.4M.

## Future Enhancements
- Agentic Auto-Remediation: Autonomous AI agents executing multi-step complex resolution workflows.
- Continuous Federated Learning: Real-time model updates across multi-region enterprise deployments without centralized data pooling.

## Keywords
- ${doc.keywords.join("\n- ")}
`;

  return fileContent;
}

// Generate NEW Knowledge Base Files (numbered 11_*.md to 20_*.md across 16 domains)
function buildExpanded320KnowledgeBase() {
  let totalGenerated = 0;

  newDomains.forEach((domain) => {
    const domainDirPath = path.join(kbDir, domain.folder);
    if (!fs.existsSync(domainDirPath)) {
      fs.mkdirSync(domainDirPath, { recursive: true });
    }

    domain.docs.forEach((doc) => {
      const filePath = path.join(domainDirPath, doc.file);
      const markdown = generateMarkdownDocument(doc, domain);
      fs.writeFileSync(filePath, markdown, "utf-8");
      totalGenerated++;
      console.log(`  ✓ Generated NEW [${domain.folder}] ${doc.file} (${doc.title})`);
    });
  });

  console.log(`\n🎉 Successfully generated ${totalGenerated} NEW enterprise consulting documents across 16 industry verticals!`);
}

buildExpanded320KnowledgeBase();
