"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import useTooltip from "./useTooltip";
import { fmtMoney } from "../../utils/commonfunction";

export default function GroupedChart({
  data = [],
  countries = [],
  colors = {},
  width = 1000,
  height = 460,
}) {
  const ref = useRef(null);
  const tooltip = useTooltip();
  const margin = { top: 64, right: 160, bottom: 72, left: 80 }; // increased top margin to fit legend

  function getColorsForCountry(country) {
    const fallbackRegular = "#14532d";
    const base = colors && colors[country] ? colors[country] : fallbackRegular;
    let c;
    try {
      c = d3.color(base) || d3.color(fallbackRegular);
    } catch {
      c = d3.color(fallbackRegular);
    }
    const megaC = c ? c.darker(0.8) : d3.color("#6b7280");
    const rgb = c ? c.rgb() : d3.color(fallbackRegular).rgb();
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    const labelColor = lum < 0.6 ? "#ffffff" : "#111827";
    return {
      regularColor: c.toString(),
      megaColor: megaC.toString(),
      labelColor,
    };
  }

  // vertical offset (pixels) between top of bar and the total label
  const TOP_TOTAL_OFFSET = 12;

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    if (!data || data.length === 0 || !countries || countries.length === 0) {
      svg.append("text").text("No data to display").attr("x", 10).attr("y", 20);
      return;
    }

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // root group for chart (all coords below are relative to this group)
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const years = data.map((d) => d.year);
    const x0 = d3.scaleBand().domain(years).range([0, innerW]).padding(0.16);
    const x1 = d3.scaleBand().domain(countries).range([0, x0.bandwidth()]).padding(0.06);

    const maxAmount =
      d3.max(data, (d) =>
        d3.max(countries, (c) => {
          const reg = d.regular?.[c] ?? 0;
          const meg = d.mega?.[c] ?? 0;
          const val = d.values?.[c] ?? reg + meg;
          return val || 0;
        })
      ) || 0;

    const yLeft = d3.scaleLinear().domain([0, maxAmount * 1.12]).range([innerH, 0]);

    const maxCount =
      d3.max(data, (d) => d3.max(countries, (c) => d.counts?.[c] ?? 0)) || 0;
    const aggregatedMaxCount =
      d3.max(data, (d) => countries.reduce((s, c) => s + (d.counts?.[c] ?? 0), 0)) || 0;
    const yRightMax = Math.max(maxCount, aggregatedMaxCount);
    const yRight = d3.scaleLinear().domain([0, Math.max(1, Math.ceil(yRightMax * 1.2))]).range([innerH, 0]);

    // draw axes
    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x0));
    g.append("g").call(d3.axisLeft(yLeft).ticks(6).tickFormat(fmtMoney));
    g.append("g").attr("transform", `translate(${innerW},0)`).call(d3.axisRight(yRight).ticks(6));

    // draw bars and keep tooltips
    const yearGroups = g
      .selectAll(".year-group")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${x0(d.year)},0)`);

    yearGroups.each(function (dRow) {
      const gg = d3.select(this);

      countries.forEach((country) => {
        const hasRegular = !!(dRow.regular && Object.prototype.hasOwnProperty.call(dRow.regular, country));
        const hasMega = !!(dRow.mega && Object.prototype.hasOwnProperty.call(dRow.mega, country));
        const reg = hasRegular ? dRow.regular?.[country] ?? 0 : 0;
        const meg = hasMega ? dRow.mega?.[country] ?? 0 : 0;
        const totalFromValues = dRow.values && Object.prototype.hasOwnProperty.call(dRow.values, country) ? dRow.values[country] : undefined;
        const total = typeof totalFromValues === "number" ? totalFromValues : reg + meg;

        const bw = x1.bandwidth();

        const { regularColor, megaColor } = getColorsForCountry(country);

        if ((hasRegular || hasMega) && (reg || meg)) {
          // regular rect (bottom)
          const regY = yLeft(reg);
          const regH = Math.max(0, yLeft(0) - regY);
          gg.append("rect")
            .attr("x", x1(country))
            .attr("y", regY)
            .attr("width", bw)
            .attr("height", regH)
            .attr("fill", regularColor)
            .on("mousemove", (event) =>
              tooltip.showTooltip(
                event,
                `${country} ${dRow.year}<br/>Regular: ${fmtMoney(reg)}`
              )
            )
            .on("mouseout", tooltip.hideTooltip);

          // mega rect (stacked on top)
          const topValue = reg + meg;
          const megaY = yLeft(topValue);
          // compute megaH properly
          const computedMegaH = Math.max(0, regY - megaY);
          // append mega rect with correct height
          gg.append("rect")
            .attr("x", x1(country))
            .attr("y", megaY)
            .attr("width", bw)
            .attr("height", computedMegaH)
            .attr("fill", megaColor)
            .on("mousemove", (event) =>
              tooltip.showTooltip(
                event,
                `${country} ${dRow.year}<br/>Mega: ${fmtMoney(meg)}`
              )
            )
            .on("mouseout", tooltip.hideTooltip);

          // show total_amount_raised above the full stacked bar
          if (reg || meg || total) {
            const xPos = x1(country);
            const topOfBarY = yLeft(topValue);
            const labelY = Math.max(12, topOfBarY - TOP_TOTAL_OFFSET); // spacing above bar
            gg.append("text")
              .attr("x", xPos + bw / 2)
              .attr("y", labelY)
              .attr("text-anchor", "middle")
              .attr("font-size", 11)
              .attr("font-weight", 700)
              .attr("fill", "#111827")
              .text(fmtMoney(total));
          }
        } else {
          // single total bar
          const barTop = yLeft(total);
          const barH = Math.max(0, innerH - barTop);
          const barFill = colors?.[country] ?? "#888";
          gg.append("rect")
            .attr("x", x1(country))
            .attr("y", barTop)
            .attr("width", bw)
            .attr("height", barH)
            .attr("fill", barFill)
            .on("mousemove", (event) =>
              tooltip.showTooltip(event, `${country} ${dRow.year}<br/>Amount: ${fmtMoney(total)}`)
            )
            .on("mouseout", tooltip.hideTooltip);

          // show total above the single bar
          if (total) {
            const labelY = Math.max(12, barTop - TOP_TOTAL_OFFSET);
            gg.append("text")
              .attr("x", x1(country) + bw / 2)
              .attr("y", labelY)
              .attr("text-anchor", "middle")
              .attr("font-size", 11)
              .attr("font-weight", 700)
              .attr("fill", "#111827")
              .text(fmtMoney(total));
          }
        }
      });
    });

    // per-country lines for counts (draw without numeric labels) - still present
    countries.forEach((country) => {
      const points = data.map((d) => ({ year: d.year, count: d.counts?.[country] ?? 0 }));
      const line = d3
        .line()
        .x((p) => x0(p.year) + x0.bandwidth() / 2)
        .y((p) => yRight(p.count))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", colors[country] || "#222")
        .attr("stroke-width", 1.25)
        .attr("opacity", 0.85)
        .attr("d", line);

      // dots remain for hover tooltips, labels removed
      points.forEach((p) => {
        const cx = x0(p.year) + x0.bandwidth() / 2;
        const cy = yRight(p.count);
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 3.5)
          .attr("fill", colors[country] || "#222")
          .on("mousemove", (event) => tooltip.showTooltip(event, `${country} ${p.year}<br/>Deals: ${p.count}`))
          .on("mouseout", tooltip.hideTooltip);
      });
    });

    // axis legends
    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", margin.top + innerH + margin.bottom - 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#111827")
      .attr("font-weight", 700)
      .attr("font-size", 13)
      .text("Year");

    {
      const lx = margin.left - 56;
      const ly = margin.top + innerH / 2;
      svg
        .append("text")
        .attr("x", lx)
        .attr("y", ly)
        .attr("transform", `rotate(-90, ${lx}, ${ly})`)
        .attr("text-anchor", "middle")
        .attr("fill", "#111827")
        .attr("font-weight", 700)
        .attr("font-size", 13)
        .text("Amount");
    }

    {
      const rx = margin.left + innerW + 56;
      const ry = margin.top + innerH / 2;
      svg
        .append("text")
        .attr("x", rx)
        .attr("y", ry)
        .attr("transform", `rotate(90, ${rx}, ${ry})`)
        .attr("text-anchor", "middle")
        .attr("fill", "#111827")
        .attr("font-weight", 700)
        .attr("font-size", 13)
        .text("Deals");
    }

    // TOP-CENTER dynamic legend per selected country: horizontal swatches (regular then mega)
    const topLegend = svg.append("g").attr("class", "top-legend");
    const swatchSize = 14;
    const gap = 28; // gap between legend items
    const labelGap = 12; // gap between swatches and country name
    // compute width per item: two swatches + gaps + approx label width
    const approxLabelWidth = 72;
    const itemWidth = swatchSize * 2 + labelGap + approxLabelWidth;
    const totalLegendWidth = countries.length * itemWidth + Math.max(0, countries.length - 1) * gap;
    const startX = margin.left + Math.max(0, (innerW - totalLegendWidth) / 2);
    const yOff = 8; // top padding inside svg

    countries.forEach((country, i) => {
      const { regularColor, megaColor } = getColorsForCountry(country);
      const xOff = startX + i * (itemWidth + gap);

      const sw = topLegend.append("g").attr("transform", `translate(${xOff}, ${yOff})`);

      // regular swatch (left)
      sw.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", swatchSize)
        .attr("height", swatchSize)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", regularColor);

      // mega swatch (right of regular)
      sw.append("rect")
        .attr("x", swatchSize + 6)
        .attr("y", 0)
        .attr("width", swatchSize)
        .attr("height", swatchSize)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("fill", megaColor);

      // country label to the right of swatches
      sw.append("text")
        .attr("x", swatchSize * 2 + labelGap)
        .attr("y", swatchSize / 2 + 4) // vertical center
        .attr("text-anchor", "start")
        .attr("font-size", 12)
        .attr("font-weight", 600)
        .attr("fill", "#111827")
        .text(country);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, countries, colors, width, height, tooltip]);

  return <svg ref={ref} />;
}