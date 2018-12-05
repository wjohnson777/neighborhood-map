'use strict'

var map;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 38.610302, lng: -90.412518},
		zoom: 11
	});
	google.maps.event.addDomListener(window, 'resize', function() {
		var center = map.getCenter();
		google.maps.event.trigger(map, 'resize');
		map.setCenter(center);
	});
	ko.applyBindings(new ViewModel());
}

function googleMapError() {
	document.getElementById('map').innerHTML="Failed to Load Google Map"
}

var VenueMarker = function(data) {
	var self = this;
	
	this.title = data.title;
	this.position = data.location;
	this.visible = ko.observable(true);
	
	var defaultIcon = createMarkerIcon('0091ff');
	var highlightedIcon = createMarkerIcon('FFFF24');
	
	this.place = new google.maps.place({
		title: this.title,
		position: this.position,
		animation: google.maps.Animation.DROP,
		icon: defaultIcon
	});
	self.markerBoundry = ko.computed(function() {
		if(self.visible() === true) {
			self.place.setMap(map);
			bounds.extend(self.place.position);
			map.fitBounds(bounds);
		} else {
			self.place.setMap(null);
		}
	});
	
	this.place.addListener('click', function() {
		populateLargeInfoWindow(this, infoWindow);
		toggleBounce(this);
		map.panTo(this.getPosition());
	});
	
	this.place.addListener('mouseover', function() {
		this.setIcon(highlightedIcon);
	});
	
	this.place.addListener('mouseout', function() {
		this.setIcon(defaultIcon);
	});
	
	this.show = function(location) {
		google.maps.event.trigger(self.place, 'click');
	};
	
	this.bounce = function(place) {
		google.maps.event.trigger(self.place, 'click');
	};
};

var ViewModel = function() {
	var self = this;
	
	self.queryLocation = ko.observable('');
	
	self.venueList = ko.observableArray([]);
	
	locations.forEach(function(location) {
		self.venueList.push( new VenueMarker(location) );
	});

	
	this.placeList = ko.computed(function() {
		var query = self.queryLocation().toLowerCase();
		if(query) {
			return ko.utils.arrayFilter(self.venueList(), function(place) {
				var queryMatch = location.title.toLowerCase();
				var result = queryMatch.includes(query);
				location.visible(result);
				return result;
			});
		}
		self.venueList().forEach(function(location) {
			location.visible(true);
		});
		return self.venueList();
	}, self);
};

function populateLargeInfoWindow(place, street, city, phone, infowindow) {
	if (infowindow.place != place) {
		infowindow.setContent('');
		infowindow.place = place;
		
		infowindow.addListener('closeclick', function() {
			infowindow.place = null;
		});
		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;
		
		var windowContent = '<h4>' + place.title + '</h4>' + '<p>' + street + "<br>" + city + '<br>' + phone + "</p>";
		
		var getStreetView = function(data, status) {
			if (status == google.maps.StreetViewStatus.OK) {
				var nearStreetViewLocation = data.location.LatLng;
				var heading = google.maps.geometry.spherical.computeHeading(
					nearStreetViewLocation, place.position);
				infowindow.setContent(windowContent + '<div id="pano"></div>');
				var panoramaOptions = {
					position: nearStreetViewLocation,
					pov: {
						heading: heading,
						pitch: 20
					}
				};
				var panorama = new google.maps.StreetViewPanorama(
					document.getElementById('pano'), panoramaOptions);
			} else {
				infowindow.setContent(windowContent + '<div style="color: red">No Street View Found</div>');
			}
		};
		
		streetViewService.getPanoramaByLocation(place.position, radius, getStreetView);
		infowindow.open(map, place);
	}
}

function animateBounce(place) {
	if (place.getAnimation() !== null) {
		place.setAnimation(null);
	} else {
		place.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			place.setAnimation(null);
		}, 1400);
	}
}

function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
	new google.maps.Size(21, 34),
	new google.maps.Point(0, 0),
	new google.maps.Point(10, 34),
	new google.maps.Size(21, 34));
	return markerImage;
}
 
 /* var largeInfowindow = new google.maps.InfoWindow();
        // Style the markers a bit. This will be our listing marker icon.
        var defaultIcon = makeMarkerIcon('0091ff');
        // Create a "highlighted location" marker color for when the user
        // mouses over the marker.
        var highlightedIcon = makeMarkerIcon('FFFF24');
        // The following group uses the location array to create an array of markers on initialize.
        for (var i = 0; i < locations.length; i++) {
          // Get the position from the location array.
          var position = locations[i].location;
          var title = locations[i].title;
          // Create a marker per location, and put into markers array.
          var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
          });
          // Push the marker to our array of markers.
          markers.push(marker);
          // Create an onclick event to open the large infowindow at each marker.
          marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
          });
          // Two event listeners - one for mouseover, one for mouseout,
          // to change the colors back and forth.
          marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
          });
          marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
          });
        }
        document.getElementById('show-listings').addEventListener('click', showListings);
        document.getElementById('hide-listings').addEventListener('click', hideListings);
      }
      // This function populates the infowindow when the marker is clicked. We'll only allow
      // one infowindow which will open at the marker that is clicked, and populate based
      // on that markers position.
      function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
          // Clear the infowindow content to give the streetview time to load.
          infowindow.setContent('');
          infowindow.marker = marker;
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
          });
          var streetViewService = new google.maps.StreetViewService();
          var radius = 50;
          // In case the status is OK, which means the pano was found, compute the
          // position of the streetview image, then calculate the heading, then get a
          // panorama from that and set the options
          function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
              var nearStreetViewLocation = data.location.latLng;
              var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                  position: nearStreetViewLocation,
                  pov: {
                    heading: heading,
                    pitch: 30
                  }
                };
              var panorama = new google.maps.StreetViewPanorama(
                document.getElementById('pano'), panoramaOptions);
            } else {
              infowindow.setContent('<div>' + marker.title + '</div>' +
                '<div>No Street View Found</div>');
            }
          }
          // Use streetview service to get the closest streetview image within
          // 50 meters of the markers position
          streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
          // Open the infowindow on the correct marker.
          infowindow.open(map, marker);
        }
      }
      // This function will loop through the markers array and display them all.
      function showListings() {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(map);
          bounds.extend(markers[i].position);
        }
        map.fitBounds(bounds);
      }
      // This function will loop through the listings and hide them all.
      function hideListings() {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(null);
        }
      }
      // This function takes in a COLOR, and then creates a new marker
      // icon of that color. The icon will be 21 px wide by 34 high, have an origin
      // of 0, 0 and be anchored at 10, 34).
      function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
          '|40|_|%E2%80%A2',
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34),
          new google.maps.Size(21,34));
        return markerImage;
      }
 */