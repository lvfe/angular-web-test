angular.module("cartrawlerApp", ["ngRoute"]).
config(function($routeProvider, $locationProvider) {//Sets angular routes and default view
	$routeProvider
	.when('/', {
		templateUrl: 'views/home.html',
		controller: 'MainCtrl'
	})
	.otherwise({
		redirectTo: "/"
	});
})
.factory("LS", function($window, $rootScope) {//HTML5 Local storage for user last filter/sort
	return {
		setData: function(key, val) {//Saves the data in the local storage
			$window.localStorage && $window.localStorage.setItem('cartrawler-'.concat(key), val);
			return this;
		},
		getData: function(key) {//Gets the data from the local storage
			return $window.localStorage && $window.localStorage.getItem('cartrawler-'.concat(key));
		}
	};
})
.service("VehicleSvc", ["$http", "$timeout", function ($http, $timeout) {
	var self = this;

	self.loadVehicles = function (callback) {
		$timeout(function () {//Simulate large data loading
			//make request
			var url = "../assets/cars.json";//same domain, remember to configure the website to allow access to this mimeType
			$http.get(url)
				.success(callback)
				.error(function(err) {
					alert("Sorry, something went wrong...");
				//debugger;
			});

		}, 2000);
	};
}])
.controller("InfoCtrl", ["$scope", function ($scope) {//Information shared through commom pages
	var model = {
		"title": "Cartrawler Demo App",
		"author": "Developer"
	};

	$scope.model = model;
}])
.controller("MainCtrl", ["$scope", "LS", "VehicleSvc", function ($scope, LS, VehicleSvc) {
  $scope.doorcount = ["N/A", "2", "3", "4", "5", "5+"];

  $scope.orderBy = LS.getData("sort") || "EstimatedTotalAmount";//Gets the last user sort option or the default
	var lastFilter = LS.getData("filter");//Gets the last user filter
	if (lastFilter) {
		$scope.search = { MakeModel: lastFilter };
	}
	$scope.isLoading = false;
	$scope.cars = [];

	$scope.sortOptions = [//List of sort options
		{ label: "Price", value: "EstimatedTotalAmount" },
		{ label: "Model", value: "MakeModel" },
		{ label: "Vendor", value: "VendorName" },
		{ label: "Door Count", value: "DoorCount" }
	];

	$scope.load = function() {//Loads the data from the feed and fetch into the model
		$scope.isLoading = true;
		VehicleSvc.loadVehicles(function (feed) {
			$scope.model = {
				"PickUpDateTime": new Date(feed[0].VehAvailRSCore.VehRentalCore["@PickUpDateTime"]),
				"ReturnDateTime": new Date(feed[0].VehAvailRSCore.VehRentalCore["@ReturnDateTime"]),
				"PickUpLocation": feed[0].VehAvailRSCore.VehRentalCore.PickUpLocation["@Name"],
				"ReturnLocation": feed[0].VehAvailRSCore.VehRentalCore.ReturnLocation["@Name"]
			};

			var carsList = feed[0].VehAvailRSCore.VehVendorAvails;
			for (var i = 0; i < carsList.length; i++) {
				var auxCar = carsList[i];
				for (var j = 0; j < carsList[i].VehAvails.length; j++) {
					var auxVeh = carsList[i].VehAvails[j];
					$scope.cars.push({
						'VendorName': auxCar.Vendor['@Name'],
						'VendorCode': auxCar.Vendor['@Code'],
						'AirConditionInd': auxVeh.Vehicle["@AirConditionInd"],
						'TransmissionType': auxVeh.Vehicle['@TransmissionType'],
						'FuelType': auxVeh.Vehicle['@FuelType'],
						'DriveType': auxVeh.Vehicle['@DriveType'],
						'PassengerQuantity': auxVeh.Vehicle['@PassengerQuantity'],
						'BaggageQuantity': auxVeh.Vehicle['@BaggageQuantity'],
						'Code': auxVeh.Vehicle['@Code'],
						'CodeContext': auxVeh.Vehicle['@CodeContext'],
						'DoorCount': auxVeh.Vehicle['@DoorCount'],
						'MakeModel': auxVeh.Vehicle.VehMakeModel['@Name'],
						'PictureURL': auxVeh.Vehicle['PictureURL'],
						'RateTotalAmount': Number(auxVeh.TotalCharge['@RateTotalAmount']),
						'EstimatedTotalAmount': Number(auxVeh.TotalCharge['@EstimatedTotalAmount']),
						'CurrencyCode': auxVeh.TotalCharge['@CurrencyCode']
					});
				}
			}
			$scope.isLoading = false;
		});
    $scope.rental = function(){
      alert("rental");
    };
	};

	$scope.sort = function(prop) {//Sorting logic
		var curOrder = $scope.orderBy.replace("-", "");
		if (curOrder == prop) {//Change Asc/Desc
			if ($scope.orderBy == prop) {
				$scope.orderBy = '-'.concat(prop);
			} else {
				$scope.orderBy = prop;
			}
		} else {//Change property
			$scope.orderBy = prop;
		}
		LS.setData("sort", $scope.orderBy);//Saves the option to the local storage
	};

	$scope.filtered = function() {
		LS.setData("filter", $scope.search.MakeModel);//Saves the option to the local storage
	};

	$scope.load();
  console.log($scope.search);
}])
.filter('currcode', function(){
  return function(input, opt1, opt2){
    var symbol = '';
    if(opt1 === 'CAD'){
      symbol = '$';
    }
    return symbol+input;
  }
})
.filter('dateformat', function(){
  return function(input, opt){
    var datef = new Date(input);
    return datef.getMonth()+1+'/'+datef.getDate()+'/'+datef.getFullYear()+' '+datef.getHours()+':'+datef.getMinutes();
  }
});
