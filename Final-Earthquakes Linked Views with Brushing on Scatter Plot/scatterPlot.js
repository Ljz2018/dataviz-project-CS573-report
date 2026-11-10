import {
  extent,
  scaleLinear,
  scaleTime,
  scaleOrdinal,
  brushX,
  timeFormat,
} from 'd3';
import { axes } from './axes';
import { colorLegend } from './colorLegend';

export const scatterPlot = (
  selection,
  {
    earthquakes,
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
    state,
    setState,
  },
) => {
  const xScale = scaleTime()
    .domain(extent(earthquakes, xValue))
    .range([margin.left, width - margin.right]);

  const yScale = scaleLinear()
    .domain(extent(earthquakes, yValue))
    .range([height - margin.bottom, margin.top]);

  selection.call(axes, {
    xScale,
    yScale,
    xAxisLabel,
    yAxisLabel,
  });
  //change tickformat to mm-dd-yyyy
  xScale.tickFormat(timeFormat('%m-%d-%Y'));

  // Categorize the depth values
  function categorizeDepth(depth) {
    if (depth < 70) {
      return 'Shallow: depth < 70km';
    } else if (depth < 300) {
      return 'Intermediate: 70km ≤ depth < 300km';
    } else {
      return 'Deep: depth ≥ 300km';
    }
  }
  earthquakes.forEach((d) => {
    d.depthCategory = categorizeDepth(d.depth);
    //console.log(d.depth);
    //console.log(d.depthCategory);
  });
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
    // setHoveredValue,
    // hoveredValue,
  });

  earthquakes.forEach((d, i) => {
    d.id = i;
  });

  selection
    .selectAll('circle.mark')
    .data(earthquakes)
    .join('circle')
    .attr('class', 'mark')
    .attr('cx', (d) => xScale(xValue(d)))
    .attr('cy', (d) => yScale(yValue(d)))
    .attr('fill', (d) => colorScale(d.depthCategory))
    .attr('r', 4)
    .attr('opacity', (d) =>
      brushInterval
        ? brushInterval.has(d.id)
          ? 0.7
          : 0.2
        : 0.7,
    );
  // .attr('stroke', (d) =>
  //   brushInterval && brushInterval.has(d.id)
  //     ? 'black'
  //     : 'none',
  // )
  // .attr('stroke-width', 2)
  // .attr('opacity', (d) =>
  //   hoveredValue
  //     ? colorValue(d) === hoveredValue
  //       ? 1
  //       : 0.2
  //     : 0.7,
  // );

  const brushG = selection
    .selectAll('g.brush')
    .data(earthquakes)
    .join('g')
    .attr('class', 'brush');

  const brush = brushX()
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .on('brush', (event) => {
      //define brush area:
      const [x0, x1] = event.selection;
      //const [x0, x1] = event.selection.map(xScale.invert);

      const newbrushInterval = new Set();

      for (const d of earthquakes) {
        const x = xScale(xValue(d));
        if (x >= x0 && x <= x1) {
          newbrushInterval.add(d.id);
        }
      }
      setState((state) => ({
        ...state,
        brushInterval: newbrushInterval,
      }));
    })
    .on('end', (event) => {
      if (event.selection === null) {
        setState((state) => ({
          ...state,
          brushInterval: null,
        }));
      }
    });

  brushG.call(brush);
};
