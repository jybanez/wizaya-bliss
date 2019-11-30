var App = {
	Splash:new Class({
		Implements:[Events,Options],
		options:{
			classes:{
				active:'active'
			}
		},
		initialize:function(options){
			this.splash = new Element('div',{'class':'splash '+this.options.classes.active}).inject(window.document.body);
		},
		show:function(){
			this.splash.addClass(this.options.classes.active);
		},
		hide:function(){
			this.splash.removeClass(this.options.classes.active);
		}
	}),
	Loader:new Class({
		Implements:[Events,Options],
		initialize:function(app,options){
			App.$splash = new App.Splash();
			this.app = app;
			console.log('Starting App for '+this.app);
			//BluetoothPrinter.print();
			this.setOptions(options);
			var container = document.id(window.document.body);
			this.scanActions(container);
			
			if (!$defined(App.$request)) {
				console.log('Loading Content');
				this.loadContent(function(result){
					//console.log(result);
					var result = Json.decode(result);			
					(function(){
						console.log('Contents loaded');
						new Asset.css(result.stylesheet,{
							onLoad:function(){
								console.log('Stylesheets loaded');
								var head = document.id(window.document.head);
								new Element('style',{type:'text/css'}).set('html',result.inlineStyles).inject(head);	
								
								var body = document.id(window.document.body);
								body.getElement('.mainAppContainer').set('html',result.body);
								(function(){
											
									new Asset.javascript(result.script,{
										onLoad:function(){
											console.log('Scripts loaded');
											$scan(window.document.body);
											
											(function(){
												window.TPH.$remote = this.app;
												console.log('Remote set for '+this.app);
												
												console.log(result.inlineScripts);
												new Element('script',{type:'text/javascript',text:result.inlineScripts}).inject(window.document.head);
												
											}.delay(2000,this));
											App.$splash.hide();
										}.bind(this)
									});	
								}.delay(2000,this));
							}.bind(this)
						});
					}.delay(1000,this));					
				}.bind(this));
			}			
		},
		scanActions:function(container){
			container.getElements('.appAction').each(function(el){
				var func = el.get('rel');
				if ($defined(this[func])) {
					el.addEvent('click',function(){
						this[func](el.get('data-params'));
					}.bind(this));
				}
			}.bind(this));
		},
		loadContent:function(onLoad){
			var hasContent = false;
			if ($defined(App.localStorage)) {
				var storage = App.localStorage.getInstance('app');
				if (storage.has('content')){
					hasContent = true;
					if ($type(onLoad)=='function'){
						(function(){
							onLoad(storage.get('content'));
						}.delay(1000,this));
					}
				}
			}
			var url = this.app.toURI();
			App.$request = new Request({
				url:url.toString(),
				onSuccess:function(result){
					if ($defined(App.localStorage)){
						App.localStorage.getInstance('app').set('content',result);
					}
					if (!hasContent){
						if ($type(onLoad)=='function') {
							(function(){
								onLoad(result);
							}.delay(2000,this));
						}
					} 
				}.bind(this),
				onFailure:function(){
					if (!hasContent) {
						alert('Unable to connect to server. Please check your internet connection.');	
					}
				}
			}).send();
		}
	})
};

if (typeof(window.localStorage) !== "undefined") {
	// Code for localStorage/sessionStorage.
	App.localStorage = new Class({
  		Implements:[Events,Options],
  		options:{
  			
  		},
  		initialize:function(id,options){
  			this.id = id;
  			this.setOptions(options); 
  		},
  		getStorage:function(){
  			if (!$defined(localStorage[this.id])) {
  				localStorage[this.id] = Json.encode({});
  			}
  			return Json.decode(localStorage[this.id]);
  		},
  		set:function(key,value){  			
  			var storage = this.getStorage();
  			storage[key] = value;
  			localStorage[this.id] = Json.encode(storage);
  		},
  		get:function(key){
  			var storage = this.getStorage();
  			return storage[key];
  		},
  		has:function(key){
  			var storage = this.getStorage();
  			return $defined(storage[key]);
  		},
  		clear:function(){
  			localStorage[this.id] = Json.encode({});
  		}
	});
	$extend(App.localStorage,{
		instances:{},
		getInstance:function(id,options){
			if (!$defined(App.localStorage.instances[id])){
				App.localStorage.instances[id] = new App.localStorage(id,options);
			}
			return App.localStorage.instances[id];
		}
	});
} else {
  // Sorry! No Web Storage support..
}
