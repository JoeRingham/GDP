function superuserSetup(token){
	
	//attaches REST data to a <SELECT> input
	var attachOptions = function(selectForm, data){
		$(data).each(function(){
			selectForm.append($('<option>').attr('value', this.id).text(this.name));
		});
		
		selectForm.val($(selectForm).children().first().attr('value'));
	};
	
	var generateRemoveButton = function(div){
		var removeBtn = $('<button>').addClass('btn').addClass('btn-danger').attr('type', 'button').appendTo(div);
		$("<span>").addClass('glyphicon').addClass('glyphicon-minus').appendTo(removeBtn);
		removeBtn.click(function(e){
			div.remove();
		});
	};
	
	//add the form-horizontal class to every form
	$('form').addClass("form-horizontal").attr('method', 'POST');
	//add columns for every label
	$('label').addClass('col-sm-2').addClass('control-label');
	//add form-group to each form subdiv
	$('form > div').addClass('form-group');
	//every <INPUT> element
	$('input').addClass('form-control');	
	
	$('#nav-div li').click(function(e){
		$('li.active').removeClass('active');
		$(this).addClass('active');
		
		$('#content-div').children().each(function(){
			$(this).css('display', 'none');
		});
		
		$('#content-div').children().eq($(this).index()).css('display', 'inline');
	});
	
//Add carriable	
$.post('/superuser/get_all_statuses', {token : token, withHp : true}).then(function(data){
	
	var addNewCarriableEffect = function(){
		var div = $('<div>').addClass('form-group').addClass('row');
		
		var selDiv = $('<div>').addClass('col-sm-7').appendTo(div);
		var sel = $('<select>').addClass('form-control').appendTo(selDiv);
		attachOptions(sel, data);
		
		var inputDiv = $('<div>').addClass('col-sm-3').appendTo(div);
		$('<input>').attr('type', 'text').addClass('form-control').appendTo(inputDiv);
		
		generateRemoveButton(div);
		
		div.appendTo('#add_carriable_effects');
	};
	
	addNewCarriableEffect();
	$('#add_carriable_effect').click(addNewCarriableEffect);
});

$('#add_carriable_submit').click(function(e){
	e.preventDefault();
	
	var allEffects = $('#add_carriable_effects').children().map(function(){
		var id = $(this).find(':selected').attr('value');
		id = id==='hp' ? 'hp' : parseInt(id);
		var val = parseInt($(this).find('input').val());
		
		return {id : id, amount : val};
	}).toArray();
	
	var checkNoDuplicates = allEffects.map(function(ele){
		return ele.id;
	});
	var unique = checkNoDuplicates.every(function(item, pos, self) {
		return self.indexOf(item) === pos;
	});
	
	if(unique){	
		$('#add_carriable_remove').remove();
		$('<input>').attr({'type': 'text', 'name': 'effects'}).val(JSON.stringify(allEffects)).appendTo('#add_carriable');
		
		$('#add_carriable').submit();
	}else{
		addError("Duplicate effects found. Please ensure only 1 of each is present.");
	}
});
// END ADD CARRIABLE
	
//Remove carriable
$.post('/superuser/get_all_carriables', {token : token}).then(function(data){		
	var selectForm = $('#remove_carriable_name');		
	attachOptions(selectForm, data);

	var getSprite = function(){
		var id = $(selectForm).children('option:selected').first().attr("value");
		var url = data.filter(function(ele){
			return ele.id==id;
		})[0].url;
		
		var sprite = new Image();
		sprite.onload = function(){
			var maxPreviewDimension = 75;
			
			var bigSide 	= $(sprite).width() > $(sprite).height() 	? 'width' : 'height';
			var smallSide 	= bigSide === 'width' 						? 'height' : 'width';
			
			$(sprite).css(bigSide, maxPreviewDimension+'px').css(smallSide, 'auto');
			
			$('#remove_carriable_label').empty().append(sprite);
		};
		sprite.src = url;
	};	
	
	getSprite();
	selectForm.change(getSprite);
});
//END REMOVE CARRIABLE
	
//Remove status
$.post("/superuser/get_all_statuses", {token : token}).then(function(data){
	attachOptions($('#remove_status_select'), data);
});
//END REMOVE STATUS

//Add condition
$.post("/superuser/get_all_statuses", {token : token}).then(function(data){
	
	var add_condition_statuses = function(){
		var div = $('<div>').addClass("form-group");
		
		var selDiv = $("<div>").addClass("col-sm-10").appendTo(div);
		var sel = $('<select>').addClass("form-control").appendTo(selDiv);
		attachOptions(sel, data);
		
		generateRemoveButton(div);
		
		div.appendTo('#add_condition_statuses');
	};
	
	add_condition_statuses();
	$("#add_condition_stat").click(add_condition_statuses);
});

$('#add_condition_submit').click(function(e){
	var statuses = $('#add_condition_statuses').children().map(function(){
		return parseInt($(this).children().first().children().first().val());
	}).toArray();
	
	var checkNoDuplicates = statuses.map(function(ele){
		return ele.id;
	});
	var unique = checkNoDuplicates.every(function(item, pos, self) {
		return self.indexOf(item) === pos;
	});
	
	if(unique){	
		$('#add_condition_statuses').remove();
		$('<input>').attr({'type': 'text', 'name': 'statuses'}).val(JSON.stringify(statuses)).appendTo('#add_condition');
		
		$('#add_condition').submit();
	}else{
		addError("Duplicate statuses found. Please ensure only 1 of each is present.");
	}
	
	

});
//END ADD CONDITION

//Remove condition
$.post("/superuser/get_all_conditions", {token : token}).then(function(data){	
	attachOptions($('#remove_condition_select'), data);
});
//END REMOVE CONDITION

//Add store item
$.post("/superuser/get_item_slots", {token : token}).then(function(data){	
	var dataArr = $(data).map(function(){
		return {id: this, name: this};
	});
	attachOptions($('#add_store_item_slot'), dataArr);
});

$('#add_store_item_submit').click(function(e){
	$('#add_store_item').submit();
});
//END ADD STORE ITEM

//Remove store item
$.post("/superuser/get_item_slots", {token : token}).then(function(data){	
	var selectForm = $('#remove_store_item_slot');
	var dataArr = $(data).map(function(){
		return {id: this, name: this};
	});
	attachOptions(selectForm, dataArr);
	
	var changeFunc = function(e){
		$.post('/superuser/get_items_for_slot', {'slot': $(selectForm).val(), token : token}).then(function(dataTwo){
			$('#remove_store_item_item').empty();
		
			attachOptions($('#remove_store_item_item'), dataTwo, 'id', 'name');
		});
	};
	
	changeFunc();
	$(selectForm).change(changeFunc);
});
//END REMOVE STORE ITEM

}