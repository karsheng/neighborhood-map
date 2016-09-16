//
//
// Knockout Part
//
//

// The place object which stores the information of a place
var Place = function() {
  this.title = ko.observable();
  this.formattedAddress = ko.observable();
  this.marker = "";
  this.openNow = ko.observable(false);
  this.show = ko.observable(true);
  this.rating = 0;
  this.placeInfoWindow = "";
  this.selected = ko.observable(false);
};

// Initial places to be populated in the map.
// NOTE: "Open Now" and "Rating above" filters do not work with these places as it is not practical to hard code these
// these information.
var initialPlaces = [
  {
    icon: "https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png",
    name: "Best Pizza",
    geometry: {
      location: {lat: 40.71557980000001, lng: -73.95341229999997}
    },
    place_id: "ChIJzWhpTVlZwokRRyrw-O4FIxI"
  },
  {
    icon:"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png",
    name: "Joe's Pizza",
    geometry: {
      location: {lat: 40.730559, lng: -74.00216799999998}
    },
    place_id: "ChIJ8Q2WSpJZwokRQz-bYYgEskM"
  },
  {
    icon:"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png",
    name: "Lombardi's Pizza",
    geometry: {
      location: {lat: 40.72153319999999, lng: -73.99563440000003}
    },
    place_id: "ChIJp-cWE4pZwokRmUI8_BIF8dg"
  },
  {
    icon:"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png",
    name: "John's of Times Square",
    geometry: {
      location: {lat: 40.7582256, lng: -73.98837789999999}
    },
    place_id: "ChIJBSESh1RYwokRyHcVnrG7JWo"
  },
  {
    icon:"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png",
    name: "Angelo's Coal Oven Pizzeria",
    geometry: {
      location: {lat: 40.7648918, lng: -73.97797450000002}
    },
    place_id: "ChIJVTtHRfdYwokRnbMmdpG2Mw0"
  }

];

var ViewModel = function() {
  var self = this;
  this.currentlySelectedPlace = null; //currentlySelectedPlace set to null initially and to be updated when user clicked a place item
  this.placeList = ko.observableArray([]);

  // when the place item in the place list is clicked,
  // the item (selectedPlace) will be highlighted and it's associated
  // marker will be animated (bouncing) and the infowindow will be shown
  // with details of the place.
  this.placeListClicked = function() {
    var order = self.placeList().indexOf(this);
    var selectedPlace = self.placeList()[order];

    // prevents reopening of the infowindo if it's already open
    if (selectedPlace.placeInfoWindow.marker == selectedPlace.marker) {
      console.log("This infowindow already is on this marker!");
    } else {
      self.highlightSelectedPlace(selectedPlace);
      bounceMarker(selectedPlace.marker, 2000);
      getPlacesDetails(selectedPlace.marker, selectedPlace.placeInfoWindow);
    }
  };

  // when the marker is clicked, look for it's associated place item in the list view and highlight it
  this.markerClicked = function(marker) {
    ko.utils.arrayForEach(self.placeList(), function(place) {
      if (marker === place.marker) {
        self.highlightSelectedPlace(place);
      }
    });
  };

  this.textFilter = ko.observable("");
  this.openNowIsChecked = ko.observable();
  this.selectedRating = ko.observable();

  // runs the filter function when the #open-now-checkbox is checked
  this.openNowIsChecked.subscribe(function(){
    this.filter();
  }, this);

  // runs the filter function when an option is selected in #rating-filter
  this.selectedRating.subscribe(function(){
    this.filter();
  }, this);

  // runs the filter function when user enters a letter/text in the #places-text-filter box
  this.textFilter.subscribe(function() {
    this.filter();
  }, this);


  //filters the results in placeList based on users input in #places-text-filter, #open-now-checkbox and #rating-filter
  this.filter = function() {

    var filterText = self.textFilter().toLowerCase();

    // loop through each place results to see if it matches user's filter options
    // and hide/show the place item and associated marker accordingly
    if (self.openNowIsChecked()) {
      ko.utils.arrayForEach(self.placeList(), function(place) {
        if (place.openNow() && place.rating >= self.selectedRating() && place.title.toLowerCase().indexOf(filterText) >= 0) {
          place.show(true);
          showMarker(place.marker);
        } else {
          place.show(false);
          hideMarker(place.marker);
        }
      });
    } else {
      ko.utils.arrayForEach(self.placeList(), function(place) {
        if (place.rating >= self.selectedRating() && place.title.toLowerCase().indexOf(filterText) >= 0) {
          place.show(true);
          showMarker(place.marker);
        } else {
          place.show(false);
          hideMarker(place.marker);
        }
      });
    }
  };

  // highlight selected places in the list view
  this.highlightSelectedPlace = function(selectedPlace) {

    // unhighlight any currentlySelectedPlace
    if (self.currentlySelectedPlace) {
      self.currentlySelectedPlace.selected(false);
    }
    // highlight the newly selected place and set it as currentlySelectedPlace
    selectedPlace.selected(true);
    self.currentlySelectedPlace = selectedPlace;
  };
};

