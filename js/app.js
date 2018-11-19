'use strict';

var Model = {
	currentMarker: ko.observable(null),
	markers: [
	  {
		name: 'Saint Louis ZOO',
		address: 'Government Dr, St. Louis, MO 63110',
		lat: 38.63679,
		lng: -90.29348,
		highlight: ko.observable(false)
	  },
	  {
		name: 'Saint Louis Science Center',
		address: '5050 Oakland Ave, St. Louis, MO 63110',
		lat: 38.628663,
		lng: -90.270577,
		highlight: ko.observable(false)
	  },
	  {
		name: 'The Gateway Arch',
		address: '50 N Leonor K Sullivan Blvd, St. Louis, MO 63102',
		lat: 38.624617,
		lng: -90.185376,
		highlight: ko.observable(false)
	  },
	  {
		name: 'Anheuser-Busch',
		address: '1200 Lynch St, St. Louis, MO 63118',
		lat:  38.599094,
		lng: -90.213997,
		highlight: ko.observable(false)
	  },
	  {
		name: 'Missouri Botanical Garden',
		address: '4344 Shaw Blvd, St. Louis, MO 63110',
		lat: 38.616105,
		lng: -90.258067,
		highlight: ko.observable(false)
	  },
	  {
		name: 'The Butterfly House',
		address: '15193 Olive Blvd, Chesterfield, MO 63017',
		lat: 38.664843,
		lng: -90.542774,
		highlight: ko.observable(false)
	  }
	]
};


function ViewModel() {
	
	var self = this;
	
	self.map = null;
	self.apiSucceed = null;
	self.currentInfoWindow = null;
	self.markers = ko.observableArray();
	self.query = ko.observable("");
	self.results = ko.observableArray();
	self.filterLocations = function() {
		var results = [];
		var query = self.query().toLowerCase();
		data.forEach(function(location) {
			if (location.name.toLowerCase().includes(query)) {
				results.push(location);
			}
		});
		return results;
	};
	
	self.updateList = function(data) {
		self.results(self.filterLocations());
		self.clearMarkers();
		self.updateMarkers(self.filterLocations());
	};
	
	self.clearMarkers = function() {
		self.markers().forEach(function (marker, i) {
			marker.setMap(null);
		});
	};
	
	self.updateMarkers = function(filterLocations) {
		filterLocations.forEach(function (location) {
			if(!location.marker){
				location.marker = new google.maps.Marker ({
					map: self.map,
					position: location.coordinates,
					animation: null
				});
				
				location.marker.addListener('click', function() {
					self.selectedLocation(location);
				});
			} else {
				location.marker.setMap(self.map);
			}
			self.markers().push(location.marker);
		});
	};
	
	self.selectedLocation = function(location) {
		self.showPlacesInfo(location);
		self.map.setCenter(location.marker.getPosition());
		self.animate(location.marker);
	};
	
	/* self.showPlacesInfo = function(location) {
		if (self.currentInfoWindow !== null) {
			self.currentInfoWindow.close();
		}
		
		location.infoWindow = new google.maps.InfoWindow({
			content: self.getHTML(location)
		});
		
		self.currentInfoWindow = location.infoWindow;
		self.currentInfoWindow.open(self.map, location.marker);
	} */
	
	self.animate = function(marker) {
		if (marker.getAnimation() !== null) {
			marker.setAnimation(null);
		} else {
			marker.setAnimation(google.maps.Animation.DROP);
		}
	};
	
	self.initMap = function() {
		self.map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 38.610302, lng: -90.412518},
			zoom: 5,
			mapTypeControl: false
		});
	};
}

var viewModel;
function initialize() {
	viewModel = new ViewModel();
	viewModel.initMap();
	viewModel.updateList();
	ko.applyBindings(viewModel, document.getElementById("list"));
}