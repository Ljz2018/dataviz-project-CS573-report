export const menuDepth = (
  selection,
  { state, setState, stateField, menuOptionsDepth },
) => {
  // Create the menu
  const menu = selection
    .selectAll('select')
    .data([null])
    .join('select')
    .attr('class', 'form-select')
    .on('change', (event) => {
      setState((state) => ({
        ...state,
        [stateField]: event.target.value,
      }));
    });

  // Fill out the options
  menu
    .selectAll('option.depth')
    .data(menuOptionsDepth)
    .join('option')
    .attr('class', 'depth')
    .attr('value', (option) => option.value)
    .text((option) => option.text)
    .property(
      'selected',
      (option) => option.value === state[stateField],
    );
};
