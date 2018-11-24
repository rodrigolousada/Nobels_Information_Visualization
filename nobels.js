// In case of not seeing the expected results, run: python -m http.server 8888
//====================   global_variables   ========================
// sources
src="http://d3js.org/d3.v3.min.js"

// dataset_extraction
var cleveland_dataset, full_dataset, bar_chart_dataset;
var selectedBar, selectedCircle;

//dispatchers
var dispatch = d3.dispatch("movieEnter");
var dispatch1 = d3.dispatch("movieEnter1");

// World Map Variables
var populationById = {};
var nameById = {};
var world_colors = d3.scaleThreshold()
              .domain([0,0.5,1,2,5,10,25,70,100,400])
              .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,48,107)","rgb(3,19,43)"]);

//====================   dataset_extraction   ========================
d3.json("data/bars.json").then(function(data) {
    var full_dataset = data;
    bar_chart_dataset = full_dataset.slice(0,35);

    gen_bar_chart();
});

d3.json("data/cleveland.json").then(function(data) {
    var full_dataset = data;
    cleveland_dataset = full_dataset.slice(0,35);

    //gen_bars();
    gen_scatterplot();
    world_map();
    //gen_sankey();
    //cutOffAntarctica();
});

dispatch1.on("movieEnter1.bars", function(cat){

    if(selectedBar != null ) {
      selectedBar.attr("fill", "purple");
    }

    if(selectedCircle != null) {
      selectedCircle.attr("fill", "purple");
    }

    selectedBar = d3.select("rect[degree=\'" + cat.degree + "\']");
    selectedBar.attr("fill", "red");
    selectedCircle = d3.selectAll("circle[degree=\'" + cat.degree + "\']");
    selectedCircle.attr("fill", "red");

    // var a = d3.selectAll("circle[degree=\'" + cat.degree + "\']")
    //     .enter().transition()
    //     .attr("fill","red");
})

// dispatch.on("movieEnter.scatterplot", function(winner){console.log(winner.name);})
// dispatch.on("movieEnter.scatterplot", function(winner){
//       if(selectedCircle != null){
//         selectedCircle.attr("fill", "purple");
//       }
//       if(selectedBar != null){
//         selectedBar.attr("fill", "purple");
//       }
//       selectedCircle = d3.select("circle[name=\'" + winner.name + "\']");
//       selectedCircle.attr("fill", "red");
//       selectedBar = d3.select("rect[degree=\'" + winner.degree + "\']")
//       selectedBar.attr("fill", "red");
//
//     })



