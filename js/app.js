'use strict'

var map;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 38.610302, lng: -90.412518},
		zoom: 12
	});
	
	google.maps.event.addDomListener(window, 'resize', function() {
    var center = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(center);
	});

	ko.applyBindings(new ViewModel());
}

function googleMapError() {
  document.getElementById('map').innerHTML="Failed to get Google Map."
}

var ViewModel = function() {
    var self = this;
	
	self.places = ko.observableArray(locations);
	
	self.query = ko.observable('');
	
	self.listClick = function(places) {
      google.maps.event.trigger(places.marker, 'click');
    };
	
	var marker;
    var largeInfoWindow = new google.maps.InfoWindow();
    self.places().forEach(function(places) {
      
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(places.location.lat, places.location.lng),
        map: map,
        title: places.name,
        animation: google.maps.Animation.DROP,

      });

      places.marker = marker;

      marker.addListener('click', function(infowindow) {
        populateInfoWindow(this, largeInfoWindow);
        toggleBounce(this);
      });
    })
	self.search = ko.computed(function() {
      var query = self.query().toLowerCase();
      if(!query) {
        // reset markers
        self.places().forEach(function(place) {
          place.marker.setVisible(true);
        })
        return self.places();
      } else {
        return ko.utils.arrayFilter(self.places(), function(place) {
          var queryMatch = place.name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0;
          place.marker.setVisible(queryMatch);
          return queryMatch;
        });
      }
    });

 }