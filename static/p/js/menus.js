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

	window.menu.stairs = {
		load : function() {
			$.get('/views/sleep.html', function(data) {
				$('#menu-overlays').html(data);

				$('#fade-overlay').hide();
				$('#fade-overlay').fadeToggle(2000);
				setTimeout(function(e) {
					$('#fade-overlay').fadeToggle(2000);
				}, 3000);
			})
		}
	};

	window.menu.scores = {
		load : function(scores) {
			$.get('/views/scoreboard.html', function(data) {
				$('#menu-overlays').html(data);
				document.title	= 'Scoreboard';

				var keys		= Object.keys(scores);

				for(var k in keys)
				{
					(function(key) {
						var container_div	= document.createElement('div'),
							title_div		= document.createElement('div');

						// TODO: Change to game name.
						title_div.innerHTML	= key + ':';

						container_div.appendChild(title_div);

						var iterate_no;
						var padding;
						// TODO: 3 should be pulled out to a config file somewhere.
						if(scores[key].length >= 3)
						{
							iterate_no	= 3;
							padding		= 0;
						}
						else
						{
							iterate_no	= scores[key].length;
							padding		= 3 - iterate_no;
						}

						for(var i = 0; i < iterate_no; i++)
						{
							container_div.appendChild(document.createElement('div')).innerHTML = scores[key][i].score;
						}

						for(var i = 0; i < padding; i++)
						{
							container_div.appendChild(document.createElement('div')).innerHTML = '-';
						}

						container_div.className	= 'col-md-4 col-centered dark-dark-grey-box-no-text';

						document.getElementById('scores').appendChild(container_div);
					})(keys[k]);
				};

				$('#score_close').on('click', function(obj) {
					$('#overlay').css('visibility', 'hidden');
					$('#canvas').css('visibility', 'visible');
				});

				$('#canvas').css('visibility', 'hidden');
				$('#overlay').css('visibility', 'visible');
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

							prev_selection		= container_div.parentNode.querySelectorAll(".minigame-selection");
							if(prev_selection.length != 0)
							{
								prev_selection				= prev_selection[0];
								prev_selection.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text';
							}

							container_div.className	= 'col-md-5 col-centered dark-dark-grey-box-no-text minigame-selection';
						});

						document.getElementById('minigames_available').appendChild(container_div);
					})(minigames[m]);
				};

				$('#minigame_accept').on('click', function(obj) {
					hub.launchGame(selected_minigame, function() {});

					$('#overlay').css('visibility', 'hidden');
					$('#canvas').css('visibility', 'visible');
				});

				$('#minigame_cancel').on('click', function(obj) {
					$('#overlay').css('visibility', 'hidden');
					$('#canvas').css('visibility', 'visible');
				});

				$('#canvas').css('visibility', 'hidden');
				$('#overlay').css('visibility', 'visible');
			});
		}
	};

	window.menu.paint = {
		load : function() {
			/*
			var canvas	= new fabric.Canvas(document.getElementById('canvas'));

			var rect = new fabric.Rect({
				left: 0,
			  	top: 0,
			  	fill: 'red',
			  	width: 20,
			  	height: 20
			});

			// "add" rectangle onto canvas
			canvas.add(rect);
			*/

			console.log('hello');
		}
	};

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

						img.className		= 'packing_images row';

						container_div.appendChild(img);
						container_div.appendChild(text_div);

						container_div.className	= 'col-md-2 col-centered';

						container_div.addEventListener('click', function(obj) {
							add_to_backpack(carriable);
						});

						document.getElementById('backpack_available').appendChild(container_div);
					})(carriables[c]);
				};

				for(var b in backpack)
				{
					(function(backpack_item) {
						add_to_backpack(backpack_item);
					})(backpack[b]);
				};

				$('#backpack_accept').on('click', function(obj) {
					$('#overlay').css('visibility', 'hidden');
					$('#canvas').css('visibility', 'visible');

					var set_array	= [];
					for(var a in array_to_add)
					{
						for(var i = 0; i < array_to_add[a]; i++)
						{
							set_array.push(a);
						};
					};

					hub.setBag(set_array, function() {});
				});

				$('#backpack_cancel').on('click', function(obj) {
					$('#overlay').css('visibility', 'hidden');
					$('#canvas').css('visibility', 'visible');
				});

				$('#canvas').css('visibility', 'hidden');
				$('#overlay').css('visibility', 'visible');
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
			//container_div.style.margin	= 'auto';

			container_div.addEventListener('click', function(obj) {
				remove_from_backpack(carriable, container_div);
			});

			$('#backpack_addition').append(container_div);

			var i	= array_to_add[carriable.id];
			i							= i + 1;
			array_to_add[carriable.id]	= i;

			load						= load + 1;
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

		load						= load - 1;
	}
})();