import { select, json, isoParse } from 'd3';
import { scatterPlot } from './scatterPlot';
import { observeResize } from './observeResize';

const earthquakeJSON =
  // //past 30 days data
  //'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
  //past 7 days data
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

export const main = (container, { state, setState }) => {
  const dimensions = observeResize({
    state,
    setState,
    container,
  });

  if (dimensions === null) return;

  const { width, height } = dimensions;

  const { data, hoveredValue, brushInterval } = state;

  const svg = select(container)
    .selectAll('svg')
    .data([null])
    .join('svg')
    .attr('width', width)
    .attr('height', height);

  // Initialize the earthquakes
  if (data === undefined || data === 'LOADING') {
    if (data === undefined) {
      setState((state) => ({
        ...state,
        data: 'LOADING',
      }));
      json(earthquakeJSON).then((earthquakeJSONData) => {
        const data = earthquakeJSONData.features.map(
          (feature) => {
            return {
              latitude: feature.geometry.coordinates[1],
              longitude: feature.geometry.coordinates[0],
              depth: feature.geometry.coordinates[2],
              sig: feature.properties.sig,
              time: feature.properties.time,
              //convert time to 2024-01-23T18:14:49.090Z
              date: new Date(
                feature.properties.time,
              ).toISOString(),

              mag: feature.properties.mag,
              url: feature.properties.url,
              place: feature.properties.place,
            };
          },
        );
        setState((state) => ({
          ...state,
          data,
        }));
      });
    }
    return;
  }
  //console.log(data);
  data.forEach((d, i) => {
    d.id = i;
  });
  const idValue = (d) => d.id;
  const xValue = (d) => d.time;

  const setHoveredValue = (d) => {
    setState((state) => ({
      ...state,
      hoveredValue: d,
    }));
  };
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
  data.forEach((d) => {
    d.depthCategory = categorizeDepth(d.depth);
    //console.log(d.depth);
    //console.log(d.depthCategory);
  });
  svg.call(scatterPlot, {
    data,
    width,
    height,
    xValue: (d) => isoParse(d.date),
    yValue: (d) => d.mag,
    colorValue: (d) => categorizeDepth(d.depth),
    xAxisLabel: 'Time',
    yAxisLabel: 'Magnitutde of Earthquake',
    colorLegendLabel: 'Depth of Earthquake',
    margin: {
      top: 38,
      right: 51,
      bottom: 50,
      left: 50,
    },
    colorLegendX: 63,
    colorLegendY: 49,
    setHoveredValue,
    hoveredValue,
    brushInterval,
  });
  //console.log(data);
};
