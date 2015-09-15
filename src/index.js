require('./update-check');
var app = require('ethoinfo-framework');
var moment = require('moment');

app.setting('couch-base-url', 'http://demo.ethoinformatics.org:5984/app_focals');
app.setting('couch-username', 'supermonkey');

//var activityService = {
function registerStartAndEndServices(domain){
	domain.register('get-begin-time', function(d){ return d.beginTime || d.timestamp; });
	domain.register('get-end-time', function(d){ return d.endTime; });
	domain.register('set-begin-time', function(d){ d.beginTime = new Date(); });
	domain.register('set-end-time', function(d){ d.endTime = new Date(); });
}
//};

function dateEqual(d1, d2){
	return d1.getFullYear() === d2.getFullYear() && 
		d1.getMonth() === d2.getMonth() && 
		d1.getDate() === d2.getDate();
}

var diaryLocationService = {
	update: function(diary, locationData, settings){
		if (!dateEqual(new Date(), diary.beginTime)) return;
		if (settings.user !== diary.observerId) return;

		if (!diary.footprint){
			diary.footprint = {
				type: 'LineString',
				coordinates: [ ]
			};
		}

		diary.footprint.coordinates.push([
				locationData.coords.longitude,
				locationData.coords.latitude,
				locationData.coords.altitude,
			]);

		console.dir(diary);
	}
};


var createIdGenerator = function(field){
	return function(entity){
		return entity.domainName +'-'+entity[field];
	};
};

// ****************************************************************************
// * DIARY                                                                    *
// ****************************************************************************
var diary = app.createDomain({name: 'diary', label: 'Diary'});
diary.register('color', '#3D9720');
diary.register('form-fields', {
		eventDate: { type: 'date', label: 'Date' }
	});

diary.register('uuid-generator', function(entity){
	var date = new Date(entity.eventDate);
	return 'diary-' + 
		date.getFullYear() + '-' +
		(date.getMonth()+1) + '-' +
		date.getDate();
});
diary.register('sort-by', 'eventDate');
diary.register('get-begin-time', function(d){ return moment(d.eventDate).startOf('day').toDate(); });
diary.register('get-end-time', function(d){ return moment(d.eventDate).endOf('day').toDate(); });
diary.register('set-begin-time', function(){ });
diary.register('set-end-time', function(){ });

diary.register('short-description', function(d){
	var date = new Date(d.eventDate);
	return moment(date).format('MM/DD/YY');
});
diary.register('long-description', function(d){
	var h1 = 'Diary for ' + d.eventDate;

	return '<h1>'+h1+'</h1>';
});
diary.register('location-aware', diaryLocationService);

// ****************************************************************************
// * CONTACT                                                                  *
// ****************************************************************************
var contact = app.createDomain({name: 'contact', label: 'Contact'});
contact.register('color', '#EECF20');
contact.register('form-fields', {
	taxon: { type: "lookup", domain: "taxon" },
	subjectId: { type: "lookup", domain: "animal-group" },
	title: { type: "text", required: true },
	samplingProtocol: { type: "text" }, 
	basisOfRecord: { type: "text" } 
});

registerStartAndEndServices(contact);
contact.register('long-description', function(){
	var h1 = 'Contact with ' + ' ' +this.getDescription('subjectId');

	return '<h1>'+h1+'</h1>';
});

contact.register('short-description', function(d){
	return d._id.split('-')[1];
});

// ****************************************************************************
// * OBSERVER ACTIVITY                                                        *
// ****************************************************************************
var observerActivity = app.createDomain({name:'observer-activity', label: 'Observer Activity'});
observerActivity.register('form-fields', {
	title: { label: "Title", type: "text" },
	notes: { label: "Notes", type: "long-text" },
	sampleId: { label: "Sample ID", type: "text" }
});
observerActivity.register('short-description', function(d){
	return 'observer - ' + d.title;
});
registerStartAndEndServices(observerActivity);


// ****************************************************************************
// * FOCAL
// ****************************************************************************
var focalSample = app.createDomain({name: 'focal', label: 'Focal'});
focalSample.register('color', '#FB6725');
focalSample.register('form-fields', {
	"subjectId": { "type": "lookup", "domain": "animal", "features": [ "inline-create" ] },
	"title": { "type": "text" },
	"samplingProtocol": { "type": "text" }
});
registerStartAndEndServices(focalSample);
focalSample.register('concurrent', false);
focalSample.register('long-description', function(d){
	var h1 = 'Focal (' + this.getDescription('subjectId') + ')';
	//var h2 = this.getDescription('age') + ' ' + this.getDescription('sex');

	return '<h1>'+h1+'</h1>';
		//'<h3>' + h2 + '</h3>';
});

focalSample.register('short-description', function(){ return 'Focal' });


// var feedingBout = app.createDomain({name: 'feeding-bout', label: 'Feeding Bout'});
// feedingBout.register('form-fields', require('./forms/placeholder.json'));
// feedingBout.register('activity', activityService);
// feedingBout.register('long-description', function(d){
// 	var h1 = 'Feeding bout';
// 	var h2 = d.placeholder;

