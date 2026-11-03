import React, { useState } from 'react';
import { Compass, MapPin, ShieldCheck } from 'lucide-react';

interface PropertyVisualProps {
  imageType: string;
  imageUrl?: string;
  referenceCode: string;
  sizeSqm: number;
  coordinatesLat?: string;
  coordinatesLng?: string;
  className?: string;
}

export const PropertyVisual: React.FC<PropertyVisualProps> = ({
  imageType,
  imageUrl,
  referenceCode,
  sizeSqm,
  coordinatesLat = '6.4589',
  coordinatesLng = '3.7845',
  className = 'h-56',
}) => {
  const [imgError, setImgError] = useState(false);

  const themes: Record<
    string,
    {
      bgGradient: string;
      accent: string;
      terrainLabel: string;
      gridColor: string;
    }
  > = {
    'coastal-estate': {
      bgGradient: 'from-[#0B192C] via-[#132A46] to-[#1D3E63]',
      accent: '#C59B27',
      terrainLabel: 'COASTAL PERIMETER SURVEY · DRY SAND-FILLED',
      gridColor: 'rgba(197, 155, 39, 0.22)',
    },
    'commercial-corridor': {
      bgGradient: 'from-[#0F172A] via-[#1E293B] to-[#0B192C]',
      accent: '#D4AF37',
      terrainLabel: 'EXPRESSWAY COMMERCIAL CORRIDOR · HIGH LOAD',
      gridColor: 'rgba(212, 175, 55, 0.22)',
    },
    'waterfront-luxury': {
      bgGradient: 'from-[#071324] via-[#0F2942] to-[#163B5C]',
      accent: '#E5C158',
      terrainLabel: 'WATERFRONT QUAY PARCEL · PILING CERTIFIED',
      gridColor: 'rgba(229, 193, 88, 0.24)',
    },
    'hillside-estate': {
      bgGradient: 'from-[#111C2D] via-[#1F3147] to-[#2B425B]',
      accent: '#C59B27',
      terrainLabel: 'ELEVATED ROCKY TOPOGRAPHY · FCDA ZONED',
      gridColor: 'rgba(197, 155, 39, 0.20)',
    },
    'agro-estate': {
      bgGradient: 'from-[#0D211D] via-[#14332C] to-[#0B192C]',
      accent: '#D4AF37',
      terrainLabel: 'ARABLE INDUSTRIAL CORRIDOR · RAIL ADJACENT',
      gridColor: 'rgba(212, 175, 55, 0.20)',
    },
    'mixed-estate': {
      bgGradient: 'from-[#0B192C] via-[#1B2B44] to-[#253A59]',
      accent: '#C59B27',
      terrainLabel: 'GATED MIXED-USE ENCLAVE · TARRED ACCESS',
      gridColor: 'rgba(197, 155, 39, 0.22)',
    },
  };

  const theme = themes[imageType] || themes['coastal-estate'];

  if (imageUrl && imageUrl.trim() !== '' && !imgError) {
    return (
      <div className={`relative w-full overflow-hidden bg-[#0B192C] ${className}`}>
        <img
          src={imageUrl}
          alt={`${referenceCode} Cadastral Property View`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90 font-mono-tabular">
          <span>{referenceCode}</span>
          <span>{sizeSqm} SQM</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-br ${theme.bgGradient} select-none ${className}`}
    >
      {/* Architectural Cadastral SVG Overlay */}
      <svg
        viewBox="0 0 600 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id={`grid-${referenceCode}`}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={theme.gridColor}
              strokeWidth="0.75"
            />
          </pattern>
        </defs>

        {/* Cadastral Survey Grid */}
        <rect width="600" height="360" fill={`url(#grid-${referenceCode})`} />

        {/* Topographic Contour Curves */}
        <path
          d="M-40 290 C 120 240, 260 310, 440 230 C 520 190, 580 210, 640 180"
          stroke={theme.accent}
          strokeOpacity="0.28"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <path
          d="M-20 330 C 150 280, 290 340, 470 265 C 540 235, 590 250, 640 220"
          stroke="#FFFFFF"
          strokeOpacity="0.15"
          strokeWidth="1"
        />

        {/* Express Road / Boulevard Geometry */}
        <path
          d="M 60 360 L 230 85 L 275 85 L 135 360 Z"
          fill="#FFFFFF"
          fillOpacity="0.06"
          stroke={theme.accent}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <line
          x1="100"
          y1="355"
          x2="252"
          y2="88"
          stroke={theme.accent}
          strokeOpacity="0.55"
          strokeWidth="1.2"
          strokeDasharray="8 8"
        />

        {/* Subdivided Estate Parcel Blocks */}
        <g stroke={theme.accent} strokeWidth="1.4" fill={theme.accent} fillOpacity="0.08">
          <polygon points="295,110 475,110 495,195 275,195" />
          <line x1="355" y1="110" x2="345" y2="195" strokeOpacity="0.6" />
          <line x1="415" y1="110" x2="420" y2="195" strokeOpacity="0.6" />
          <line x1="285" y1="152" x2="485" y2="152" strokeOpacity="0.6" />
        </g>

        {/* Highlighted Prime Allocation Plot */}
        <polygon
          points="355,110 415,110 417,152 350,152"
          fill={theme.accent}
          fillOpacity="0.32"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Survey Beacons (Corner Pillars) */}
        <circle cx="295" cy="110" r="4" fill="#FFFFFF" />
        <circle cx="475" cy="110" r="4" fill="#FFFFFF" />
        <circle cx="495" cy="195" r="4" fill="#FFFFFF" />
        <circle cx="275" cy="195" r="4" fill="#FFFFFF" />

        {/* Cadastral North Rose */}
        <g transform="translate(535, 58)">
          <circle
            cx="0"
            cy="0"
            r="22"
            stroke={theme.accent}
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <polygon points="0,-16 4,4 0,0 -4,4" fill={theme.accent} />
          <text
            x="-4"
            y="-26"
            fill="#FFFFFF"
            fontSize="9"
            fontFamily="monospace"
            opacity="0.8"
          >
            N
          </text>
        </g>
      </svg>

      {/* Scrim for guaranteed legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/95 via-[#0B192C]/25 to-transparent" />

      {/* Top Cadastral Coordinate Bar */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/80 font-mono-tabular">
        <span className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#C59B27]" />
          <span>
            {Number(coordinatesLat).toFixed(4)}°N, {Number(coordinatesLng).toFixed(4)}°E
          </span>
        </span>
        <span className="text-[#E5C158] font-medium">{referenceCode}</span>
      </div>

      {/* Bottom Metadata Readout */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90">
        <span className="text-[11px] tracking-wide text-slate-300 truncate max-w-[70%]">
          {theme.terrainLabel}
        </span>
        <span className="font-mono-tabular font-semibold text-[#E5C158] flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          {sizeSqm} sqm
        </span>
      </div>
    </div>
  );
};
