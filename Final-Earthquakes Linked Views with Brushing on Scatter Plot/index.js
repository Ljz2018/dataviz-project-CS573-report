import { select, zoom, json, brush, isoParse } from 'd3';
import topojson from 'topojson-client';
import { map } from './map';
import { menuDepth } from './menuDepth';
import { menuMag } from './menuMag';
import { scatterPlot } from './scatterPlot';

import './styles.css';
//data of world map
const worldAtlasURL =
  'https://unpkg.com/visionscarto-world-atlas@0.1.0/world/110m.json';
//data of tectonic plate boundary (geoJson)
const tectonicJSON =
  'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';
//feed data from usgs (geoJson)
const earthquakeJSON =
  // //past 30 days data
  //'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
  //past 7 days data
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
// Sensitivity of the drag interaction
const panningSensitivity = 5000;
//two menu-options for making dropdown menus:
// const menuOptionsDepth = [
//   { value: 'Choose Depth', text: 'Choose Depth' },
//   {
//     value: 'Shallow: depth < 70km',
//     text: 'Shallow: depth < 70km',
//   },
//   {
//     value: 'Intermediate: 70km ≤ depth < 300km',
//     text: 'Intermediate: 70km ≤ depth < 300km',
//   },
//   {
//     value: 'Deep: depth ≥ 300km',
//     text: 'Deep: depth ≥ 300km',
//   },
// ];
// const menuOptionsMag = [
//   { value: 'Choose Magnitude', text: 'Choose Magnitude' },
//   { value: '2.5 or less', text: '2.5 or less' },
//   { value: '2.5 to 5.4', text: '2.5 to 5.4' },
//   { value: '5.5 to 6.0', text: '5.5 to 6.0' },
//   { value: '6.1 to 6.9', text: '6.1 to 6.9' },
//   { value: '7.0 to 7.9', text: '7.0 to 7.9' },
//   { value: '8.0 or greater', text: '8.0 or greater' },
// ];

