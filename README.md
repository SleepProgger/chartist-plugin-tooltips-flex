# Tooltip plugin for Chartist.js

This is a plugin for Chartist.js that will display a tooltip when hovering over line graphs.  
It supports interpolation when hovvering between data points.  
Works on mobile browser (only tested on firefox and chrome on android).  
Supports Chartist.AutoScaleAxis and Chartist.FixedScaleAxis.
Demo: https://jsfiddle.net/2d94h0vx/4/


## Available options and their defaults

```javascript
  var defaultOptions = {
    tooltipOffset: {
      x: 0,
      y: -15
    },
    tooltipClass: 'chartist-tooltip-flex',
    markerClass: 'chartist-tooltip-flex-marker',
    markerY: false,
    /* Function to merge the two found nearest points.
     * Can be one of: nearest, left, right, interpolate
     * Or a function. See comment over merge_functions.
     * Warning: interpolate doesn't properly work with lineSmooth: true. (TODO)
     * */
    mergeFnc: 'nearest',
    /* Function to create/update the tooltip content.
     * function fn(series, tooltip)...
     *  series contains {name: seriesname, value: value choosen by tooltipMergeFnc} for each series in the graph.
     *  If the return value is not null set it as textContent. tooltip can be used to update html.
     *  this is the plguin object which provides:
     *    options           : The option object
     *    merge_functions   : Object containing all build in merge function
     *    unProjectX(value) : Transforms x data value to svg position
     *    unProjectY(value) : Transforms y data value to svg position
     *    project(value)    : Transforms x svg position to x data value 
     */
    displayFnc: default_tooltip_display,
    /* Adds the tooltipHighlightPointClass to each point returned by the merge function if set. */
    highlightPoint: true,
    highlightPointClass: 'ct-tooltip-point-hit',
    /* Format function for x values. Used by the default tooltipMergeFnc */
    formatX: Chartist.noop,
    /* Format function for y values. Used by the default tooltipMergeFnc */
    formatY: Chartist.noop,
    /* Format function for series names. Used by the default tooltipMergeFnc */
    formatName: function(x){ var n=x.name; return n[0].toUpperCase() + n.substr(1) },
    /* Format function to select which x value is shown. Parameter is an array of all x values. Used by the default tooltipMergeFnc */
    mergeXSeriesFnc: function(x_values){ return x_values[0] }
  };
```

## Sample usage in Chartist.js

```javascript
var chart = new Chartist.Line('.ct-chart', {
  series: [
    {name: "Something", data: [{y: 1, x: 1}, {y: 5, x: 2}, {y: 3, x: 3}, {y: 4, x: 4}, {y: 6, x: 5}, {y: 2, x: 5}, {y: 3, x: 6}]},
    {name: "Something else", data: [{y: 2, x: 1}, {y: 4, x: 2}, {y: 2, x: 3}, {y: 5, x: 4}, {y: 4, x: 5}, {y: 3, x: 6}, {y: 6, x: 7}]}
  ]
}, {
  plugins: [
    Chartist.plugins.Tooltips_flex({
      formatY: function(y){ return "ABCDEFGHIJKLMNOPQ"[y] },
      formatX: function(x){ return x.toFixed(2)+ "%" }
    }),
  ]
});
```

## Limitations and requirements

- You have to provide a name or className for your series. If no name is given the `formatName` option need to be set to handle that.
- Does not work witth StepAxis (TODO: for later)
- Currently only works when grid is enabled. (TODO: for later)
- This plugin isn't stable yet (and maybe never will). Options and functionality might change.