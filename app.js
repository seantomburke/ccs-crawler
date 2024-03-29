//number of crawlers to use. More crawlers uses more resources and 
var NUMBER_OF_CRAWLERS = 5;
var child = 'spider3.js';
var domain = 'www.royalpalacebanquet.com';
var filterURL = function(url){
	return true; //(url.match(/http(s)?:\/\/((www|.+)\.)?abt\.com\/product/)) ? true: false;
}

var Crawler = require("crawler").Crawler,
	// express = require("express"),
	// handlebars = require("express3-handlebars"),
	// dotenv = require('dotenv'),
	robots = require('robots'),
	colors = require('colors'),
	icon = require('log-symbols'),
	// async = require('async'),
	rparser = new robots.RobotsParser(),
	sitemapper = new require('sitemapper'),
	crawler_count = 0,
	sitemaps = [],
	sites = [],
	children = [],
	cp = require('child_process');

//set theme colors
colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	info: 'blue',
	success: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'blue',
	error: 'red'
});

//for calculating total time
var start = new Date();
var end = new Date();


//TODO
//if we want to see results from a broser

// dotenv.load();
// //express
// var app = express();
// app.engine('html', handlebars({extname:'.html', defaultLayout: 'main'}));
// app.set('view engine', 'html');
// app.set('port', process.env.PORT);

console.log("# of crawlers     : ", ("" + NUMBER_OF_CRAWLERS).info);
				// var incr = Math.round(sites.length/NUMBER_OF_CRAWLERS);
				// console.log("sites per crawler : ", ("" + incr).info);
for(var i=0; i<NUMBER_OF_CRAWLERS;i++){

	children[i] = cp.fork(__dirname+'/'+child, [i]);
   	console.log('Crawler '+("" + children[i].pid).help +' spawned');

	children[i].on('exit', function (code) {
		//when crawler finishes calculate time and log to console.
		children[i] = undefined;
	});

	children[i].on('message', function(data) {
		if(data.message == "empty")
		{
			//console.info(icon.sucess, "Crawler "+data.cid+" ("+ data.pid +")is finished".success);
			children[data.cid].send({"message":"die"});
		}
		else if(data.message == "increment")
		{
			crawler_count++;
			console.log("# of Crawlers Running: ", crawler_count);
		}
		else if(data.message == "decrement")
		{
			crawler_count--;
			console.log("# of Crawlers Running: ", crawler_count);
			if(crawler_count === 0)
			{
				var end = new Date;
				console.log((""+end).input);
				console.log(("Total elapsed time: ".input+((end.getTime() - start.getTime())/1000 + "s").help));
			}
		}
	});
}



//robots.txt of the site
var robots_url =  'http://'+domain+'/robots.txt';

rparser.setUrl(robots_url, function(parser, success){
	console.log(icon.info, "Robots.txt URL:", robots_url)
	if(success){
		parser.getSitemaps(function(sitemaps)
		{
			console.log("Sitemap URL(s):", sitemaps);
			//get only the first sitemap if there is a list
			sitemapper.getSites(sitemaps[0], function(err, sites){
				sites = sites.filter(function(url){
					//Regex to filter only valid urls; return true to crawl
					return filterURL(url);
				});
				//crawler information
				console.log("# of sitemap sites: ", ("" + sites.length).info);
				// console.log("# of crawlers     : ", ("" + NUMBER_OF_CRAWLERS).info);
				// var incr = Math.round(sites.length/NUMBER_OF_CRAWLERS);
				// console.log("sites per crawler : ", ("" + incr).info);

				//spawn child crawlers
				for(var i=0; i<sites.length;i++){
					var crawlerIndex = (i % NUMBER_OF_CRAWLERS);
					//console.log('\r\n\r\nSpawning crawler for sites:', ((i*incr+1) +"-" + (i*incr+incr)).info);

					//create a thread for the each child with the 'spider.js' code, and send the split sites as a message
					children[crawlerIndex].send({
						"message":"queue",
						"site": sites[i]
					});

   					//calculate time on exit
				}
			})
		});
	}
});

//exit on process termination signal
process.on("SIGTERM", function() {
   console.log("Parent SIGTERM detected");
   // exit cleanly
   process.exit();
});

