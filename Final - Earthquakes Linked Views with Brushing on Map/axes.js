import { axisLeft, axisBottom, timeFormat } from 'd3';
const xAxisTickFormat = timeFormat('%m/%d/%Y');
export const axes = (
  selection,
  {
    xScale,
    yScale,
    xAxisLabel,
    yAxisLabel,
    xAxisLabelOffset = 25,
    yAxisLabelOffset = 30,
  },
) => {
  selection
    .selectAll('g.y-axis')
    .data([null])
    .join('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${xScale.range()[0]},0)`)
    .call(axisLeft(yScale));

  selection
    .selectAll('g.x-axis')
    .data([null])
    .join('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${yScale.range()[0]})`)
    .call(axisBottom(xScale).ticks(5))
    .attr('tickFormat', xAxisTickFormat);

  selection
    .selectAll('text.x-axis-label')
    .data([null])
    .join('text')
    .attr('x', (xScale.range()[0] + xScale.range()[1]) / 2)
    .attr('y', yScale.range()[0] + xAxisLabelOffset)
    .attr('class', 'x-axis-label')
    .attr('alignment-baseline', 'hanging')
    .attr('text-anchor', 'middle')
    .attr('font-family', 'sans-serif')
    .text(xAxisLabel)
    .attr('tickFormat', xAxisTickFormat);

  selection
    .selectAll('text.y-axis-label')
    .data([null])
    .join('text')
    .attr('class', 'y-axis-label')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('font-family', 'sans-serif')
    .attr('x', -(yScale.range()[0] + yScale.range()[1]) / 2)
    .attr('y', xScale.range()[0] - yAxisLabelOffset)
    .text(yAxisLabel);
};
