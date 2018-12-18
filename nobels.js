// In case of not seeing the expected results, run: python -m http.server 8888

// dataset_extraction
var selectedBar, selectedCircle;
var general_transition = d3.transition()
                            .duration(500)
                            .ease(d3.easeLinear);

//scaterplot Variables
var r = 2;

// World Map Variables
var populationById = {};
var nameById = {};
var birthWinningColor = "#dd5ef5";
var affiliationWinningColor = "#6d88f3";
var birthAndAffiliationWinningColor = "#FF9933";

var world_colors = d3.scaleThreshold()
                      .domain([0,1,2,5,10,25,70,100])
                      .range(["rgb(247,251,255)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,48,107)","rgb(18, 36, 62)"]);
var sankey_colors;

function prize_color(chart) {
  switch(chart.toLowerCase()) {
    case "chemistry":
      return "#b8f878";
    case "physics":
      return "#8ad0f8";
    case "economics":
      return "gold";
    case "medicine":
      return "chocolate";
    case "literature":
      return "#6B8E23"; //"dark olive green";
    case "peace":
      return "#00CED1";
    default:
      return null;
  }
}

function choose_sankey_color(name) {
    var color = prize_color(name.replace(/ .*/, "").toLowerCase());
    if (color == null)
          color = d3.rgb(sankey_colors(name.replace(/ .*/, "")));
    return color;
}

var worldmap_tip, scatter_tip , sankey_tip;
function cleanMouseEvent(){
    d3.selectAll("*").interrupt();
    
    //Cleveland Plot
    d3.select("#bar_and_cleveland").selectAll("circle")
      // .interrupt()
      // .transition()
      .style("opacity", 1)
      .style('r', r)
      .style("fill", function (d1) {
        worldmap_tip.hide(d1);
        scatter_tip.hide(d1);
        return prize_color(d1.category);
      });

    d3.selectAll("g.scatter_legend_color").selectAll("*")
      .style("opacity", 0);

    //Bar Chart
    d3.select("#bar_and_cleveland").selectAll("bar_chart").selectAll("rect")
      // .interrupt()
      // .transition()
      .style("opacity", 1)
      .style("fill", function (d1) {
        return prize_color(d1.category);
      });

     //WorldMap
     d3.select("#worldmap").selectAll("path")
      //  .interrupt()
      //  .transition()
       .style("stroke", "white")
       .style("stroke-width", 0.3)
       .style("fill", function (d1) {
         return world_colors(populationById[d1.id]);
       })
       .style("opacity", 0.8);

     d3.select("#worldmap").selectAll("rect")
       .style("opacity", 0.8)
       .style("stroke-width", 0.3);

     d3.selectAll("g.world_legend_color").selectAll("*")
        .style("opacity", 0);

     //Sankey
     d3.select("#sankey_diagram").selectAll("rect")
       // .interrupt()
       // .transition()
       .style("fill", function(d1) {
          sankey_tip.hide(d1);
          if(d1.node>1) {
            return choose_sankey_color(d1.name);
          }
          else{
            return prize_color(d1.name);
          }
       })
       .style("opacity", 1);

     d3.select("#sankey_diagram").selectAll("path.link")
       // .interrupt()
       // .transition()
       .style("opacity", 0.8)
       .style("stroke-opacity", 0.2)
       .style("stroke", function (d1) { return choose_sankey_color(d1.target.name) });

     //Chord Chart
     d3.select("#chord").selectAll("circle,rect,path,text")
       .style("opacity", 1);
}

// var dispatch = d3.dispatch("mouseout");
// dispatch.on("mouseout", cleanMouseEvent);

//====================   dataset_extraction   ========================
d3.json("data/bars.json").then(function(data) {
    var bar_chart_dataset = data.slice(0,35);

    gen_bar_chart(bar_chart_dataset, "chemistry");
    gen_bar_chart(bar_chart_dataset, "physics");
    // gen_bar_chart(bar_chart_dataset, "economics");
    // gen_bar_chart(bar_chart_dataset, "medicine");
    // gen_bar_chart(bar_chart_dataset, "literature");
    // gen_bar_chart(bar_chart_dataset, "peace");
});

d3.json("data/cleveland.json").then(function(data) {
    var cleveland_dataset = data.slice(0,400);

    gen_scatterplot(cleveland_dataset, "chemistry");
    gen_scatterplot(cleveland_dataset, "physics");
    // gen_scatterplot(cleveland_dataset, "economics");
    // gen_scatterplot(cleveland_dataset, "medicine");
    // gen_scatterplot(cleveland_dataset, "literature");
    // gen_scatterplot(cleveland_dataset, "peace");

    world_map();
    gen_sankey();
    chord_chart();
});