// 	return '<h1>'+h1+'</h1>' + 
// 		'<h3>' + h2 + '</h3>';
// });

// feedingBout.register('short-description', function(d){
// 	return 'Focal - ' + (d.title || d.notes);
// });

// ****************************************************************************
// * FOCAL OBSERVATION                                                        *
// ****************************************************************************
var focalBehavior = app.createDomain({name: 'focal-behavior', label:'Behavior'});
focalBehavior.register('form-fields', {
	"type": { "type": "lookup", "domain": "focal-behavior-type" },
	"notes": { "label": "Notes", "type": "textarea" }
});
registerStartAndEndServices(focalBehavior);
focalBehavior.register('long-description', function(d){
	var h1 = 'Aggression towards ' + this.getDescription('animal');
	var h2 = this.getDescription('age') + ' ' + this.getDescription('sex');
	var div = d.notes;

	return '<h1>'+h1+'</h1>' + 
		'<h3>' + h2 + '</h3>' + 
		'<div style="font-style:italic;">' + div + '</div>';
});

// ****************************************************************************
// * SOCIAL FOCAL BEHAVIOR                                                           *
// ****************************************************************************
var socialFocalBehavior = app.createDomain({name: 'social-focal-behavior', label:'Social behavior'});
socialFocalBehavior.register('form-fields', {
	"type": { "type": "lookup", "domain": "social-focal-behavior-type" },
	"age": { "type": "lookup", "domain": "age-class" },
	"sex": { "type": "lookup", "domain": "sex" },
	"animal": { "type": "lookup", "domain": "animal" }
});
registerStartAndEndServices(socialFocalBehavior);
socialFocalBehavior.register('long-description', function(d){
	var h1 = this.getDescription('type') + ' towards ' + this.getDescription('animal');
	var h2 = this.getDescription('age') + ' ' + this.getDescription('sex');
	var div = d.notes;

	return '<h1>'+h1+'</h1>' + 
		'<h3>' + h2 + '</h3>' + 
		'<div style="font-style:italic;">' + div + '</div>';
});


// ****************************************************************************
// * POOP SAMPLE                                                              *
// ****************************************************************************
var poopSample = app.createDomain({name: 'poop-sample', label:'Poop sample'});
poopSample.register('form-fields', {
	"location": { "type": "text" }
});
registerStartAndEndServices(poopSample);
poopSample.register('long-description', function(){
	var h1 = 'Poop sample from ' + this.getDescription('animal');
	var h2 = '';
	var div = '';

	return '<h1>'+h1+'</h1>' + 
		'<h3>' + h2 + '</h3>' + 
		'<div style="font-style:italic;">' + div + '</div>';
});
poopSample.register('short-description', function(){
	return 'Poop sample';
});


// ****************************************************************************
// * CODES                                                                    *
// ****************************************************************************
function createSimpleCodeDomain(name, label){
	var domain = app.createDomain({name: name, label: label});
	domain.register('code-domain', true);
	domain.register('form-fields', [ { fields: { name: { type: 'text' } } } ]);
	domain.register('short-description', function(d){ return d.name; });
	domain.register('uuid-generator', createIdGenerator('name'));

	return domain;
}

createSimpleCodeDomain('animal-group', 'Animal Group');
createSimpleCodeDomain('taxon', 'Taxon');
createSimpleCodeDomain('age-class', 'Age class');
createSimpleCodeDomain('sex', 'Sex');
createSimpleCodeDomain('focal-behavior-type', 'Behavior type');
createSimpleCodeDomain('social-focal-behavior-type', 'Social behavior type');

var user = createSimpleCodeDomain('user', 'User');
user.register('setting-lookup', true);

var animal = app.createDomain({name: 'animal', label: 'Animal'});
animal.register('code-domain', true);
animal.register('form-fields', {
	"name": { "type": "text" },
	"taxon": { "type": "lookup", "domain": "taxon" },
	"age": { "type": "lookup", "domain": "age-class" },
	"sex": { "type": "lookup", "domain": "sex" },
	"group": { "type": "lookup", "domain": "animal-group" }
});
animal.register('short-description', function(d){ return d.name; });



// ****************************************************************************
// * SET DOMAIN RELATIONSHIPS                                                 *
// ****************************************************************************


// contact.register(focalSample, 'groupCompostions');
// contact.register(focalSample, 'rollCallCensuses');
// contact.register(focalSample, 'experiments');
// contact.register(feedingBout, 'feedingBouts');
// contact.register(focalSample, 'groupScans');
// contact.register(focalSample, 'focalSamples');
// contact.register(focal, 'processing');
// contact.register(focal, 'resourcePatches');
// focalSample.register(feedingBout, 'feedingBouts');
// focalSample.register(feedingBout, 'feedingBouts');

diary.register('contacts', contact);

contact.register('focals', focalSample);
contact.register('collections', poopSample);

focalSample.register('observations', socialFocalBehavior, {inline: true});
focalSample.register('observations', focalBehavior, {inline: true});
focalSample.register('collections', poopSample);

app.run();
