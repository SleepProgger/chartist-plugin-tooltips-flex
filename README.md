# Tooltip plugin for Chartist.js

This is a plugin for Chartist.js that will display a tooltip when hovering over line graphs.  
It supports interpolation when hovvering between data points (well currently the nearest point is taken, but configurable).  
Works on mobile browser (only tested on firefox and chrome on android).  
Supports Chartist.AutoScaleAxis and Chartist.FixedScaleAxis.


## Available options and their defaults

```javascript
  var defaultOptions = {
    tooltipOffset: {
      x: 0,
      y: 0
    },
    tooltipTooltipClass: 'chartist-tooltip-flex',
    tooltipMarkerClass: 'chartist-tooltip-flex-marker',
    /* Function to merge the two found nearest points.
     * Can be one of: nearest, left, right
     * Or a function. See comment over merge_functions. */
    tooltipMergeFnc: 'nearest',
    /* Function to create/update the tooltip content.
     * function fn(series, tooltip)...
     *  series contains {name: seriesname, value: value choosen by tooltipMergeFnc} for each series in the graph.
     *  If the return value is not null set it as textContent. tooltip can be used to update html.
     *  this is the options object so the format functions can be used in custom display functions. */
    tooltipDisplayFnc: default_tooltip_display,
    /* Adds the tooltipHighlightPointClass to each point returned by the merge function if set. */
    tooltipHighlightPoint: true,
    tooltipHighlightPointClass: 'ct-tooltip-point-hit',
    /* Experimental feature which pins the tooltip to the max y of the graph at the mouse x position. */
    tooltipFollowMaxLine: false,
    tooltipTooltipYDist: 15,
    /* Format function for x values. Used by the default tooltipMergeFnc */
    tooltipFormatX: Chartist.noop,
    /* Format function for y values. Used by the default tooltipMergeFnc */
    tooltipFormatY: Chartist.noop,
    /* Format function for series names. Used by the default tooltipMergeFnc */
    tooltipNameFormat: function(x){ return x.name },
    /* Format function to select which x value is shown. Parameter is an array of all x values. Used by the default tooltipMergeFnc */
    tooltipMergeXSeries: function(x_values){ return x_values[0] }
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
      tooltipFormatY: function(y){ return "ABCDEFGHIJKLMNOPQ"[y] },
      tooltipFormatX: function(x){ return x.toFixed(2)+ "%" }
    }),
  ]
});
```

## Limitations and requirements

- This plugin isn't stable yet (and maybe never will). Options and functionality might change.