//initialize ViewModel and apply bindings
var model = new ViewModel();
ko.applyBindings(model);

//
//
// Google Maps Part
//
//
var map;

// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarkers = [];

function initMap() {
  // Create a styles array to use with the map.
  var styles = [
    {
      featureType: 'water',
      stylers: [
        { color: '#19a0d8' }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.stroke',
      stylers: [
        { color: '#ffffff' },
        { weight: 6 }
      ]
    },{
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [
        { color: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -40 }
      ]
    },{
      featureType: 'transit.station',
      stylers: [
        { weight: 9 },
        { hue: '#e85113' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'labels.icon',
      stylers: [
        { visibility: 'off' }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [
        { lightness: 100 }
      ]
    },{
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        { lightness: -100 }
      ]
    },{
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        { visibility: 'on' },
        { color: '#f0e4d3' }
      ]
    },{
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [
        { color: '#efe9e4' },
        { lightness: -25 }
      ]
    }
  ];

  // Constructor creates a new map
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    styles: styles,
    mapTypeControl: false
  });

  var searchBox = new google.maps.places.SearchBox(
    document.getElementById('places-search'));

    // Listen for the event fired when the user selects a prediction from the
    // picklist and retrieve more details for that place.
    searchBox.addListener('places_changed', function() {
      searchBoxPlaces(this);
    });

  // Listen for the event fired when the user selects a prediction and clicks
  // "go" more details for that place.
  document.getElementById('go-places').addEventListener('click', textSearchPlaces);

  //create markers for the hardcoded initial places
  createMarkersForPlaces(initialPlaces);
  //show the places on the map
  showPlaces();
}

// This function will loop through the placeMarkers array and display them all.
function showPlaces() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < placeMarkers.length; i++) {
    placeMarkers[i].setMap(map);
    bounds.extend(placeMarkers[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the markers arrays and hide them all.
function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}
// this function hides a marker from the map
function hideMarker(marker) {
  marker.setMap(null);
}
// this function displays a marker on the map
function showMarker(marker) {
  marker.setMap(map);
}

// This function fires when the user selects a searchbox picklist item.
// It will do a search using the selected query string or place.
function searchBoxPlaces(searchBox) {
  hideMarkers(placeMarkers);
  var places = searchBox.getPlaces();
  if (places.length === 0) {
    window.alert('We did not find any places matching that search!');
  } else {
  // For each place, get the details and create marker for it
    createMarkersForPlaces(places);
  }
}

// This function firest when the user select "go" on the places search.
// It will do a nearby search using the entered query string or place.
function textSearchPlaces() {
  hideMarkers(placeMarkers);
  var placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
    query: document.getElementById('places-search').value,
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // For each place, get the details and create marker for it
      createMarkersForPlaces(results);
    }
  });
}

// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
  var bounds = new google.maps.LatLngBounds();
  // Create a single infowindow to be used with the place details information
  // so that only one is open at once.
  var placeInfoWindow = new google.maps.InfoWindow();
  model.placeList.removeAll();

  for (var i = 0; i < places.length; i++) {
    var place = places[i];
    var icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(35, 35)
    };
    // Create a marker for each place.
    var marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.place_id
    });

    // get place information and store the info and marker for later use
    storePlaceInfo(marker, placeInfoWindow, place);

    // If a marker is clicked, do a place details search on it
    marker.addListener('click', function() {
      if (placeInfoWindow.marker == this) {
        console.log("This infowindow already is on this marker!");
      } else {
        // runs the
        model.markerClicked(this);
        bounceMarker(this, 2000);
        getPlacesDetails(this, placeInfoWindow);
      }
    });
    placeMarkers.push(marker);
    if (place.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      if (typeof place.geometry.location.lat === 'function') {
        bounds.extend(place.geometry.location);
      }
    }
  }
  map.fitBounds(bounds);
  // apply filter (if any)
  model.filter();
}
// get place info and store the info and it's the associated marker and infoWindow in the model ViewModel
function storePlaceInfo(marker, infoWindow, place) {
  //create new instance of Place
  var placeOfInterest = new Place();
  var openingHours = place.opening_hours;
  if (place.name) {
    placeOfInterest.title = place.name;
  }
  if (place.formatted_address) {
    placeOfInterest.formattedAddress = place.formatted_address;
  }
  if (typeof openingHours !== 'undefined') {
    if (openingHours.open_now) {
        placeOfInterest.openNow(true);
    }
  }
  if (place.rating) {
    placeOfInterest.rating = place.rating;
  }
  placeOfInterest.placeInfoWindow = infoWindow;
  placeOfInterest.marker = marker;
  model.placeList.push(placeOfInterest);
}

// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
  // get places details from Google Maps API
  var innerHTML = '<div id="place-details">';
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Set the marker property on this infowindow so it isn't created again.
      infowindow.marker = marker;
      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        innerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        innerHTML += '<br><br><strong>Hours:</strong><br>' +
            place.opening_hours.weekday_text[0] + '<br>' +
            place.opening_hours.weekday_text[1] + '<br>' +
            place.opening_hours.weekday_text[2] + '<br>' +
            place.opening_hours.weekday_text[3] + '<br>' +
            place.opening_hours.weekday_text[4] + '<br>' +
            place.opening_hours.weekday_text[5] + '<br>' +
            place.opening_hours.weekday_text[6];

            if (place.opening_hours.open_now) {
              innerHTML += '<br><p><strong>Open Now</strong></p>';
            } else {
              innerHTML += '<br><p><strong>Closed</strong></p>';
            }
      }
      if (place.rating) {
        innerHTML += '<br> Rating: ' + place.rating;
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxHeight: 100, maxWidth: 200}) + '">';
      }
      innerHTML += '</div>';
      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
      });
    } else {
      innerHTML += 'Unable to retrieve details. Please try again later.</div>';
      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
      });
    }
  });

  // Load Foursquare to get user check-ins count asynchronously
  var lat = marker.position.lat();
  var lng = marker.position.lng();
  const CLIENT_ID = 'JIYGMSOKDZCP1QPVHIHQWZ3E1JIHFOQ2IAVV41W5ENUMHRT2';
  const CLIENT_SECRET = 'P1VKASPXQRIFDNGB42XFA1QMSXSKDAXJ5FFCSJJSBEB44OH0' ;
  var foursquareUrl = 'https://api.foursquare.com/v2/venues/search?client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&ll='+ lat +','+ lng +'&v=20130815&query=' + marker.title;

  $.getJSON(foursquareUrl)
    .done(function(data){
      var venue = data.response.venues[0];
      // append checkin count to infowindow if the venue is found
      if (venue) {
        var content = '<div id="foursquare-details"><br>Foursquare Check-Ins: ' + venue.stats.checkinsCount +'</div>';
        $('#place-details').append(content);
      }
  }).fail(function(e){
      alert('Oops sorry! Something went wrong while we tried to retrieve information from Foursquare.');
  });
}

// bounce marker with timeout
function bounceMarker(marker, timeout) {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  window.setTimeout(function() {
    marker.setAnimation(null);
  }, timeout);
}

//Open/close the drawer when the menu icon is clicked.
var menu = $('#menu');
var main = $('main');
var drawer = $('#drawer');

menu.on('click', function(e) {
  drawer.toggleClass('open');
  menu.toggleClass('open');
  e.stopPropagation();
});
// close the drawer when main is clicked
main.on('click', function() {
  drawer.removeClass('open');
  menu.removeClass('open');
});
