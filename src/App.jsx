
import React, { useEffect, useState } from "react";
import { fetchCountryData } from "./api";
import Filters from "./components/filter";
import { AVAILABLE, COLORS } from "./utils/constant";
import Chart from "./components/Chart";

export default function App() {
  const [selected, setSelected] = useState(["KSA"]);
  const [dataByCountry, setDataByCountry] = useState({});
  const [loading, setLoading] = useState(false);

  // Normalize a row so num_of_deals and regular/mega alternate keys exist
  function normalizeRow(row) {
    const copy = { ...row };

    // deals
    if (copy.num_of_deals == null) {
      copy.num_of_deals = copy.num_deals ?? copy.deals_count ?? copy.deals ?? 0;
    }

    // canonical total amount
    copy.total_amount_raised = copy.total_amount_raised ?? copy.totalRaised ?? copy.amount ?? 0;

    // normalize regular / mega possible keys into canonical fields
    // adjust/add keys if your JSON uses different names
    copy.total_amount_raised_regular_deals =
      copy.total_amount_raised_regular_deals ??
      copy.total_amount_raised_regular ??
      copy.total_regular ??
      copy.regular_amount ??
      copy.regular_amount_total ??
      0;

    copy.total_amount_raised_mega_deals =
      copy.total_amount_raised_mega_deals ??
      copy.total_amount_raised_mega ??
      copy.total_mega ??
      copy.mega_amount ??
      copy.mega_amount_total ??
      0;

    return copy;
  }

  useEffect(() => {
    let mounted = true;
    // setLoading(true);

    const promises = selected.map((countryKey) => {
      const meta = AVAILABLE.find((a) => a.key === countryKey);
      return fetchCountryData(meta.key, meta.file).then((raw) => {
        const normalized = Array.isArray(raw) ? raw.map(normalizeRow) : [];
        return { country: meta.key, data: normalized };
      });
    });

    Promise.all(promises)
      .then((results) => {
        if (!mounted) return;
        const map = {};
        results.forEach((r) => {
          map[r.country] = r.data;
        });
        setDataByCountry(map);
      })
      .catch((err) => {
        console.error("Failed to fetch country data", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selected]);

  // Build chart data: include both total_amount_raised (values) and num_of_deals (counts)
  // AND include per-country regular/mega breakdowns so GroupedChart can render stacked segments
  const years = Array.from(
    new Set(
      Object.values(dataByCountry)
        .flat()
        .map((d) => d.year)
    )
  ).sort((a, b) => a - b);

  const chartData = years.map((y) => {
    const regular = {};
    const mega = {};
    const values = {};
    const counts = {};

    selected.forEach((country) => {
      const rows = dataByCountry[country] || [];
      const row = rows.find((r) => r.year === y) || {};

      // prefer canonical regular/mega keys if present, otherwise try fallbacks
      const regVal =
        row.total_amount_raised_regular_deals ??
        row.total_amount_raised_regular ??
        row.total_regular ??
        row.regular_amount ??
        0;

      const megVal =
        row.total_amount_raised_mega_deals ??
        row.total_amount_raised_mega ??
        row.total_mega ??
        row.mega_amount ??
        0;

      const totalVal = row.total_amount_raised ?? row.totalRaised ?? row.amount ?? regVal + megVal;
      const dealsVal = row.num_of_deals ?? row.num_deals ?? row.deals ?? row.deals_count ?? 0;

      // set into per-country objects (GroupedChart uses these keys)
      regular[country] = regVal;
      mega[country] = megVal;
      values[country] = totalVal;
      counts[country] = dealsVal;
    });

    return { year: y, regular, mega, values, counts };
  });

  const singleCountry = selected.length === 1 ? selected[0] : null;
  const rawData = singleCountry ? dataByCountry[singleCountry] || [] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Interactive Analytics Dashboard
        </h1>

        <div>
          <Filters
            options={AVAILABLE.map((a) => a.key)}
            selected={selected}
            onChange={setSelected}
          />
        </div>

        <div className="flex gap-6 mt-4">
          <div className="flex-1">
            {loading && <div className="mb-2 text-gray-500">Loading data...</div>}
            <Chart
              rawData={rawData}
              countryName={singleCountry}
              data={singleCountry ? null : chartData}
              countries={selected}
              colors={COLORS}
              height={440}
              width={1200}
            />
          </div>
        </div>
      </div>
    </div>
  );
}