//====================   gen_scatterplot   ========================
function gen_scatterplot() {
    var div = d3.select("body").append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);
    // var formatTime = d3.time.format("%e %B");

    var w = 600;
    var h = 150;

    var svg = d3.select("#the_chart")
                  .append("svg")
                  .attr("width",w)
                  .attr("height",h)
  		            .attr("fill", "blue");


    var padding = 30;
    var bar_w = 15;
    var r = 5;

    var hscale = d3.scaleLinear()
                   .domain([100,0])
                   .range([padding,h-padding]);

    var xscale = d3.scaleLinear()
                   .domain([1901,2020])
                   .range([padding,w-padding]);

    var yaxis = d3.axisLeft()
                  .scale(hscale)
                  .tickSize(-innerWidth)
                  .tickPadding(10);

    var xaxis = d3.axisBottom()
	                .scale(xscale)
                  .tickFormat(d3.format("d"));
                  //.ticks(cleveland_dataset.length/2);

    var cscale = d3.scaleLinear()
                   .domain([d3.min(cleveland_dataset, function(d) { return  d.year;}),
                            d3.max(cleveland_dataset, function(d) { return d.year;})])
                   .range(["red", "blue"]);


    gY = svg.append("g")
           	.attr("transform","translate(30,0)")
          	.attr("class","y axis")
          	.call(yaxis);


    gX = svg.append("g")
            .attr("transform","translate(0," + (h-padding) + ")")
            .call(xaxis);

    svg.selectAll("circle")
        .data(cleveland_dataset)
        .enter().append("circle")
        .attr("r",r)
        .attr("fill","purple")
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
        .on("mouseover", function(d){
                              tooltip.style("display",'block');
                              d3.selectAll("circle,rect,path")
                                .style("opacity",0.5);
                              d3.select(this)
                                .style("opacity",1)
                                .attr("fill", "red");
                              d3.selectAll("rect[degree=\'" + d.degree + "\']")
                                .style("opacity",1)
                                .attr("fill","green");
                              d3.selectAll("path[country = \'" + d.countryBorn + "\']")
                                .style("opacity", 1)
                                .style("fill","blue");
                              d3.selectAll("path[country = \'" + d.countryAffiliation + "\']")
                                .style("opacity", 1)
                                .style("fill","red");
                        })
        .on('mouseout', function(d){
                            tooltip.style("display", "none");
                            d3.selectAll("circle,rect")
                              .style("opacity",1);
                            d3.selectAll("path")
                              .style("opacity",0.8);
                            d3.selectAll("path[country = \'" + d.countryBorn + "\']")
                              .style("fill", function(d1) { return world_colors(populationById[d1.id]); })
                              .style("opacity", 0.8);
                            d3.selectAll("path[country = \'" + d.countryAffiliation + "\']")
                              .style("fill", function(d1) { return world_colors(populationById[d1.id]); })
                              .style("opacity", 0.8);
                            d3.select(this).attr("fill", "purple");
                            d3.selectAll("rect[degree=\'" + d.degree + "\']").attr("fill","purple");

                        })
        .on('mousemove', function(d){
                            var xPos = d3.mouse(this)[0] - 60;
                            var yPos = d3.mouse(this)[1] - 35;

                            tooltip.attr('transform','translate('+ xPos+","+ yPos+")");
                            tooltip.select("text").text(d.name);
                            // tooltip.select('.ma').html(d.data.label);
                        });
        var tooltip = svg.append("g")
                          .attr("class", tooltip)
                          .style('display','none');
        tooltip.append("rect")
                .attr("width",150)
                .attr("height",30)
                .style("fill","black")
                .style("fill-opacity",.70);
        tooltip.append("text")
                .attr("x",15)
                .attr('dy','1.2em')
                .style("fill", "white")
                .style('front-size','1.25em')
                .attr('font-weight','bold');
}


