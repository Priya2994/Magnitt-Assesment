import React from "react";
import SingleStackedChart from "./SingleStackedChart";
import GroupedChart from "./GroupChart";

export default function BarChart(props) {
  const { rawData } = props;

  return (
    <div className="border border-gray-200 rounded p-2 bg-white flex justify-center">
      {rawData && rawData.length ? (
        <SingleStackedChart {...props} />
      ) : (
        <GroupedChart {...props} />
      )}
    </div>
  );
}
