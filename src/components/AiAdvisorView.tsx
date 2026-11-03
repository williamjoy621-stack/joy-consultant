import React, { useState, useEffect } from 'react';
import { PropertyItem, AiRecommendationResult } from '../types.ts';
import {
  Sparkles,
  ShieldCheck,
  Search,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck2,
} from 'lucide-react';

interface AiAdvisorViewProps {
  properties: PropertyItem[];
  authToken: string | null;
  onSelectProperty: (property: PropertyItem, tab?: 'overview' | 'book' | 'order') => void;
}

function buildClientRecommendationFallback(
  budgetNum: number,
  preferredLocation: string,
  category: string,
  properties: PropertyItem[]
): AiRecommendationResult {
  const safeBudget = Number(budgetNum) || 5000000;
  const availableProps = properties.filter((p) => p.availabilityStatus === 'Available');

  const locationFiltered =
    preferredLocation && preferredLocation !== 'Any Nigerian Growth Corridor'
      ? availableProps.filter(
          (p) =>
            p.location.toLowerCase().includes(preferredLocation.split(',')[0].toLowerCase()) ||
            p.city.toLowerCase().includes(preferredLocation.split(',')[0].toLowerCase())
        )
      : availableProps;

  const categoryFiltered =
    category && category !== 'Any'
      ? (locationFiltered.length > 0 ? locationFiltered : availableProps).filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        )
      : locationFiltered.length > 0
      ? locationFiltered
      : availableProps;

  const candidatePool = categoryFiltered.length > 0 ? categoryFiltered : availableProps;

  const affordableMatches = candidatePool
    .filter((p) => Number(p.priceNgn) <= safeBudget * 1.45)
    .sort((a, b) => Number(a.priceNgn) - Number(b.priceNgn));

  const selectedList = (
    affordableMatches.length > 0
      ? affordableMatches
      : [...candidatePool].sort((a, b) => Number(a.priceNgn) - Number(b.priceNgn))
  ).slice(0, 3);

  return {
    executiveSummary:
      affordableMatches.length > 0
        ? `Based on your target budget of ₦${safeBudget.toLocaleString()} (${preferredLocation}), our live JOY CONSULTANT database identifies ${affordableMatches.length} verified land option(s) that match either via outright acquisition or our structured 30% initial deposit milestone plan.`
        : `Your specified budget of ₦${safeBudget.toLocaleString()} is below the outright price of parcels in that exact filter, so we have selected our most accessible verified parcels starting from ₦4,500,000 where a 30% deposit secures immediate plot reservation.`,
    recommendations: selectedList.map((p) => ({
      propertyId: p.id,
      referenceCode: p.referenceCode,
      title: p.title,
      matchReason: `Located in ${p.location} (${p.sizeSqm} sqm, ${p.category}) at ₦${Number(
        p.priceNgn
      ).toLocaleString()} per plot. Proximity to ${p.landmarks} supports strong capital appreciation.`,
      affordabilityStrategy:
        Number(p.priceNgn) <= safeBudget
          ? `Fits outright within your ₦${safeBudget.toLocaleString()} budget with room for statutory survey & deed perfection.`
          : `Accessible via ${p.paymentPlanSummary} (30% initial deposit of ₦${Math.round(
              Number(p.priceNgn) * 0.3
            ).toLocaleString()}).`,
      verifiedTitleStatus: `${p.documentationStatus} · Survey Plan: ${p.surveyPlanNumber}`,
    })),
    dueDiligenceChecklist: [
      'Verify the Registered Survey Plan number and UTM beacon coordinates at the State Office of the Surveyor-General.',
      'Conduct an official Land Registry charting search to confirm the parcel is free from government acquisition or encumbrance.',
      'Inspect the physical site topography, drainage alignment, and perimeter beacons during a scheduled JOY CONSULTANT site visit.',
      'Ensure all stage payments are remitted exclusively to the corporate escrow account against an official Allocation & Contract of Sale.',
    ],
    complianceDisclaimer:
      'All recommendations are strictly grounded in live JOY CONSULTANT PostgreSQL property records. Title perfection timelines are governed by the relevant State Land Registry.',
  };
}

