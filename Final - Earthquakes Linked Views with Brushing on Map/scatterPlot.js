import {
  extent,
  scaleLinear,
  scaleTime,
  scaleOrdinal,
  brushX,
  timeFormat,
  select,
  utcFormat,
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

  earthquakes.forEach((d, i) => {
    d.id = i;
  });
  // Create a tooltip.
  const tooltip = select('body')
    .append('div')
    .attr('class', 'earthquake-tooltip')
    .style('position', 'absolute')
    .style('background-color', 'white')
    .style('border', 'solid')
    .style('border-width', '2px')
    .style('border-radius', '5px')
    .style('padding', '5px')
    .style('visibility', 'hidden');
  selection
    .selectAll('circle.mark')
    .data(earthquakes)
    .join('circle')
    .attr('class', 'mark')
    .attr('cx', (d) => xScale(xValue(d)))
    .attr('cy', (d) => yScale(yValue(d)))
    .attr('fill', (d) => colorScale(d.depthCategory))
    .attr('r', 4)
    .attr('opacity', 0.7)
    .attr('visibility', (d) =>
      brushInterval
        ? brushInterval.has(d.id)
          ? 'visible'
          : 'hidden'
        : 'visible',
    )
    .on('mouseover', function (event, d) {
      select(this)
        .attr('stroke', 'black')
        .attr('stroke-width', 2);
      tooltip.style('visibility', 'visible');
    })
    .on('mousemove', function (event, d) {
      tooltip
        .html(
          'Magnitude ' +
            d.mag +
            ' earthquake' +
            '<br>' +
            'Location: ' +
            d.place +
            '<br>' +
            'Time: ' +
            //how to convert 1712102291228 to  2024-04-02 23:58:11 (UTC)
            utcFormat('%Y-%m-%d %H:%M:%S (UTC)')(
              new Date(d.time),
            ) +
            '<br>' +
            'Depth: ' +
            d.depth +
            ' km',
        )
        .style('top', event.pageY - 10 + 'px')
        .style('left', event.pageX + 10 + 'px');
    })
    .on('mouseout', function (d) {
      select(this).attr('stroke', null);
      tooltip.style('visibility', 'hidden');
    });
};
