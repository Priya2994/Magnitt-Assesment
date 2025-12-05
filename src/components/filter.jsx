
import React from "react";
export default function Filters({
  options = [],
  selected = [],
  onChange,
}) {
  function toggle(option) {
    const exists = selected.includes(option);
    if (exists) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Row 1: filters | conditional (countries OR legend) */}
      <div className="flex flex-wrap items-start gap-6">
        {/* Filters (left, flexible) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Country filter</h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <label
                  key={opt}
                  htmlFor={`filter-${opt}`}
                  className={`cursor-pointer select-none flex items-center gap-3 px-4 py-2 rounded-lg border transition-shadow duration-150 whitespace-nowrap
                    ${active ? "bg-gray-50 border-gray-300 shadow-sm" : "bg-white border-gray-200 hover:shadow-sm"}`}
                >
                  <input
                    id={`filter-${opt}`}
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(opt)}
                    className="sr-only"
                    aria-checked={active}
                  />

                  <span
                    className={`shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-md border transition-colors
                      ${active ? "bg-gray-600 border-gray-600 text-white" : "bg-white border-gray-300 text-transparent"}`}
                    aria-hidden="true"
                  >
                    {active && (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>

                  <span className="text-sm text-slate-800">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}