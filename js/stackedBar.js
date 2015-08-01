
/*
 * 
 *
 * StackedBar is a visualization for displaying the different categories of offenses and their frequences.
 * 
 *
 * Design: stacked bar chart.
 *
 */

StackedBar = function(_parentElement, _data, _legendOn, _plotName) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.legendOn = _legendOn;
    this.displayData = [];
    this.plotName = _plotName

    this.width = this.data.length > 2 ? 480 : 280;
    // dimensions
    this.margin = {top: 40, right: 50, bottom: 100, left: 50},
    this.width = this.width - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    this.initVis();
}


// Step 1
StackedBar.prototype.initVis = function() {

    var that = this;

    this.svg = this.parentElement
    .append('svg')
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
    .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


    // create scales
    this.x = d3.scale.ordinal()
    .rangeRoundBands([0, this.width], .35);

    this.y = d3.scale.linear()
        .rangeRound([this.height, 0]);

    // create axes
    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom");

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .orient("left");

    this.tip = d3.tip()
      .attr('class', 'd3-tip')
      .style('padding', '0px')
      .offset([-2, 0])
      .html(function(d) {
        return "<strong>" + d.itemName + ":</strong> " +  (d.percent*100).toFixed(2) + "%";
      });

    this.color = d3.scale.ordinal()
                    .range(["#5C755E", "#EECD86", "#E18942", "#B95835", "#3D3242"]);

    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    this.svg.append("g")
        .attr("class", "y axis")
        

    this.svg.append("g")
        .append("text")
        .attr("y", -20)
        .attr("dy", ".71em")        
        .text(this.plotName);

    this.svg.call(this.tip);

    // wrangle data
    this.wrangleData()

    // then update the visualization to display data
    this.updateVis();

}


// Step 2
StackedBar.prototype.wrangleData = function() {


    var displayTmp = [];

    var sums = {};
    var values = {};
    var numWins = {};

    this.data.forEach(function(el, i, arr){
        sums[el["key"]] = sums[el["key"]] + el["marginalUtil"] || el["marginalUtil"];

        if(!numWins[el["key"]]) numWins[el["key"]] = [];

        numWins[el["key"]].push(el["item"]);

        if(!values[el["key"]]) values[el["key"]] = {};

        values[el["key"]][el["item"]] = el["marginalUtil"];
    });

    Object.keys(values).forEach(function(el, i, arr){
        displayTmp.push({
            type: el,
            total: sums[el],
            values: values[el],
            numWins: numWins[el]
        });
    });

    this.displayData = displayTmp;

}

// Step 3
StackedBar.prototype.updateVis = function() {

    // now that the data is set(this.displayData)...
    var that = this;



    this.color.domain(d3.range(d3.max(this.displayData, 
        function(x){return Object.keys(x.numWins).length})).map(
            function(x){
                return "item" + (x+1);
        }));

    this.displayData.forEach(function(d) {
        var y0 = 0;
        d.offenses = Object.keys(d["values"]).map(function(name, i, arr) { 
            return {
                name: "item" + (i+1),
                itemName: d["numWins"][i], 
                y0: y0, 
                y1: y0 += d.values[name],
                percent: d.values[name] / d["total"]
            }; 
        });
    });

    // set scale domains
    this.x.domain(this.displayData.map(function(d) { 
        return d.type; 
    }));

    // this.y.domain([0, d3.max(this.displayData, function(x){return x.total})]);
    // I thought this line might be a little mis leading...
    this.y.domain([0, 100]);

    var winners = this.svg.selectAll(".winners")
      .data(this.displayData)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { 
        return "translate(" + that.x(d.type) + ",0)"; 
        });

      winners.selectAll("rect")
          .data(function(d) { return d.offenses; })
        .enter().append("rect")
          .attr("width", this.x.rangeBand())
          .attr("y", function(d) { return that.y(d.y1); })
          .attr("height", 0)
          .on('mouseover', function(d) { that.tip.style("padding", "10px").show(d); })
          .on('mouseout', that.tip.hide)
          .transition()
          .duration(2000)
          .attr("height", function(d) { return that.y(d.y0) - that.y(d.y1); })
          .style("fill", function(d) { return that.color(d.name); });

    // update axis
    this.svg.select(".x.axis")
        .call(this.xAxis)
        .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)" );

    this.svg.select(".y.axis")
        .call(this.yAxis);    

    if (this.legendOn) {
        this.legend = this.svg.selectAll(".legend")
          .data(this.color.domain().slice().reverse())
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(50," + i * 20 + ")"; });

      this.legend.append("rect")
          .attr("x", this.width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", this.color);

      this.legend.append("text")
          .attr("x", this.width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d; });
    }

}