//====================   gen_scatterplot   ========================
function gen_scatterplot(dataset, chart) {
    dataset = dataset.filter(function(d){ return d.category.toLowerCase() == chart; });

    // Set tooltips
    scatter_tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function (d) {
        return "<strong>Name: </strong><span class='details'>" + d.name + "<br></span>"
              + "<strong>Gender: </strong><span class='details'>" + d.Gender + "<br></span>"
              + "<strong>Age: </strong><span class='details'>" + d.Age + "<br></span>"
              + "<strong>Born in: </strong><span class='details'>" + d.BirthCity + ", " + d.countryBorn + "<br></span>"
              + "<strong>Worked for: </strong><span class='details'>" + d.affiliation + ", " + d.countryAffiliation + "<br></span>"
              + "<strong>Year: </strong><span class='details'>" + d.year + "</span>";
    })

    var w = 600;
    var h = 150;

    var svg = d3.select("#" + chart)
                  .append("svg")
                  .attr("width",w)
                  .attr("height",h)
  		            .style("fill", birthWinningColor)
                  ;


    var padding = 30;
    var bar_w = 15;

    //Axis creation
    var yscale = d3.scaleLinear()
                   .domain([0,0])
                   .range([h-padding,h-padding]);

    var xscale = d3.scaleLinear()
                   .domain([0,0])
                   .range([padding,padding]);

    var yaxis = d3.axisLeft()
                  .scale(yscale)
                  .ticks(8)
                  ;

    var xaxis = d3.axisBottom()
	                .scale(xscale)
                  .tickFormat(d3.format("d"));

    var cscale = d3.scaleLinear()
                   .domain([d3.min(dataset, function(d) { return d.year;}),
                            d3.max(dataset, function(d) { return d.year;})])
                   .range([affiliationWinningColor, birthWinningColor]);


    gY = svg.append("g")
            .attr("class","y axis")
           	.attr("transform","translate("+padding+",0)")
          	.call(yaxis);


    gX = svg.append("g")
            .attr("class","x axis")
            .attr("transform","translate(0," + (h-padding) + ")")
            .call(xaxis);

    //Axis Animation
    yscale.domain([90,20])
          .range([padding,h-padding]);
    xscale.domain([1900,2020])
          .range([padding,w-padding]);

    svg.selectAll(".x")
        .transition()
        .duration(3000)
        .call(xaxis);

    svg.selectAll(".y")
        .transition()
        .duration(3000)
        .call(yaxis);

    yaxis.tickSize(-innerWidth)
          .tickPadding(10);

    svg.selectAll(".y")
        .transition()
        .delay(3000)
        .duration(4000)
        .call(yaxis);

    svg.call(scatter_tip);


    //Zoom and Brush
    var brush = d3.brush()
                  .extent([ [0, 0], [w,h]])
                  //.on("brush", brushmove)
                  .on("end", brushended),
        idleTimeout,
        idleDelay = 350;

    var svg_brush = svg.append("svg")
                      .attr("class", "svgBrush")
                      .attr("transform", "translate(" + (-padding) + "," + (-padding) + ")")
                      .attr("height", h-2*padding)
                      .attr("y", padding)
                      .attr("width", w-padding)
                      .attr("x", padding);
    svg_brush = svg_brush.append("g")
                        .attr("transform", "translate(" + (-padding) + "," + (-padding) + ")")
                        .attr("class", "brush")
                        .call(brush)
                        ;

    // Average Line creation
    d3.json("data/statistics.json", function(data) {
        data = data.filter(function(d) { return d.category.toLowerCase() == chart; })[0];
        line = svg_brush.append('line')
                        .attr('id', 'average_age')
                        .style("pointer-events", "none")
                        .attr('category', data.category)
                        .attr('averageAge', data.averageAge)
                        .attr('x1', 0)
                        .attr('y1', yscale(data.averageAge))
                        .attr('x2', 0)
                        .attr('y2', yscale(data.averageAge))
                        .style('stroke', prize_color(chart))
                        .style("opacity",1)
                        .transition()
                        .delay(4500)
                        .duration(3000)
                        .attr('x2', w+padding);
    });


    //Circles Creation
    var circles = svg_brush.selectAll("circle")
                      .data(dataset)
                      .enter().append("circle")
                      .attr("r",0)
                      .style("fill",prize_color(chart))
                      .attr("cx",function(d, i) {
                                        if (d.year == 0) {
                                          return padding;
                                        }
                                        return  xscale(d.year);
                                })
                      .attr("cy",function(d) { return yscale(d.year - d.birthYear); })
                      .attr("name", function(d) { return d.name; })
                      .attr("prizeShare", function (d) { return d.prizeShare })
                      .attr("countryAffiliation", function(d){ return d.countryAffiliation })
                      .attr("countryBorn", function(d){ return d.countryBorn })
                      .attr("affiliation", function(d){ return d.affiliation })
                      .attr("category", function(d){ return d.category })
                      .attr("gender", function(d){ return d.Gender })
                      .on("mouseenter", function(d){
                                            cleanMouseEvent();
                                            //Opacity 0.5
                                            d3.selectAll("circle,rect,path")
                                              .transition()
                                              .duration(700)
                                              .style("opacity",0.2);

                                            //Change this
                                            scatter_tip.show(d);
                                            d3.select(this)
                                              .transition()
                                              .duration(700)
                                              .style('r',r * 3)
                                              .style("opacity",1);

                                            d3.selectAll("g.scatter_legend_color").selectAll("*")
                                              .transition()
                                              .duration(700)
                                              .style("opacity", 0);

                                            //Bar Chart
                                            d3.select("#" + chart)
                                              .selectAll("rect[prizeShare=\'" + d.prizeShare + "\']")
                                              .transition()
                                              .duration(700)
                                              .style("opacity",1);

                                            //Map
                                            d3.selectAll("path[country = \'" + d.countryBorn + "\']")
                                              .transition()
                                              .duration(700)
                                              .style("opacity", 1)
                                              .style("fill", birthWinningColor);
                                            d3.selectAll("path[country = \'" + d.countryAffiliation + "\']")
                                              .transition()
                                              .duration(700)
                                              .style("opacity", 1)
                                              .style("fill", function(d1) {
                                                                  if(d.countryBorn == d.countryAffiliation)
                                                                      return birthAndAffiliationWinningColor;
                                                                  else
                                                                      return affiliationWinningColor;
                                                              });

                                            d3.selectAll("g.world_legend_color").selectAll("*")
                                              .transition()
                                              .duration(700)
                                              .style("opacity", 1);

                                            //Sankey
                                            d3.select("rect[affiliationName=\'" + d.affiliation + "\']")
                                              .transition()
                                              .duration(700)
                                              .style("opacity", 1);
                                            d3.select("rect[affiliationName=\'" + d.category + "\']")
                                              .transition()
                                              .duration(700)
                                              .style("opacity", 1);

                                            d3.select("#sankey_diagram").selectAll("path[affiliationName=\'" + d.affiliation + "\']").filter("path[category=\'" + d.category + "\']")
                                              .transition()
                                              .duration(700)
                                              .style("opacity", 1)
                                              .style("stroke-opacity", 0.6);

                                            //Chord Chart
                                            d3.select("#chord").selectAll("text")
                                              .transition()
                                              .duration(700)
                                              .style("opacity",0.2);

                                            // console.log(d3v3.selectAll("g.node-" + d.name.replace(' ', '_')))
                                            // d3v3.selectAll("path.link.target-" + d.name.replace(' ', '_'))
                                            //   .classed("target", true)
                                            //   .each(updateNodes("source", true));

                                            // svg.selectAll("path.link.source-" + d.name.replace(' ', '_'))
                                            //   .classed("source", true)
                                            //   .each(updateNodes("target", true))
                                            //   // .transition()
                                            //   // .duration(800)
                                            //   .style("opacity", 1);
                                            //console.log(d3v3);
                                            //console.log(d3v3.selectAll("g#node-" + d.name.replace(' ', "_") + ".node"));
                                            // d3v3.selectAll("g#node-" + d.name.replace(' ', "_") + ".node")
                                            //   .on("mouseover", function (d) {
                                            //     //console.log("ola");
                                            //   });
                                      })
                      .on('mouseout', cleanMouseEvent)
                      .on('drag', function(d){console.log("please do not crash")});

      //Circles Animation
      svg.selectAll("circle")
          .transition()
          .delay(3000)
          .duration(3000)
          .attr("r",r);

      // function brushmove() {
      //   var extent = brush.extent();
      //   circles.classed("selected", function (d) {
      //     is_brushed = extent[0] <= d.index && d.index <= extent[1];
      //     return is_brushed;
      //   });
      // }

      function brushended() {
        var s = d3.event.selection;
        if (!s) {
          if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
          yscale.domain([90, 20]);
          xscale.domain([1900, 2020]);
        } else {
          xscale.domain([s[0][0], s[1][0]].map(xscale.invert, xscale));
          yscale.domain([s[0][1], s[1][1]].map(yscale.invert, yscale));
          svg.select(".brush").call(brush.move, null);
        }
        zoom();
      }

      function idled() {
        idleTimeout = null;
      }

      function zoom() {
        var t = svg.transition().duration(750);
        svg.select(".x").transition(t).call(xaxis);
        svg.select(".y").transition(t).call(yaxis);
        svg.selectAll("circle").transition(t)
            .attr("cx", function (d, i) {
                            if (d.year == 0) {
                              return padding;
                            }
                            return xscale(d.year);
                        })
            .attr("cy", function (d) {
                            return yscale(d.year - d.birthYear);
                        });
        svg.select('line#average_age').transition(t)
            .attr('y1', yscale(svg.select('line#average_age').attr('averageAge')))
            .attr('y2', yscale(svg.select('line#average_age').attr('averageAge')))
      }

       //Adding scatter_legend for our highlighted colors
       var highlights_scatter_legend_labels = ["Born in", "Won for", "Born and Won for"];
       var colorScale = d3.scaleOrdinal()
                          .domain(highlights_scatter_legend_labels)
                          .range([birthWinningColor, affiliationWinningColor, birthAndAffiliationWinningColor]);
       var highlights_scatter_legend = svg.selectAll("g.scatter_legend_color")
                                          .data(colorScale.domain())
                                          .enter().append("g")
                                          .attr("class", "scatter_legend_color");

       var ls_w = 12,
           ls_h = 12;

       highlights_scatter_legend.append("rect")
         .attr("class", "map_highlight_colors")
         .attr("x", function (d, i) {
           return w/6 + (i * 8 * ls_w) - 2 * ls_w;
         })
         .attr("y", 10)
         .attr("width", ls_w)
         .attr("height", ls_h)
         .attr("color", function (d, i) {
           return colorScale(i);
         })
         .style("fill", function (d, i) {
           return colorScale(i);
         })
         .style("opacity", 0.8)
         .style("stroke", "white")
         .style('stroke-width', 0.3);

       highlights_scatter_legend.append("text")
         .attr("class", "map_highlight_colors")
         .attr("x", function (d, i) {
           return w / 6 + (i * 8 * ls_w) - 8;
         })
         .attr("y", 20)
         .text(function (d, i) {
           return highlights_scatter_legend_labels[i];
         })
         .style("pointer-events", "none")
         .style("font-size", "12px")
         .style("font-family", "calibri, sans serif")
         .style("white-space", "pre")
         .style("fill", "rgb(247,251,255)");


       svg.selectAll("g.scatter_legend_color").selectAll("*").style("opacity", 0);
}

