// In case of not seeing the expected results, run: python -m http.server 8888
//====================   global_variables   ========================
// source
src="http://d3js.org/d3.v4.min.js"

// srcsankey="sankey.js"

// dataset_extraction
var selectedBar, selectedCircle;

//scaterplot Variables
var r = 5;

// World Map Variables
var populationById = {};
var nameById = {};
var world_colors = d3.scaleThreshold()
                      .domain([0,0.5,1,2,5,10,25,70,100,400])
                      .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,48,107)","rgb(3,19,43)"]);
var sankey_colors;

//====================   dataset_extraction   ========================
d3.json("data/bars.json").then(function(data) {
    var full_dataset = data;
    var bar_chart_dataset = full_dataset.slice(0,35);

    gen_bar_chart(bar_chart_dataset, "purple", "#chemistry_chart");
    gen_bar_chart(bar_chart_dataset, "#1f77b4", "#physics_chart");
});

d3.json("data/cleveland.json").then(function(data) {
    var full_dataset = data;
    var cleveland_dataset = full_dataset.slice(0,35);

    gen_scatterplot(cleveland_dataset, "purple", "#chemistry_chart");
    gen_scatterplot(cleveland_dataset, "#1f77b4", "#physics_chart");
    world_map();
    gen_sankey();
});



