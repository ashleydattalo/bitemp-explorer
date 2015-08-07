/*global d3, d3plus, moment */

function showCurrURI(uri) {
  document.getElementById('selectedURI').innerHTML = 'Selected URI: ' + uri.bold();
}

var barChart = function() {
  // default values for configurable input parameters
  var width = 600;
  var height = 300;
  var uri, isEditing, isViewing, isDeleting, logicURI;
  var xMin = null;
  var xMax = null;
  var yMin = null;
  var yMax = null;
  var draggableBars;
  var displayProperty = '';
  var lastDoc;
  var data;
  var displayedProps = [];
  var background;

  var margin = {
    top: 0,
    right: 0,
    bottom: 150,
    left: 170
  };
  var xAxisLabel = 'System Time';
  var yAxisLabel = 'Valid Time';

  var color =
    d3.scale.category10();

  var xScale, xAxis, xAxisCssClass;
  var yScale, yAxis, g;
  var axisLabelMargin;

  var chart = function(container) {

    function setDimensions() {
      axisLabelMargin = 0;
    }

    function setupXAxis() {
      // minStart: earliest sysStart
      // maxEnd: latest non-infinty sysEnd
      // maxStart: max sysStart time
      var minStart, maxEnd, maxStart;

      if (xMin) {
        minStart = xMin;
      }

      else {
        if (data.length) {
          minStart =  moment.min(data.map(function(d){
            return moment(d.content.sysStart);
          })).toDate();
        }
        else {
          minStart = moment('2001-01-01T00:00:00').toDate();
        }
      }

      maxStart =
        moment.max(data.map(function(d){
          return moment(d.content.sysStart);
        })).add('y', 10);

      if (xMax) {
        maxEnd = xMax;
      }
      else {
        if (data.length) {
          maxEnd =
            moment.max(data.map(function(d){
              if (d.content.sysEnd.startsWith('9999')) {
                return maxStart;
              }
              else {
                return moment(d.content.sysEnd);
              }
            })).toDate();
        }
        else {
          maxEnd = moment('2015-01-01T00:00:00').toDate();
        }
      }

      xScale = d3.time.scale()
        .domain([minStart, maxEnd])
        .range([axisLabelMargin,width-margin.left-margin.right-axisLabelMargin]);

      if (data.length > 12 && width < 500) {
        xAxisCssClass = 'axis-font-small';
      } else {
        xAxisCssClass = '';
      }

      xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(10)
        .tickFormat(d3.time.format('%Y-%m-%d'))
        .tickSize(10,0)
        .orient('end');

    }

    function setupYAxis() {
      // minStart: earliest valStart
      // maxEnd: latest non-infinty valEnd
      // maxStart: max valStart time
      var minStart, maxEnd, maxStart;

      if (yMin) {
        minStart = yMin;
      }
      else {
        if (data.length) {
          minStart =
            moment.min(data.map(function(d){
              return moment(d.content.valStart);
            })).toDate();
        }
        else {
          minStart = moment('2001-01-01T00:00:00').toDate();
        }
      }
      maxStart =
        moment.max(data.map(function(d){
          return moment(d.content.valStart);
        })).add('y', 10);

      if (yMax) {
        maxEnd = yMax;
      }
      else {
        if (data.length) {
          maxEnd =
            moment.max(data.map(function(d){
              if (d.content.valEnd.startsWith('9999')) {
                return maxStart;
              }
              else {
                return moment(d.content.valEnd);
              }
            })).toDate();
        }
        else {
          maxEnd = moment('2015-01-01T00:00:00').toDate();
        }
      }

      yScale = d3.time.scale()
        .domain([minStart, maxEnd])
        .range([height - axisLabelMargin - margin.top - margin.bottom, axisLabelMargin]);

      var yAxisCssClass;
      if (data.length > 12 && width < 500) {
        yAxisCssClass = 'axis-font-small';
      } else {
        yAxisCssClass = '';
      }

      yAxis = d3.svg.axis()
        .scale(yScale)
        //ticks(15)
        .orient('left')
        .tickFormat(d3.time.format('%Y-%m-%d'))
        .tickSize(10,0);
    }

    function setupBarChartLayout() {

      g = container.append('svg')
        .attr('class', 'svg-chart')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var colorDomain = [];
      data.map(function(d){
        colorDomain.push(d.content.data);
      });

      color.domain(colorDomain);
    }

    function addXAxisLabel() {
      //Rotate ticks
      g.append('g')
        .attr('class', 'xaxis ' + xAxisCssClass)
        .attr('transform', 'translate(0,' +
          (height - axisLabelMargin - margin.top - margin.bottom) + ')')
        .call(xAxis)
        .selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-1.4em')
          .attr('dy', '0.8em')
          .attr('transform', 'rotate(-60)');

      //Add x axis label
      g.append('g')
        .append('text')
        .attr('class', 'axis-label')
        .attr('y', height - 20)
        .attr('x', (width - margin.left)/2)
        .text(xAxisLabel);
    }

    function addYAxisLabel() {

      g.append('g')
        .attr('class', 'yaxis ')
        .attr('transform', 'translate('+axisLabelMargin+', 0)')
        .call(yAxis);

      g.append('g')
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left+65)
        .attr('x', -(height - margin.top + margin.bottom - axisLabelMargin-190) / 2)
        .style('text-anchor', 'left')
        .text(yAxisLabel);

    }

    function addRectangle() {
      g.append('rect')
        .style('stroke', 'black')
        .style('stroke-width', '5')
        .style('fill', 'white')
        .attr('class', 'background')
        .attr('x', axisLabelMargin)
        .attr('y', -axisLabelMargin)
        .attr('width', width - axisLabelMargin - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom);
    }

    function setLastDoc(ld) {
      lastDoc = ld;
    }

    function getLastDoc() {
      return lastDoc;
    }


    function addBarChartData() {

      var split = g.selectAll('.split')
      var arr = [];

      split = g.selectAll('.split')
        .data(data)
        .enter()
        .append('g')
        .attr('class','split')
        .attr('stroke', 'black');

      var r;
      var propTooltip = d3.select('body')
        .append('div')
        .style('z-index', '10')
        .style('visibility', 'hidden')
        .style('word-wrap', 'break-word')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .style('width', '32em')
        .text('');

      r = split
        .append('rect')
        .on('mouseover', function(d) {
          var str = '';
          if(!displayProperty) {
            displayProperty = 'data';
          }
          if (displayProperty.indexOf('.') === -1) {
            str = d.content[displayProperty];
          }
          else {
            str = path(d, 'content.' + displayProperty);
          }
          if(str && str.length > 15) {  //if you want all mouse overs to work, comment out
            propTooltip.text(str);
          }
          return propTooltip.style('visibility', 'visible');
        })
        .on('mouseout', function() {
          propTooltip.text('');
          return propTooltip.style('visibility', 'hidden');
        })
        .on('mousemove', function() {
          var coordinates = [0, 0];
          coordinates = d3.mouse(this);
          propTooltip.style('position', 'absolute')
            .style('top', coordinates[1] + 115 + 'px')
            .style('left', coordinates[0] + 110 + 'px');
        })

        .on('click', function(datum, index) {
          document.getElementById('editButton').disabled = false;
          document.getElementById('deleteButton').disabled = false;
          document.getElementById('viewButton').disabled = false;
          document.getElementById('deleteErrMessage').innerHTML = '';

          if (!chart.getEditing() && !chart.getViewing() && !chart.getDeleting()) {
            chart.setCurrentURI(datum.uri);
            showCurrURI(datum.uri);

            $(this).attr('stroke-width', '4');
            $(this).attr('stroke', 'black');
            $(this).attr('fill-opacity', 0.7);
            if (getLastDoc() !== this) {
              $(getLastDoc()).attr('stroke', 'grey');
              $(getLastDoc()).attr('stroke-width', '1');
              $(getLastDoc()).attr('fill-opacity', 0.9);
            }
            setLastDoc(this);
          }
        })
        .attr('stroke', 'grey')
        .attr('stroke-width', '1')
        .attr('fill',function(d) {
          if(!displayProperty) {
            displayProperty = 'data';
          }
          else {
            if (displayProperty.indexOf('.') === -1) {
              return color(d.content[displayProperty]);
            }
            else {
              var str = path(d, 'content.' + displayProperty);
              return color(str);
            }
          }
        })
        .attr('x', function(d) {
          var barx = xScale(moment(d.content.sysStart).toDate());
          return barx;
        })
        .attr('y', function(d) {
          var bary = yScale(moment(d.content.valEnd).toDate());
          return bary;
        })
        .style('opacity', 0)
        .transition()
        .duration(1500)
        .style('opacity', 0.9)
        .attr('height', function(d) {
          var bValStart = yScale(moment(d.content.valStart).toDate());
          var bValEnd = yScale(moment(d.content.valEnd).toDate());
          var h=-bValEnd+bValStart;
          return h;
        })
        .attr('width', function(d) {
          var bSysStart = xScale(moment(d.content.sysStart).toDate());
          var bSysEnd = xScale(moment(d.content.sysEnd).toDate());
          if (bSysEnd>width) {
            bSysEnd=width-axisLabelMargin;
          }
          var w=bSysEnd-bSysStart;
          return w;
        });

      split.append('text')
        .attr('id', 'box')
        .style('fill', 'DarkMagenta')
        .attr('class','tooltip-txt')
        .style('opacity', 0)
        .transition()
        .duration(1500)
        .style('opacity', 1)
        .style('text-anchor', 'middle')
        .attr('x', function(d) {
          var barx1 = xScale(moment(d.content.sysStart).toDate());
          var barx2;
          if (!d.content.sysEnd) {
            return 75;
          }
          if (d.content.sysEnd.indexOf('9999') === 0) {
            barx2 = xScale(moment(d.content.sysStart).add(5, 'y').toDate());
            return barx1;
          }
          else {
            barx2 = xScale(moment(d.content.sysEnd).toDate());
            return (barx1+barx2)/2;
          }
        })
        .attr('y', function(d) {
          if (!d.content.valEnd) {
            return 0;
          }
          var bary1 = yScale(moment(d.content.valStart).toDate());
          var bary2;
          if (d.content.valEnd.indexOf('9999') === 0) {
            bary2 = yScale(moment(d.content.valStart).add(5, 'y').toDate());
            return (bary1+bary2)/2;
          }
          else {
            bary2 = yScale(moment(d.content.valEnd).toDate());
            return (bary1+bary2)/2;
          }
        })
        .text(function(d) {
          var str = '';
          if(!displayProperty) {
            displayProperty = 'data';
          }
          if (displayProperty.indexOf('.') === -1) {
            str = d.content[displayProperty];
          }
          else {
            str = path(d, 'content.' + displayProperty);
          }
          var alreadyInGraph = false;
          for(var i = 0; i < displayedProps.length; i++) {
            if(displayedProps[i] === str) {
              alreadyInGraph = true;
            }
          }
          if(alreadyInGraph === false) {
            displayedProps.push(str);
            if(str && str.length > 15) {
              str = str.substring(0, 15) + '...';
            }
            return str;
          }
        })
      };

    function path(object, fullPath) {
      var selection = object;
      fullPath.split('.').forEach(function(path) {
        selection = selection[path];
      });
      return selection;
    }

    function addBackground() {
      background = g.append('svg')
        .style('stroke', 'red')
        .style('stroke-width', '5')
        .style('fill', 'white')
        .attr('class', 'background')
        .attr('x', axisLabelMargin)
        .attr('y', -axisLabelMargin)
        .attr('width', width - axisLabelMargin - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom);
    }

    function addDragBars() {
      var format = d3.time.format('%Y-%m-%d');

      function lineCreator(x1, x2, y1, y2, direction, id) {
        background
          .append('line')
          .attr('x1', x1)
          .attr('x2', x2)
          .attr('y1', y1)
          .attr('y2', y2)
          .style('opacity', '.99')
          .style('position', 'relative')
          .style('cursor', 'pointer')
          .style('z-index', '1')
          .attr('stroke-width', '8')
          .attr('stroke', 'red')
          .data([ {'x':0, 'y':0} ])
          .attr('class', 'hide')
          .attr('id', id)
          .call(direction);
      }

      var dragLeft = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#endSysBox').css({'border': '1px solid black'});
          $('#vertBar2').css({'font-weight': 'normal'});
        })
        .on('drag', function(d,i) {
          $('#endSysBox').css({'border': '2px solid red'});
          $('#vertBar2').css({'font-weight': 'bold'});
          var scale = xScale.invert( d.x + width - margin.left - margin.right );
          $('#endSysBox').val(format(scale));
          if (d.x+d3.event.dx >= 0) {
            d.x = 0;
          }
          else if(d.x + d3.event.dx <= -1*(width - margin.left - margin.right)){
            d.x = -1*(width - margin.left - margin.right);
          }
          else {
            d.x+=d3.event.dx;
          }
            d.y += 0;
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [ d.x,d.y ] + ')';
        });
      });

      var dragRight = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#startSysBox').css({'border': '1px solid black'});
          $('#vertBar1').css({'font-weight': 'normal'});
        })
        .on('drag', function(d,i) {
          $('#startSysBox').css({'border': '2px solid red'});
          $('#vertBar1').css({'font-weight': 'bold'});
          var scale = xScale.invert( d.x );
          $('#startSysBox').val(format(scale));
          if (d.x+d3.event.dx <= 0) {
            d.x = 0;
          }
          else if(d.x + d3.event.dx >= width - margin.left - margin.right){
            d.x = width - margin.left - margin.right;
          }
          else {
            d.x+=d3.event.dx;
          }
            d.y += 0;
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [ d.x,d.y ] + ')';
          });
      });

      var dragUp = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#startValBox').css({'border': '1px solid black'});
          $('#horzBar1').css({'font-weight': 'normal'});
        })
        .on('drag', function(d,i) {
          $('#startValBox').css({'border': '2px solid red'});
          $('#horzBar1').css({'font-weight': 'bold'});
          var scale = yScale.invert( d.y + height-margin.top-margin.bottom);
          $('#startValBox').val(format(scale));
          if (d.y+d3.event.dy >= 0) {
              d.y = 0;
          }
          else if(d.y + d3.event.dy <= -1*(height-margin.top-margin.bottom -5)){
            d.y = -1*(height-margin.top-margin.bottom -5);
          }
          else {
            d.y+=d3.event.dy;
          }
          d.x += 0;
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [ d.x,d.y ] + ')';
          });

      });

      var dragDown = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#endValBox').css({'border': '1px solid black'});
          $('#horzBar2').css({'font-weight': 'normal'});
        })
        .on('drag', function(d,i) {
          $('#endValBox').css({'border': '2px solid red'});
          $('#horzBar2').css({'font-weight': 'bold'});
          var scale = yScale.invert(d.y);
          $('#endValBox').val(format(scale));
          if(d.y+d3.event.dy <= 0 ) {
            d.y = 0;
          }
          else if(d.y+d3.event.dy >= (height-margin.top-margin.bottom)) {
            d.y = height-margin.top-margin.bottom;
          }
          else {
            d.y += d3.event.dy;
          }
          d.x += 0;
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [ d.x,d.y ] + ')';
        });
      });

      function lineShifter(textId, barId)  {
      $('#'+textId).change(function(){
        var input = $('#'+textId).val();
        var date = new Date(input).toISOString();
        if (textId.includes('Sys')) {
          var dx = xScale(moment(date).toDate());
          if (textId.includes('end')) {
            dx = -(width - margin.left - dx);
          }
          $('#'+barId).attr('transform', 'translate('+dx+', 0)');
        }
        else {
          var dy = yScale(moment(date).toDate());
          if (textId.includes('start')) {
            dy = -(height-margin.top-margin.bottom-dy);
          }
          $('#'+barId).attr('transform', 'translate(0,'+dy+')');
        }
      });
      }

      lineShifter('startSysBox', 'dragRight');
      lineShifter('endSysBox', 'dragLeft');
      lineShifter('startValBox', 'dragUp');
      lineShifter('endValBox', 'dragDown');

      //right vertical line
      lineCreator(width - margin.left-4, width - margin.left-4, 1, height-margin.top-margin.bottom, dragLeft, 'dragLeft');
      $('#endSysBox').val(format(xScale.invert(width - margin.left - margin.right)));

      //left vertical line
      lineCreator(3, 3, 3, height-margin.top-margin.bottom, dragRight, 'dragRight');
      $('#startSysBox').val(format(xScale.invert(0)));

      //bottom horizontal line
      lineCreator(0, width - margin.left, height - margin.bottom -margin.top-3, height - margin.bottom - margin.top-3 , dragUp, 'dragUp');
      $('#startValBox').val(format(yScale.invert(height -margin.top- margin.bottom)));

      //top horizontal line
      lineCreator(0, width - margin.left, 3, 3, dragDown, 'dragDown');
      $('#endValBox').val(format(yScale.invert(0)));
  }

  setDimensions();
  setupXAxis();
  setupYAxis();
  setupBarChartLayout();
  addRectangle();
  addXAxisLabel();
  addYAxisLabel();
  addBarChartData();
  addBackground();
  if (draggableBars) {
    addDragBars();
  }

};
  d3.selection.prototype.size = function() {
    var n = 0;
    this.each(function() { ++n; });
    return n;
  };

  chart.data = function(value) {
    if (!arguments.length) {
      return data;
    }
    data = value;
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value;
    return chart;
  };

  chart.xMin = function(value) {
    if (!arguments.length) {
      return xMin;
    }
    xMin = value;
    return chart;
  };

  chart.xMax = function(value) {
    if (!arguments.length) {
      return xMax;
    }
    xMax = value;
    return chart;
  };

  chart.yMin = function(value) {
    if (!arguments.length) {
      return yMin;
    }
    yMin = value;
    return chart;
  };

  chart.yMax = function(value) {
    if (!arguments.length) {
      return yMax;
    }
    yMax = value;
    return chart;
  };

  chart.draggableBars = function(value) {
    if (!arguments.length) {
      return draggableBars;
    }
    draggableBars = value;
    return chart;
  };

  chart.margin = function(value) {
    if (!arguments.length) {
      return margin;
    }
    margin = value;
    return chart;
  };

  chart.getDeleting = function() {
    return isDeleting;
  };

  chart.setDeleting = function(bool) {
    isDeleting = bool;
  };

  chart.getEditing = function() {
    return isEditing;
  };

  chart.setEditing = function(bool) {
    isEditing = bool;
  };

  chart.getViewing = function() {
    return isViewing;
  };

  chart.setViewing = function(bool) {
    isViewing = bool;
  };

  chart.getCurrentURI = function() {
    return uri;
  };

  chart.setCurrentURI = function(u) {
    uri = u;
  };

  chart.xAxisLabel = function(value) {
    if (!arguments.length) {
      return xAxisLabel;
    }
    xAxisLabel = value;
    return chart;
  };

  chart.yAxisLabel = function(value) {
    if (!arguments.length) {
      return yAxisLabel;
    }
    yAxisLabel = value;
    return chart;
  };

  chart.getDisplayProperty = function() {
    return displayProperty;
  };

  chart.setLogicalURI = function(str) {
    logicURI = str;
  };

  chart.getLogicalURI = function() {
    return logicURI;
  };

  chart.setDisplayProperty = function(str) {
    if(!str) {
      displayProperty = 'data';
    }
    else {
      displayProperty = str;
    }
    return chart;
  };

  return chart;
};