//====================   gen_bar_chart   ========================
function gen_bar_chart(dataset, chart){

    var max_bar_length = d3.max(dataset, function(d) { return d.number;})

    dataset = dataset.filter(function(d){ return d.category.toLowerCase()==chart;});

    var h = 150;
    var w = 170;

    var svg = d3.select("#" + chart)
                .append("bar_chart")
                .append("svg")
                .style("margin-left", "-30px")

                .attr("width",w)
                .attr("height",h);


    var padding = 30;
    var bar_h = 15;

    var wscale = d3.scaleLinear()
                   .domain([max_bar_length,0])
                   .range([padding,w-padding]);

    var yscale = d3.scaleLinear()
                   .domain([0,dataset.length])
                   .range([padding,h-padding]);

    svg.append("g")
        .attr("transform","translate("+ padding + ",0)")
        .attr("class","x axis");

    svg.append("g")
        .attr("transform","translate(0," + (w-padding) + ")");


    var bars = svg.selectAll("rect")
        .data(dataset)
        .enter().append("rect")
        .attr("height",Math.floor((h-padding*2)/dataset.length )-1) //dataset.length     (w-padding*2)/3)-1
        .style("fill",prize_color(chart))


        .attr("y",function(d, i) {
                      return yscale(i);
                  })
        .attr("x", w - padding)
        .attr("category", function(d) { return d.category; })
        .attr("prizeShare", function(d) { return d.prizeShare; })
        .text(function(d) { return d.prizeShare; }) //Not working
        .on("mouseenter", function (d) {
                                cleanMouseEvent();
                                //Opacity 0.5
                                d3.selectAll("circle,rect,path")
                                  .transition()
                                  .duration(700)
                                  .style("opacity",0.2);

                                //Change this
                                d3.select(this)
                                  .transition()
                                  .duration(700)
                                  .style("opacity", 1);

                                //Cleveland Plot
                                d3.select("#" + chart).selectAll("circle[prizeShare=\'" + d.prizeShare + "\']")
                                  .transition()
                                  .duration(700)
                                  .style('r',r * 2)
                                  .style("opacity", 1);

                                d3.selectAll("g.scatter_legend_color").selectAll("*")
                                  .transition()
                                  .duration(700)
                                  .style("opacity", 0);

                                //Map
                                d3.selectAll("g.world_legend_color").selectAll("*")
                                  .transition()
                                  .duration(700)
                                  .style("opacity", 0);
                                
                                //Chord Chart
                                d3.select("#chord").selectAll("text")
                                  .transition()
                                  .duration(700)
                                  .style("opacity",0.2);
                          })
        .on('mouseout', cleanMouseEvent)
        .transition()
        .duration(3000)
        .attr("x",function(d) {
                      return wscale(d.number);
                  })
        .attr("width",function(d) {
                              return w-padding-wscale(d.number);
                     });


  svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function (d) {
      return d.prizeShare;
    })
    .attr("y", function (d, i) {
      return i * (90 / dataset.length) + 46;  // +5
    })
    .attr("x", function (d) {
      return h -  + 27;              // +15
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "#3b3a3c")
    .style("pointer-events", "none");


}

