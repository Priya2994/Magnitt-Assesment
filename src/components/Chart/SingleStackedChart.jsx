"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { fmtMoney } from "../../utils/commonfunction";
import useTooltip from "./useTooltip";

export default function SingleStackedChart({
  rawData = [],
  width = 900,
  height = 420,
}) {
  const ref = useRef(null);
  const tooltip = useTooltip();
  // margins: increased top to make room for horizontal legend
  const margin = { top: 64, right: 120, bottom: 60, left: 64 };

  // vertical offset (pixels) between top of bar and the total label
  const TOP_TOTAL_OFFSET = 20;

  useEffect(() => {
    if (!rawData || rawData.length === 0) {
      d3.select(ref.current).selectAll("*").remove();
      return;
    }

    const svg = d3.select(ref.current);
    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const rows = rawData.slice().sort((a, b) => a.year - b.year);
    const years = rows.map((r) => String(r.year));

    const x = d3.scaleBand().domain(years).range([0, innerW]).padding(0.28);
    const maxAmount = d3.max(rows, (r) => r.total_amount_raised) || 0;
    const yLeft = d3
      .scaleLinear()
      .domain([0, maxAmount * 1.15])
      .range([innerH, 0]);

    const maxCount = d3.max(rows, (r) => r.num_of_deals) || 0;
    const yRight = d3
      .scaleLinear()
      .domain([0, Math.max(1, Math.ceil(maxCount * 1.2))])
      .range([innerH, 0]);

    // axes
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(yLeft).ticks(5).tickFormat(fmtMoney));
    g.append("g")
      .attr("transform", `translate(${innerW},0)`)
      .call(d3.axisRight(yRight).ticks(5));

    // bars + labels (regular / mega) and TOTAL label above each bar
    rows.forEach((d) => {
      const xPos = x(String(d.year));
      const bw = x.bandwidth();
      const regular = d.total_amount_raised_regular_deals || 0;
      const mega = d.total_amount_raised_mega_deals || 0;
      // prefer explicit total_amount_raised if provided, otherwise sum regular+mega
      const total = d.total_amount_raised ?? regular + mega;

      // compute heights for internal label placement decisions
      const regularHeight = Math.max(0, yLeft(0) - yLeft(regular));

      // regular rect
      g.append("rect")
        .attr("x", xPos)
        .attr("y", yLeft(regular))
        .attr("width", bw)
        .attr("height", regularHeight)
        .attr("fill", "#14532d")
        .on("mousemove", (event) =>
          tooltip.showTooltip(
            event,
            `${d.year}<br/>Regular: ${fmtMoney(regular)}`
          )
        )
        .on("mouseout", tooltip.hideTooltip);

      // regular label (inside if enough vertical space, otherwise above)
      const regularLabelInside = regularHeight > 20;
      const regularLabelY = regularLabelInside
        ? yLeft(regular) + regularHeight / 2 + 5
        : yLeft(regular) - 6;
      g.append("text")
        .attr("x", xPos + bw / 2)
        .attr("y", regularLabelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", 700)
        .attr("fill", regularLabelInside ? "#ffffff" : "#14532d")
        .text(fmtMoney(regular));

      // mega rect (stacked on top of regular)
      const topValue = regular + mega;
      const megaTopY = yLeft(topValue);
      const computedMegaH = Math.max(0, yLeft(regular) - megaTopY);

      g.append("rect")
        .attr("x", xPos)
        .attr("y", megaTopY)
        .attr("width", bw)
        .attr("height", computedMegaH)
        .attr("fill", "#262626")
        .on("mousemove", (event) =>
          tooltip.showTooltip(event, `${d.year}<br/>Mega: ${fmtMoney(mega)}`)
        )
        .on("mouseout", tooltip.hideTooltip);

      // mega label (inside if enough vertical space, otherwise above)
      const megaLabelInside = computedMegaH > 20;
      const megaLabelY = megaLabelInside
        ? megaTopY + computedMegaH / 2 + 5
        : megaTopY - 6;
      g.append("text")
        .attr("x", xPos + bw / 2)
        .attr("y", megaLabelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", 700)
        .attr("fill", megaLabelInside ? "#ffffff" : "#111827")
        .text(fmtMoney(mega));

      // TOTAL label: show total_amount_raised above the full stacked bar
      if (total) {
        const topOfBarY = yLeft(total); // using total to compute top (covers cases where total != regular+mega)
        const labelY = Math.max(12, topOfBarY - TOP_TOTAL_OFFSET);
        g.append("text")
          .attr("x", xPos + bw / 2)
          .attr("y", labelY)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", 800)
          .attr("fill", "#111827")
          .text(fmtMoney(total));
      }
    });

    // deals line
    const line = d3
      .line()
      .x((d) => x(String(d.year)) + x.bandwidth() / 2)
      .y((d) => yRight(d.num_of_deals || 0))

    g.append("path")
      .datum(rows)
      .attr("fill", "none")
      .attr("stroke", "#FF9F1A")
      .attr("stroke-width", 2)
      .attr("d", line);

    g.selectAll(".dot")
      .data(rows)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(String(d.year)) + x.bandwidth() / 2)
      .attr("cy", (d) => yRight(d.num_of_deals || 0))
      .attr("r", 4)
      .attr("fill", "#FF9F1A")
      .on("mousemove", (event, d) =>
        tooltip.showTooltip(event, `${d.year}<br/>Deals: ${d.num_of_deals}`)
      )
      .on("mouseout", tooltip.hideTooltip);

    // deal count labels above each dot
    // g.selectAll(".deal-label")
    //   .data(rows)
    //   .enter()
    //   .append("text")
    //   .attr("x", (d) => x(String(d.year)) + x.bandwidth() / 2)
    //   .attr("y", (d) => yRight(d.num_of_deals || 0) - 10)
    //   .attr("text-anchor", "middle")
    //   .attr("font-size", "12px")
    //   .attr("font-weight", 700)
    //   .attr("fill", "#111827")
    //   .text((d) => (d.num_of_deals != null ? d.num_of_deals : ""));

    // axis legend labels
    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", margin.top + innerH + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#111827")
      .attr("font-weight", 600)
      .attr("font-size", 14)
      .text("Year");

    {
      const lx = margin.left - 48;
      const ly = margin.top + innerH / 2;
      svg
        .append("text")
        .attr("x", lx)
        .attr("y", ly)
        .attr("transform", `rotate(-90, ${lx}, ${ly})`)
        .attr("text-anchor", "middle")
        .attr("fill", "#111827")
        .attr("font-weight", 600)
        .attr("font-size", 14)
        .text("Amount");
    }

    {
      const rx = margin.left + innerW + 48;
      const ry = margin.top + innerH / 2;
      svg
        .append("text")
        .attr("x", rx)
        .attr("y", ry)
        .attr("transform", `rotate(90, ${rx}, ${ry})`)
        .attr("text-anchor", "middle")
        .attr("fill", "#111827")
        .attr("font-weight", 600)
        .attr("font-size", 14)
        .text("Deals");
    }

    // Series legend (horizontal, top of chart)
    const legendData = [
      { label: "Regular", color: "#14532d" },
      { label: "Mega", color: "#262626" },
      { label: "Deals (line)", color: "#FF9F1A" },
    ];

    const swatchSize = 14;
    const itemGap = 24;
    const textGap = 8;
    const approxLabelWidth = 110; // approximate width reserved per item (swatch + text)
    const itemWidth = swatchSize + textGap + approxLabelWidth;
    const totalLegendWidth = legendData.length * itemWidth + (legendData.length - 1) * itemGap;
    const legendStartX = margin.left + Math.max(0, (innerW - totalLegendWidth) / 2);
    const legendY = 12; // distance from top of svg

    const legend = svg.append("g").attr("transform", `translate(${legendStartX}, ${legendY})`);

    legendData.forEach((item, i) => {
      const xOff = i * (itemWidth + itemGap);
      const group = legend.append("g").attr("transform", `translate(${xOff}, 0)`);

      // swatch
      group
        .append("rect")
        .attr("x", 0)
        .attr("y", -swatchSize / 2)
        .attr("width", swatchSize)
        .attr("height", swatchSize)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", item.color);

      // label
      group
        .append("text")
        .attr("x", swatchSize + textGap)
        .attr("y", 0)
        .attr("alignment-baseline", "middle")
        .attr("font-size", 14)
        .attr("font-weight", 600)
        .attr("fill", "#111827")
        .text(item.label);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData, width, height, tooltip]);

  return <svg ref={ref} />;
}