export const main = (container, { state, setState }) => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  //   // Initialize the selected menu options.
  //   if (state.xColumn === undefined) {
  //     setState((state) => ({
  //       ...state,
  //       xColumn: menuOptionsDepth[0].value,
  //       yColumn: menuOptionsMag[0].value,
  //     }));
  //     return;
  //   }
  const containerSelection = select(container)
    .attr('class', 'ui-elements-container')
    //set containerSelection to x = 0, y = 0
    .style('width', '100%')
    .style('height', '5%');

  //   const menusContainer = containerSelection
  //     .selectAll('div.menus-container')
  //     .data([null])
  //     .join('div')
  //     .attr('class', 'menus-container');
  //   menusContainer
  //     .selectAll('.menu')
  //     .data([
  //       { label: 'Depth', stateField: 'xColumn' },
  //       { label: 'Magnitude', stateField: 'yColumn' },
  //     ])
  //     .join((enter) =>
  //       enter
  //         .append('div')
  //         .attr('class', 'menu d-flex')
  //         .html(
  //           (d) => `
  //             <label class="col-form-label">${d.label}</label>
  //             <div class="menu-container ms-3"></div>
  //           `,
  //         ),
  //     )
  //     .each(function ({ label, stateField }) {
  //       //if label is Depth, call menuDepth. if label is Magnitude, call menuMag
  //       if (label === 'Depth') {
  //         select(this)
  //           .select('div.menu-container')
  //           .call(menuDepth, {
  //             state,
  //             setState,
  //             stateField,
  //             menuOptionsDepth,
  //           });
  //       }
  //       if (label === 'Magnitude') {
  //         select(this)
  //           .select('div.menu-container')
  //           .call(menuMag, {
  //             state,
  //             setState,
  //             stateField,
  //             menuOptionsMag,
  //           });
  //       }
  //     });
  const rotationInputContainer = containerSelection
    .selectAll('div.rotation-input-container')
    .data([null])
    .join('div')
    .attr('class', 'rotation-input-container');

  const svg = select(container)
    .selectAll('svg')
    .data([null])
    .join('svg')
    .attr('width', width)
    .attr('height', height);

  // const mapGroup = svg
  //   .selectAll('g.map')
  //   .data([null])
  //   .join('g')
  //   .attr('class', 'map');

  // const mapSVG = mapGroup
  //   .selectAll('svg.map')
  //   .data([null])
  //   .join('svg')
  //   .attr('class', 'map')
  //   .attr('width', width)
  //   .attr('height', 0.75 * height);

  // const plotGroup = svg
  //   .selectAll('g.plot')
  //   .data([null])
  //   .join('g')
  //   .attr('class', 'plot');

  // const plotSVG = mapGroup
  //   .selectAll('svg.plot')
  //   .data([null])
  //   .join('svg')
  //   .attr('class', 'plot')
  //   .attr('width', width)
  //   .attr('height', height / 2)
  //   .attr('transform', `translate(0,${height / 2})`);

  const {
    countries,
    tectonic,
    earthquakes,
    rotation,
    scale,
    translation,
    initialScale,
    transform,
    xColumn,
    yColumn,
    brushInterval,
  } = state;

  // Initialize the countries
  if (countries === undefined || countries === 'LOADING') {
    if (countries === undefined) {
      setState((state) => ({
        ...state,
        countries: 'LOADING',
      }));
      fetch(worldAtlasURL)
        .then((response) => response.json())
        .then((topoJSONData) => {
          const countries = topojson.feature(
            topoJSONData,
            'countries',
          );
          setState((state) => ({
            ...state,
            countries,
          }));
        });
    }
    return;
  }

  // Initialize the tectonic
  if (tectonic === undefined || tectonic === 'LOADING') {
    if (tectonic === undefined) {
      setState((state) => ({
        ...state,
        tectonic: 'LOADING',
      }));
      json(tectonicJSON).then((geoJSONData) => {
        const tectonic = geoJSONData;
        setState((state) => ({
          ...state,
          tectonic,
        }));
      });
    }
    return;
  }

  // Initialize the earthquakes
  if (
    earthquakes === undefined ||
    earthquakes === 'LOADING'
  ) {
    if (earthquakes === undefined) {
      setState((state) => ({
        ...state,
        earthquakes: 'LOADING',
      }));
      json(earthquakeJSON).then((earthquakeJSONData) => {
        const earthquakes = earthquakeJSONData.features.map(
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
          earthquakes,
        }));
      });
    }
    return;
  }
  earthquakes.forEach((d, i) => {
    d.id = i;
  });
  // Initialize rotation
  if (rotation === undefined) {
    setState((state) => ({
      ...state,
      rotation: [180, 0, 0],
    }));
    return;
  }

  //make a input box
  //label = 'Set Honrizontal Rotation Degree'
  //input is number between 0-365 degree
  //input can control the ratation degree of the map
  //fix the bug of input that can only enter one digit at a time
  // rotationInputContainer
  //   .selectAll('div.rotation-input')
  //   .data([null])
  //   .join('div')
  //   .attr('class', 'rotation-input')
  //   .html(
  //     `
  // <label>Set Horizontal Rotation Degree (0-360 degree)</label>
  // <input type="number" min="0" max="360" value=${rotation[0]}>
  // `,
  //   )
  //   .select('input')
  //   .on('input', function () {
  //     const newValue = +this.value;
  //     setState((state) => ({
  //       ...state,
  //       rotation: [newValue, 0, 0],
  //     }));
  //   });
  // White space around the outside.
  const margin = 20;

  // Render the map
  svg
    .selectAll('g.map')
    .data([null])
    .join('g')
    .attr('class', 'map')
    .call(map, {
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
      height: height / 1.5,
      margin,

      brushInterval,
    });

  svg
    .selectAll('g.plot')
    .data([null])
    .join('g')
    .attr('class', 'plot')
    .attr('transform', `translate(0,${height / 1.5})`)
    .call(scatterPlot, {
      earthquakes,
      width,
      height: height / 3,
      xValue: (d) => isoParse(d.date),
      yValue: (d) => d.mag,

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
      brushInterval,
      state,
      setState,
    });
};