//====================   world_map   ========================
function world_map(){
    var format = d3.format(",");

    // Set tooltips
    worldmap_tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                          return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Nº Winners: </strong><span class='details'>" + format(d.population) +"</span>";
                      })
    
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = 1200 - margin.left - margin.right,
        height = 690 - margin.top - margin.bottom,
        focus = [150, -40];

    var projection = d3.geoMercator()
                       .scale(100) // zoom alterar scale ver depois
                       .translate([(width / 2), (height / 2)])
                       .center(focus);

    var path = d3.geoPath()
                  .projection(projection);

    var zoom = d3.zoom()
                  .scaleExtent([1, 4])
                  .on("zoom", zoomed);


    var svg = d3.select("#worldmap")
                .append("svg")
                .attr("width", 700)
                .attr("height", 400)
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 700 400")
                .classed("svg-content-responsive", true)
                .on("mouseover", function(d) {
                    // //Uncomment for world map world_legend effect
                    // svg.selectAll("g.world_legend")
                    //     .transition()
                    //     .duration(3000)
                    //     .style("display","initial")
                })
                .on("mouseout", function(d){
                    // //Uncomment for world map world_legend effect
                    // svg.selectAll("g.world_legend")
                    //     .transition()
                    //     .duration(1000)
                    //     .style("display", "none")
                });

    var g = svg.append('g')
                .attr('class', 'map');

    svg.call(worldmap_tip);

    svg.call(zoom);

    function reset() {
      svg.transition()
        .duration(750)
        .call(zoom.transform,
          d3.zoomIdentity
          .translate(0, 0)
          .scale(1)
        );
    }

    function zoomed() {
      g.attr("transform", d3.event.transform);
    }

    svg.call(d3.drag()
                  .on("drag", function () {
                              svg.attr("transform", d3.event.transform);
                            }));

    queue().defer(d3.json, "data/world_countries.json")
            .defer(d3.tsv, "data/countrycount.tsv")
            .await(ready);

    function ready(error, data, population) {
        population.forEach(function(d) { populationById[d.id] = +d.population; });
        population.forEach(function(d) { nameById[d.id] = d.name; });
        data.features.forEach(function(d) { d.population = populationById[d.id] });

        g = svg.append("g")
                .attr("class", "countries")
              .selectAll("path")
                .data(data.features)
              .enter().append("path")
                .attr("d", path)
                .attr("country", function(d) { return nameById[d.id]; })
                .attr("color", function (d) { return world_colors(populationById[d.id]); })
                .style("fill", function(d) { return world_colors(populationById[d.id]); })
                .style("opacity",0.8)
                .style("stroke","white")
                .style('stroke-width', 0.3)
                .on('mouseenter', function (d) {
                                    cleanMouseEvent();
                                    //Opacity 0.2
                                    d3.selectAll("circle,rect,path")
                                      .style("opacity", 0.2);

                                    //Change this
                                    worldmap_tip.show(d);
                                    d3.select(this)
                                      .style("opacity", 1)
                                      .style("stroke","white")
                                      .style("stroke-width",1.5);
                                  
                                    d3.select("#worldmap").selectAll("rect[color=\'" + world_colors(populationById[d.id]) + "\']")
                                      .style("opacity", 1)
                                      .style("stroke-width", 1.5);

                                    d3.selectAll("g.world_legend_color").selectAll("*")
                                      .style("opacity", 0);

                                    //Cleveland Plot
                                    d3.selectAll("circle[countryAffiliation=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(700)
                                      .style('r',r * 2)
                                      .style("opacity", 1)
                                      .style("fill", affiliationWinningColor);
                                    d3.selectAll("circle[countryBorn=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(700)
                                      .style('r', r * 2)
                                      .style("opacity", 1)
                                      .style("fill", birthWinningColor);
                                    d3.selectAll("circle[countryBorn=\"" + nameById[d.id] + "\"]").filter("circle[countryAffiliation=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(700)
                                      .style('r',r * 2)
                                      .style("opacity", 1)
                                      .style("fill", birthAndAffiliationWinningColor);

                                    d3.selectAll("g.scatter_legend_color").selectAll("*")
                                      .transition()
                                      .duration(700)
                                      .style("opacity", 1);

                                    //Sankey
                                    d3.selectAll("rect[affiliationCountry=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(700)
                                      .style("opacity", 1);
                                    
                                    d3.select("#sankey_diagram").selectAll("path[affiliationCountry=\'" + nameById[d.id] + "\']")
                                      .transition()
                                      .duration(700)
                                      .style("opacity", 1)
                                      .style("stroke-opacity", 0.7);

                                    //Chord Chart
                                    d3.select("#chord").selectAll("text")
                                      .style("opacity",0.2);
                                })
                .on('mouseout', cleanMouseEvent);

        svg.append("path")
            .datum(topojson.mesh(data.features, function(a, b) { return a.id !== b.id; }))
            // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
            .attr("class", "names")
            .attr("d", path);
      }

      //Adding world_legend for our Choropleth on WorldMap 
      var world_legend_labels = ["0", "1", "2   -  4", "5   -  9", "10 - 24", "25 - 69", "70 - 99", "100+"]
      var world_legend = svg.selectAll("g.world_legend")
                      .data(world_colors.domain())
                    .enter().append("g")
                      .attr("class", "world_legend");

      var ls_w = 12,
          ls_h = 12;

      world_legend.append("rect")
        .attr("class", "map_colors")
        .attr("x", 20)
        .attr("y", function (d, i) {
          return height/1.7 - (i * ls_h) - 2 * ls_h;
        })
        .attr("width", ls_w)
        .attr("height", ls_h)
        .attr("color", function (d, i) { return world_colors(d); })
        .style("fill", function (d, i) { return world_colors(d); })
        .style("opacity", 0.8)
        .style("stroke", "white")
        .style('stroke-width', 0.3)
        .on("mouseenter", function(d){
            cleanMouseEvent();
            //Opacity 0.2
            d3.selectAll("circle,rect,path")
              .style("opacity", 0.2);

            d3.select(this)
              .style("opacity", 1)
              .style("stroke", "white")
              .style("stroke-width", 1.5);

            d3.select("#worldmap").selectAll("path[color=\'" + world_colors(d) + "\']")
              .style("opacity", 1)
              .style("stroke-width", 1.5);

            //forget other legends
            d3.selectAll("g.world_legend_color").selectAll("*")
              .style("opacity", 0);

            d3.selectAll("g.scatter_legend_color").selectAll("*")
              .style("opacity", 0);

            //Chord Chart
            d3.select("#chord").selectAll("text")
              .style("opacity", 0.2);
        })
        .on("mouseout", cleanMouseEvent);

      world_legend.append("text")
        .attr("class", "map_colors")
        .attr("x", 35)
        .attr("y", function (d, i) {
          return height/1.7 - (i * ls_h) - ls_h - 4;
        })
        .text(function (d, i) {
          return world_legend_labels[i];
        })
        .style("pointer-events", "none")
        .style("font-size","10px")
        .style("font-family", "calibri, sans serif")
        .style("white-space", "pre")
        .style("fill", "rgb(247,251,255)");


      //svg.selectAll("g.world_legend").style("display", "none")


      //Adding world_legend for our highlighted colors 
      var highlights_world_legend_labels = ["Born and Won for", "Won for", "Born in"];
      var colorScale = d3.scaleOrdinal()
                          .domain(highlights_world_legend_labels)
                          .range([birthAndAffiliationWinningColor, affiliationWinningColor, birthWinningColor]);
      var highlights_world_legend = svg.selectAll("g.world_legend_color")
                                  .data(colorScale.domain())
                                .enter().append("g")
                                  .attr("class", "world_legend_color");

      highlights_world_legend.append("rect")
        .attr("class", "map_highlight_colors")
        .attr("x", 20)
        .attr("y", function (d, i) {
          return height / 2.3 - (i * ls_h) - 2 * ls_h;
        })
        .attr("width", ls_w)
        .attr("height", ls_h)
        .attr("color", function (d, i) { return colorScale(i); })
        .style("fill", function (d, i) { return colorScale(i); })
        .style("opacity", 0.8)
        .style("stroke", "white")
        .style('stroke-width', 0.3);

      highlights_world_legend.append("text")
        .attr("class", "map_highlight_colors")
        .attr("x", 35)
        .attr("y", function (d, i) {
          return height / 2.3 - (i * ls_h) - ls_h - 2;
        })
        .text(function (d, i) {
          return highlights_world_legend_labels[i];
        })
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("font-family", "calibri, sans serif")
        .style("white-space", "pre")
        .style("fill", "rgb(247,251,255)");


      svg.selectAll("g.world_legend_color").selectAll("*").style("opacity", 0);
}

//==================== Sankey Diagram   ========================
function gen_sankey(){
    var units = "Connections";
    var rect;
  
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
                  width = 450 - margin.left - margin.right,
                  height = 304 - margin.top - margin.bottom;

    // format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function(d) { return formatNumber(d) + " " + units; },
        color = d3.scaleOrdinal(d3.schemeSet2 ); //schemeCategory20 /20c

    // Set tooltips
    sankey_tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function (d) {
        return "<strong></strong><span class='details'>" + (d.name ? d.name : d.source.name + " → " +
            d.target.name) + "<br></span>" +
          "<strong>Nº Winners: </strong><span class='details'>" + format(d.value) + "</span>";
      })
    
    sankey_colors=color;
    // append the svg object to the body of the page
    var svg = d3.select("#sankey_diagram")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");

    // Set the sankey diagram properties
    var sankey = d3.sankey()
                    .nodeWidth(20)
                    .nodePadding(40)
                    .size([width, height]);

    var path = sankey.link();

    svg.call(sankey_tip);
    // load the data
    d3.json("data/sankeyTop5.json", function(error, graph) {

        sankey.nodes(graph.nodes)
              .links(graph.links)
              .layout(32);

        // add in the links
        var link = svg.append("g")
                      .selectAll(".link")
                      .data(graph.links)
                    .enter().append("path")
                      .attr("class", "link")
                      .attr("d", path)
                      .attr("category", function (d) { return d.source.name;})
                      .attr("affiliationName",function(d){ return d.target.name; })
                      .attr("affiliationCountry",function(d){
                                                        if (d.target.country!=null)
                                                            return d.target.country;
                                                    })
                      .style("stroke", function(d) {return choose_sankey_color(d.target.name); })
                      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                      .sort(function(a, b) { return b.dy - a.dy; })
                      .on("mouseenter", function (d) {
                                          cleanMouseEvent();
                                          //Opacity 0.5
                                          d3.selectAll("circle,rect,path")
                                            .transition()
                                            .duration(700)
                                            .style("opacity",0.2);

                                          //Change this
                                          sankey_tip.show(d);
                                          d3.select(this)
                                            .transition()
                                            .duration(700)
                                            .style("opacity", 1)
                                            .style("stroke-opacity",0.7);

                                          d3.select("#sankey_diagram").selectAll("rect[affiliationName=\'" + d.target.name + "\']")
                                            .transition()
                                            .duration(700)
                                            .style("opacity", 1);
                                          d3.select("#sankey_diagram").selectAll("rect[affiliationName=\'" + d.source.name + "\']")
                                            .transition()
                                            .duration(700)
                                            .style("opacity", 1);

                                          //Cleveland Plot
                                         d3.selectAll("circle[affiliation=\'" + d.target.name + "\']").filter("circle[category =\'" + d.source.name + "\']")
                                            .transition()
                                            .duration(700)
                                            .style('r',r*2);

                                          d3.selectAll("g.scatter_legend_color").selectAll("*")
                                            .transition()
                                            .duration(700)
                                            .style("opacity", 0);

                                          //Map
                                          d3.selectAll("path[country=\'" + d.target.country + "\']")
                                            .transition()
                                            .duration(700)
                                            .style("opacity", 1)
                                            .style("stroke", "white")
                                            .style("stroke-width", 1.5);

                                          d3.selectAll("g.world_legend_color").selectAll("*")
                                            .transition()
                                            .duration(700)
                                            .style("opacity", 0);

                                          //Chord Chart
                                          d3.select("#chord").selectAll("text")
                                            .transition()
                                            .duration(700)
                                            .style("opacity",0.2);
                                       })
                      .on("mouseout", cleanMouseEvent);

        // add in the nodes
        var node = svg.append("g").selectAll(".node")
                      .data(graph.nodes)
                    .enter().append("g")
                      .attr("class", "node")
                      .attr("transform", function(d) {
                  	                         return "translate(" + d.x + "," + d.y + ")"; })
                      .call(d3.drag()
                              .subject(function(d) { return d; })
                              .on("start", function() {
                                  this.parentNode.appendChild(this);
                              })
                              .on("drag", dragmove));

        // add the rectangles for the nodes
        rect = node.append("rect")
                    .attr("height", function(d) { return d.dy; })
                    .attr("width", sankey.nodeWidth())
                    .attr("affiliationName",function(d){ return d.name })
                    .attr("affiliationCountry",function(d){
                                                      if (d.country!=null)
                                                          return d.country;
                                                  })
                    .style("fill", function(d) {return d.color = choose_sankey_color(d.name.replace(/ .*/, "")); })
                    .style("stroke", function(d) {return d3.rgb(d.color).darker(2); })
                    .on("mouseenter", function (d) {
                        cleanMouseEvent();
                        //Opacity 0.5
                        d3.selectAll("circle,rect,path")
                          .transition()
                          .duration(500)
                          .style("opacity", 0.2);

                        //Change this
                        sankey_tip.show(d);
                        d3.select(this)
                          .transition()
                          .duration(700)
                          .style("opacity", 1);

                        d3.select("#sankey_diagram").selectAll("path[affiliationName=\'" + d.name + "\']")
                          .transition()
                          .duration(700)
                          .style("opacity", 1)
                          .style("stroke-opacity", 0.7);

                        d3.selectAll("g.world_legend_color").selectAll("*")
                          .transition()
                          .duration(700)
                          .style("opacity", 0);

                        //Cleveland Plot
                        d3.selectAll("circle[affiliation=\'" + d.name + "\']")
                          .transition()
                          .duration(700)
                          .style('r', r * 2);

                        d3.select("#" + d.name.toLowerCase()).selectAll("circle,rect")
                          .transition()
                          .duration(700)
                          .style("opacity", 1);

                        d3.selectAll("g.scatter_legend_color").selectAll("*")
                          .transition()
                          .duration(700)
                          .style("opacity", 0);

                        //Map
                        d3.selectAll("path[country=\'" + d.country + "\']")
                          .transition()
                          .duration(700)
                          .style("opacity", 1)
                          .style("stroke", "white")
                          .style("stroke-width", 1.5);

                        d3.selectAll("g.world_legend_color").selectAll("*")
                          .style("opacity", 0);

                        //Chord Chart
                        d3.select("#chord").selectAll("text")
                          .transition()
                          .duration(700)
                          .style("opacity",0.2);
                      })
                      .on("mouseout", cleanMouseEvent);

        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
            .style("pointer-events", "none")
            .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

        // the function for moving the nodes
        function dragmove(d) {
            d3.select(this).attr("transform",
                "translate(" + (
                	   d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
                	) + "," + (
                           d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
                    ) + ")");
            sankey.relayout();
            link.attr("d", path);
        }
    });
}

//=================== Chord Chart   ======================
function chord_chart(){

    console.log('v3.svg', d3v3.version)

    var w = 680,
      h = 650,
      rx = w / 2,
      ry = h / 2,
      m0,
      rotate = 0
      pi = Math.PI;

    var splines = [];

    var cluster = d3v3.layout.cluster()
      .size([360, ry - 180])
      .sort(function(a, b) { return d3v3.ascending(a.key, b.key); });

    var bundle = d3v3.layout.bundle();

    var line = d3v3.svg.line.radial()
      .interpolate("bundle")
      .tension(.85)
      .radius(function(d) { return d.y; })
      .angle(function(d) { return d.x / 180 * Math.PI; });

    // Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
    var div = d3v3.select("#chord")
      .style("width", 600 + "px")
      .style("height", 400 + "px")
      .style("margin-top", "-250px")
      .style("margin-left", "-70px")

      // .style("position", "absolute")
      ;

    var svg = div.append("svg:svg")
      .attr("width", w)
      .attr("height", w)
      // .style("top", "0px")
      .append("svg:g")
      .attr("transform", "translate(" + rx + "," + ry + ")");

    svg.append("svg:path")
      .attr("class", "arc")
      .attr("d", d3v3.svg.arc().outerRadius(ry - 180).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
      .on("mousedown", mousedown);

    d3v3.json("data/chordchartPhysicsWithouAntiSocials_pt2.json", function(classes) {
          var nodes = cluster.nodes(packages.root(classes)),
              links = packages.imports(nodes),
              splines = bundle(links);

          var path = svg.selectAll("path.link")
                        .data(links)
                      .enter().append("svg:path")
                        .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
                        .attr("d", function(d, i) { return line(splines[i]); });

          var groupData = svg.selectAll("g.group")
                            .data(nodes.filter(function(d) { return (
                                            d.key=='Harvard_University' || d.key == 'University_of_California' || d.key == 'MIT' ||
                                            d.key== "Academy_of_Sciences"|| d.key== "Amsterdam_University"|| d.key== "Atomic_Energy_Research_Establishment"|| d.key== "Australian_National_University"|| d.key== "Bell_Laboratories"|| d.key== "Bell_Telephone_Laboratories"|| d.key== "Berlin_University"|| d.key== "Bristol_University"|| d.key== "Brown_University"|| d.key== "Caltech"|| d.key== "CERN"|| d.key== "Chinese_University_of_Hong_Kong"|| d.key== "CollÃ¨ge_de_France"|| d.key== "Columbia_Univeristy"|| d.key== "Columbia_University"|| d.key== "Copenhagen_University"|| d.key== "Cornell_University"|| d.key== "Department_of_Scientific_and_Industrial_Research"|| d.key== "Digital_Pathways_Inc"|| d.key== "Edinburgh_University"|| d.key== "ETH_Zurich"|| d.key== "Forschungszentrum_J&uuml;lich"|| d.key== "Frankfurt-on-the-Main_University"|| d.key== "Fritz-Haber-Institut_der_Max-Planck-Gesellschaft"|| d.key== "Goettingen_University"|| d.key== "Greifswald_University"|| d.key== "Groningen_University"|| d.key== "Halle_University"|| d.key== "Harvard_University"|| d.key== "Humboldt_University_of_Berlin"|| d.key== "I_Campbell"|| d.key== "IBM_Zurich_Research_Laboratory"|| d.key== "Imperial_College_of_London"|| d.key== "Institute_for_Advanced_Study"|| d.key== "International_Bureau_of_Weights_and_Measures"|| d.key== "International_Centre_for_Theoretical_Physics"|| d.key== "IPHT"|| d.key== "Johns_Hopkins_University"|| d.key== "Kajuro_Tamaki"|| d.key== "KEK"|| d.key== "Kiel_University"|| d.key== "Kyoto_Imperial_University"|| d.key== "Kyoto_Sangyo_University"|| d.key== "Lawrence_Berkeley_National_Laboratory"|| d.key== "Leiden_University"|| d.key== "Leipzig_University"|| d.key== "Liverpool_University"|| d.key== "London_University"|| d.key== "Ludwig-Maximilians-_UniversitÃ¤t"|| d.key== "Marconi_Wireless_Telegraph_Co_Ltd"|| d.key== "Max-Planck-Institut"|| d.key== "Max-Planck_Institut"|| d.key== "Meijo_University"|| d.key== "MIT"|| d.key== "Moscow_State_University"|| d.key== "Munich_University"|| d.key== "Municipal_School_of_Industrial_Physics_and_Chemistry"|| d.key== "Nagoya_Imperial_Univeristy"|| d.key== "Nagoya_University"|| d.key== "NASA_Goddard_Space_Flight_Center"|| d.key== "National_Institute_of_Standards_and_Technology"|| d.key== "Nordita"|| d.key== "PN_Lebedev_Physical_Institute"|| d.key== "Princeton_University"|| d.key== "Queen's_University"|| d.key== "Rome_University"|| d.key== "Royal_Institution_of_Great_Britain"|| d.key== "Semiconductor_Laboratory_of_Beckman_Instruments_Inc"|| d.key== "Sorbonne_University"|| d.key== "Stanford_Linear_Accelerator_Center"|| d.key== "Stanford_University"|| d.key== "Strasbourg_University"|| d.key== "Technical_University_of_Berlin"|| d.key== "Trinity_College"|| d.key== "Unit&eacute;_Mixte_de_Physique_CNRS\/THALES"|| d.key== "Univer_of_Konigsberg"|| d.key== "Univeristy_of_Cambridge"|| d.key== "Univeristy_of_Goettingen"|| d.key== "Univeristy_of_Konigsberg"|| d.key== "Univeristy_of_Oxford"|| d.key== "Univeristy_of_Zurich"|| d.key== "University_College"|| d.key== "University_College_of_London"|| d.key== "University_of_Bologna"|| d.key== "University_of_Bonn"|| d.key== "University_of_Budapest"|| d.key== "University_of_California"|| d.key== "University_of_Cambridge"|| d.key== "University_of_Chicago"|| d.key== "University_of_Colorado"|| d.key== "University_of_Columbia"|| d.key== "University_of_Edinburgh"|| d.key== "University_of_Geneva"|| d.key== "University_of_Giesen"|| d.key== "University_of_Goettingen"|| d.key== "UNiversity_of_Goettingen"|| d.key== "University_of_Grenoble"|| d.key== "University_of_Heidelberg"|| d.key== "University_of_Illinois"|| d.key== "University_of_Innsbruck"|| d.key== "University_of_Konigsberg"|| d.key== "University_of_London"|| d.key== "University_of_Manchester"|| d.key== "University_of_Oxford"|| d.key== "University_of_Pennsylvania"|| d.key== "University_of_Rochester"|| d.key== "University_of_Tokyo"|| d.key== "University_of_Toronto"|| d.key== "University_of_Utrecht"|| d.key== "University_of_Washington"|| d.key== "Victoria_University"|| d.key== "WÃ¼rzburg_University"|| d.key== "École_Normale_Supérieure"|| d.key== "École_Polytechnique"|| d.key== "École_Supérieure_de_Physique_et_Chimie"

                                          ) && d.children; }))
                            .enter().append("group")
                            .attr("class", "group");

          var groupArc = d3v3.svg.arc()
                                .innerRadius(ry - 177)
                                .outerRadius(ry - 157)
                                .startAngle(function(d) { return (findStartAngle(d.__data__.children)-2) * pi / 180;})
                                .endAngle(function(d) { return (findEndAngle(d.__data__.children)+2) * pi / 180});
          
          var color = d3v3.scale.category20c();

          svg.selectAll("g.arc")
              .data(groupData[0])
              .enter().append("svg:path")
              .attr("d", groupArc)
              .attr("class", "groupArc")
              .attr("fill",function(d,i){return color(i);})
              .style("fill-opacity", 0.65);

          svg.selectAll("g.node")
              .data(nodes.filter(function(n) { return !n.children; }))
            .enter().append("svg:g")
              .attr("class", "node")
              .attr("id", function(d) { return "node-" + d.key; })
              .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
            .append("svg:text")
              .attr("dx", function(d) { return d.x < 180 ? 25 : -25; })
              .attr("dy", ".31em")
              .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
              .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
              .text(function(d) { return d.key.replace(/_/g, ' '); })
              .on("mouseover", mouseover)
              .on("mouseout", mouseout);

          d3v3.select("input[type=range]")
              .on("change", function() {
                                line.tension(this.value / 100);
                                path.attr("d", function(d, i) { return line(splines[i]); });
                            });
    });

    d3v3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup);

    function mouse(e) {
        return [e.pageX - rx, e.pageY - ry];
    }

    function mousedown() {
        m0 = mouse(d3v3.event);
        d3v3.event.preventDefault();
    }

    function mousemove() {
        if (m0) {
            var m1 = mouse(d3v3.event),
                dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;
            div.style("-webkit-transform", "translate3d(0," + (ry - rx) + "px,0)rotate3d(0,0,0," + dm + "deg)translate3d(0," + (rx - ry) + "px,0)");
        }
    }

    function mouseup() {
        if (m0) {
            var m1 = mouse(d3v3.event),
                dm = Math.atan2(cross(m0, m1), dot(m0, m1)) * 180 / Math.PI;

            rotate += dm;
            if (rotate > 360) rotate -= 360;
            else if (rotate < 0) rotate += 360;
            m0 = null;

            div.style("-webkit-transform", "rotate3d(0,0,0,0deg)");

            svg.attr("transform", "translate(" + rx + "," + ry + ")rotate(" + rotate + ")")
              .selectAll("g.node text")
                .attr("dx", function(d) { return (d.x + rotate) % 360 < 180 ? 25 : -25; })
                .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
                .attr("transform", function(d) { return (d.x + rotate) % 360 < 180 ? null : "rotate(180)"; });
        }
    }

    function mouseover(d) {
        //Call Cleveland Action
        // d3.selectAll("circle[name=\"" + d.key.replace(/_/g, ' ') + "\"]")
        //   .dispatch("mouseenter");

        //Get everything with opacity 1
        d3.selectAll("#bar_and_cleveland, #worldmap, #sankey_diagram").selectAll("circle,rect,path")
          .style("opacity",0.2);

        //Clear legends
        d3.selectAll("g.world_legend_color").selectAll("*").style("opacity", 0);
        d3.selectAll("g.scatter_legend_color").selectAll("*").style("opacity", 0);

        //MouseOver this
        d3v3.select(this)
            .transition()
            .duration(750)
            .style("opacity",1);

        d3v3.selectAll("path.link.target-" + d.key)
            .classed("target", true)
            .each(updateNodes("source", true));

        d3v3.selectAll("path.link.target-" + d.key)
            .transition()
            .duration(750)
            .style("opacity", 1);

        svg.selectAll("path.link.source-" + d.key)
            .classed("source", true)
            .each(updateNodes("target", true));

        d3v3.selectAll("path.link.source-" + d.key)
          .transition()
          .duration(750)
          .style("opacity", 1);
    }


    function mouseout(d) {
        cleanMouseEvent();

        //Clear this
        svg.selectAll("path.link.source-" + d.key)
            .style("opacity", 0.2)
            .classed("source", false)
            .each(updateNodes("target", false));

        svg.selectAll("path.link.target-" + d.key)
            .style("opacity", 0.2)
            .classed("target", false)
            .each(updateNodes("source", false));
    }


    function updateNodes(name, value) {
      return function(d) {
        console.log(this);
        console.log(d);
        if (value) this.parentNode.appendChild(this);
        d3.select("#chord").select("#node-" + d[name].key)
            .classed(name, value);
      };
    }

    function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }

    function findStartAngle(children) {
        var min = children[0].x;
        children.forEach(function(d) {
            if (d.x < min)
                min = d.x;
        });
        return min;
    }

    function findEndAngle(children) {
      var max = children[0].x;
      children.forEach(function(d) {
          if (d.x > max)
              max = d.x;
      });
      return max;
    }
}


//=================== Filter Column   ======================

function womanClicked(){
  var checkBox = document.getElementById("woman");
  if (checkBox.checked == true){

    d3.select("#chemistry").selectAll("circle[gender=\"" + "Female" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 1)
      ;
    d3.select("#physics").selectAll("circle[gender=\"" + "Female" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 1)
      ;
  } else {
    d3.select("#chemistry").selectAll("circle[gender=\"" + "Female" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 0.1)
      ;
    d3.select("#physics").selectAll("circle[gender=\"" + "Female" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 0.1)
      ;
  }
}
function manClicked(){
  var checkBox = document.getElementById("men");
  if (checkBox.checked == true){


    d3.select("#chemistry").selectAll("circle[gender=\"" + "Male" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 1)
      ;
    d3.select("#physics").selectAll("circle[gender=\"" + "Male" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 1)
      ;
  } else {
    d3.select("#chemistry").selectAll("circle[gender=\"" + "Male" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 0.1)
      ;
    d3.select("#physics").selectAll("circle[gender=\"" + "Male" + "\"]")
      .transition()
      .duration(700)
      .style("opacity", 0.1)
      ;
  }
}
