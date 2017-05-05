import stocks from './stocks';

export default class ColumnChart{
	constructor(opts){
		this.data = opts.data;
		this.color = opts.hasOwnProperty('color') ? opts.color : 'goldenrod';

		this.margin = opts.hasOwnProperty('margin') ? opts.margin : {top:20,bottom:20,left:5,right:0};

		this.width = $(opts.el).width() - (this.margin.left+this.margin.right);
		this.height = $(opts.el).height() - (this.margin.top+this.margin.top);

		this.barsWidth = this.width - (this.margin.left+this.margin.right);
		this.barsHeight = this.height - (this.margin.top+this.margin.top);

		this.xCol = opts.xCol;
		this.yCol = opts.yCol;

		this.lookup = stocks;

		this.hover = opts.hasOwnProperty('hover') ? opts.hover : false;

		//TO DO: domains dynamic
		this.x = d3.scaleLinear().rangeRound([0, this.barsWidth]).domain([-4,103]);
		this.y = d3.scaleLinear().rangeRound([this.height, 0]).domain([0,50]);
		this.pieceY = d3.scaleLinear().range([0, this.height]).domain([0,50]);

		this.fillBy = opts.hasOwnProperty('fillBy') ? opts.fillBy : false;
		this.category = opts.hasOwnProperty('category') ? opts.category : false;

		this.barWidth = 5.7;

		this.durationSpeed = opts.hasOwnProperty('durationSpeed') ? opts.durationSpeed : 750;

		this.el = opts.el;
		
		this.svg = d3.select(opts.el).append('svg')
					.attr('width',this.width)
					.attr('height',this.height)
					.style('transform',`translate(${this.margin.left}px, ${this.margin.top}px)`);

		this.svg.append("rect")
			.attr('class','background')
			.attr('width',this.barsWidth)
			.attr('height',this.barsHeight+(this.margin.top*2))
			.style('transform', `translate(${(this.margin.left)}px,-21px)`)

		this.svg.append("g")
		      .attr("class", "axis x")
		      .style('transform',`translate(${this.margin.left}px, ${this.height - this.margin.top}px)`)
		      .call(d3.axisBottom(this.x));

		this.svg.append("g")
		      .attr("class", "axis y")
		      .style('transform',`translate(${this.margin.left}px, -${this.margin.top}px)`)
		      .call(d3.axisRight(this.y).tickSize(this.barsWidth).ticks(4));

		$(this.el).append(`<p class="mentioned"> mentions</p>`);

		$(this.el).find('.x .tick').first().children('text').append(' days');


		this.barG = this.svg.append('g')
			.attr('width',this.barsWidth)
			.attr('height',this.barsHeight)
			.attr('class','barG')
			.style('transform',`translate(${(this.barWidth/4)}px, -${this.margin.top}px)`);

		this.svg.selectAll('.y text').style('transform',`translate(-${this.barsWidth-10}px, -7px)`)
	}

