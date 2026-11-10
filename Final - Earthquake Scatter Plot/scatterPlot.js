import {
  extent,
  scaleLinear,
  scaleTime,
  scaleOrdinal,
} from 'd3';
import { axes } from './axes';
import { colorLegend } from './colorLegend';

export const scatterPlot = (
  selection,
  {
    data,
    width,
    height,
    xValue,
    yValue,
    colorValue,
    margin,
    xAxisLabel,
    yAxisLabel,

    colorLegendLabel,
    colorLegendX,
    colorLegendY,
    setHoveredValue,
    hoveredValue,
    brushInterval,
  },
) => {
  const xScale = scaleTime()
    .domain(extent(data, xValue))
    .range([margin.left, width - margin.right]);

  const yScale = scaleLinear()
    .domain(extent(data, yValue))
    .range([height - margin.bottom, margin.top]);

  selection.call(axes, {
    xScale,
    yScale,
    xAxisLabel,
    yAxisLabel,
  });

  // // Categorize the depth values
  // function categorizeDepth(depth) {
  //   if (depth < 70) {
  //     return 'Shallow: depth < 70km';
  //   } else if (depth < 300) {
  //     return 'Intermediate: 70km ≤ depth < 300km';
  //   } else {
  //     return 'Deep: depth ≥ 300km';
  //   }
  // }
  // data.forEach((d) => {
  //   d.depthCategory = categorizeDepth(d.depth);
  //   //console.log(d.depth);
  //   //console.log(d.depthCategory);
  // });
  // assign color according to categorizeDepth(d.depth).
  const colorScale = scaleOrdinal()
    .domain([
      'Shallow: depth < 70km',
      'Intermediate: 70km ≤ depth < 300km',
      'Deep: depth ≥ 300km',
    ])
    .range(['red', 'blue', 'green']);

  selection.call(colorLegend, {
    colorScale,
    colorLegendLabel,
    colorLegendX,
    colorLegendY,
    setHoveredValue,
    hoveredValue,
  });

  selection
    .selectAll('circle.mark')
    .data(data)
    .join('circle')
    .attr('class', 'mark')
    .attr('cx', (d) => xScale(xValue(d)))
    .attr('cy', (d) => yScale(yValue(d)))
    .attr('fill', (d) => colorScale(d.depthCategory))
    .attr('r', 4)
    .attr('stroke', (d) =>
      brushInterval && brushInterval.has(d.id)
        ? 'black'
        : 'none',
    )
    .attr('stroke-width', 5)
    .attr('opacity', (d) =>
      hoveredValue
        ? colorValue(d) === hoveredValue
          ? 1
          : 0.2
        : 0.7,
    );
};