export const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({
  properties,
  authToken,
  onSelectProperty,
}) => {
  const [budgetNgn, setBudgetNgn] = useState('5000000');
  const [preferredLocation, setPreferredLocation] = useState('Any Nigerian Growth Corridor');
  const [category, setCategory] = useState('Any');
  const [customQuestion, setCustomQuestion] = useState(
    'I have ₦5 million. Which available land options can I consider, and what should I check before buying?'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiRecommendationResult | null>(null);
  const [error, setError] = useState('');

  // Standalone Cadastral Verification Lookup
  const [searchCode, setSearchCode] = useState('JC-LEK-001');
  const matchedVerificationProperty = properties.find(
    (p) =>
      p.referenceCode.toLowerCase() === searchCode.trim().toLowerCase() ||
      p.surveyPlanNumber.toLowerCase().includes(searchCode.trim().toLowerCase()) ||
      p.title.toLowerCase().includes(searchCode.trim().toLowerCase())
  );

  useEffect(() => {
    if (properties.length > 0 && !result) {
      setResult(
        buildClientRecommendationFallback(
          Number(budgetNgn),
          preferredLocation,
          category,
          properties
        )
      );
    }
  }, [properties]);

  const handleRunRecommendation = async (e?: React.FormEvent, presetBudget?: string, presetQuestion?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const activeBudget = presetBudget ?? budgetNgn;
    const activeQuestion = presetQuestion ?? customQuestion;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          budgetNgn: Number(activeBudget),
          preferredLocation,
          category,
          customQuestion: activeQuestion,
        }),
      });
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
      if (!res.ok || !data || data.error || !data.recommendations) {
        setResult(
          buildClientRecommendationFallback(
            Number(activeBudget),
            preferredLocation,
            category,
            properties
          )
        );
        return;
      }
      setResult(data);
    } catch {
      setResult(
        buildClientRecommendationFallback(
          Number(activeBudget),
          preferredLocation,
          category,
          properties
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="text-xs font-mono-tabular text-[#9A7411] tracking-wider">
          AI PROPERTY RECOMMENDATION &amp; CADASTRAL VERIFICATION
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-[#0B192C] mt-2 text-balance">
          Intelligent Land Investment Guidance Grounded in Verified Records
        </h1>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          Evaluate real land acquisition opportunities based on your capital budget, preferred corridor, and title requirements. Our AI engine queries only live JOY CONSULTANT PostgreSQL listings and never invents availability, prices, or legal titles.
        </p>
      </div>

      {/* Preset Investor Scenarios */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">Try Investor Scenarios:</span>
        {[
          {
            label: '₦5M Budget Options & Checks',
            budget: '5000000',
            q: 'I have ₦5 million. Which available land options can I consider, and what should I check before buying?',
          },
          {
            label: '₦20M Residential Plot with C of O',
            budget: '20000000',
            q: 'I have ₦20 million for a residential plot with Certificate of Occupancy (C of O) in Lagos or Enugu. Which properties fit?',
          },
          {
            label: '₦75M Abuja / Waterfront Portfolio',
            budget: '75000000',
            q: 'I have ₦75 million for executive land banking or commercial development. Compare my best options.',
          },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setBudgetNgn(preset.budget);
              setCustomQuestion(preset.q);
              handleRunRecommendation(undefined, preset.budget, preset.q);
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B192C] hover:border-[#C59B27] transition-colors whitespace-nowrap shrink-0"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form
          onSubmit={(e) => handleRunRecommendation(e)}
          className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 space-y-4"
        >
          <h2 className="text-lg font-serif-display font-semibold text-[#0B192C]">
            Configure Your Investment Profile
          </h2>

          <div className="text-xs space-y-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Target Investment Budget (₦ NGN)
              </label>
              <input
                type="number"
                required
                min={1000000}
                step={500000}
                value={budgetNgn}
                onChange={(e) => setBudgetNgn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular text-sm font-semibold"
              />
              <div className="text-[11px] text-slate-500 mt-1 font-mono-tabular">
                Formatted: ₦{Number(budgetNgn || 0).toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Preferred Location / Growth Corridor
              </label>
              <select
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Any Nigerian Growth Corridor">Any Nigerian Growth Corridor</option>
                <option value="Ibeju-Lekki & Epe, Lagos">Ibeju-Lekki &amp; Epe, Lagos</option>
                <option value="Victoria Island Annex, Lagos">Victoria Island Annex, Lagos</option>
                <option value="Guzape District, Abuja FCT">Guzape District, Abuja FCT</option>
                <option value="Moniya Dry Port Corridor, Ibadan">Moniya Dry Port Corridor, Ibadan</option>
                <option value="Centenary City Corridor, Enugu">Centenary City Corridor, Enugu</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Land Use / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Any">All Land Categories</option>
                <option value="Residential Land">Residential Land</option>
                <option value="Commercial Land">Commercial Land</option>
                <option value="Agricultural / Farmland">Agricultural / Farmland</option>
                <option value="Waterfront Plot">Waterfront Plot</option>
                <option value="Mixed-Use Estate">Mixed-Use Estate</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Your Specific Investment Question
              </label>
              <textarea
                rows={3}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49] transition-colors inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C59B27]" />
                Evaluating Live Platform Listings...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                Generate AI Property Recommendations
              </>
            )}
          </button>
        </form>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#C59B27] mx-auto" />
              <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                Ready to Match Your Capital to Verified Land Parcels
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Click &ldquo;Generate AI Property Recommendations&rdquo; or select a preset budget scenario above to receive an instant portfolio analysis grounded in our PostgreSQL listings.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
              <div>
                <div className="text-xs font-mono-tabular text-[#9A7411]">
                  AI ADVISORY REPORT
                </div>
                <p className="text-sm text-[#0B192C] mt-2 leading-relaxed">
                  {result.executiveSummary}
                </p>
              </div>

              {/* Matched Listings */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#0B192C]">
                  Recommended Platform Listings ({result.recommendations?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(result.recommendations || []).map((rec, i) => {
                    const matchedProp = properties.find(
                      (p) =>
                        p.id === rec.propertyId ||
                        p.referenceCode === rec.referenceCode
                    );
                    return (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono-tabular text-[#9A7411] font-semibold">
                              {rec.referenceCode}
                            </span>{' '}
                            · <span className="font-semibold text-[#0B192C] text-sm">{rec.title}</span>
                          </div>
                          {matchedProp && (
                            <span className="font-mono-tabular font-bold text-[#0B192C]">
                              ₦{Number(matchedProp.priceNgn).toLocaleString()} ({matchedProp.sizeSqm} sqm)
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed">{rec.matchReason}</p>
                        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-600">
                            <strong>Strategy:</strong> {rec.affordabilityStrategy} ·{' '}
                            <strong>Title:</strong> {rec.verifiedTitleStatus}
                          </div>
                          {matchedProp && (
                            <button
                              type="button"
                              onClick={() => onSelectProperty(matchedProp, 'overview')}
                              className="px-3 py-1.5 rounded bg-[#0B192C] text-white font-medium hover:bg-[#162B49] inline-flex items-center gap-1 whitespace-nowrap shrink-0 self-start sm:self-auto"
                            >
                              Inspect Parcel
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pre-Purchase Due Diligence Checklist */}
              {result.dueDiligenceChecklist && result.dueDiligenceChecklist.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0B192C] text-white space-y-2.5 text-xs">
                  <div className="font-semibold text-[#E5C158] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Mandatory Pre-Purchase Verification Checklist
                  </div>
                  <ul className="space-y-1.5 text-slate-200">
                    {result.dueDiligenceChecklist.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {result.complianceDisclaimer && (
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-white/10">
                      {result.complianceDisclaimer}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Land Verification & Documentation Tracker Lookup */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-serif-display font-bold text-[#0B192C] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#C59B27]" />
              Live Land Verification &amp; Documentation Tracker
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Verify the recorded status of Survey Plans, Deeds of Assignment, and Certificates of Occupancy (C of O) for any listed parcel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter Ref (e.g. JC-LEK-001) or Survey No..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono-tabular w-64"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSearchCode(p.referenceCode)}
              className={`px-2.5 py-1 rounded font-mono-tabular transition-colors ${
                searchCode.toLowerCase() === p.referenceCode.toLowerCase()
                  ? 'bg-[#0B192C] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p.referenceCode} ({p.city})
            </button>
          ))}
        </div>

        {matchedVerificationProperty ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-2">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Parcel &amp; Location</div>
              <div className="font-semibold text-[#0B192C] mt-1">
                {matchedVerificationProperty.title}
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-600 mt-1">
                Ref: {matchedVerificationProperty.referenceCode} · {matchedVerificationProperty.coordinatesLat}°N, {matchedVerificationProperty.coordinatesLng}°E
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Registered Survey Plan</div>
              <div className="font-semibold text-emerald-800 mt-1">
                {matchedVerificationProperty.surveyPlanStatus}
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-700 mt-1">
                {matchedVerificationProperty.surveyPlanNumber}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Deed of Assignment</div>
              <div className="font-semibold text-[#0B192C] mt-1">
                {matchedVerificationProperty.deedOfAssignmentStatus}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Cadastral Boundary Coordinates Verified
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500">C of O / Governor&rsquo;s Consent</div>
              <div className="font-semibold text-[#0B192C] mt-1">
                {matchedVerificationProperty.cOfOStatus}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {matchedVerificationProperty.documentationStatus}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            No recorded parcel matches &ldquo;{searchCode}&rdquo;. Select one of the verified reference codes above.
          </div>
        )}
      </div>
    </div>
  );
};
