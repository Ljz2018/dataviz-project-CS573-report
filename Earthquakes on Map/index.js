import {
  select,
  drag,
  geoEquirectangular,
  zoom,
  json,
  brush,
} from 'd3';
import topojson from 'topojson-client';
import { map } from './map';
import { menuDepth } from './menuDepth';
import { menuMag } from './menuMag';
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
const panningSensitivity = 1000;
//two menu-options for making dropdown menus:
const menuOptionsDepth = [
  { value: 'Choose Depth', text: 'Choose Depth' },
  {
    value: 'Shallow: depth < 70km',
    text: 'Shallow: depth < 70km',
  },
  {
    value: 'Intermediate: 70km ≤ depth < 300km',
    text: 'Intermediate: 70km ≤ depth < 300km',
  },
  {
    value: 'Deep: depth ≥ 300km',
    text: 'Deep: depth ≥ 300km',
  },
];
const menuOptionsMag = [
  { value: 'Choose Magnitude', text: 'Choose Magnitude' },
  { value: '2.5 or less', text: '2.5 or less' },
  { value: '2.5 to 5.4', text: '2.5 to 5.4' },
  { value: '5.5 to 6.0', text: '5.5 to 6.0' },
  { value: '6.1 to 6.9', text: '6.1 to 6.9' },
  { value: '7.0 to 7.9', text: '7.0 to 7.9' },
  { value: '8.0 or greater', text: '8.0 or greater' },
];

export const main = (container, { state, setState }) => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const svg = select(container)
    .selectAll('svg')
    .data([null])
    .join('svg')
    .attr('width', width)
    .attr('height', height);

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
  // Initialize rotation
  if (rotation === undefined) {
    setState((state) => ({
      ...state,
      rotation: [180, 0, 0],
    }));
    return;
  }

  // Initialize scale and translation
  // by fitting to the size of the page
  //fit geoEquirectangular to the size of the page
  if (scale === undefined || translation === undefined) {
    const fittedProjection = geoEquirectangular().fitExtent(
      [
        [0, 10],
        [width - 10, height - 40],
      ],
      { type: 'Sphere' },
    );
    // .fitWidth(width, { type: 'Sphere' });

    const initialScale = fittedProjection.scale();
    const initialTranslation = fittedProjection.translate();
    setState((state) => ({
      ...state,
      //initialScale,
      scale: initialScale,
      translation: initialTranslation,
    }));
    return;
  }

  // Initialize the selected menu options.
  if (state.xColumn === undefined) {
    setState((state) => ({
      ...state,
      xColumn: menuOptionsDepth[0].value,
      yColumn: menuOptionsMag[0].value,
    }));
    return;
  }
  const containerSelection = select(container).attr(
    'class',
    'ui-elements-container',
  );
  const menusContainer = containerSelection
    .selectAll('div.menus-container')
    .data([null])
    .join('div')
    .attr('class', 'menus-container');
  menusContainer
    .selectAll('.menu')
    .data([
      { label: 'Depth', stateField: 'xColumn' },
      { label: 'Magnitude', stateField: 'yColumn' },
    ])
    .join((enter) =>
      enter
        .append('div')
        .attr('class', 'menu d-flex')
        .html(
          (d) => `
            <label class="col-form-label">${d.label}</label>
            <div class="menu-container ms-3"></div>
          `,
        ),
    )
    .each(function ({ label, stateField }) {
      //if label is Depth, call menuDepth. if label is Magnitude, call menuMag
      if (label === 'Depth') {
        select(this)
          .select('div.menu-container')
          .call(menuDepth, {
            state,
            setState,
            stateField,
            menuOptionsDepth,
          });
      }
      if (label === 'Magnitude') {
        select(this)
          .select('div.menu-container')
          .call(menuMag, {
            state,
            setState,
            stateField,
            menuOptionsMag,
          });
      }
    });
  // White space around the outside.
  const margin = 20;
  // Render the map
  svg.call(map, {
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
  });

  // Set up the drag behavior (source: https://vizhub.com/curran/globe-with-panning-zooming)
  // svg.call(
  //   drag().on('drag', (event) => {
  //     setState((state) => {
  //       const k = panningSensitivity / state.scale;
  //       return {
  //         ...state,
  //         rotation: [
  //           state.rotation[0] + event.dx * k,
  //           //state.rotation[1] - event.dy * k,
  //           //state.rotation[2],
  //         ],
  //       };
  //     });
  //   }),
  // );
  //add left and right buttons to drag the map
  //add div to include both buttons and add left and right buttons to drag the map
  const dragButtonsContainer = containerSelection
    .selectAll('div.drag-buttons-container')
    .data([null])
    .join('div')
    .attr('class', 'drag-buttons-container');

  dragButtonsContainer
    .selectAll('button.drag-button')
    .data(['left', 'right'])
    .join('button')
    .attr('class', 'drag-button')
    .html((d) => 'Move ' + d)
    .on('click', (event, d) => {
      setState((state) => {
        const k = panningSensitivity / state.scale;
        const direction = d === 'right' ? 1 : -1;
        return {
          ...state,
          rotation: [
            state.rotation[0] + direction * k,
            // state.rotation[1],
            // state.rotation[2],
          ],
        };
      });
    });
};
