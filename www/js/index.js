/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.load, false);
    },
    load: function() {
        window.wall = new TPH.Wall('wall',{
			grid:{
				columns:100,
				height:'fit'
			},
			data:[
				{
					row:3,
					col:3,
					content:'3,3',
					size:{
						x:2,
						y:2
					},
					draggable:true
				},
				{
					type:'app',
					row:1,
					col:2,
					content:'1,2',
					size:{
						x:2,
						y:3
					},
					draggable:false
				},
				{
					type:'image',
					row:1,
					col:6,
					content:'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
					size:{
						x:4,
						y:1
					},
					draggable:true
				},
				{
					type:'iframe',
					row:2,
					col:5,
					size:{
						x:3,
						y:5
					},
					content:'http://www.techprojecthive.com',
					title:'Tech Project Hive, Co.',
					draggable:true
				},
				{
					type:'iframe',
					row:5,
					col:2,
					size:{
						x:3,
						y:5
					},
					content:'https://hello.ph',
					title:'Hello PH!',
					draggable:true
				}
			]
		});
    }
};
