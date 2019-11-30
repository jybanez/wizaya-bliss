TPH.Wall = new Class({
	Implements:[Events,Options],
	options:{
		grid:{
			scrollbars:true,
			progress:true,
			rowHeight:100,
			colWidth:100,
			height:300,
			columns:10,
			rows:10
		},
		data:[]
	},
	z:1,
	initialize:function(container,options){
		this.setOptions(options);
		this.grid = new TPH.Grid(container,$merge(this.options.grid,{
			classes:{
				container:'grid wall'
			},
			onBeforeRender:function(grid){
				//this.hideAll();
				if (!$defined(this.cells)) {
					this.cells = new Array();
				} else {
					this.cells.empty();
				}
			}.bind(this),
			onCellCreate:function(cell){
				cell.setOptions({
					resizers:{
						horizontal:false,
						vertical:false
					}
				});
			}.bind(this),
			onCellRender:function(cell){
				this.cells.push(cell);
			}.bind(this),
			onRender:function(grid){
				return;
				if (!$defined(this.cells)) return;
				this.cells.each(function(cell){
					if ($defined(cell.$items)) {
						cell.$items.each(function(item){
							item.render();
						});
					}	
				}.bind(this));
			}.bind(this),
			onReady:function(grid){
				console.log('Grid Ready');
				console.log(grid.getCellCoordinates(1,1));
				console.log(grid.getCellCoordinates(2,2));
				console.log(grid.getCellCoordinates(3,3));
				console.log(grid.getCellCoordinates(4,4));
				this.render();
			}.bind(this)
		}));
		this.grid.canExplore = true;
	},
	render:function(){		
		this.options.data.each(function(data){
			var cell = this.grid.getCell(data.row-1,data.col-1);
			if ($defined(cell)) {
				if (!$defined(data.$item)) {
					data.$item = new TPH.Wall.Item(this.grid,cell,$merge(data,{
						z:this.z++,
						onMousedown:function(instance){
							this.toTop(instance);
						}.bind(this),
						onClick:function(instance){
							this.toTop(instance);
						}.bind(this)
					}));
				}				
				data.$item.render();
			}
		}.bind(this));
	},
	hideAll:function(){
		this.options.data.each(function(data){
			if ($defined(data.$item)) {
				data.$item.hide();
			}
		}.bind(this));
	},
	showAll:function(){
		this.options.data.each(function(data){
			if ($defined(data.$item)) {
				data.$item.show();
			}
		}.bind(this));
	},
	toTop:function(item){
		item.setZ(this.z++);
	},
	toBottom:function(item){
		item.setZ(0);
	}
});

TPH.Wall.Item = new Class({
	Implements:[Events,Options],
	options:{
		classes:{
			container:'wall-item',
			content:'wall-item-content'
		},
		size:{
			x:1,
			y:1
		}
	},
	initialize:function(grid,cell,options){
		this.grid = grid;
		this.setOptions(options);
		this.setCell(cell);
	},
	render:function(){
		if (!$defined(this.element)) {
			var scroll = this.grid.viewport.getScroll();
			var endCol = (this.options.col)+(this.options.size.x-1),
				endRow = (this.options.row)+(this.options.size.y-1);
			
			var startCoords = this.grid.getCellCoordinates(this.options.row,this.options.col);//this.cell.element.getCoordinates(this.grid.viewport),
				endCoords = this.grid.getCellCoordinates(endRow,endCol);//this.grid.getCell(endRow,endCol).element.getCoordinates(this.grid.viewport);
			
			this.element = new Element('div',{
				tabindex:0,
				'class':this.options.classes.container,
				styles:{
					top:startCoords.top+scroll.y,
					left:startCoords.left+scroll.x,
					width:(endCoords.left+endCoords.width)-startCoords.left,
					height:(endCoords.top+endCoords.height)-startCoords.top,
					'z-index':this.options.z
				}
			});
			this.content = new Element('div',{'class':this.options.classes.content})
							.inject(this.element);
							
			var content = TPH.Wall.Item.render($pick(this.options.type,'html'),this);
			
			switch($type(content)) {
				case 'string':
					this.content.set('html',content);
					break;
				case 'element':
					this.content.adopt(content);
					break;
			}
			this.element.addEvents({
				mousedown:function(e){
					this.fireEvent('onMousedown',[this]);
				}.bind(this),
				click:function(e){		
					this.fireEvent('onClick',[this]);
					this.element.focus();
				}.bind(this)
			});
			
			if (this.options.draggable) {
				this.makeDraggable();	
			}
			
			this.show();
		} 
		
	},
	makeDraggable:function(){
		this.dragger = this.element.makeDraggable({
			stopPropagation:true,
			handle:this.options.dragHandle,
			onBeforeStart:function(){
				this.grid.canExplore = false;
				this.element.addClass('dragging');
			}.bind(this),
			onStart:function(){
				
			}.bind(this),
			onCancel:function(){
				this.grid.canExplore = true;
				this.element.removeClass('dragging');
			}.bind(this),
			onComplete:function(el,e){
				this.grid.canExplore = true;
				this.element.removeClass('dragging');
				var scroll = this.grid.viewport.getScroll();
				var coords = el.getCoordinates(this.grid.viewport);
				var cell = this.grid.getCellFromPoint(coords.left,coords.top);
				if ($defined(cell)) {
					this.setCell(cell);
					
					var coords = cell.element.getCoordinates(this.grid.viewport);
					this.element.setStyles({
						left:coords.left+scroll.x,
						top:coords.top+scroll.y
					});
				}
			}.bind(this)
		});
	},
	hide:function(){
		if ($defined(this.element)) {
			this.element.remove();	
		}
		return this;
	},
	show:function(){
		if ($defined(this.element)) {
			if (!this.grid.viewport.contains(this.element)) {
					this.element.inject(this.grid.viewport);	
			}
		}
		return this;
	},
	setCell:function(cell){
		if (this.cell!=cell) {
			if ($defined(this.cell)) {
				this.cell.$items.erase(this);
			}
			this.cell = cell;
			if (!$defined(cell.$items)) {
				cell.$items = new Array();
			}
			cell.$items.include(this);
		}
		return this;
	},
	setZ:function(z){
		this.setOptions({z:z});
		this.element.setStyle('z-index',z);
	}
});

TPH.Wall.Item.render = function(type,itemData){
	return TPH.Wall.Items[$defined(TPH.Wall.Items[type.capitalize()])?type.capitalize():'Html'](itemData);                   
};

TPH.Wall.Items = {
	Html:function(itemData){
		return itemData.options.content;
	},
	Image:function(itemData){
		var el = new Element('img',{src:itemData.options.content});
		el.ondragstart = function(){
			return false;
		};
		return el;
	},
	Iframe:function(itemData){
		var el = new Element('div',{
			styles:{
				width:'100%',
				height:'100%'
			}
		});
		
		var header = new Element('div',{
			'class':'frame-header'
		}).inject(el).set('html',itemData.options.title);
		
		itemData.setOptions({dragHandle:header});
		
		var iframe = new Element('iframe',{
			src:itemData.options.content,
			height:'100%',
			width:'100%',
			frameborder:0,
			seamless:'seamless'
		});
		iframe.addEvent('load',function(){
			console.log(iframe);
			//header.set('html',iframe.contentDocument.title);
		});
		el.adopt(iframe);
		
		return el;
	},
	App:function(itemData){
		return Json.encode(itemData.options);
	}
};