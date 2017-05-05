import narrative from './narrative';
import ColumnChart from './columnChart';
import * from './throttle-debounce';

$(() => {
	//init new column chart
	const topChart = new ColumnChart({
	  data,
	  el:'.chart',
	  xCol:'day_index',
	  yCol:'count',
	  color:"#ce3139",
	  hover:true
	});

	// create function to run 'update' method, including an option for a callback when needed
	const slide = function(data, highlight = "all", callback = new Function){
	  chart.update(data, highlight, callback);
	}

	//using a library, ensure the function will be properly throttled
	let newSlide = slide.throttle();

	//An example of using this with the owlCarousel library, following their standard documentation
	const slides = $(".narrative");
	slides.addClass("owl-carousel").addClass("owl-theme");
	slides.owlCarousel({
	    nav:true,
	    items:1,
	    margin:50,
	    onChanged:callback
	});

	// Narrative here is an array of functions, that indicate what should occur on each slide. Because owl logs the event's item index, I can use that to grab the right function
	function callback(event){
	  if ( typeof(event.item.index) == "number" ) {
	    narrative[event.item.index]();
	  };
	};

});
