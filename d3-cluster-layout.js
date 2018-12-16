"use strict";

function draw_cluster() {
    var width = 500;
    var height = 250;
    var svg = d3.select("body")
        .append("svg")
        .attrs({"width" : width,
                "height" : height})
        .append("g")
        .attr("transform", "scale(0.8, 0.8)translate(20, 20)");

    var data = {
        "name": "Eve",
        "children": [
            { "name": "Cain" },
            {
                "name": "Seth",
                "children": [
                    { "name": "Enos" },
                    { "name": "Noam" }
                ]
            },
            { "name": "Abel" },
            {
                "name": "Awan",
                "children": [
                    { "name": "Enoch" }
                ]
            },
            { "name": "Azura" }
        ]
    };

    // see also:
    // d3/d3-hierarchy: 2D layout algorithms for visualizing hierarchical data.
    // https://github.com/d3/d3-hierarchy
    var root_node = d3.hierarchy(data);
    console.log("root_node");
    console.log(root_node);

    var node_size = 20;
    var cluster = d3.cluster()
        .size([width, height]);
    var nodes = cluster(root_node);
    var links = nodes.links();
    console.log("clustered nodes");
    console.log(nodes);
    console.log("clustered nodes (leaves)");
    console.log(nodes.leaves());
    console.log("clustered nodes (ancestors)"); // from root
    console.log(nodes.ancestors());
    console.log("clustered nodes (descendants)"); // from root
    console.log(nodes.descendants());
    console.log("clustered links");
    console.log(links);

    // path
    // see also:
    // d3/d3-shape: Graphical primitives for visualization, such as lines and areas.
    // https://github.com/d3/d3-shape
    var line = d3.line()
        .curve(d3.curveBundle.beta(0.85))
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; });
    svg.selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("d", function(d) {
                return line([
                    d.source,
                    {"x" : d.source.x, "y" : (d.source.y + d.target.y)/2 },
                    {"x" : d.target.x, "y" : (d.source.y + d.target.y)/2 },
                    d.target
                ]);
            });

    // circle (overwrite path)
    svg.selectAll("circle")
        .data(nodes.descendants())
        .enter()
        .append("circle")
        .attrs({
            "cx" : function(d) { return d.x; },
            "cy" : function(d) { return d.y; },
            "r" : node_size/2
        })
        .append("title")
        .text(function(d) { return d.data.name; });

    // text
    svg.selectAll("text")
        .data(nodes.descendants())
        .enter()
        .append("text")
        .attrs({
            "dy" : node_size * 1.1,
            "text-anchor" : "middle",
            "x" : function(d) { return d.x; },
            "y" : function(d) { return d.y; }
        })
        .text(function(d) { return d.data.name; } );
}

// run
draw_cluster();
