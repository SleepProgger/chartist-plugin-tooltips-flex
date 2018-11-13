(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(["chartist"], function (Chartist) {
      return (root.returnExportsGlobal = factory(Chartist));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory(require("chartist"));
  } else {
    root['Chartist.plugins.Tooltips_flex'] = factory(Chartist);
  }
}(this, function (Chartist) {

  /**
   * Chartist.js plugin to display a tooltip when hovering (or clickin) the chart.
   *
   */
  /* global Chartist */
  (function(window, document, Chartist) {
    'use strict';

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


    /*
     * "Borrowed" from https://stackoverflow.com/a/29018745/4830897
     * Binary search in JavaScript.
     * Returns the index of of the element in a sorted array or (-n-1) where n is the insertion point for the new element.
     * Parameters:
     *     ar - A sorted array
     *     el - An element to search for
     *     compare_fn - A comparator function. The function takes two arguments: (a, b) and returns:
     *        a negative number  if a is less than b;
     *        0 if a is equal to b;
     *        a positive number if a is greater than b.
     * The array may contain duplicate elements. If there are more than one equal elements in the array, 
     * the returned value can be the index of any one of the equal elements.
     */
    function binarySearch(ar, el, compare_fn) {
        var m = 0;
        var n = ar.length - 1;
        while (m <= n) {
            var k = (n + m) >> 1;
            var cmp = compare_fn(el, ar[k]);
            if (cmp > 0) {
                m = k + 1;
            } else if(cmp < 0) {
                n = k - 1;
            } else {
                return k;
            }
        }
        return m - 1;
    }

    /* Merge functions get the two nearest points and should return
     * SVG point elements (which can then be highlighted) and one value
     * to show in the tooltip.
     * Params: left, right = {svg:SVG point, data: Point object (Should be {x:.., y:...})}, point = mouse position relative to graph
     * Returns: [ [svg points to add options.tooltipHighlightPointClass class to], data point]
     */
    // TODO: use object instead of arrays as return value
    var merge_functions = {
        left: function(left, right, point){
          if(!left) left = right;
          return [[left.svg], left.data];
        },
        right: function(left, right, point){
          if(!right) right = left;
          return [[right.svg], right.data];
        },
        nearest: function(left, right, point){
          if(!left) return [[right.svg], right.data];
          if(!right) return [[left.svg], left.data];
          if(Math.abs(left.svg.attr('x1') - point) < Math.abs(right.svg.attr('x1') - point))
            return [[left.svg], left.data];
          return [[right.svg], right.data]
        },
        // TODO: interpolate
    }

    /*
     * The default display function.
     * If the return value != null use it as textContent (!) for the tooltip.
     * Use the tooltip parameter if you want to write/update HTML.
     */
    function default_tooltip_display(series, tooltip){
      var x_vals = [];
      var text = "";
      for(var i=0; i < series.length; ++i){
        x_vals.push(series[i].value.x);
        text += this.tooltipNameFormat(series[i]) + ": " + this.tooltipFormatX(series[i].value.y) + "\n";
      }
      text = this.tooltipFormatY(this.tooltipMergeXSeries(x_vals)) + "\n" + text;
      return text;
    }


    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.Tooltips_flex = function(options) {
      options = Chartist.extend({}, defaultOptions, options);
      // This is a bit strange but allows the display func to use the formatter functions
      options.tooltipDisplayFnc = options.tooltipDisplayFnc.bind(options);

      return function tooltips_flex(chart) {
        var chart_container = chart.container;
        var tooltip = document.body.querySelector('.chartist-tooltip-flex');
        var marker = null;
        var width = 0, height = 0;

        var series = [];
        var created = false;
        var old_sel_points = [];
        var tooltipMergeFnc = options.tooltipMergeFnc;
        if(typeof tooltipMergeFnc !== "function"){
          tooltipMergeFnc = merge_functions[tooltipMergeFnc];
        }

        if(!tooltip){
          tooltip = document.createElement('div');
          tooltip.className = options.tooltipTooltipClass;
          // Fallback CSS so its at least visible without the css file.
          tooltip.style.position = 'absolute';
          tooltip.style.whiteSpace = 'pre';
          tooltip.style.top = '0';
          document.body.append(tooltip);
        }

        function get_nearest_points(elements, point){
          var i = binarySearch(elements.raw_x, point, function(a,b){
            if(a > b) return 1;
            if(a < b) return -1;
            return 0;
          });
          var data = elements.data.data;
          var right = null;
          i = Math.max(0, i);
          var left = {svg: elements.svg[i], data: data[i]};
          if(i+1 < data.length){
            right = {svg: elements.svg[i+1], data: data[i+1]}
          }
          return [left, right];
        }

        var _tooltip_visible = false;
        function _show_tooltip(){
          tooltip.classList.add('tooltip-show');
          marker.addClass('tooltip-show');
          _tooltip_visible = true;
        }

        var rafQueued = false;
        var last_event = null;
        function update(){
          rafQueued = false;
          if(!_tooltip_visible) _show_tooltip();
          // getBoundingClientRect call required in case the graph position changes.
          // I'd really like to get rid of this, but then we'd need to have the tooltip relative to the graph.
          // TODO: as graph container child or as foreign svg object ? .. Still required to get the correct mouse_x ..
          // TODO: try to cache it.. when to update ?
          var cont_box = chart.container.getBoundingClientRect();
          var left_border = cont_box.left + window.pageXOffset;
          var mouse_x = last_event.pageX - left_border;

          var values = [];
          var vals_y = [];
          var highlightsToAdd = [];
          for(var i=0; i < series.length; ++i){
            var points = get_nearest_points(series[i], mouse_x);
            points = tooltipMergeFnc(points[0], points[1], mouse_x)
            values.push({value: points[1], name: series[i].data.name});
            var pToHighlight = points[0];
            for(var j=0; j < pToHighlight.length; ++j){
              var node = pToHighlight[j].getNode();
              highlightsToAdd.push(node);
              vals_y.push(node.getAttribute('y1'));
            }
          }

          var ret = options.tooltipDisplayFnc(values, tooltip);
          if(ret){
            tooltip.textContent = ret;          
          }
          height = tooltip.offsetHeight;
          width = tooltip.offsetWidth;
          var offsetX = - width / 2 + options.tooltipOffset.x;
          var y = last_event.pageY;
          if(options.tooltipFollowMaxLine){
            y = Math.min.apply(Math, vals_y) + cont_box.top + window.pageYOffset - options.tooltipTooltipYDist;
          }
          var offsetY = - height + options.tooltipOffset.y;

          /*
          * Try to do all the dom changing at once to limit relayouts.
          */
          //tooltip.style.top = y + offsetY + 'px';
          //tooltip.style.left = event.pageX + offsetX + 'px';
          // Not really sure this one is faster
          tooltip.style.transform = 'translate(' + (last_event.pageX + offsetX) + 'px, ' + (y + offsetY) + 'px)';
          marker.getNode().setAttribute('transform', 'translate('+mouse_x+' 0)');
          if(options.tooltipHighlightPoint){          
            // clean up old highlights
            for(var i=0; i < old_sel_points.length; ++i){
              old_sel_points[i].classList.remove(options.tooltipHighlightPointClass);
            }
            old_sel_points = [];
            // and add new
            for(var i=0; i < highlightsToAdd.length; ++i){             
              highlightsToAdd[i].classList.add(options.tooltipHighlightPointClass);
              old_sel_points.push(highlightsToAdd[i]);
            }
          }
        }


        chart_container.addEventListener('mouseenter', function (event) {
          _show_tooltip();
        });

        chart_container.addEventListener('mouseleave', function (event) {
          tooltip.classList.remove('tooltip-show');
          marker.removeClass('tooltip-show');
        });

        chart_container.addEventListener('mousemove', function (event) {
          if(!created) return;
          last_event = event;
          // Not really sure the requstAnimationFrame stuff is helping here.
          // It might on slow devices
          if(rafQueued){
            return;
          }
          rafQueued = true;
          requestAnimationFrame(update);
        });


        if (chart instanceof Chartist.Line) {
          chart.on('created', function(data) {
            var grid = chart.svg.querySelector('.ct-grids');
            var grid_box = grid.getNode().getBoundingClientRect();
            var cont_box = chart.container.getBoundingClientRect();
            var top_padding = grid_box.top - cont_box.top;
            marker = chart.svg.elem('line', {x1: 0, y1: top_padding, x2: 0, y2: grid_box.height + top_padding, style: options.tooltipMarkerClass}, options.tooltipMarkerClass );

            series = [];
            var series_data = chart.data.series;
            console.log(chart);
            for(var i=0; i < series_data.length; ++i){
              var series_name = series_data[i].className;
              // We are (ab)using the points here. Alternatively we could use the lines values.
              // Series not always have the classname attribute so fall back to using the name.
              if(!series_name){
                series_name = '[*|series-name="'+series_data[i].name+'"]';
              } else{
                series_name = "." + series_name;
              }
              var elem = chart.svg.querySelectorAll(series_name + ' .ct-point').svgElements;
              var raw_x = [];
              // Create raw x value array to increase search performance
              for(var j=0; j < elem.length; ++j){
                raw_x.push(elem[j].attr('x1'));
              }
              var d = {data: series_data[i], raw_x: raw_x, svg: elem};
              series.push(d);
            }
            created = true;
          });
        }
      };
    };
    Chartist.plugins.Tooltips_flex.mergeFunctions = merge_functions;
    Chartist.plugins.Tooltips_flex.defaultOptions = defaultOptions;
  }(window, document, Chartist));

  return Chartist.plugins.Tooltips_flex;

}));
