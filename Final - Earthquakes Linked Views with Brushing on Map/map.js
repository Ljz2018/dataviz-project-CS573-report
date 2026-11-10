import {
  geoEquirectangular,
  geoNaturalEarth1,
  geoPath,
  geoGraticule,
  scaleOrdinal,
  select,
  utcFormat,
  brush,
  zoom,
  zoomIdentity,
} from 'd3';
import { colorLegend } from './colorLegend';

const projection = geoEquirectangular();
const path = geoPath(projection);
const graticule = geoGraticule();

export const map = (
  selection,
  {
    countries,
    tectonic,
    earthquakes,
    rotation,
    scale,
    translation,
    transform,
    xColumn,
    yColumn,
    width,
    height,
    margin,
    brushInterval,
    state,
    setState,
    colorLegendLabel,
    colorLegendX,
    colorLegendY,
  },
) => {
  projection.rotate(rotation).fitExtent(
    [
      [margin, margin],
      [width - margin, height - margin],
    ],
    { type: 'Sphere' },
  );
  selection
    .selectAll('path.graticule')
    .data([null])
    .join('path')
    .attr('class', 'graticule')
    .attr('d', path(graticule()))
    .attr('fill', 'none')
    .attr('stroke', '#BBB')
    .attr('stroke-width', 0.5);

  selection
    .selectAll('path.outline')
    // .data([null])
    .data([{ type: 'Sphere' }])
    .join('path')
    .attr('class', 'outline')
    // .attr('d', path(graticule.outline()))
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 2);

  selection
    .selectAll('path.country')
    .data(countries.features)
    .join('path')
    .attr('d', path)
    .attr('class', 'country')
    .attr('fill', '#d7d9d9b8')
    .attr('stroke', 'black')
    .attr('stroke-width', 1);

  //draw tectonic plate boundaries
  selection
    .selectAll('path.tectonic')
    .data(tectonic.features)
    .join('path')
    .attr('d', path)
    .attr('class', 'tectonic')
    .attr('fill', 'none')
    .attr('stroke', 'orange')
    .attr('stroke-width', 3);

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
  });

  // Categorize the magnitude values
  //2.5 or less
  //2.5 to 5.4
  //5.5 to 6.0
  //6.0 to 6.9
  //7.0 to 7.9
  //8.0 or greater
  function categorizeMag(mag) {
    if (mag <= 2.5) {
      return '2.5 or less';
    } else if (mag > 2.5 && mag <= 5.4) {
      return '2.5 to 5.4';
    } else if (mag > 5.4 && mag <= 6.0) {
      return '5.5 to 6.0';
    } else if (mag > 6.0 && mag <= 6.9) {
      return '6.1 to 6.9';
    } else if (mag > 6.9 && mag <= 7.9) {
      return '7.0 to 7.9';
    } else if (mag > 7.9) {
      return '8.0 or greater';
    }
  }

  earthquakes.forEach((d) => {
    d.magCategory = categorizeMag(d.mag);
  });

  //project earthquakes according to graticules
  for (const d of earthquakes) {
    const [x, y] = projection([d.longitude, d.latitude]);
    d.x = x;
    d.y = y;
  }
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

  //plot earthquakes on the map
  selection
    .selectAll('a')
    .data(earthquakes)
    .join((enter) =>
      enter.append('a').call((selection) => {
        selection.append('circle');
      }),
    )
    .attr('href', (d) => d.url)
    // Open in a new tab
    .attr('target', '_blank')
    .select('circle')
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('r', (d) => Math.pow(1.4, d.mag))
    .attr('fill', (d) => colorScale(d.depthCategory))
    .attr('stroke', 'black')
    .attr('stroke-width', 0.5)
    .on('mouseover', function (event, d) {
      select(this).attr('fill', 'yellow');
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
      select(this).attr('fill', (d) =>
        colorScale(d.depthCategory),
      );
      tooltip.style('visibility', 'hidden');
    });
  //change opacity based on both xColumn and yColumn in dropdown menus
  // .attr('opacity', (d) => {
  //   if (
  //     xColumn === 'Choose Depth' &&
  //     yColumn === 'Choose Magnitude'
  //   ) {
  //     return 1;
  //   } else if (xColumn === 'Choose Depth') {
  //     return d.magCategory === yColumn ? 1 : 0.1;
  //   } else if (yColumn === 'Choose Magnitude') {
  //     return d.depthCategory === xColumn ? 1 : 0.1;
  //   } else {
  //     return d.depthCategory === xColumn &&
  //       d.magCategory === yColumn
  //       ? 1
  //       : 0.1;
  //   }
  // });
  // .attr('visibility', (d) => {
  //   if (
  //     xColumn === 'Choose Depth' &&
  //     yColumn === 'Choose Magnitude'
  //   ) {
  //     return 'visible';
  //   } else if (xColumn === 'Choose Depth') {
  //     return d.magCategory === yColumn
  //       ? 'visible'
  //       : 'hidden';
  //   } else if (yColumn === 'Choose Magnitude') {
  //     return d.depthCategory === xColumn
  //       ? 'visible'
  //       : 'hidden';
  //   } else {
  //     return d.depthCategory === xColumn &&
  //       d.magCategory === yColumn
  //       ? 'visible'
  //       : 'hidden';
  //   }
  // });
  const brushG = selection
    .selectAll('g.brush')
    .data(earthquakes)
    .join('g')
    .attr('class', 'brush');

  const brushBehavior = brush()
    .extent([
      [margin, margin],
      [width, height],
    ])
    .on('brush', (event) => {
      //define brush area:
      const [[x0, y0], [x1, y1]] = event.selection;

      const newbrushInterval = new Set();

      for (const d of earthquakes) {
        if (
          d.x >= x0 &&
          d.x <= x1 &&
          d.y >= y0 &&
          d.y <= y1
        ) {
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

  brushG.call(brushBehavior);
  //how to make brushtool to zoom in the brushed area
  // const zoomBehavior = zoom()
  //   .scaleExtent([1, 8])
  //   .on('zoom', (event) => {
  //     selection
  //       .selectAll('circle')
  //       .attr('transform', event.transform);

  //     selection
  //       .selectAll('path')
  //       .attr('transform', event.transform);
  //   });

  // brushBehavior.on('end', (event) => {
  //   if (!event.selection) {
  //     return;
  //   }

  //   const [[x0, y0], [x1, y1]] = event.selection;
  //   event.selection = null;

  //   const dx = x1 - x0,
  //     dy = y1 - y0,
  //     x = (x0 + x1) / 2,
  //     y = (y0 + y1) / 2,
  //     scale = Math.max(
  //       1,
  //       Math.min(
  //         8,
  //         0.9 / Math.max(dx / width, dy / height),
  //       ),
  //     ),
  //     translate = [
  //       width / 2 - scale * x,
  //       height / 2 - scale * y,
  //     ];

  //   selection
  //     .transition()
  //     .duration(750)
  //     .call(
  //       zoomBehavior.transform,
  //       zoomIdentity
  //         .translate(translate[0], translate[1])
  //         .scale(scale),
  //     );
  // });

  // selection.call(zoomBehavior);
  //add zoom
  // const zoomBehavior = zoom()
  //   .scaleExtent([1, 5])
  //   .translateExtent([
  //     [0, 0],
  //     [width, height],
  //   ])
  //   .on('zoom', (event) => {
  //     const { transform } = event;
  //     selection
  //       .selectAll('path')
  //       .attr('transform', transform);
  //     selection
  //       .selectAll('circle')
  //       .attr('transform', transform);
  //   });

  // selection.call(zoomBehavior);
};
