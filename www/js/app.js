var App = {
	getInstance:function(){
		return App.$instance;
	},
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
	Interface:{
		Log:new Class({
			initialize:function(){
				var oldConsoleLog = console.log;
				var isFunction = function(obj) {
				  return !!(obj && obj.constructor && obj.call && obj.apply);
				};
				
				var stackLimit = 3;
				
				var arrayToString = function(arr, level) {
					var level = $pick(level,0);
					if (level>stackLimit) {
						return '(Stack Limit Reached)';
					}  
					var spacer = level?"\t".repeat(level):'';
					var lines = new Array();
					arr.each(function(val){
						if (!isFunction(val)) {
							if($defined(val)) {
								switch($type(val)){
									case 'array':
										val = arrayToString(val,level+1);
										break;
									case 'object':
										val = objectToString(val,level+1);
										break;
									case 'string':
										val = '"'+val+'"';
										break;
								}	
							} else {
								val = 'null';
							}
							lines.push(spacer+"\t"+val);	
						}
					});
					var content = lines.length?lines.join(",\n"):'';
					var glue = lines.length?"\n":"";
					return ['Array [',content,(lines.length?spacer:'')+']'].join(glue);
				};
				
				var objectToString = function(obj, level) {
					var level = $pick(level,0);
					if (level>stackLimit) {
						return '(Stack Limit Reached)';
					}
					var spacer = level?"\t".repeat(level):'';
					var lines = new Array();
					for(var key in obj) {
						var val = obj[key];
						if (!isFunction(val)) {
							if($defined(val)) {
								switch($type(val)){
									case 'array':
										val = arrayToString(val,level+1);
										break;
									case 'object':
										val = objectToString(val,level+1);
										break;
									case 'string':
										val = '"'+val+'"';
										break;
								}	
							} else {
								val = 'null';
							}
							
							lines.push(spacer+"\t"+key+' : '+val);	
						}
					}
					var content = lines.length?lines.join(",\n"):'';
					var glue = lines.length?"\n":"";
					return ['Object {',content,(lines.length?spacer:'')+'}'].join(glue);
				};
				
				console.log = function(){
					var error = new Error();
					var callerLine = error.stack.split("\n")[3];
					if ($defined(callerLine)) {
						var callerIndex = callerLine.indexOf("at ");
						var lineNumber = callerLine.slice(callerIndex+2, callerLine.length).trim();
				
						var lines = new Array();
						for(var i=0;i<arguments.length;i++) {
							var arg = arguments[i];
							var type = $type(arg);
							//oldConsoleLog(' - '+type+' - ');
							switch(type) {
								case 'array':
									lines.push(arrayToString(arg));
									break;
								case 'object':
									lines.push(objectToString(arg));
									break;
								default:
									lines.push(arg);
							}
						}
						oldConsoleLog(lineNumber+"\n"+(lines.length?lines.join("\n"):''));
					} else {
						oldConsoleLog.apply(null,arguments);
					}
					
				};
			}
		})
	},
	Loader:new Class({
		Implements:[Events,Options],
		options:{
			idleTimer:10000
		},
		$assetsUpdated:false,
		initialize:function(app,options){
			this.app = app;
			var url = app.toURI();
			this.$id = url.get('host');
			
			this.setOptions(options);
			this.$body = document.id(window.document.body);
			this.$head = document.id(window.document.head);
			
			this.$assets = new Array();
			this.$isLoaded = new Array();
			
			App.FileSystem.getInstance('PERSISTENT',{
				onReady:function(instance){
					this.$fileSystem = instance;
					this.run();
					return;
					this.$fileSystem.clear(function(){
						this.run();
					}.bind(this)); 
					//this.reset();
				}.bind(this)
			});
			App.$instance = this;
			console.log('Welcome!',device);
			if (['android'].contains(device.platform.toLowerCase())) {
				new App.Interface.Log();	
			}
		},
		requestData:function(onRequest,onError){
			new Request({
				url:this.app,
				onSuccess:onRequest,
				onFailure:onError
			}).send();
		},
		getData:function(onGet,onError){
			if (!$defined(this.$data)) {
				var fileName = this.$id+'.json';
				this.$fileSystem.getEntry('/'+fileName,function(fileEntry){
					this.$fileSystem.readFile(fileEntry,function(content){
						if ($type(onGet)=='function') {
							this.$data = Json.decode(content);
							onGet(this.$data);
						}
					}.bind(this),onError);
				}.bind(this),function(){
					this.startSpin('Downloading Updates. Please wait...');
					this.requestData(function(result){			
						this.$data = Json.decode(result);
						this.$fileSystem.createFile(this.$fileSystem.getBaseEntry(),{
							name:fileName,
							content:[result]
						},function(entry){
							if ($type(onGet)=='function') {
								onGet(this.$data);
							}
							//this.stopSpin();
						}.bind(this),onError);
					}.bind(this),onError);
				}.bind(this));
			} else {
				onGet(this.$data);
			}
		},
		$spinCounter:0,
		startSpin:function(message){
			if (!this.$spinCounter) {
				//console.log('Create Spinner');
				if (!$defined(this.$spinner)) {
					this.$spinner = new Element('div',{
						'class':'assetsLoader'
					}).inject(window.document.body);	
				}
			}
			this.$spinner.set('html',message);
			this.$spinner.addClass('loading').removeClass('check').addClass('visible');
			this.$spinCounter++;
			//console.log(this.$spinCounter);
		},
		stopSpin:function(message){
			if (this.$spinCounter) {
				this.$spinCounter--;
				if (!this.$spinCounter) {
					var message = $pick(message,'');
					if (message.length) {
						this.$spinner
							.removeClass('loading')
							.addClass('check')
							.set('html',message)
							;	
					}
					this.$spinner.removeClass('visible');
				}	
			}
			//console.log(this.$spinCounter);
		},
		reset:function(onReset,onError){
			this.$fileSystem.clear(function(){
				if (confirm('App will now restart. Press OK to continue.')) {
					location.reload();
				}
			}.bind(this));
		},
		update:function(onUpdate,onError){
			this.startSpin('Downloading Updates. Please wait...');
			this.requestData(function(result){
				this.$fileSystem.createFile(this.$fileSystem.getRoot(),{
					name:'app.json',
					content:[result]
				},function(entry){
					var data = Json.decode(result);
					new App.Localizer(this.$fileSystem,{
						overwrite:true,
						onDownloadComplete:function(){
							//console.log('Update Complete');
							if ($type(onUpdate)=='function') {
								onUpdate();
							}
							this.stopSpin('Update Complete!');	
						}.bind(this)
					}).setItems([{
						source:data.stylesheet,
						target:this.toLocalURL(data.stylesheet)
					},{
						source:data.script,
						target:this.toLocalURL(data.script)
					}]).download();	
				}.bind(this),onError);
			}.bind(this),onError);
		},
		/*
		toLocalURL:function(url){
			var url = url.toURI();
			var base = this.$fileSystem.getBase().toURI();
			url.set('scheme',base.get('scheme'))
				.set('host',base.get('host'))
				.set('directory',base.get('directory')+url.get('directory'))
				;	
			//return url.toString();
			//var host = url.toURI().set('directory','').set('file','').set('fragment','').set('query','').toString(),
			//	path = url.replace(host,base);	 	
			return path;
		},
		*/
		loadAsset:function(source,onLoad){
			var url = source.toURI();
			var target = url.get('directory')+url.get('file');
			console.log('App Load Asset',target);
			this.$fileSystem.getEntry(target,function(fileEntry){
				onLoad(fileEntry.toURL());
			}.bind(this),function(){
				new App.Localizer(this.$fileSystem,{
					onSave:function(item,fileEntry){
						onLoad(fileEntry.toURL());
					}.bind(this)
				}).setItems([{
					source:source,
					target:target
				}]).download();	
			}.bind(this));				
		},
		run:function(){
			this.getData(function(data){
				console.log('App Data',data);
				var body = this.$body.appendHTML(data.body,'top');
				var head = this.$head;
				//this.startSpin('Updating. Please wait...');
				this.loadAsset(data.stylesheet,function(styleUrl){
					console.log(data.stylesheet,styleUrl);
					new Asset.css(styleUrl,{
						onload:function(){
							new Element('style',{
								type:'text/css'
							}).inject(head).set('text',data.inlineStyles);		
						}.bind(this)
					});					
					this.loadAsset(data.script,function(scriptUrl){ 
						//console.log(data.script,scriptUrl);
						new Asset.javascript(scriptUrl,{
							onload:function(){
								$extend(TPH,{
									$remote:this.app
								});
								//return;
								new Element('script',{
									type:'text/javascript'
								}).inject(head).set('text',data.inlineScripts);
								this.stopSpin('Update Complete!');	
							}.bind(this)
						});
						window.addEvent('onPlatformReady',function(instance){
							body.removeClass.delay(500,body,['empty']);
						});
					}.bind(this));	
				}.bind(this));				
			}.bind(this),function(e){
				console.log(e);
			}.bind(this));
		}
	}),
	Server:new Class({
		Implements:[Events,Options],
		initialize:function(options){
			this.$httpd = ( cordova && cordova.plugins && cordova.plugins.CorHttpd ) ? cordova.plugins.CorHttpd : null;
			
			this.$httpd.getURL(function(url){
    			if(url.length > 0) {
    				document.getElementById('url').innerHTML = "server is up: <a href='" + url + "' target='_blank'>" + url + "</a>";
    			} else {
    				document.getElementById('url').innerHTML = "server is down.";
    			}
    		});
		},
		getURL:function(){
			
		}
	}),
	FileSystem:new Class({
		Implements:[Events,Options],
		options:{
			quota:100,
			storage:'PERSISTENT'
		},
		initialize:function(options){
			this.setOptions(options);
			window.requestFileSystem(window[this.options.storage], this.getQuota(), function (fileSystem) {
				console.log('Filesystem Ready',cordova.file);
				this.$rootEntry = fileSystem.root;
				
				console.log('file system open: ' + fileSystem.name);
				console.log(fileSystem);
				
				this.getEntry('/',function(result){
					this.$baseEntry = result;
					
					this.fireEvent('onReady',[this]);
				}.bind(this),function(e){
					console.log(e);
				}.bind(this));
				
			}.bind(this), function(){
				console.log('ON Request File System Error',arguments);
			}.bind(this));
		},
		getQuota:function(){
			return this.options.quota*1024*1024; 
		},
		getRootEntry:function(){
			return this.$root;
		},
		getBaseEntry:function(){
			return this.$baseEntry;
		},
		isEmpty:function(onEmpty,onNotEmpty){
			this.readDirectory(this.getBaseEntry(),false,function(entries){
				console.log('isEmpty',entries.length);
				if (entries.length) {
					if ($type(onNotEmpty)=='function') {
						onNotEmpty();
					}
				} else {
					if ($type(onEmpty)=='function') {
						onEmpty();
					}
				}
			}.bind(this));
		},
		clear:function(onClear,onError){
			this.readDirectory(this.getBaseEntry(),false,function(entries){
				console.log('Clear',entries.length);
				if (entries.length) {
					entries.forEach(function(entry){
						if (entry.isFile) {
							this.deleteFile(entry,function(){
								console.log('File Deleted',arguments);
								this.isEmpty(onClear); 
							}.bind(this),onError);
						} else {
							this.deleteDirectory(entry,function(){
								console.log('Directory Deleted',arguments);
								this.isEmpty(onClear);
							}.bind(this),onError);
						}
					}.bind(this));	
				} else if ($type(onClear)=='function') {
					onClear();
				}	
			}.bind(this),onError);
			return this;
		},
		getStorageDirectory:function(){
			return cordova.file[this.options.storage=='PERSISTENT'?'dataDirectory':'cacheDirectory'];
		},
		getBase:function(){
			return this.options.storage.toLowerCase();
		},
		getCDV:function(path){
			return 'cdvfile://localhost/'+this.getBase()+path;
		},
		getEntry:function(path,onSuccess,onError){
			//var name = path.charAt(0)=='/'?this.getBase()+path.substr(1):path;
			//console.log('FileSystem:Get Entry',path);
			var name = this.getCDV(path);
			console.log('FileSystem:getEntry:',{
				path:path,
				name:name
			});
			window.resolveLocalFileSystemURL(name,onSuccess,onError);
			return this;
		},
		createFile:function(dirEntry, fileData, onCreate, onError) {
			dirEntry.getFile(fileData.name, {create: true, exclusive: false}, function(fileEntry) {
		        fileEntry.createWriter(function (fileWriter) {
		        	//console.log('Create File '+fileData.name);
			        fileWriter.onwriteend = function() {
			            //console.log("Successfull file write "+fileData.name);
			            //this.readFile(fileEntry, onCreate, onError);
			            if ($type(onCreate)=='function') {
			            	onCreate(fileEntry);
			            }	
			        }.bind(this);
			
			        fileWriter.onerror = onError;
			        
			        //console.log($defined(fileData.blob));
			        //console.log('Blob',fileData.blob);
			        var dataObj = $defined(fileData.blob)?fileData.blob:new Blob(fileData.content, { type: $pick(fileData.type,'text/plain') });
					//console.log(dataObj);
			        fileWriter.write(dataObj);
			    }.bind(this));
		    }.bind(this), onError);
		    return this;
		},
		readFile:function(fileEntry, onRead, onError) {
	    	fileEntry.file(function (file) {
		        var reader = new FileReader();
		        reader.onloadend = function() {
		            //console.log("Successful file read: " + this.result);
		            //displayFileData(fileEntry.fullPath + ": " + this.result);
		            onRead(this.result);
		        };
		        reader.readAsText(file);
		    }, onError);
		    return this;
		},
		deleteFile:function(fileEntry, onDelete, onError){
			fileEntry.remove(onDelete, onError);
		    return this;
		},
		recurseDirectory:function(dirEntry,paths,onFinished,onError){
			if (paths.length) {
				var path = paths.shift();
				dirEntry.getDirectory(path,{
					create:true
				},function(newDirEntry){
					this.recurseDirectory(newDirEntry,paths,onFinished,onError);
				}.bind(this),onError);	
			} else if ($type(onFinished)=='function') {
				//console.log(dirEntry);
				//console.log('Directory found '+dirEntry.name);
				onFinished(dirEntry);
			}
		},
		getDirectory:function(dirEntry,name,autoCreate,onGet,onError){
			var $paths = new Array();
			name.split('/').each(function(part){
				if (part.length) {
					$paths.push(part);
				}
			}) ;
			
			if (autoCreate) {
				this.recurseDirectory(dirEntry,$paths,onGet,onError);
			} else {
				dirEntry.getDirectory(name,{
					create:$pick(autoCreate,false)
				},onGet,onError);	
			}
			
			return this;
		},
		createDirectory:function(dirEntry,name,onCreate,onError){
			this.getDirectory(dirEntry,true,onCreate,onError);
			return this;
		},
		readDirectory:function(dirEntry,recursive,onRead,onError){
			//console.log('Read Directory ',dirEntry.toURL());
			var reader = dirEntry.createReader();
			var entries = new Array();
			reader.readEntries(function(results){
				results.each(function(result){
					entries.push(result);
					if ($pick(recursive,false) && result.isDirectory) {
						result.children = this.readDirectory(result,true);
					}
				}.bind(this));
				if ($type(onRead)=='function') {
					onRead(entries);
				}
			}.bind(this),onError);
			//console.log(entries);
			return entries;
		},
		deleteDirectory:function(dirEntry,onFinished){
			dirEntry.removeRecursively(onFinished,onFinished);
			return this;
		}
	}),
	Localizer:new Class({
		Implements:[Events,Options],
		options:{
			overwrite:false
		},
		initialize:function(fileSystem,options){
			this.$fileSystem = fileSystem;
			this.setOptions(options);
			this.$items = new Array();
		},
		add:function(item){
			this.$items.push(item);
			return this;
		},
		setItems:function(items){
			this.$items = items;
			console.log('Localizer setItems:',this.$items);
			return this;
		},
		getItems:function(){
			return this.$items;
		},
		clear:function(){
			this.$items.empty();
			return this;
		},
		download:function(){
			this.fireEvent('onBeforeDownload',[this]);
			this.execute(this.getItems(),function(){
				this.clear();
				//console.log('Localizetion Complete ');
				this.fireEvent('onDownloadComplete',[this]);
			}.bind(this));
			return this;
		},
		/*
		localizeLinks:function(url,content){
			var oldHost = url.toURI().set('directory','').set('file','').toString(),
				newHost = dirEntry.toURL().replace(base,'');	 				
			var regexp = /url\(\s*(['"]?)(.*?)\1\s*\)/ig; //RegExp('url\(\'([^\']+)\'\)','gi');
			var urls = new Array();
			var exts = ['eot','woff','woff2','ttf','svg'];
			while((match=regexp.exec(result))!==null) {
				var uri = match[2].toURI();
				var file = uri.get('file');
				var ext = file.split('.').pop();
				if (exts.contains(ext)) {
					urls.push({
						source:match[2],
						target:match[2].replace(oldHost,'/'+newHost),
						url:base+match[2].replace(oldHost,newHost)
					});
				}
			}
		},
		*/
		request:function(item,onRequest,onError){
			var req = new XMLHttpRequest();
			req.open('GET',item.source,true);
			req.responseType = 'blob';
			req.addEventListener('readystatechange',function(e){
				//console.log(req);
				if (req.readyState == 4) {
					switch(req.status){
						case 200:
							if ($type(onRequest)=='function'){
								onRequest(req.response);
							}
							break;
						case 404:
							if ($type(onError)=='function') {
								onError();
							}
							break;		
					}
				}
			}.bind(this));
			req.addEventListener('error',function(e){
				if ($type(onError)=='function') {
					onError();
				}
			}.bind(this));
			req.send();
		},
		execute:function(list,onComplete){
			if (list.length) {
				var item = list.shift();
				console.log('Localizer check file : ',item.source);
				this.$fileSystem.getEntry(item.target,function(fileEntry){
					console.log('Localizer file exists ',item.target);
					this.fireEvent('onExist',[item,fileEntry,this]);
					if (this.options.overwrite) {
						this.request(item,function(blob){
							this.process(item,blob,function(item,blob){
								//console.log('Processed ',item.source,item.target);
								this.save(item,blob,function(){
									this.execute(list,onComplete);
								}.bind(this));
							}.bind(this));
						}.bind(this),function(){
							this.execute(list,onComplete);
						}.bind(this));	
					} else {
						this.execute(list,onComplete);
					}	
					
				}.bind(this),function(){
					console.log('Locallizer file does not exist ',item.target);
					this.request(item,function(blob){
						this.process(item,blob,function(item,blob){
							this.save(item,blob,function(){
								this.execute(list,onComplete);
							}.bind(this));
						}.bind(this));
					}.bind(this),function(){
						this.execute(list,onComplete);
					}.bind(this));
				}.bind(this));		
			} else if ($type(onComplete)=='function'){
				//console.log('Execute Complete');
				onComplete();
			}
			return this;
		},
		save:function(item,blob,onSave){
			var uri = item.source.toURI();
			var directory = uri.get('directory'),
				file = uri.get('file');
			//var ext = file.split('.').pop();
			//console.log(file,blob);
			console.log('Localizer Save : ',{
				item:item,
				uri:uri,
				directory:directory,
				file:file
			});
			this.fireEvent('onBeforeSave',[item,blob,this]);
			this.$fileSystem.getDirectory(this.$fileSystem.getBaseEntry(),directory,true,function(dirEntry){
				console.log('Saving to local '+item.source+' >> '+item.target);
				console.log('Directory Entry',dirEntry);
				this.$fileSystem.createFile(dirEntry,{
					name:file,
					blob:blob
				},function(fileEntry){
					$extend(item,{
						internal:fileEntry.toInternalURL()
					});
					if ($type(item.onLocalize)=='function') {
						item.onLocalize(item,fileEntry);
					}
					if ($type(onSave)=='function') {
						onSave(item,fileEntry);
					}
					this.fireEvent('onSave',[item,fileEntry,this]);
					console.log('Save File Success',fileEntry,item);
				}.bind(this),function(e){
					console.log('Save File Error',directory,file);
					console.log(e);
					this.fireEvent('onSaveFileError',[directory,file,item,e,this]);
				}.bind(this));	
			}.bind(this),function(e){
				console.log('Save Directory Error',directory);
				console.log(e);
				this.fireEvent('onSaveDirectoryError',[directory,item,e,this]);
			}.bind(this));
			return this;
		},
		process:function(item,blob,onProcess){
			var uri = item.target.toURI();
			var directory = uri.get('directory'),
				file = uri.get('file');
			var handler = App.Localizer.Handler;
			 
			var ext = file.split('.').pop();
			console.log('Localizing ',item.source,blob.type);
			
			switch(blob.type){
				case 'text/css':
					handler = App.Localizer.CSS;
					break;
				case 'application/javascript':
				case 'application/ecmascript':
				case 'text/javascript':
				case 'text/ecmascript':
					handler = App.Localizer.JS;
					break;
				default:
					break;
			}
			new handler(this.$fileSystem,item,blob,{
				overwrite:this.options.overwrite,
				onComplete:onProcess
			});
			return this;
		}
	})
};

