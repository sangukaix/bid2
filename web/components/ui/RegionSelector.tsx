"use client";

export const REGION_OPTIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

type RegionSelectorProps = {
  regions: string[];
  onChange: (regions: string[]) => void;
  name?: string;
  label?: string;
  description?: string;
};

export function parseRegions(value: string) {
  return value
    .split(",")
    .map((region) => region.trim())
    .filter(Boolean);
}

export default function RegionSelector({
  regions,
  onChange,
  name,
  label = "희망 지역",
  description = "여러 지역을 차례대로 추가할 수 있습니다.",
}: RegionSelectorProps) {
  function addRegion(region: string) {
    if (!region || regions.includes(region)) {
      return;
    }

    onChange([...regions, region]); // 지역을 고르는 즉시 목록에 추가
  }

  function removeRegion(region: string) {
    onChange(regions.filter((item) => item !== region));
  }

  return (
    <div>
      <span className="text-sm font-medium text-slate-700">{label}</span>

      <select
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        onChange={(event) => addRegion(event.target.value)}
        value=""
      >
        <option value="">지역 선택</option>
        {REGION_OPTIONS.map((region) => (
          <option disabled={regions.includes(region)} key={region} value={region}>
            {region}
          </option>
        ))}
      </select>

      <div className="mt-3 flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-slate-300 p-2">
        {regions.map((region) => (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-semibold text-blue-700"
            key={region}
          >
            {region}
            <button
              aria-label={`${region} 지역 삭제`}
              className="h-5 w-5 text-base leading-none text-blue-500 hover:text-blue-800"
              onClick={() => removeRegion(region)}
              title="지역 삭제"
              type="button"
            >
              ×
            </button>
          </span>
        ))}

        {regions.length === 0 && <span className="px-1 text-sm text-slate-400">전체 지역</span>}
      </div>

      {name && <input name={name} readOnly type="hidden" value={regions.join(", ")} />}
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
