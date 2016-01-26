(function(){
	// TODO: load_max should really be set somewhere and passed in, not defined here.
	// TODO: Should we have all the variables defined here?

	// Backpacking.
	var array_to_add	= [];
	var load			= 0;
	var load_max		= 10;

	// Minigame select.
	var selected_minigame;

	window.menu = {};

	window.menu.sleep	= {
		load : function() {
			$.get('/views/sleep.html', function(data) {
				$('#menu-overlays').html(data);

				$('#fade-overlay').hide();
				$('#fade-overlay').fadeToggle(2000);
				setTimeout(function(e) {
					$('#fade-overlay').fadeToggle(2000);
				}, 3000);
			});
		}
	};

	window.menu.scores = {
		load : function(formatted_scores) {
			$.get('/views/scoreboard.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Scoreboard';

				formatted_scores.forEach(function(formatted_score) {
					var container_div	= document.createElement('div'),
						title_div		= document.createElement('div');

					title_div.innerHTML	= formatted_score.name + ':';

					container_div.appendChild(title_div);

					formatted_score.scores.forEach(function(score) {
						container_div.appendChild(document.createElement('div')).innerHTML = score;
					});

					container_div.className	= 'col-md-4 col-centered dark-dark-grey-box-no-text';

					document.getElementById('scores').appendChild(container_div);
				});

				$('#score_close').on('click', function(obj) {
					$('#overlay').hide();
				});

				$('#overlay').show();
			});
		}
	};

	window.menu.game_select = {
		load : function(minigames) {
			$.get('/views/minigame_select.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Select a minigame!';

				for(var m in minigames)
				{
					(function(minigame) {

						// TODO: Add image handling.

						var container_div	= document.createElement('div'),
							title_div		= document.createElement('div'),
							desc_div		= document.createElement('div');
							//img				= minigame.image.cloneNode();

						title_div.innerHTML	= minigame.name;
						desc_div.innerHTML	= minigame.description;

						// TODO: Either make a new CSS class, or genericise with carriables.
						//img.className		= 'packing_images';

						container_div.appendChild(title_div);
						//container_div.appendChild(img);
						container_div.appendChild(desc_div);

						container_div.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text';

						container_div.addEventListener('click', function(obj) {
							selected_minigame	= minigame.id;

							var prev_selection		= container_div.parentNode.querySelectorAll(".minigame-selection");
							if(prev_selection.length !== 0)
							{
								prev_selection				= prev_selection[0];
								prev_selection.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text';
							}

							container_div.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text minigame-selection';
						});

						document.getElementById('minigames_available').appendChild(container_div);
					})(minigames[m]);
				}

				$('#minigame_accept').on('click', function(obj) {
					hub.launchGame(selected_minigame, function() {});
					$('#overlay').hide();
				});

				$('#minigame_cancel').on('click', function(obj) {
					$('#overlay').hide();
				});

				$('#overlay').show();
			});
		}
	};

	window.menu.customise_hub = {
		load : function(available, equipped) {
			var original_selection	= {};
			var original_images		= [];
			var selected_items		= {};
			var selected_images		= [];

			$.get('/views/customise_hub.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Customise the hub!';

				var temp = 0;
				var slots	= Object.keys(available);

				slots.forEach(function(key) {
					original_selection[key]	= equipped[key].id;
					selected_items[key]		= equipped[key].id;

					// TODO: Proper title formatting, rather than upper-casing the system name.
					/*
					var slot_title_div			= document.createElement('div');
					slot_title_div.innerHTML	= key.toUpperCase();
					slot_title_div.className	= 'dark-dark-grey-box';

					document.getElementById('hub_customisables_container').appendChild(slot_title_div);
					*/
					var div_id					= 'div_' + key;

					var slot_title_li			= document.createElement('li');
					var slot_title_elem			= document.createElement('a');

					slot_title_elem.innerHTML	= key.toUpperCase();
					slot_title_elem.setAttribute('data-toggle', 'tab');
					slot_title_elem.setAttribute('href', '#' + div_id);
					//slot_title_elem.href(div_id);

					// Check size of the ul (hub_customisables_titles), make active if empty.
					// ul/title bit to 'active', content to 'in active'
					if(temp === 0)
					{
						slot_title_li.className = 'active';
					}

					slot_title_li.appendChild(slot_title_elem);
					document.getElementById('hub_customisables_titles').appendChild(slot_title_li);
					// set data-toggle -> blah.setAttribute('data-toggle', val);
					// Not sure if best way, but a way.
					// set href to content link -> blah.href('link');

					var container_div		= document.createElement('div');
					container_div.id		= div_id;
					container_div.className	= 'row row-centered';
					container_div.className += ' tab-pane fade';

					// Check size of the ul (hub_customisables_titles), make active if empty.
					// ul/title bit to 'active', content to 'in active'
					if(temp === 0)
					{
						container_div.className += ' in active';
						temp 					+= 1;
					}

					var available_for_slot	= available[key];
					for(var a in available_for_slot)
					{
						(function(item) {
							var img					= document.createElement('img');

							// TODO: Find proper classname.
							img.src					= item.url;
							//img.className			= 'packing_images';
							img.className			= 'height-100px white-img-box hub-item-box';
							//img.className			= 'col-md-3 col-centered';

							if(item.id == equipped[key].id)
							{
								img.className			+= ' active';
								original_images[key]	= item.url;
							}

							img.addEventListener('click', function(obj) {
								selected_items[key]		= item.id;
								selected_images[key]	= item.url;

								// TODO: If changed from 'white-img-box' in definition, change here.
								$('.white-img-box', obj.target.parentNode).removeClass('active');
								$(this).addClass('active');

								// TODO: Need reworking, heavily inefficient.
								var canvas			= document.getElementById('canvas').fabric;
								var canvas_objects	= canvas.getObjects();
								for(var co in canvas_objects)
								{
									(function(canvas_object) {
										if(slots.indexOf(canvas_object.name) > -1)
										{
											if(canvas_object.id != selected_items[canvas_object.name])
											{
												canvas_object._element.src	= selected_images[canvas_object.name];
												canvas_object.id			= selected_items[canvas_object.name];
											}
										}
									})(canvas_objects[co]);
								}
								canvas.renderAll();
							});

							container_div.appendChild(img);
						})(available_for_slot[a]);
					}

					document.getElementById('hub_customisables_content').appendChild(container_div);
				});

				var canvas	= document.getElementById('canvas').fabric;

				$('#hub_customise_accept').on('click', function(obj) {
					comms.update_equipped_items(selected_items, function(obj) {
						canvas.renderAll();
						$('#overlay').hide();
					});
				});

				$('#hub_customise_cancel').on('click', function(obj) {
					var canvas_objects	= canvas.getObjects();
					for(var co in canvas_objects)
					{
						(function(canvas_object) {
							if(slots.indexOf(canvas_object.name) > -1)
							{
								if(canvas_object.id != original_selection[canvas_object.name])
								{
									canvas_object._element.src	= original_images[canvas_object.name];
									canvas_object.id 			= original_selection[canvas_object.name];
								}
							}
						})(canvas_objects[co]);
					}

					canvas.renderAll();
					$('#overlay').hide();
				});

				$('#overlay').show();
			});
		}
	};

	window.menu.shop = {
		load : function(locked_items, currency) {
			$.get('/views/shop.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Shop';
				
				$('#currency_container').html("You have " + currency.value + " to spend in the shop");

				locked_items.forEach(function(item) {
					if (item.url) {
						var img_html = '<img src="' + item.url + '" style="width:100%">';
						$('#hub_shop_content').append('<div class="col-md-2 white-img-box">' + img_html + '</div>');
					}
				});
				
				$('#hub_shop_accept').on('click', function(data) {
					// Add currency stuff
				});

				$('#hub_shop_cancel').on('click', function(data) {
					$('#overlay').hide();
				});

				
			});
		}
	}

	window.menu.backpack = {
		load : function(carriables, backpack){

			// 'backpack' is a list of IDs, replaces with the actual objects.
			var temp_backpack	= [];
			for(var b in backpack)
			{
				var id	= backpack[b];
				temp_backpack.push(carriables[id]);
			}
			backpack	= temp_backpack;

			$.get('/views/pack_backpack.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Pack your backpack';

				// Populate the potential carriables, and attach their event handlers.
				for(var c in carriables)
				{
					(function(carriable) {
						array_to_add[carriable.id]	= 0;

						var container_div	= document.createElement('div'),
							text_div		= document.createElement('div'),
							img				= carriable.image.cloneNode();

						text_div.innerHTML	= carriable.name;
						text_div.className	= 'row';

						img.className		= 'packing_images';

						container_div.appendChild(img);
						container_div.appendChild(text_div);

						container_div.className = 'col-md-2 col-centered';

						container_div.addEventListener('click', function(obj) {
							add_to_backpack(carriable);
						});

						document.getElementById('backpack_available').appendChild(container_div);
					})(carriables[c]);
				}

				for(var b in backpack)
				{
					(function(backpack_item) {
						add_to_backpack(backpack_item);
					})(backpack[b]);
				}

				$('#backpack_accept').on('click', function(obj) {
					$('#overlay').hide();
					load	= 0;

					var set_array	= [];
					for(var a in array_to_add)
					{
						for(var i = 0; i < array_to_add[a]; i++)
						{
							set_array.push(a);
						}
					}

					hub.setBag(set_array, function() {});
				});

				$('#backpack_cancel').on('click', function(obj) {
					$('#overlay').hide();
					load	= 0;
				});

				$('#overlay').show();
			});
		}
	};

	function add_to_backpack(carriable)
	{
		if(load < load_max) {
			var container_div	= document.createElement('div'),
				img				= carriable.image.cloneNode();

			img.className		= 'packing_images';

			container_div.appendChild(img);

			container_div.className	= 'col-md-3 col-centered';

			container_div.addEventListener('click', function(obj) {
				remove_from_backpack(carriable, container_div);
			});

			$('#backpack_addition').append(container_div);

			var i	= array_to_add[carriable.id];
			i							= i + 1;
			array_to_add[carriable.id]	= i;

			load++;
		}
		else
		{
			alert('You can only carry ' + load_max + ' items, please remove some if you want to make room for more.');
		}
	}

	function remove_from_backpack(carriable, carriable_div)
	{
		carriable_div.parentNode.removeChild(carriable_div);

		var i						= array_to_add[carriable.id];
		i							= i - 1;
		array_to_add[carriable.id]	= i;

		load--;
	}
})();