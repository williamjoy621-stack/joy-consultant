import { PropertyItem, ServiceItem } from '../types.ts';

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
  isJson: boolean;
  rawText: string;
}> {
  try {
    const res = await fetch(url, options);
    const rawText = await res.text();
    let data: T | null = null;
    let isJson = false;
    try {
      data = JSON.parse(rawText) as T;
      isJson = true;
    } catch {
      data = null;
      isJson = false;
    }
    return {
      ok: res.ok && isJson,
      status: res.status,
      data,
      isJson,
      rawText,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      isJson: false,
      rawText: err?.message || 'Network error',
    };
  }
}

export const FALLBACK_PROPERTIES: PropertyItem[] = [
  {
    id: 1,
    title: 'The Imperial Haven Estate, Ibeju-Lekki',
    referenceCode: 'JC-LEK-001',
    location: 'Lekki Free Trade Zone Axis, Ibeju-Lekki, Lagos',
    city: 'Lagos',
    state: 'Lagos State',
    coordinatesLat: '6.4589',
    coordinatesLng: '3.7845',
    priceNgn: 18500000,
    sizeSqm: 600,
    plotCount: 18,
    category: 'Residential Land',
    documentationStatus: 'Certificate of Occupancy (C of O)',
    surveyPlanStatus: 'Verified & Charted at Alausa Surveyor-General',
    deedOfAssignmentStatus: 'Executed & Ready for Perfection',
    cOfOStatus: 'Lagos State Global C of O (Ref: LS/C-OF-O/2024/88412)',
    surveyPlanNumber: 'LS/D/IBJ/4491/2025',
    availabilityStatus: 'Available',
    isFeatured: true,
    description:
      'Dry, perimeter-fenced residential serviced plots situated 6 minutes from the Lekki Deep Sea Port and Dangote Refinery corridor. Engineered drainage, solar street lighting, and gated security house.',
    landmarks: 'Lekki Deep Sea Port, Dangote Refinery, La Campagne Tropicana',
    paymentPlanSummary: 'Outright or 6–12 Month Milestone Plan (30% Initial Deposit)',
    imageType: 'coastal-estate',
    imageUrl: '',
  },
  {
    id: 2,
    title: 'Goldcrest Commercial Hub, Epe Corridor',
    referenceCode: 'JC-EPE-002',
    location: 'Ketty-Itokin Expressway, Epe, Lagos',
    city: 'Epe',
    state: 'Lagos State',
    coordinatesLat: '6.5841',
    coordinatesLng: '3.9823',
    priceNgn: 8500000,
    sizeSqm: 500,
    plotCount: 25,
    category: 'Commercial Land',
    documentationStatus: "Governor's Consent",
    surveyPlanStatus: 'Registered Perimeter Survey Verified',
    deedOfAssignmentStatus: 'Ready for Execution Upon Deposit',
    cOfOStatus: "Perfected Governor's Consent (File: EPE/GC/2025/192)",
    surveyPlanNumber: 'LS/D/EPE/1190/2025',
    availabilityStatus: 'Available',
    isFeatured: true,
    description:
      'High-visibility commercial and logistics land directly facing the expanded Epe-Itokin dual carriageway, ideal for warehousing, retail plazas, or long-term land banking.',
    landmarks: 'Lekki-Epe International Airport Site, Alaro City, Epe Resort',
    paymentPlanSummary: 'Outright or 6-Month Structured Plan (30% Deposit)',
    imageType: 'commercial-corridor',
    imageUrl: '',
  },
  {
    id: 3,
    title: 'Victoria Crest Waterfront, Victoria Island Annex',
    referenceCode: 'JC-VIA-003',
    location: 'Oniru / Victoria Island Waterfront Axis, Lagos',
    city: 'Lagos',
    state: 'Lagos State',
    coordinatesLat: '6.4281',
    coordinatesLng: '3.4419',
    priceNgn: 145000000,
    sizeSqm: 1000,
    plotCount: 4,
    category: 'Waterfront Plot',
    documentationStatus: 'Certificate of Occupancy (C of O)',
    surveyPlanStatus: 'Charted & Cleared of Coastal Setback Encumbrance',
    deedOfAssignmentStatus: 'Solicitor-Vetted Contract & Deed Ready',
    cOfOStatus: 'Lagos State C of O + NIWA Shoreline Clearance',
    surveyPlanNumber: 'LS/D/ETI/9082/2025',
    availabilityStatus: 'Available',
    isFeatured: true,
    description:
      'Ultra-prime 1,000 sqm waterfront development parcel with reinforced sheet-pile jetty access, zoned for luxury high-rise apartments or corporate headquarters.',
    landmarks: 'Eko Atlantic City, Landmark Beach, Four Points by Sheraton',
    paymentPlanSummary: 'Outright or 3-Month Corporate Escrow Tranche (50% Deposit)',
    imageType: 'waterfront-prime',
    imageUrl: '',
  },
  {
    id: 4,
    title: 'Sovereign Hills Guzape Executive Plots',
    referenceCode: 'JC-ABJ-004',
    location: 'Guzape District Phase II, Abuja FCT',
    city: 'Abuja',
    state: 'FCT Abuja',
    coordinatesLat: '9.0068',
    coordinatesLng: '7.5142',
    priceNgn: 65000000,
    sizeSqm: 750,
    plotCount: 9,
    category: 'Residential Land',
    documentationStatus: 'Certificate of Occupancy (C of O)',
    surveyPlanStatus: 'AGIS Recertification & TDP Verified',
    deedOfAssignmentStatus: 'Power of Attorney & Deed Ready',
    cOfOStatus: 'FCDA Statutory Right of Occupancy & C of O (AGIS Verified)',
    surveyPlanNumber: 'FCT/AGIS/GUZ/7731/2025',
    availabilityStatus: 'Available',
    isFeatured: true,
    description:
      'Elevated hill-view diplomatic residential plots in Guzape District with tarred asphalt road network, underground power cabling, and panoramic views of Abuja city centre.',
    landmarks: 'Asokoro Extension, COZA Auditorium,ait/Raypower Hill',
    paymentPlanSummary: 'Outright or 6-Month Milestone Payment',
    imageType: 'highland-diplomatic',
    imageUrl: '',
  },
  {
    id: 5,
    title: 'Emerald Agro-Industrial Park, Moniya-Ibadan',
    referenceCode: 'JC-IBD-005',
    location: 'Moniya Inland Dry Port Axis, Ibadan, Oyo',
    city: 'Ibadan',
    state: 'Oyo State',
    coordinatesLat: '7.5284',
    coordinatesLng: '3.9142',
    priceNgn: 3800000,
    sizeSqm: 600,
    plotCount: 52,
    category: 'Agricultural / Farmland',
    documentationStatus: 'Registered Survey & Deed',
    surveyPlanStatus: 'Oyo State Surveyor-General Red Copy Lodged',
    deedOfAssignmentStatus: 'Immediate Execution Upon Payment',
    cOfOStatus: 'Government Gazette & C of O in View (Oyo Lands Bureau)',
    surveyPlanNumber: 'OY/SUR/MNY/3310/2025',
    availabilityStatus: 'Available',
    isFeatured: false,
    description:
      'Fertile, flat agro-processing and residential expansion plots located 4 minutes from the Obafemi Awolowo Train Station (Lagos-Ibadan Standard Gauge Rail) and Moniya Dry Port.',
    landmarks: 'Moniya Rail Terminal, Ibadan Inland Dry Port, IITA Ibadan',
    paymentPlanSummary: 'Outright (₦3.8M) or 3-Month Installment Plan (₦1.2M Initial Deposit)',
    imageType: 'agro-estate',
    imageUrl: '',
  },
  {
    id: 6,
    title: 'Coal City Executive Layout, Centenary Corridor',
    referenceCode: 'JC-ENU-006',
    location: 'Centenary City / Enugu-Port Harcourt Expressway, Enugu',
    city: 'Enugu',
    state: 'Enugu State',
    coordinatesLat: '6.3921',
    coordinatesLng: '7.5389',
    priceNgn: 14500000,
    sizeSqm: 550,
    plotCount: 16,
    category: 'Mixed-Use Estate',
    documentationStatus: 'Certificate of Occupancy (C of O)',
    surveyPlanStatus: 'Enugu Geographic Information Service (ENGIS) Charted',
    deedOfAssignmentStatus: 'Ready for Execution & Stamp Duty',
    cOfOStatus: 'Enugu State Estate Global C of O (ENGIS/2025/410)',
    surveyPlanNumber: 'EN/SUR/CEN/2084/2025',
    availabilityStatus: 'Available',
    isFeatured: false,
    description:
      'Gated smart mixed-use estate along the Centenary City growth corridor in Enugu, designed for modern family duplexes and diaspora retirement residences.',
    landmarks: 'Centenary City Enugu, Akanu Ibiam International Airport, UNTH',
    paymentPlanSummary: 'Outright or 6-Month Structured Plan (30% Initial Deposit)',
    imageType: 'mixed-layout',
    imageUrl: '',
  },
];

