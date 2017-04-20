
prism.run(["eucalyptus.services.metaService","$http", function (metaService,$http) {

	prism.custom = {
		metaService: metaService,
		http: $http
	};

}])

prism.run([function(){

	//	Initialize the bookmarks object
	prism.dashdesc = {
		saved: {},
		popup: function() {
			
			//	Get the scope
			var myScope = prism.$ngscope;
			
			//	Get the dom injector
			var myDom = prism.$injector.get('ux-controls.services.$dom');

			//	Define the modal window's options
			var options = {
				scope: { 
					in: myScope 
				},
				templateUrl: '/plugins/sisense_dashdesc/dashdescTemplate.html'				
			};

			//	Define the ui options			
			var ui = {};

			//	Refresh the list of saved bookmarks
			
			prism.dashdesc.saved = prism.activeDashboard.desc ? prism.activeDashboard.desc : "";

			//	Add the modal window			
			myDom.modal(options,ui);
			
			//	Apply the scope, but make sure  
			
			if (!myScope.$$phase){
				myScope.$apply();
			}
		},
		saveDesc: function(desc) {
	
			if (!prism.activeDashboard.desc){
				prism.activeDashboard.desc = "";
			}
			prism.activeDashboard.desc = desc;

			//	Write back to the dashboard object
			this.updateDashboard(prism.activeDashboard.desc);
		},
		updateDashboard:function(desc) {

			//	API Endpoint
			var url = '/api/v1/dashboards/' + prism.activeDashboard.oid;

			//	Create AJAX payload
			var payload = {
				"desc": desc				
			}

			//	Make API call
			$.ajax({
				url: url,
				method: 'PATCH',
				contentType:'application/json',
				data:JSON.stringify(payload)
			}).done(function(data){
				//	write the saved bookmarks to the dashboard's settings property
				prism.activeDashboard.desc = data.desc;
			});
		},
		initDasDesc:function() {

			//	API Endpoint
			var url = '/api/v1/dashboards/' + prism.activeDashboard.oid + '?fields=bookmarks';
			
			//	Make API call
			$.ajax({
				url: url,
				method: 'GET',
				async: false,
				contentType:'application/json'
			}).done(function(data){
				//	Make sure the dashboard has a settings object
				if (typeof prism.activeDashboard.settings === "undefined") {
					prism.activeDashboard.settings = {}
				};
				//	write the saved bookmarks to the dashboard's settings property
				prism.activeDashboard.settings.bookmarks = data.bookmarks;
			});
		}
	}

	//	Define the controller for the modal window
	mod.controller('bookmarksController', ['$scope',  function ($scope) {

	    	//	Grab the scope
	    	var myScope = $scope;	    	
	    	
	    	//	Load the current bookmarks
	    	prism.bookmarks.initBookmarks();
	    	myScope.bookmarks = prism.activeDashboard.settings.bookmarks ? prism.activeDashboard.settings.bookmarks : {};	

	    	//	Create variable for the bookmark name check
	    	myScope.newBookmarkNameIsInvalid = false;

	    	//	Define a function to check the user input for a new bookmark's name
	    	var nameChangeFunction = function(name) {

	    		//	Get the saved bookmarks
	    		var myBookmarks = prism.activeDashboard.settings.bookmarks ? prism.activeDashboard.settings.bookmarks : {};

	    		//	Only run if there are some bookmarks saved already	    		
    			var numberBookmarks = Object.keys(myBookmarks).length;
    			if (numberBookmarks == 0) {
    				myScope.newBookmarkNameIsInvalid = false;
    				return true;    				
    			}

    			//	Loop through each bookmark and check to see if its been added already
    			for (key in myBookmarks) {

    				//	Get each bookmark
    				var thisBookmark = myBookmarks[key];

    				//	If it exists AND if the names match AND the users match
    				if (thisBookmark && thisBookmark.name == name && thisBookmark.user == prism.user._id) {
    					myScope.newBookmarkNameIsInvalid = true;
    					return false;    					
    				}	    				
    			}

    			//	If we got this far, there were no matches
    			myScope.newBookmarkNameIsInvalid = false;
				return true;
	    	}

	    	//	Define function to clean up properties at each level of a filter
	    	var cleaner = function(object) {

	    		//	Loop through each property at this level	    		
	    		for (key in object){

	    			//	Delete any properties that start with $
    				var startsWithDollar = (key.substring(0,1) === '$');

    				//	Delete functions
    				var isFunction = (typeof object[key] === 'function');

    				//	Should this property be deleted
    				if (startsWithDollar || isFunction) {
    					delete object[key];
    				} else {
    					//	Keeping the property, but does it have children?
		    			if (object.hasOwnProperty(key) && !$.isEmptyObject(object[key]) && (typeof object[key] === 'object')) {
		    				//	Run function recursively
		    				cleaner(object[key]);
		    			}
    				}
	    		}
	    	}

	    	//	Define a function to clean up the filter objects
	    	var getFilters = function() {

	    		//	Get the dashboard filters
	    		var dashboardFilters = prism.activeDashboard.filters.$$items;
	    		var savedFilters = [];

	    		//	Loop through all the filters
	    		$.each(dashboardFilters,function(){

	    			//	Create a clean filter object	    			
	    			var thisFilter = $.extend({},this);	    			
	    			cleaner(thisFilter);

	    			//	Save the filter
	    			savedFilters.push(thisFilter);
	    		})

	    		//	Return the clean list of filters
	    		return savedFilters;
	    	}

	    	//	Define new bookmark
	    	myScope.newBookmark = {
	    		name: '',
	    		nameChangedIsValid: nameChangeFunction,
	    		user: prism.user._id,
	    		filters: []
	    	};

	    	//	Set the current filters
	    	myScope.newBookmark.filters = getFilters();
	    	
	    	//	Function to load a given bookmark
	    	myScope.loadBookmark = function (bookmark) {
	    		//	Set the bookmark
	        	//prism.activeDashboard.settings.bookmarks.loadBookmark(bookmark);
	        	prism.bookmarks.loadBookmark(bookmark);

	        	//	Close the window
	        	this.close();
	        };

	        //	Function to save a selected bookmark
	    	myScope.saveBookmark = function () {
	    		//	Set the bookmark	    		
	        	//prism.activeDashboard.settings.bookmarks.saveBookmark(this.newBookmark);
	        	prism.bookmarks.saveBookmark(this.newBookmark);

	        	//	Close the window
	        	this.close();
	        };

	        //	Function to delete a selected bookmark
	    	myScope.deleteBookmark = function (bookmark) {
	    		//	Set the bookmark
	        	//prism.activeDashboard.settings.bookmarks.deleteBookmark(bookmark);
	        	prism.bookmarks.deleteBookmark(bookmark);
	        };

	        //	Function to close the window
	        myScope.close = function(){
	        	//	Run the close function
	        	this.finished()
	        };
    }])
    
	//	Add handler for header menu buttons
	mod.directive('filtersHeadline',[function(){
		return {
			restrict: 'C',
			replace: false,
			link: function(scope,element,attrs){				

				//	Get the filter label
				var headerLabel = parseFloat(prism.version) >= 6.6 ? $('.filters-title') : $('h2',element);

				//	Make it clickable				
				$(headerLabel).on('click', { scope: scope }, prism.bookmarks.popup);

				//	Add style for mouse pointer
				$(headerLabel).css('cursor', 'pointer');

				//	Add styling for on hover
				var hoverColor = "#ffff9c";
				var defaultColor = "transparent";
				$(headerLabel).mouseenter(function() {
				    $(this).css("background", hoverColor);
				}).mouseleave(function() {
				     $(this).css("background", defaultColor);
				});
			}
		}
	}])

	//	Add handler for filters menu
	prism.on('beforemenu',function(e, args){

		//	Only add for the filters menu
		if (args.settings.name === "filters") {

			//  Get the list of existing items            
            var items = args.settings.items;

            //  Create a separator
            var separator = {
                type: "separator"
            };

            //  Create a button for the bookmarks popup
            var button = {
                caption: 'Bookmarks',
                type: '"header"',
                execute: prism.bookmarks.popup,
                closing: true
            }

            //   Add options to the menu         
            args.settings.items.push(separator);
            args.settings.items.push(button);
		}
	})
}])