//====================   gen_bar_chart   ========================
function gen_bar_chart(){

    var h = 150;
    var w = 200;

    var svg = d3.select("#the_chart")
                .append("svg")
                .attr("width",w)
                .attr("height",h);


    var padding = 30;
    var bar_h = 15;

    var wscale = d3.scaleLinear()
                   .domain([d3.max(bar_chart_dataset, function(d) { return d.number;}),0])
                   .range([padding,w-padding]);

    var yscale = d3.scaleLinear()
                   .domain([0,bar_chart_dataset.length]) //dataset.length
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
        .data(bar_chart_dataset)
        .enter().append("rect")
        .attr("height",Math.floor((h-padding*2)/bar_chart_dataset.length )-1) //dataset.length     (w-padding*2)/3)-1
        .attr("width",function(d) {
                              return w-padding-wscale(d.number);
                     })
        .attr("fill","purple")
        .attr("y",function(d, i) {
                      return yscale(i);
                  })
        .attr("x",function(d) {
                      return wscale(d.number);
                  })
        .attr("degree", function(d) { return d.degree; })
        .text(function(d) { return d.degree; }) //Not working
        .on("mouseover", function(d){
                                d3.selectAll("circle,rect,path")
                                  .style("opacity",0.5);
                                d3.select(this)
                                  .style("opacity", 1)
                                  .attr("fill", "red");
                                d3.selectAll("circle[degree=\'" + d.degree + "\']")
                                  .style("opacity", 1)
                                  .attr("fill","green");
                          })
        .on('mouseout', function(d){
                                d3.selectAll("circle,rect")
                                  .style("opacity",1);
                                d3.selectAll("path")
                                  .style("opacity",0.8);
                                d3.select(this).attr("fill", "purple");
                                d3.selectAll("circle[degree=\'" + d.degree + "\']").attr("fill","purple");
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
                          return "<strong>country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Population: </strong><span class='details'>" + format(d.population) +"</span>";
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
                                d3.select("circle[countryAffiliation=\'" + d.properties.name + "\']")
                                  .style("opacity", 1)
                                  .attr("fill", "red");
                                d3.selectAll("circle[countryBorn=\'" + d.properties.name + "\']")
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
                                d3.select("circle[countryAffiliation=\'" + d.properties.name + "\']")
                                  .attr("fill", "purple");
                                d3.selectAll("circle[countryBorn=\'" + d.properties.name + "\']")
                                  .attr("fill", "purple");
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

//====================   world_map   ========================

function gen_sankey(){

}


//
// function genvis() {
//
//   var w = 800;
//     var h = 400;
//     var svg = d3.select("#the_chart");
//
//     svg = svg.append("svg");
//     svg = svg.attr("width",w);
//     svg = svg.attr("height",h);
//
//     var padding=30;
//
//
//     var hscale = d3.scaleLinear()
//                          .domain([10,0])
//                          .range([padding,h-padding]);
//
//
//    var xscale = d3.scaleLinear()
//                         .domain([0,dataset.length])
//                         .range([padding,w-padding]);
//
//                         var yaxis = d3.axisLeft()
//                   .scale(hscale);
//
//                   svg.append("g")
//                      .attr("transform","translate(30,0)")
//                      .attr("class", "y axis")
//                      .call(yaxis);
//
//                      var bar_w = 15;
//                      var xaxis = d3.axisBottom()
//                                    .scale(d3.scaleLinear()
//                                      .domain([dataset[0].oscar_year,dataset[dataset.length-1].oscar_year])
//                                      .range([padding+bar_w/2,w-padding-bar_w/2]))
//                                    .tickFormat(d3.format("d"))
//                                    .ticks(dataset.length/4);
//
//                                    svg.append("g")
//                  .attr("transform","translate(0," + (h-padding) + ")")
//                  .call(xaxis);
//
//                  svg.selectAll("rect").append("title")
//                  	.data(dataset)
//                         .text(function(d) { return d.title;});
//
//                         d3.selectAll("#old")
//                         .on("click", function() {
//                           dataset = full_dataset.slice(35,70);
//                           bar_w = Math.floor((w-padding*2)/dataset.length)-1;
//
//                           svg.selectAll("rect")
//                              .data(dataset)
//                              .transition()
//        .duration(1000)
//
//                                .attr("height",function(d) {
//                                                 return h-padding-hscale(d.rating);
//                                          })
//                                .attr("fill","red")
//                                .attr("y",function(d) {
//                                          return hscale(d.rating);
//                                          })
//                                .select("title")
//                                   .text(function(d) { return d.title;});
//                       })
//
//
//    svg.selectAll("rect")
//         .data(dataset)
//       .enter().append("rect")
//         .attr("width",Math.floor((w-padding*2)/dataset.length)-1)
//         .attr("height",function(d) {
//                        return h-padding-hscale(d.rating);
//                        })
//
//     .attr("fill","purple")
//     .attr("x",function(d, i) {
//                          return xscale(i);
//                   })
//                   .attr("y",function(d) {
//                    return hscale(d.rating);
//                    });
//
//                    xaxis.scale(d3.scaleLinear()
//                            .domain([1901,2012])
//                            .range([padding+bar_w/2,w-padding-bar_w/2]));
//
//             d3.select(".x.axis")
//               .call(xaxis);
//
// }
