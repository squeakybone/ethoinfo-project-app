var app = require('ethoinfo-framework');

app.setting('couch-base-url', 'http://ec2-54-84-90-63.compute-1.amazonaws.com:5984/');
app.setting('couch-username', 'ro');

var activityService = {
	getBeginTime: function(d){ return d.beginTime || d.timestamp; },
	getEndTime: function(d){ return d.endTime; },
	start: function(d){ d.beginTime = new Date(); },
	stop: function(d){ d.endTime = new Date(); },
	locationUpdate: function(d, l){ 
		d.locations = d.locations || [];
		d.locations.push(l);
	},
};


var observerActivity = app.createDomain({name:'observer-activity', label: 'Observer Activity'});
observerActivity.register('form-fields', require('./forms/observer-activity.json'));
observerActivity.register('activity', activityService);
observerActivity.register('short-description', function(d){
	return 'observer - ' + d.title;
});
observerActivity.register('child-domains', ['follow', 'sighting']);

var aggressionEvent = app.createDomain({name: 'aggression-event', label:'Aggression'});
aggressionEvent.register('form-fields', require('./forms/aggression-event.json'));
aggressionEvent.register('activity', activityService);
aggressionEvent.register('short-description', function(d){
	return 'Agreession towards - ' + d.animal;
});

var focal = app.createDomain({name: 'focal', label: 'Focal'});
focal.register('form-fields', require('./forms/focal.json'));
focal.register('activity', activityService);
focal.register('short-description', function(d){
	return 'Focal - ' + d.animal;
});
focal.register(aggressionEvent);

var sighting = app.createDomain({name: 'sighting', label: 'Sighting'});
sighting.register('form-fields', require('./forms/sighting.json'));
sighting.register('activity', activityService);
sighting.register('short-description', function(d){
	return 'Sighting - ' + (d.title || d.sightingName);
});
sighting.register(focal);

var animalGroup = app.createDomain({name: 'animal-group', label: 'Animal Group'});
animalGroup.register('code-domain', true);
animalGroup.register('form-fields', require('./forms/animal-group.json'));
animalGroup.register('short-description', function(d){ return d.name; });

var animal = app.createDomain({name: 'animal', label: 'Animal'});
animal.register('code-domain', true);
animal.register('form-fields', require('./forms/animal.json'));
animal.register('short-description', function(d){ return d.name; });

var taxon = app.createDomain({name: 'taxon', label: 'Taxon'});
taxon.register('code-domain', true);
taxon.register('form-fields', require('./forms/taxon.json'));
taxon.register('short-description', function(d){ return d.name; });

var user = app.createDomain({name: 'user', label: 'User'});
user.register('code-domain', true);
user.register('form-fields', require('./forms/user.json'));
user.register('short-description', function(d){ return d.name; });

module.exports = app.getRegistry();