//====================   gen_scatterplot   ========================
function gen_scatterplot(dataset, prize_color, chart = "#chemistry_chart") {
    var div = d3.select("body").append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);
    // var formatTime = d3.time.format("%e %B");

    var w = 600;
    var h = 150;

    var svg = d3.select(chart)
                  .append("svg")
                  .attr("width",w)
                  .attr("height",h)
  		            .attr("fill", "blue");


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
                  .ticks(5);

    var xaxis = d3.axisBottom()
	                .scale(xscale)
                  .tickFormat(d3.format("d"));

    var cscale = d3.scaleLinear()
                   .domain([d3.min(dataset, function(d) { return  d.year;}),
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
    hscale.domain([100,0])
          .range([padding,h-padding]);
    xscale.domain([1901,2020])
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

    //Circles Creation
    svg.selectAll("circle")
        .data(dataset)
        .enter().append("circle")
        .attr("r",0)
        .attr("fill",prize_color)
        .attr("cx",function(d, i) {
                          if (d.year == 0) {
                            return padding;
                          }
                          return  xscale(d.year);
                  })
        .attr("cy",function(d) { return hscale(d.age); })
        .attr("name", function(d) { return d.name; })
        .attr("degree", function(d){ return d.degree })
        .attr("countryAffiliation", function(d){ return d.countryAffiliation })
        .attr("countryBorn", function(d){ return d.countryBorn })
        .attr("Affiliation", function(d){ return d.Affiliation })
        .on("mouseover", function(d){
                              tooltip.style("display",'block');
                              d3.selectAll("circle,rect,path")
                                .transition()
                                .duration("500")
                                .style("opacity",0.5);
                              d3.select(this)
                                .transition()
                                .duration("500")
                                .style('r',r * 2)
                                .style("opacity",1)
                                .attr("fill", "red");
                              d3.selectAll("rect[degree=\'" + d.degree + "\']")
                                .transition()
                                .duration("500")
                                .style("opacity",1)
                                .attr("fill","green");
                              d3.selectAll("path[country = \'" + d.countryBorn + "\']")
                                .transition()
                                .duration("500")
                                .style("opacity", 1)
                                .style("fill","blue");
                              d3.selectAll("path[country = \'" + d.countryAffiliation + "\']")
                                .transition()
                                .duration("500")
                                .style("opacity", 1)
                                .style("fill","red");
                              d3.select("rect[AffiliationName=\'" + d.Affiliation + "\']")
                                .transition()
                                .duration("500")
                                .style("fill","green")
                                .style("opacity", 1);
                        })
        .on('mouseout', function(d){
                            tooltip.style("display", "none");
                            d3.selectAll("circle,rect")
                              .transition()
                              .duration("200")
                              .style("opacity",1);
                            d3.selectAll("path")
                              .transition()
                              .duration("200")
                              .style("opacity",0.8);
                            d3.selectAll("path[country = \'" + d.countryBorn + "\']")
                              .transition()
                              .duration("200")
                              .style("fill", function(d1) { return world_colors(populationById[d1.id]); })
                              .style("opacity", 0.8);
                            d3.selectAll("path[country = \'" + d.countryAffiliation + "\']")
                              .transition()
                              .duration("200")
                              .style("fill", function(d1) { return world_colors(populationById[d1.id]); })
                              .style("opacity", 0.8);
                            d3.select(this)
                              .transition()
                              .duration("200")
                              .style('r',r)
                              .attr("fill", prize_color);
                            d3.selectAll("rect[degree=\'" + d.degree + "\']")
                              .transition()
                              .duration("200")
                              .attr("fill", prize_color);
                            d3.select("rect[AffiliationName=\'" + d.Affiliation + "\']")
                              .transition()
                              .duration("200")
                              .style("fill",d3.rgb(sankey_colors(d.Affiliation.replace(/ .*/, ""))))
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
            .duration(5000)
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
function gen_bar_chart(dataset, prize_color, chart = "#chemistry_chart"){

    var h = 150;
    var w = 200;

    var svg = d3.select(chart)
                .append("svg")
                .attr("width",w)
                .attr("height",h);


    var padding = 30;
    var bar_h = 15;

    var wscale = d3.scaleLinear()
                   .domain([d3.max(dataset, function(d) { return d.number;}),0])
                   .range([padding,w-padding]);

    var yscale = d3.scaleLinear()
                   .domain([0,dataset.length])
                   .range([padding,h-padding]);


    // var yaxis = d3.axisLeft()
    //               .scale(hscale);
    //
    // var xaxis = d3.axisBottom()
    //               .scale(d3.scaleLinear()
    //                         .domain([dataset[0].oscar_year,dataset[dataset.length-1].oscar_year])
    //                         .range([padding+bar_w/2,w-padding-bar_w/2]))
    //               .tickFormat(d3.format("d"))
    //               .ticks(dataset.length/4);
    //               //.ticks(20);

    svg.append("g")
        .attr("transform","translate(30,0)")
        .attr("class","x axis");
        // .call(yaxis);

    svg.append("g")
        .attr("transform","translate(0," + (w-padding) + ")");
        // .call(xaxis);


    svg.selectAll("rect")

        .data(dataset)
        .enter().append("rect")
        .attr("height",Math.floor((h-padding*2)/dataset.length )-1) //dataset.length     (w-padding*2)/3)-1
        .attr("fill",prize_color)
        .attr("y",function(d, i) {
                      return yscale(i);
                  })
        .attr("x",w-padding)
        .attr("degree", function(d) { return d.degree; })
        .text(function(d) { return d.degree; }) //Not working
        .on("mouseover", function(d){
                                d3.selectAll("circle,rect,path")
                                  .style("opacity",0.5);
                                d3.select(this)
                                  .style("opacity", 1)
                                  .attr("fill", "red");
                                d3.selectAll("circle[degree=\'" + d.degree + "\']")
                                  .transition()
                                  .style('r',r * 2)
                                  .duration("500")
                                  .style("opacity", 1)
                                  .attr("fill","green");
                          })
        .on('mouseout', function(d){
                                d3.selectAll("circle,rect")
                                  .style("opacity",1);
                                d3.selectAll("path")
                                  .style("opacity",0.8);
                                d3.select(this)
                                  .attr("fill",prize_color);
                                d3.selectAll("circle[degree=\'" + d.degree + "\']")
                                  .transition()
                                  .duration("200")
                                  .style('r',r )
                                  .attr("fill",prize_color)
                                  ;
                          })
        .transition()
        .duration(3000)
        .attr("x",function(d) {
                      return wscale(d.number);
                  })
        .attr("width",function(d) {
                              return w-padding-wscale(d.number);
                     });
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
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

    var path = d3.geoPath();

    var svg = d3.select("#worldmap")
                .append("svg")
                .attr("width", width)
                .attr("height", 300)
                .append('g')
                .attr('class', 'map');

    var projection = d3.geoMercator()
                       .scale(70)
                       .translate( [(width/4), (height / 2.5 )] );

    var path = d3.geoPath()
                  .projection(projection);

    svg.call(tip);

    queue().defer(d3.json, "data/world_countries.json")
            .defer(d3.tsv, "data/countrycount.tsv")
            .await(ready);

    function ready(error, data, population) {
        population.forEach(function(d) { populationById[d.id] = +d.population; });
        population.forEach(function(d) { nameById[d.id] = d.name; });
        data.features.forEach(function(d) { d.population = populationById[d.id] });

        svg.append("g")
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
            .on('mouseover',function(d){
                                tip.show(d);
                                d3.selectAll("circle,rect,path")
                                  .style("opacity",0.5);
                                d3.selectAll("circle[countryAffiliation=\'" + nameById[d.id] + "\']")
                                  .transition()
                                  .style('r',r * 2)
                                  .duration("500")
                                  .style("opacity", 1)
                                  .attr("fill", "red");
                                d3.selectAll("circle[countryBorn=\'" + nameById[d.id] + "\']")
                                  .transition()
                                  .style('r',r * 2)
                                  .duration("500")
                                  .style("opacity", 1)
                                  .attr("fill", "blue");
                                d3.selectAll("rect[AffiliationCountry=\'" + nameById[d.id] + "\']")
                                  .transition()
                                  .duration("500")
                                  .style("opacity", 1)
                                  .attr("fill", "blue");
                                d3.select(this)
                                  .style("opacity", 1)
                                  .style("stroke","white")
                                  .style("stroke-width",3);
                            })
            .on('mouseout', function(d){
                                tip.hide(d);
                                d3.selectAll("circle,rect")
                                  .style("opacity",1);
                                d3.selectAll("path")
                                  .style("opacity",0.8);
                                d3.selectAll("circle[countryAffiliation=\'" + nameById[d.id] + "\']")
                                  .transition()
                                  .duration("200")
                                  .attr("fill", "#1f77b4")
                                  .style('r',r)
                                  ;
                                d3.selectAll("circle[countryBorn=\'" + nameById[d.id] + "\']")
                                  .transition()
                                  .duration("200")
                                  .style('r',r)
                                  .attr("fill", "#1f77b4");
                                d3.select(this)
                                  .style("opacity", 0.8)
                                  .style("stroke","white")
                                  .style("stroke-width",0.3);
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
                  width = 350 - margin.left - margin.right,
                  height = 204 - margin.top - margin.bottom;

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
                    .nodeWidth(36)
                    .nodePadding(40)
                    .size([width, height]);

    var path = sankey.link();

    // load the data
    d3.json("data/sankey.json", function(error, graph) {
        console.log(graph);
        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        // add in the links
        var link = svg.append("g")
                      .selectAll(".link")
                      .data(graph.links)
                    .enter().append("path")
                      .attr("class", "link")
                      .attr("d", path)
                      .attr("AffiliationName",function(d){ return d.name })
                      .attr("AffiliationCountry",function(d){
                                                        if (d.country!=null)
                                                            return d.country;
                                                    })
                      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                      .sort(function(a, b) { return b.dy - a.dy; })
                      .on("mouseover", function(d){
                                          d3.selectAll("circle,rect,path")
                                            .transition()
                                            .duration("500")
                                            .style("opacity",0.5);
                                          d3.selectAll("circle[Affiliation=\'" + d.target.name + "\']")
                                            .transition()
                                            .duration("200")
                                            .style('r',r*2 )
                                            .attr("fill","green");
                                          d3.selectAll("path[country=\'" + d.target.country + "\']")
                                            .transition()
                                            .duration(200)
                                            .style("opacity",1)
                                            .attr("fill","green");
                                       })
                      .on("mouseout", function(d){
                                           d3.selectAll("circle,rect")
                                             .transition()
                                             .duration("200")
                                             .style("opacity",1);
                                           d3.selectAll("path")
                                             .transition()
                                             .duration("200")
                                             .style("opacity",0.8);
                                           d3.selectAll("circle[Affiliation=\'" + d.target.name + "\']")
                                             .transition()
                                             .duration("200")
                                             .style('r',r )
                                             .style("opacity",1)
                                             .attr("fill","#1f77b4");
                                           d3.selectAll("path[country=\'" + d.target.country + "\']")
                                             .transition()
                                             .duration(200)
                                             .style("opacity",1)
                                             .attr("fill","green");
                                           d3.selectAll("path[country = \'" + d.target.country + "\']")
                                             .transition()
                                             .duration("200")
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
                      .on("mouseover", function(d){
                                          d3.selectAll("circle,rect,path")
                                            .transition()
                                            .duration("200")
                                            .style("opacity",0.5);
                                          d3.select(this)
                                            .style("opacity", 1);
                                          d3.selectAll("circle[Affiliation=\'" + d.name + "\']")
                                            .transition()
                                            .duration("200")
                                            .style('r',r*2 )
                                            .attr("fill","green");
                                          d3.selectAll("path[country=\'" + d.country + "\']")
                                            .transition()
                                            .duration(200)
                                            .style("opacity",1)
                                            .attr("fill","green");
                                       })
                      .on("mouseout", function(d){
                                         d3.selectAll("circle,rect")
                                           .transition()
                                           .duration("200")
                                           .style("opacity",1);
                                         d3.selectAll("path")
                                           .transition()
                                           .duration("200")
                                           .style("opacity",0.8);
                                         d3.selectAll("circle[Affiliation=\'" + d.name + "\']")
                                           .transition()
                                           .duration("200")
                                           .style('r',r )
                                           .attr("fill","#1f77b4");
                                         d3.selectAll("path[country = \'" + d.country + "\']")
                                           .transition()
                                           .duration("200")
                                           .style("opacity", 0.8)
                                           .style("fill", function(d1) { return world_colors(populationById[d1.id]); });
                                      });

        // add the rectangles for the nodes
        rect = node.append("rect")
                    .attr("height", function(d) { return d.dy; })
                    .attr("width", sankey.nodeWidth())
                    .attr("AffiliationName",function(d){ return d.name })
                    .attr("AffiliationCountry",function(d){
                                                      if (d.country!=null)
                                                          return d.country;
                                                  })
                    .style("fill", function(d) {return d.color = color(d.name.replace(/ .*/, "")); })
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


}