export const FALLBACK_SERVICES: ServiceItem[] = [
  {
    id: 1,
    title: 'Cadastral Survey Charting & Coordinate Verification',
    category: 'Land Verification',
    priceLabel: '₦150,000 per parcel',
    durationEstimate: '48 – 72 Hours',
    description:
      'Independent physical coordinate picking using differential GPS by SURCON-licensed surveyors and official charting at the State Surveyor-General Office to confirm zero government committed acquisition.',
    deliverables: 'Signed Charting Report, UTM Coordinate Sheet & Satellite Overlay Map',
    availabilityStatus: 'Available',
  },
  {
    id: 2,
    title: "Certificate of Occupancy (C of O) & Governor's Consent Processing",
    category: 'Legal & Title Perfection',
    priceLabel: 'Custom Statutory Assessment',
    durationEstimate: '30 – 90 Working Days',
    description:
      "End-to-end legal processing of Deed of Assignment stamping, Capital Gains Tax clearance, and Governor's Consent or C of O perfection at Alausa Lagos, AGIS Abuja, or State Land Registries.",
    deliverables: 'Registered Title Instrument, Stamp Duty Receipt & Land Registry Extract',
    availabilityStatus: 'Available',
  },
  {
    id: 3,
    title: 'Diaspora Virtual Live Drone & Beacon Inspection',
    category: 'Inspection & Advisory',
    priceLabel: 'Complimentary for Listed Estates',
    durationEstimate: '45-Minute Live Session',
    description:
      'Real-time high-definition video and drone walk-through of your selected plot, showing physical perimeter beacons, access roads, and neighbouring infrastructure live with our field surveyor.',
    deliverables: 'Recorded 4K Drone Footage, Beacon Coordinate Log & Live Q&A Session',
    availabilityStatus: 'Available',
  },
  {
    id: 4,
    title: 'Corporate & Bulk Land Acquisition Consultancy',
    category: 'Investment Advisory',
    priceLabel: 'Retainer / Success-Based',
    durationEstimate: '2 – 4 Weeks',
    description:
      'Strategic land banking, community excision negotiation, environmental impact assessment, and master-plan layout design for real estate developers, cooperatives, and agro-industrial firms.',
    deliverables: 'Feasibility Dossier, Legal Due Diligence Report & Registered Perimeter Survey',
    availabilityStatus: 'Available',
  },
];