	update(newData, highlight = 'all', callbackFunc = function(){ } ){
		let same = false;

		let wasTrump = this.currentPresident == "Trump";
		let isObama = newData[0].president == "Obama";

		if (this.currentPresident == newData[0].president || (wasTrump+isObama) == 2) {
			same = true; 
		};

		this.currentPresident = newData[0].president;
		let stacks = {};
		let sameN = 0;
		let adds = 0;  

		const _this = this;
		

		const animation = d3.transition().duration(this.durationSpeed);
		$(".dynamic .companyLabel").fadeOut(this.durationSpeed);
		this.barG.selectAll(".focus-wrap").remove();

        let bars = this.barG.selectAll(".bar").data(newData);
        let tooltip = d3.select('.companyLabel');

        bars.exit()
        	.transition(animation)
        	.attr("y", this.height+50)
        	.style("fill-opacity", 1e-6) 
      		.remove();

      	bars.attr("class",'bar')
      		.attr('data-industry',d => d.industry)
      		.attr('data-stock',d => d.stock)
      		.style('fill',this.color)
			.on("mouseover", function(d) {
				if (_this.hover) {
					_this.barG.selectAll('.bar').style('opacity',0.4);
					d3.select(this).style('opacity',1);

			       tooltip.transition()
			         .duration(200)
			         .style("opacity", .9);
			       tooltip.html(_this.lookup[d.stock])
			         .style("top", `${d.y}px`)
			         .style("left", `${d.x + (_this.barWidth*4)}px`);
			     };
		    })
		    .on("mouseout", function(d) {
		    	if (_this.hover) {
		    		_this.barG.selectAll('.bar').style('opacity',1);
		    		tooltip.transition()
		    		  .duration(500)
		    		  .style("opacity", 0);
		    	};
		    })
      		.transition(25)
      		.delay((d,i) => i*2)
      		.style('opacity',(d) => {
      			if (same) sameN ++;

      			if(highlight == "all"){
      				return 1;
      			}
      			else if(typeof(highlight) == "object"){
      				if (highlight.values.indexOf(d[highlight.column]) > -1) {
      					return 1;
      				}
      				else return 0.4;
      			}
      			else if (d.industry != highlight) {
      				return 0.4;
      			}
      			else{
      				return 1;
      			}
      		})
			.attr("x", (d) => {
				d.x = this.x(d[this.xCol]);
				return d.x;
			})
			.attr("y", (d) => {
				let xVal = d[this.xCol];
				let yVal = parseFloat(d[this.yCol]);
				if (!stacks.hasOwnProperty(xVal)) {
					stacks[xVal] = 1;
					d.y = this.height-this.pieceY(stacks[xVal])
					return d.y;
				}
				else{
					stacks[xVal] += 1;
					d.y = this.height-this.pieceY(stacks[xVal])
					return d.y;
				}
			})
			.attr("width",this.barWidth)
			.attr("height", (d) => { 
				//let yVal = parseFloat(d[this.yCol]);
				return this.pieceY(1);
			})
			.on("end",function(){
				if (same) {
					sameN--;
					if (!sameN) {
						setTimeout(function(){callbackFunc()},250)
						
					};
				};
			});

		bars.enter().append("rect")
			.attr('data-industry',d => d.industry)
			.attr('data-stock',d => d.stock)
			.attr("class",'bar')
			.attr("x", (d) => {
				d.x = this.x(d[this.xCol]);
				return d.x
			})
			.attr("y",this.height)
			.style('fill',this.color)
			.on("mouseover", function(d) {
				if (_this.hover) {
					_this.barG.selectAll('.bar').style('opacity',0.4);
					d3.select(this).style('opacity',1);

			       tooltip.transition()
			         .duration(200)
			         .style("opacity", .9);
			       tooltip.html(_this.lookup[d.stock])
			         .style("top", `${d.y}px`)
			         .style("left", `${d.x + (_this.barWidth*4)}px`);
			     };
		    })
		    .on("mouseout", function(d) {
		    	if (_this.hover) {
		    		_this.barG.selectAll('.bar').style('opacity',1);
		    		tooltip.transition()
		    		  .duration(500)
		    		  .style("opacity", 0);
		    	};
		    })
			.transition(25)
			.delay((d,i) => i*2)
			.style('opacity',(d) => {
				if(highlight == "all"){
					return 1;
				}
				else if(typeof(highlight) == "object"){
					if (highlight.values.indexOf(d[highlight.column]) > -1) {
						return 1;
					}
					else return 0.4;
				}
				else if (d.industry != highlight) {
					return 0.4;
				}
				else{
					return 1;
				}
			})
			.attr("y", (d) => {
				adds++;
				let xVal = d[this.xCol];
				let yVal = parseFloat(d[this.yCol]);
				if (!stacks.hasOwnProperty(xVal)) {
					stacks[xVal] = 1;
					d.y = this.height-this.pieceY(stacks[xVal]);
					return d.y;
				}
				else{
					stacks[xVal] += 1;
					d.y = this.height-this.pieceY(stacks[xVal]);
					return d.y;
				}
			})
			.attr("height", (d) => { 
				return this.pieceY(1);
			})
			.attr("width",this.barWidth)
			.on("end",function(){
				adds--;
				if (!adds) {
					callbackFunc()
				};
			});
	}

	_stackByValue(d){
		let xVal = d[this.xCol];
		let yVal = parseFloat(d[this.yCol]);
		if (!this.stacks.hasOwnProperty(xVal)) {
			this.stacks[xVal] = yVal;
			return this.height-this.pieceY(yVal);
		}
		else{
			this.stacks[xVal] += yVal;
			return this.height-this.pieceY(this.stacks[xVal]);
		}
	}

	updateAxis(){

		this.svg.select(".y.axis")
			.transition()
			.duration(500)
		    .call(d3.axisRight(this.y).tickSize(this.barsWidth));

		this.svg.select(".x.axis")
	        .call(d3.axisBottom(this.x))
	        .selectAll("text")
	           .attr("y", 0)
	           .attr("x", 9)
	           .attr("dy", ".35em")
	           .attr("transform", "rotate(90)")
	           .style("text-anchor", "start");
	}

	highlightBy(columnname,value = ""){
		let _this = this;

		this.barG.selectAll(".bar")
			.transition()
			.duration(this.durationSpeed)
			.style('opacity', d => {
				if(columnname == "all"){
					return 1;
				}
				else if (d[columnname] != value) {
					return 0.4;
				}
				else{
					return 1;
				}
			});

		if (columnname != "all") {
			$(".legend").show()
		};
	}

	focus(columnname,value){
		let x = 0;
		let y = 0;

		let found = false;

		this.barG.selectAll(".bar")
			.attr('class', d => {
				if(d[columnname] == value && !found){
					x = d.x;
					y = d.y;
					found = true;
					return "bar focus";
				}
				else{
					return "bar";
				}
			});

		let top = $(".focus").first().offset().top-$(this.el).offset().top ;
		let left = $(".focus").first().offset().left-$(this.el).offset().left;

		$(this.el).find(".companyLabel").text(this.lookup[value]).css({
			"top": `${top - (this.barWidth*2)}px`,
			"left": `${left + (this.barWidth*1.5)}px`
		}).fadeIn(this.durationSpeed);

		this.barG.append('rect')
      		.style('fill','rgba(0,0,0,0)')
      		.attr('class','focus-wrap')
			.attr("x", x)
			.attr("y", y)
			.attr("width",this.barWidth)
			.attr("height", (d) => { 
				return this.pieceY(1);
			});
	}


}