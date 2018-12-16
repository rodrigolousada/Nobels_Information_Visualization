// In case of not seeing the expected results, run: python -m http.server 8888
//====================   global_variables   ========================
// source
// src="http://d3js.org/d3.v4.min.js"

// srcsankey="sankey.js"

// dataset_extraction
var selectedBar, selectedCircle;

//scaterplot Variables
var r = 2;

// World Map Variables
var populationById = {};
var nameById = {};
var world_colors = d3.scaleThreshold()
                      .domain([0,0.5,1,2,5,10,25,70,100,400])
                      .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,48,107)","rgb(3,19,43)"]);
var sankey_colors;

function prize_color(chart) {
  switch(chart.toLowerCase()) {
    case "chemistry":
      return "purple";
    case "physics":
      return "#1f77b4";
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

//====================   dataset_extraction   ========================
d3.json("data/bars_new.json").then(function(data) {
    var bar_chart_dataset = data.slice(0,35);

    gen_bar_chart(bar_chart_dataset, "chemistry");
    gen_bar_chart(bar_chart_dataset, "physics");
    // gen_bar_chart(bar_chart_dataset, "economics");
    // gen_bar_chart(bar_chart_dataset, "medicine");
    // gen_bar_chart(bar_chart_dataset, "literature");
    // gen_bar_chart(bar_chart_dataset, "peace");
});

d3.json("data/clevelandClean1.json").then(function(data) {
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
    var div = d3.select("body").append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);
    // var formatTime = d3.time.format("%e %B");

    dataset = dataset.filter(function(d){ return d.category.toLowerCase() == chart; });

    var w = 600;
    var h = 150;

    var svg = d3.select("#" + chart)
                  .append("svg")
                  .attr("width",w)
                  .attr("height",h)
  		            .style("fill", "blue");


    var padding = 30;
    var bar_w = 15;

    //Axis creation
    var hscale = d3.scaleLinear()
                   .domain([0,0])
                   .range([h-padding,h-padding]);

    var xscale = d3.scaleLinear()
                   .domain([0,0])
                   .range([padding,padding]);

    var yaxis = d3.axisLeft()
                  .scale(hscale)
                  .ticks(8);

    var xaxis = d3.axisBottom()
	                .scale(xscale)
                  .tickFormat(d3.format("d"));

    var cscale = d3.scaleLinear()
                   .domain([d3.min(dataset, function(d) { return d.year;}),
                            d3.max(dataset, function(d) { return d.year;})])
                   .range(["red", "blue"]);


    gY = svg.append("g")
            .attr("class","y axis")
           	.attr("transform","translate(30,0)")
          	.call(yaxis);


    gX = svg.append("g")
            .attr("class","x axis")
            .attr("transform","translate(0," + (h-padding) + ")")
            .call(xaxis);

    //Axis Animation
    hscale.domain([90,20])
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


        // Average Line creation
    d3.json("data/statistics.json", function(data) {
        data = data.filter(function(d) { return d.category.toLowerCase() == chart; })[0];
        line = svg.append('line')
                  .attr('id', 'average_age')
                  .attr('x1', padding)
                  .attr('y1', hscale(data.averageAge))
                  .attr('x2', padding)
                  .attr('y2', hscale(data.averageAge))
                  .style('stroke', prize_color(chart))
                  .style("opacity",1)
                  .transition()
                  .delay(4500)
                  .duration(3000)
                  .attr('x2', w);
        });
    //Circles Creation
    svg.selectAll("circle")
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
        .attr("cy",function(d) { return hscale(d.year - d.birthYear); })
        .attr("name", function(d) { return d.name; })
      .attr("prizeShare", function (d) { return d.prizeShare })
        .attr("countryAffiliation", function(d){ return d.countryAffiliation })
        .attr("countryBorn", function(d){ return d.countryBorn })
        .attr("affiliation", function(d){ return d.affiliation })
        .attr("category", function(d){ return d.category })
        .on("mouseenter", function(d){
                              //Opacity 0.5
                              d3.selectAll("circle,rect,path")
                                .transition()
                                .duration(250)
                                .style("opacity",0.5);

                              //Change this
                              tooltip.style("display",'block');
                              d3.select(this)
                                .transition()
                                .duration(250)
                                .style('r',r * 2)
                                .style("opacity",1)
                                .style("fill", "green");

                              //Bar Chart
                              d3.select("#" + chart)
                                .selectAll("rect[prizeShare=\'" + d.prizeShare + "\']")
                                .transition()
                                .duration(250)
                                .style("opacity",1)
                                .style("fill","green");

                              //Map
                              d3.selectAll("path[country = \'" + d.countryBorn + "\']")
                                .transition()
                                .duration(250)
                                .style("opacity", 1)
                                .style("fill","blue");
                              d3.selectAll("path[country = \'" + d.countryAffiliation + "\']")
                                .transition()
                                .duration(250)
                                .style("opacity", 1)
                                .style("fill","red");

                              //Sankey
                              d3.select("rect[affiliationName=\'" + d.affiliation + "\']")
                                .transition()
                                .duration(250)
                                .style("fill","green")
                                .style("opacity", 1);
                              // d3.select('line')
                              //   .style("opacity", 1);
                        })
        .on('mouseleave', function(d){
                            //Opacity back to normal
                            d3.selectAll("circle,rect")
                              .transition()
                              .duration(100)
                              .style("opacity",1);
                            d3.selectAll("path")
                              .transition()
                              .duration(100)
                              .style("opacity",0.8);

                            //Change this
                            tooltip.style("display", "none");
                            d3.select(this)
                              .transition()
                              .duration(100)
                              .style('r',r)
                              .style("fill", prize_color(chart));

                            //Bar Chart
                            d3.select("#" + chart).selectAll("rect[prizeShare=\'" + d.prizeShare + "\']")
                              .transition()
                              .duration(100)
                              .style("fill", prize_color(chart));

                            //Map
                            d3.selectAll("path[country = \'" + d.countryBorn + "\']")
                              .transition()
                              .duration(100)
                              .style("fill", function(d1) { return world_colors(populationById[d1.id]); })
                              .style("opacity", 0.8);
                            d3.selectAll("path[country = \'" + d.countryAffiliation + "\']")
                              .transition()
                              .duration(100)
                              .style("fill", function(d1) { return world_colors(populationById[d1.id]); })
                              .style("opacity", 0.8);

                            //Sankey
                            d3.select("rect[affiliationName=\'" + d.affiliation + "\']")
                              .transition()
                              .duration(100)
                              .style("fill",choose_sankey_color(d.affiliation))
                              .style("opacity", 1);
                        })
        .on('mousemove', function(d){
                            var xPos = d3.mouse(this)[0] - 60;
                            var yPos = d3.mouse(this)[1] - 35;

                            tooltip.attr('transform','translate('+ xPos+","+ yPos+")");
                            tooltip.select("text").text(d.name);
                            // tooltip.select('.ma').html(d.data.label);
                        });

        //Circles Animation
        svg.selectAll("circle")
            .transition()
            .delay(3000)
            .duration(3000)
            .attr("r",r);



        //Tooltip
        var tooltip = svg.append("g")
                          .attr("class", tooltip)
                          .style('display','none');
        tooltip.append("rect")
                .attr("width",150)
                .attr("height",30)
                .style("fill","black")
                .style("fill-opacity",.80);
        tooltip.append("text")
                .attr("x",15)
                .attr('dy','1.2em')
                .style("fill", "white")
                .style('front-size','1.25em')
                .style('font-family','Arial')
                // .style('color','')
                .attr('font-weight','bold');
}

//====================   gen_bar_chart   ========================
function gen_bar_chart(dataset, chart){

    var max_bar_length = d3.max(dataset, function(d) { return d.number;})

    dataset = dataset.filter(function(d){ return d.category.toLowerCase()==chart;});

    var h = 150;
    var w = 200;

    var svg = d3.select("#" + chart)
                .append("svg")
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
        .attr("transform","translate(30,0)")
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
        .attr("x",w-padding)
      .attr("prizeShare", function(d) { return d.prizeShare; })
        .text(function(d) { return d.prizeShare; }) //Not working
        .on("mouseenter", function(d){
                                //Opacity 0.5
                                d3.selectAll("circle,rect,path")
                                  .style("opacity",0.5);

                                //Change this
                                d3.select(this)
                                  .style("opacity", 1)
                                  .style("fill", "green");

                                //Cleveland Plot
                                d3.select("#" + chart).selectAll("circle[prizeShare=\'" + d.prizeShare + "\']")
                                  .transition()
                                  .duration(250)
                                  .style('r',r * 2)
                                  .style("opacity", 1)
                                  .style("fill","green");
                          })
        .on('mouseleave', function(d){
                                //Opacity back to normal
                                d3.selectAll("circle,rect")
                                  .style("opacity",1);
                                d3.selectAll("path")
                                  .style("opacity",0.8);

                                //Change this
                                d3.select(this)
                                  .style("fill",prize_color(chart));
                                d3.select("#" + chart)
                                  .selectAll("circle[prizeShare=\'" + d.prizeShare + "\']")
                                  .transition()
                                  .duration(100)
                                  .style('r',r )
                                  .style("fill",prize_color(chart));
                          })
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
      return h -  + 0;              // +15
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "white");


}

//====================   world_map   ========================
function world_map(){
    var format = d3.format(",");

    // Set tooltips
    var tip = d3.tip()
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
                .classed("svg-content-responsive", true);

    var g = svg.append('g')
                .attr('class', 'map');

    svg.call(tip);

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
                .style("fill", function(d) { return world_colors(populationById[d.id]); })
                .style('stroke', 'white')
                .style('stroke-width', 1.5)
                .style("opacity",0.8)
                // tooltips
                .style("stroke","white")
                .style('stroke-width', 0.3)
                .on('mouseenter',function(d){
                                    //Opacity 0.5
                                    d3.selectAll("circle,rect,path")
                                      .style("opacity",0.5);

                                    //Change this
                                    tip.show(d);
                                    d3.select(this)
                                      .style("opacity", 1)
                                      .style("stroke","white")
                                      .style("stroke-width",1.5);

                                    //Cleveland Plot
                                    d3.selectAll("circle[countryAffiliation=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .style('r',r * 2)
                                      .duration(250)
                                      .style("opacity", 1)
                                      .style("fill", "red");
                                    d3.selectAll("circle[countryBorn=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .style('r',r * 2)
                                      .duration(250)
                                      .style("opacity", 1)
                                      .style("fill", "blue");

                                    //Sankey
                                    d3.selectAll("rect[affiliationCountry=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(250)
                                      .style("opacity", 1)
                                      .style("fill", "green");
                                })
                .on('mouseleave', function(d){
                                    //Opacity back to normal
                                    d3.selectAll("circle,rect")
                                      .style("opacity",1);
                                    d3.selectAll("path")
                                      .style("opacity",0.8);

                                    //Change this
                                    tip.hide(d);
                                    d3.select(this)
                                      .style("opacity", 0.8)
                                      .style("stroke","white")
                                      .style("stroke-width",0.3);

                                    //Cleveland Plot
                                    d3.selectAll("circle[countryAffiliation=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(100)
                                      .style('r',r)
                                      .style("fill", function(d1) { return prize_color(d1.category);});
                                    d3.selectAll("circle[countryBorn=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(100)
                                      .style('r',r)
                                      .style("fill", function(d1) { return prize_color(d1.category);});

                                    //Sankey
                                    d3.selectAll("rect[affiliationCountry=\"" + nameById[d.id] + "\"]")
                                      .transition()
                                      .duration(250)
                                      .style("fill", function(d1) { return choose_sankey_color(d1.name);})
                                      .style("opacity", 1);
                                });

        svg.append("path")
            .datum(topojson.mesh(data.features, function(a, b) { return a.id !== b.id; }))
            // .datum(topojson.mesh(data.features, function(a, b) { return a !== b; }))
            .attr("class", "names")
            .attr("d", path);
      }
}

//==================== Sankey Diagram   ========================
function gen_sankey(){
    var units = "Widgets";
    var rect;
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
                  width = 450 - margin.left - margin.right,
                  height = 304 - margin.top - margin.bottom;

    // format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
        format = function(d) { return formatNumber(d) + " " + units; },
        color = d3.scaleOrdinal(d3.schemeCategory10); //schemeCategory20 /20c

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
                      .attr("affiliationName",function(d){ return d.target.name; })
                      .attr("affiliationCountry",function(d){
                                                        if (d.target.country!=null)
                                                            return d.target.country;
                                                    })
                      .style("stroke", function(d) {return choose_sankey_color(d.target.name); })
                      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                      .sort(function(a, b) { return b.dy - a.dy; })
                      .on("mouseenter", function(d){
                                          //Opacity 0.5
                                          d3.selectAll("circle,rect,path")
                                            .transition()
                                            .duration(250)
                                            .style("opacity",0.5);

                                          //Change this
                                          d3.select(this).selectAll("rect")
                                            .style("opacity", 1);

                                          //Cleveland Plot
                                          d3.selectAll("circle[affiliation=\'" + d.target.name + "\']")
                                            .transition()
                                            .duration(100)
                                            .style('r',r*4 )
                                            .style("fill","green");

                                          //Map
                                          d3.selectAll("path[country=\'" + d.target.country + "\']")
                                            .transition()
                                            .duration(100)
                                            .style("opacity",1)
                                            .style("fill","green");
                                       })
                      .on("mouseleave", function(d){
                                           //Opacity back to normal
                                           d3.selectAll("circle,rect")
                                             .transition()
                                             .duration(100)
                                             .style("opacity",1);
                                           d3.selectAll("path")
                                             .transition()
                                             .duration(100)
                                             .style("opacity",0.8);

                                           //Change this

                                           //Cleveland Plot
                                           d3.selectAll("circle[affiliation=\'" + d.target.name + "\']")
                                             .transition()
                                             .duration(100)
                                             .style('r',r )
                                             .style("opacity",1)
                                             .style("fill", function(d1) { return prize_color(d1.category);});

                                          //Map
                                           d3.selectAll("path[country = \'" + d.target.country + "\']")
                                             .transition()
                                             .duration(100)
                                             .style("opacity", 0.8)
                                             .style("fill", function(d1) { return world_colors(populationById[d1.id]); });
                                      });

        // add the link titles
        link.append("title")
            .text(function(d) {
                  		return d.source.name + " → " +
                              d.target.name + "\n" + format(d.value);
                  });

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
                              .on("drag", dragmove))
                      .on("mouseenter", function(d){
                                          //Opacity 0.5
                                          d3.selectAll("circle,rect,path")
                                            .transition()
                                            .duration(100)
                                            .style("opacity",0.5);

                                          //Change this
                                          d3.select(this)
                                            .style("opacity", 1);

                                          //Cleveland Plot
                                          d3.selectAll("circle[affiliation=\'" + d.name + "\']")
                                            .transition()
                                            .duration(100)
                                            .style('r',r*4)
                                            .style("fill","green");

                                          //Map
                                          d3.selectAll("path[country=\'" + d.country + "\']")
                                            .transition()
                                            .duration(100)
                                            .style("opacity",1)
                                            .style("fill","green");
                                       })
                      .on("mouseleave", function(d){
                                         //Opacity back to normal
                                         d3.selectAll("circle,rect")
                                           .transition()
                                           .duration(100)
                                           .style("opacity",1);
                                         d3.selectAll("path")
                                           .transition()
                                           .duration(100)
                                           .style("opacity",0.8);

                                         //Change this

                                         //Cleveland Plot
                                         d3.selectAll("circle[affiliation=\'" + d.name + "\']")
                                           .transition()
                                           .duration(100)
                                           .style('r',r )
                                           .style("fill",function(d1) { return prize_color(d1.category);});

                                         //Map
                                         d3.selectAll("path[country = \'" + d.country + "\']")
                                           .transition()
                                           .duration(100)
                                           .style("opacity", 0.8)
                                           .style("fill", function(d1) { return world_colors(populationById[d1.id]); });
                                      });

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
                    .append("title")
                    .text(function(d) {return d.name + "\n" + format(d.value); });

        // add in the title for the nodes
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
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
    // src="//code.jquery.com/jquery-1.12.3.min.js"
    // src="js/d3.v3.js"

    // d3=d3version3;

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
    .style("margin-top", "-200px")
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

  d3v3.json("data/flare3nodes.json", function(classes) { //flare-imports
  var nodes = cluster.nodes(packages.root(classes)),
      links = packages.imports(nodes),
      splines = bundle(links);

  var path = svg.selectAll("path.link")
      .data(links)
    .enter().append("svg:path")
      .attr("class", function(d) { return "link source-" + d.source.key + " target-" + d.target.key; })
      .attr("d", function(d, i) { return line(splines[i]); });

  var groupData = svg.selectAll("g.group")
    .data(nodes.filter(function(d) { return (d.key=='nyu' || d.key == 'harvard' || d.key == 'mit') && d.children; }))
    .enter().append("group")
    .attr("class", "group");

  var groupArc = d3v3.svg.arc()
  .innerRadius(ry - 177)
  .outerRadius(ry - 157)
  .startAngle(function(d) { return (findStartAngle(d.__data__.children)-2) * pi / 180;})
  .endAngle(function(d) { return (findEndAngle(d.__data__.children)+2) * pi / 180});

  svg.selectAll("g.arc")
  .data(groupData[0])
  .enter().append("svg:path")
  .attr("d", groupArc)
  .attr("class", "groupArc")
  .style("fill", "#1f77b4")
  .style("fill-opacity", 0.5);

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

    d3v3.select("input[type=range]").on("change", function() {
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
    d3.selectAll("#sankey_diagram")
      .style("opacity",0.5);

    d3v3.select(this)
        .style("opacity",1)
        .style("fill","#111111")
        ;

    d3v3.selectAll("path.link.target-" + d.key)
        .classed("target", true)
        .each(updateNodes("source", true));

    svg.selectAll("path.link.source-" + d.key)
        .classed("source", true)
        .each(updateNodes("target", true));


    console.log(d.key.replace(/_/g, ' '));

    d3.selectAll("circle[name=\"" + d.key.replace(/_/g, ' ') + "\"]")
      .transition()
      .style('r',r * 2)
      .duration(250)
      .style("opacity", 1)
      .style("fill", "red");


  }
  function mouseout(d) {

    d3.selectAll("#sankey_diagram")
       .style("opacity",1);

    svg.selectAll("path.link.source-" + d.key)
        .classed("source", false)
        .each(updateNodes("target", false));

    svg.selectAll("path.link.target-" + d.key)
        .classed("target", false)
        .each(updateNodes("source", false));
  }

  function updateNodes(name, value) {
    return function(d) {
      if (value) this.parentNode.appendChild(this);
      svg.select("#node-" + d[name].key).classed(name, value);
    };
  }

  function cross(a, b) {
  return a[0] * b[1] - a[1] * b[0];
  }

  function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
  }

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