$extend(App.Localizer,{
	Handler:new Class({
		Implements:[Events,Options],
		initialize:function(fileSystem,item,blob,options){
			this.setOptions(options);
			this.$fileSystem = fileSystem;
			this.$item = item;
			this.$blob = blob;
			this.handle();
		},
		handle:function(){
			this.fireEvent('onComplete',[this.$item,this.$blob,this]);
		}
	})
});
$extend(App.Localizer,{
	CSS:new Class({
		Extends:App.Localizer.Handler,
		handle:function(){
			var reader = new FileReader();
	        reader.onloadend = function() {
	        	var base = this.$fileSystem.getBase();
	        	var oldHost = this.$item.source.toURI().set('directory','').set('file','').toString(),
					newHost = base; //this.$fileSystem.getRoot().toURL().replace(base,'');	
	            var content = reader.result;
	            var regexp = /url\(\s*(['"]?)(.*?)\1\s*\)/ig; //RegExp('url\(\'([^\']+)\'\)','gi');
				var urls = new Array();
				var exts = ['eot','woff','woff2','ttf','svg'];
				while((match=regexp.exec(content))!==null) {
					var uri = match[2].toURI();
					var file = uri.get('file');
					var ext = file.split('.').pop();
					
					if (exts.contains(ext)) {
						var item = {
							source:match[2],
							target:match[2].replace(oldHost,newHost),
							url:base+match[2].replace(oldHost,newHost)
						};
						//console.log(item);
						urls.push(item);
					}
				}
				if (urls.length) {
					new App.Localizer(this.$fileSystem,{
						overwrite:this.options.overwrite,
						onSave:function(item){
							content = content.replace(item.source,item.url);
						}.bind(this),
						onDownloadComplete:function(){
							this.fireEvent('onComplete',[this.$item,new Blob([content],{type:'text/css'}),this]);	
						}.bind(this)
					}).setItems(urls).download();	
				} else {
					this.fireEvent('onComplete',[this.$item,this.$blob,this]);
				}
	        }.bind(this);
	        reader.readAsText(this.$blob);
		}
	}),
	JS:new Class({
		Extends:App.Localizer.Handler,
		options:{
			excludedExtensions:['map']
		},
		handle:function(){
			var ext = this.$item.source.toURI().get('file').split('.').pop();
			//console.log('Localizer JS Handler',this.$item,ext);
        	if (!this.options.excludedExtensions.contains(ext)) {
        		var reader = new FileReader();
		        reader.onloadend = function() {
		        	var base = this.$fileSystem.getBase();
		        	var source = this.$item.source.toURI();
		        	
		        	var oldHost = this.$item.source.toURI().set('directory','').set('file','').toString(),
						newHost = base; //this.$fileSystem.getRoot().toURL().replace(base,'');	
		            var content = reader.result;
		            var regexp = /\/\/\# sourceMappingURL=(.*?)\.map/igm; //RegExp('url\(\'([^\']+)\'\)','gi');
					var urls = new Array();
					while((match=regexp.exec(content))!==null) {
						var sourceFile = source.set('file',match[1]+'.map').toString();
						var item = {
							source:sourceFile,
							target:sourceFile.replace(oldHost,newHost)
						};
						urls.push(item);
					}
					
					if (urls.length) {
						new App.Localizer(this.$fileSystem,{
							overwrite:this.options.overwrite,
							onDownloadComplete:function(){
								this.fireEvent('onComplete',[this.$item,this.$blob,this]);	
							}.bind(this)
						}).setItems(urls).download();
					} else {
						this.fireEvent('onComplete',[this.$item,this.$blob,this]);	
					}
		        }.bind(this);
		        reader.readAsText(this.$blob);	
	        } else {
	        	this.fireEvent('onComplete',[this.$item,this.$blob,this]);	
	        }			
		}
	})
});

$extend(App.FileSystem,{
	$instances:{},
	getInstance:function(storage,options){
		var storage = $pick(storage,'PERSISTENT');
		if (!$defined(App.FileSystem.$instances[storage])) {
			App.FileSystem.$instances[storage] = new App.FileSystem($merge({
				storage:storage
			},options));
		}
		return App.FileSystem.$instances[storage];
	}
});

if (typeof(window.localStorage) !== "undefined") {
	// Code for localStorage/sessionStorage.
	$extend(App,{
		localStorage:new Class({
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
		})
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
