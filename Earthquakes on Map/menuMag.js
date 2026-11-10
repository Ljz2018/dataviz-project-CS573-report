export const menuMag = (
  selection,
  { state, setState, stateField, menuOptionsMag },
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
    .selectAll('option.mag')
    .data(menuOptionsMag)
    .join('option')
    .attr('class', 'mag')
    .attr('value', (option) => option.value)
    .text((option) => option.text)
    .property(
      'selected',
      (option) => option.value === state[stateField],
    );
};
